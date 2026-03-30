import { Request, Response } from "express";
import { z } from "zod";
import pool from "../database/pool";
import { AuthRequest } from "../middleware/auth.middleware";
import { uploadToS3, deleteFromS3 } from "../utils/uploadToS3";

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
 * @desc    Get all products with triple security shield
 */
export const getAllProducts = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    const search = req.query.search ? `%${req.query.search}%` : null;
    const categoryId = req.query.category_id ? parseInt(req.query.category_id as string) : null;
    const subCategory = req.query.sub_category ? `%${req.query.sub_category}%` : null;
    const location = req.query.location ? `%${req.query.location}%` : null;

    let whereClause = `WHERE p.status = 'approved' AND p.is_active = true AND u.is_active = true`;
    const queryParams: any[] = [];

    if (search) {
      whereClause += ` AND (p.name LIKE ? OR v.firm_name LIKE ?)`;
      queryParams.push(search, search);
    }

    if (categoryId && !isNaN(categoryId)) {
      whereClause += ` AND p.category_id = ?`;
      queryParams.push(categoryId);
    }

    if (subCategory) {
      whereClause += ` AND p.sub_category LIKE ?`;
      queryParams.push(subCategory);
    }

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
    console.error("Error in getAllProducts:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * @route   GET /api/products/:id
 */
export const getProductDetails = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

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

    return res.status(200).json({ success: true, data: rows[0] });

  } catch (error) {
    console.error("Error in getProductDetails:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * @route   POST /api/products
 * @desc    Add product — uploads image/video to S3
 */
export const addProduct = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "User authentication failed." });

    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const { category_id, name, sub_category, third_category, description } = parsed.data;

    // Multer memoryStorage — files come as buffer
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files?.image?.[0]) {
      return res.status(400).json({ error: "Product image is mandatory for marketplace quality." });
    }

    // Upload image to S3
    const imageFile = files.image[0];
    const image_url = await uploadToS3(
      imageFile.buffer,
      imageFile.originalname,
      imageFile.mimetype,
      "products"
    );

    // Upload video to S3 (optional)
    let video_url: string | null = null;
    if (files?.video?.[0]) {
      const videoFile = files.video[0];
      video_url = await uploadToS3(
        videoFile.buffer,
        videoFile.originalname,
        videoFile.mimetype,
        "videos"
      );
    }

    // Validate category exists
    const [category]: any = await pool.query("SELECT id FROM categories WHERE id = ?", [category_id]);
    if (category.length === 0) return res.status(400).json({ error: "The selected category does not exist." });

    // Get vendor
    const [vendor]: any = await pool.query("SELECT id FROM vendors WHERE user_id = ?", [userId]);
    if (vendor.length === 0) return res.status(404).json({ error: "Vendor profile not found." });
    const vendorId = vendor[0].id;

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

/**
 * @route   GET /api/vendor/products
 */
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

/**
 * @route   PUT /api/products/:id
 * @desc    Update product — uploads new files to S3, deletes old ones
 */
export const updateProduct = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized: Token missing" });

    const { id } = req.params;
    if (isNaN(Number(id))) return res.status(400).json({ error: "Invalid Product ID format" });

    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const [vendor]: any = await pool.query("SELECT id FROM vendors WHERE user_id = ?", [userId]);
    if (vendor.length === 0) return res.status(404).json({ error: "Vendor profile not found" });
    const vendorId = vendor[0].id;

    // Fetch existing product (need old URLs for S3 cleanup)
    const [existing]: any = await pool.query(
      "SELECT id, image_url, video_url FROM products WHERE id = ? AND vendor_id = ?",
      [id, vendorId]
    );
    if (existing.length === 0) return res.status(403).json({ error: "Forbidden: You do not own this product" });

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Upload new image if provided, delete old from S3
    let new_image_url: string | null = null;
    if (files?.image?.[0]) {
      const imageFile = files.image[0];
      new_image_url = await uploadToS3(
        imageFile.buffer,
        imageFile.originalname,
        imageFile.mimetype,
        "products"
      );
      // Delete old image from S3
      if (existing[0].image_url) await deleteFromS3(existing[0].image_url);
    }

    // Upload new video if provided, delete old from S3
    let new_video_url: string | null = null;
    if (files?.video?.[0]) {
      const videoFile = files.video[0];
      new_video_url = await uploadToS3(
        videoFile.buffer,
        videoFile.originalname,
        videoFile.mimetype,
        "videos"
      );
      // Delete old video from S3
      if (existing[0].video_url) await deleteFromS3(existing[0].video_url);
    }

    const { category_id, name, sub_category, third_category, description } = parsed.data;

    // COALESCE preserves old URL if no new file uploaded
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

/**
 * @route   DELETE /api/products/:id
 * @desc    Hard delete product + S3 cleanup
 */
export const deleteProduct = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (isNaN(Number(id))) return res.status(400).json({ error: "Invalid Product ID format" });

    let product;

    if (userRole === 'admin') {
      const [rows]: any = await pool.query(
        "SELECT image_url, video_url FROM products WHERE id = ?", [id]
      );
      product = rows;
    } else {
      const [vendor]: any = await pool.query("SELECT id FROM vendors WHERE user_id = ?", [userId]);
      if (vendor.length === 0) return res.status(404).json({ error: "Vendor profile not found" });

      const [rows]: any = await pool.query(
        "SELECT image_url, video_url FROM products WHERE id = ? AND vendor_id = ?",
        [id, vendor[0].id]
      );
      product = rows;
    }

    if (product.length === 0)
      return res.status(403).json({ error: "Product not found or you cannot delete it" });

    await pool.query("DELETE FROM products WHERE id = ?", [id]);

    if (product[0].image_url) deleteFromS3(product[0].image_url);
    if (product[0].video_url) deleteFromS3(product[0].video_url);

    return res.status(200).json({ success: true, message: "Product permanently deleted." });
  } catch (error) {
    console.error("Delete Product Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
/**
 * @route   GET /api/vendor/products/:id
 */
export const getVendorProductById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized." });

    const { id } = req.params;
    if (isNaN(Number(id))) return res.status(400).json({ error: "Invalid Product ID." });

    const [vendor]: any = await pool.query("SELECT id FROM vendors WHERE user_id = ?", [userId]);
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

    if (rows.length === 0) return res.status(404).json({ error: "Product not found." });

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("GetVendorProductById Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};