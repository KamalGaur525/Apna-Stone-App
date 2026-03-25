import { Request, Response } from "express";
import { z } from "zod";
import pool from "../database/pool";
import { AuthRequest } from "../middleware/auth.middleware";

// --- VALIDATION SCHEMAS ---
const productSchema = z.object({
  category_id: z.coerce.number({ message: "Category ID must be a valid number" }),
  name: z.string().min(3, "Product name must be at least 3 chars").max(255),
  sub_category: z.string().optional(),
  third_category: z.string().optional(),
  description: z.string().optional(),
});

/**
 * @route   GET /api/products
 * @desc    Get all products with triple security shield (Approved + Product Active + Vendor Active)
 */
export const getAllProducts = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10)); 
    const offset = (page - 1) * limit;

    // --- FILTERS EXTRACTION ---
    const search = req.query.search ? `%${req.query.search}%` : null;
    const categoryId = req.query.category_id ? parseInt(req.query.category_id as string) : null;
    const subCategory = req.query.sub_category ? `%${req.query.sub_category}%` : null; // 🟢 Naya
    const location = req.query.location ? `%${req.query.location}%` : null; // 🟢 Naya

    let whereClause = `WHERE p.status = 'approved' AND p.is_active = true AND u.is_active = true`;
    const queryParams: any[] = [];

    // 🔍 Search Logic (Name or Firm Name)
    if (search) {
      whereClause += ` AND (p.name LIKE ? OR v.firm_name LIKE ?)`;
      queryParams.push(search, search);
    }

    // 📁 Category Filter
    if (categoryId && !isNaN(categoryId)) {
      whereClause += ` AND p.category_id = ?`;
      queryParams.push(categoryId);
    }

    // 💎 Sub-Category Filter (Marble, Granite, etc.)
    if (subCategory) {
      whereClause += ` AND p.sub_category LIKE ?`;
      queryParams.push(subCategory);
    }

    // 📍 Location Filter (City/State)
    if (location) {
      whereClause += ` AND v.location LIKE ?`;
      queryParams.push(location);
    }

    const dataQuery = `
      SELECT 
        p.id, p.name, p.description, p.image_url, p.sub_category, p.created_at,
        v.firm_name as vendor_name, v.location as vendor_location,
        c.name as category_name
      FROM products p
      INNER JOIN vendors v ON p.vendor_id = v.id
      INNER JOIN users u ON v.user_id = u.id
      INNER JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as count FROM products p
      INNER JOIN vendors v ON p.vendor_id = v.id
      INNER JOIN users u ON v.user_id = u.id      
      INNER JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;

    const [totalRows]: any = await pool.query(countQuery, queryParams);
    const [products]: any = await pool.query(dataQuery, [...queryParams, limit, offset]);

    return res.status(200).json({
      success: true,
      meta: { total: totalRows[0].count, page, limit },
      data: products
    });

  } catch (error) {
    console.error("Error in getAllProducts Filters:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

 
export const getProductDetails = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    
    // Validation: Product ID number hona chahiye
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid Product ID." });
    }

    const query = `
      SELECT 
        p.id, p.name, p.description, p.image_url, p.video_url, p.created_at,
       v.id as vendor_id, v.firm_name, v.location, v.whatsapp, v.email, v.about, v.logo_url,
        u.phone as vendor_phone,
        c.name as category_name
      FROM products p
      INNER JOIN vendors v ON p.vendor_id = v.id
      INNER JOIN users u ON v.user_id = u.id
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? 
        AND p.status = 'approved' 
        AND p.is_active = true 
        AND u.is_active = true
    `;

    const [rows]: any = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found or access restricted." });
    }

    return res.status(200).json({ 
      success: true, 
      data: rows[0] 
    });

  } catch (error) {
    console.error("Error in getProductDetails:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

 
export const addProduct = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "User authentication failed." });

    // Body Validation
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const { category_id, name, sub_category, third_category, description } = parsed.data;

    // Multer Files Extraction
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const image_url = files?.image ? `/uploads/products/${files.image[0].filename}` : null;
    const video_url = files?.video ? `/uploads/products/${files.video[0].filename}` : null;

    // Image mandatory check
    if (!image_url) {
        return res.status(400).json({ error: "Product image is mandatory for marketplace quality." });
    }

    // Check DB existences
    const [category]: any = await pool.query("SELECT id FROM categories WHERE id = ?", [category_id]);
    if (category.length === 0) return res.status(400).json({ error: "The selected category does not exist." });

    const [vendor]: any = await pool.query("SELECT id FROM vendors WHERE user_id = ?", [userId]);
    if (vendor.length === 0) return res.status(404).json({ error: "Vendor profile not found." });
    
    const vendorId = vendor[0].id;

    // Insert Query (Status: 'approved' for Instant Go-Live)
    const [result]: any = await pool.query(
      `INSERT INTO products 
       (vendor_id, category_id, name, sub_category, third_category, description, image_url, video_url, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
      [vendorId, category_id, name, sub_category || null, third_category || null, description || null, image_url, video_url]
    );

    return res.status(201).json({
      success: true,
      message: "Product added and is now LIVE on the marketplace!",
      productId: result.insertId
    });

  } catch (error) {
    console.error("Error in addProduct:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
 
export const getMyProducts = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    const [vendor]: any = await pool.query("SELECT id FROM vendors WHERE user_id = ?", [userId]);
    if (vendor.length === 0) return res.status(404).json({ error: "Vendor not found" });
    const vendorId = vendor[0].id;

    // Fetching only active products for the vendor
    const [products]: any = await pool.query(
      `SELECT p.id, p.name, p.status, p.image_url, p.created_at, c.name as category_name 
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.vendor_id = ? AND p.is_active = true
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [vendorId, limit, offset]
    );

    const [total]: any = await pool.query(
      "SELECT COUNT(*) as count FROM products WHERE vendor_id = ? AND is_active = true", 
      [vendorId]
    );

    return res.status(200).json({
      success: true,
      data: products,
      pagination: { total: total[0].count, page, limit }
    });
  } catch (error) {
    console.error("Error in getMyProducts:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
 
export const updateProduct = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized: Token missing" });

    const { id } = req.params;
    if (isNaN(Number(id))) return res.status(400).json({ error: "Invalid Product ID format" });

    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    // Multer Files Extraction
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const new_image_url = files?.image ? `/uploads/products/${files.image[0].filename}` : null;
    const new_video_url = files?.video ? `/uploads/products/${files.video[0].filename}` : null;

    const [vendor]: any = await pool.query("SELECT id FROM vendors WHERE user_id = ?", [userId]);
    if (vendor.length === 0) return res.status(404).json({ error: "Vendor profile not found" });
    const vendorId = vendor[0].id;

    const [existing]: any = await pool.query("SELECT id FROM products WHERE id = ? AND vendor_id = ?", [id, vendorId]);
    if (existing.length === 0) return res.status(403).json({ error: "Forbidden: You do not own this product" });

    const { category_id, name, sub_category, third_category, description } = parsed.data;

    // Update Query (COALESCE preserves the old URL if a new file is not uploaded)
    await pool.query(
      `UPDATE products 
       SET category_id = ?, name = ?, sub_category = ?, third_category = ?, description = ?, 
           image_url = COALESCE(?, image_url), 
           video_url = COALESCE(?, video_url)
       WHERE id = ? AND vendor_id = ?`,
      [category_id, name, sub_category || null, third_category || null, description || null, new_image_url, new_video_url, id, vendorId]
    );

    return res.status(200).json({ 
      success: true, 
      message: "Product updated successfully!" 
    });

  } catch (error) {
    console.error("Update Product Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

 
export const deleteProduct = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    if (isNaN(Number(id))) return res.status(400).json({ error: "Invalid Product ID format" });

    const [vendor]: any = await pool.query(
      "SELECT id FROM vendors WHERE user_id = ?", [userId]
    );
    if (vendor.length === 0) return res.status(404).json({ error: "Vendor profile not found" });
    const vendorId = vendor[0].id;

    // ✅ Hard Delete — DB se poora remove
    const [result]: any = await pool.query(
      "DELETE FROM products WHERE id = ? AND vendor_id = ?",
      [id, vendorId]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ error: "Product not found or you cannot delete it" });
    }

    return res.status(200).json({
      success: true,
      message: "Product permanently deleted.",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
export const getVendorProductById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized." });

    const { id } = req.params;
    if (isNaN(Number(id))) return res.status(400).json({ error: "Invalid Product ID." });

    const [vendor]: any = await pool.query(
      "SELECT id FROM vendors WHERE user_id = ?", [userId]
    );
    if (vendor.length === 0) return res.status(404).json({ error: "Vendor not found." });

    const [rows]: any = await pool.query(
      `SELECT 
        p.id, p.name, p.description, p.image_url, p.video_url, p.created_at,
        p.status, p.rejection_reason, p.sub_category, p.third_category,
        c.name as category_name
       FROM products p
       INNER JOIN categories c ON p.category_id = c.id
       WHERE p.id = ? AND p.vendor_id = ? AND p.is_active = true`,
      [id, vendor[0].id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Product not found." });

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("GetVendorProductById Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};