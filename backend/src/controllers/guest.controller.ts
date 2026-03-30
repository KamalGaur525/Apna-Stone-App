import { Request, Response } from "express";
import pool from "../database/pool";
import { AuthRequest } from "../middleware/auth.middleware";

// ── Guest Home ───────────────────────────────────────
export const getGuestHome = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const city = req.query.city as string || null;

    // ── Categories with product count ────────────────
    const [categories]: any = await pool.query(
      `SELECT 
        c.id, c.name,
        COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
         AND p.status = 'approved' AND p.is_active = true
       WHERE c.parent_id IS NULL
       GROUP BY c.id
       ORDER BY product_count DESC`
    );

    // ── Featured Firms — with city filter ────────────
    let firmQuery = `
      SELECT DISTINCT
        v.id, v.firm_name, v.tier, v.location, v.logo_url,
        v.whatsapp, v.email, v.instagram, v.facebook, v.website,
        u.phone,
        COUNT(p.id) as product_count
       FROM vendors v
       JOIN users u ON v.user_id = u.id
       JOIN products p ON p.vendor_id = v.id
       WHERE p.status = 'approved' AND p.is_active = true AND u.is_active = true
    `;

    const firmParams: any[] = [];
    if (city) {
      firmQuery += ` AND v.location LIKE ?`;
      firmParams.push(`%${city}%`);
    }

    firmQuery += ` GROUP BY v.id ORDER BY product_count DESC LIMIT 10`;

    const [firms]: any = await pool.query(firmQuery, firmParams);

    // ── Trending Products ────────────────────────────
    const [products]: any = await pool.query(
      `SELECT 
        p.id, p.name, p.image_url, p.sub_category,
        v.firm_name as vendor_name,
        c.name as category_name
       FROM products p
       JOIN vendors v ON p.vendor_id = v.id
       JOIN users u ON v.user_id = u.id
       JOIN categories c ON p.category_id = c.id
       WHERE p.status = 'approved' AND p.is_active = true AND u.is_active = true
       ORDER BY p.created_at DESC
       LIMIT 10`
    );

    // ── Services ─────────────────────────────────────
    const [services]: any = await pool.query(
      `SELECT 
        st.id as service_type_id, st.name as service_type,
        sp.id, sp.name, sp.phone, sp.photo_url, sp.description
       FROM service_types st
       JOIN service_providers sp ON sp.service_type_id = st.id
       WHERE st.is_active = true AND sp.is_active = true
       ORDER BY st.name ASC
       LIMIT 10`
    );

    return res.status(200).json({
      success: true,
      data: { categories, firms, products, services },
    });
  } catch (error) {
    console.error("GetGuestHome Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// ── Search ───────────────────────────────────────────
export const searchGuest = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const query = req.query.q as string;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: "Search query must be at least 2 characters." });
    }

    const search = `%${query.trim()}%`;

    // ── Firms ────────────────────────────────────────
    const [firms]: any = await pool.query(
      `SELECT DISTINCT
        v.id, v.firm_name, v.tier, v.location, v.logo_url,
        u.phone, v.whatsapp
       FROM vendors v
       JOIN users u ON v.user_id = u.id
       JOIN products p ON p.vendor_id = v.id
       JOIN categories c ON p.category_id = c.id
       WHERE u.is_active = true
         AND p.status = 'approved'
         AND p.is_active = true
         AND (
           v.firm_name LIKE ?
           OR v.location LIKE ?
           OR p.name LIKE ?
           OR p.sub_category LIKE ?
           OR p.third_category LIKE ?
           OR c.name LIKE ?
         )
       LIMIT 20`,
      [search, search, search, search, search, search]
    );

    // ── Services ─────────────────────────────────────
    const [services]: any = await pool.query(
      `SELECT 
        sp.id, sp.name, sp.phone, sp.photo_url, sp.description,
        st.name as service_type
       FROM service_providers sp
       JOIN service_types st ON sp.service_type_id = st.id
       WHERE st.is_active = true AND sp.is_active = true
         AND (
           sp.name LIKE ?
           OR st.name LIKE ?
           OR sp.description LIKE ?
         )
       LIMIT 10`,
      [search, search, search]
    );

    return res.status(200).json({
      success: true,
      data: { firms, services },
      query: query.trim(),
    });
  } catch (error) {
    console.error("SearchGuest Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// ── Firm Detail ──────────────────────────────────────
export const getFirmDetail = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;

    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid firm ID." });
    }

    // Firm info
    const [firms]: any = await pool.query(
      `SELECT 
        v.id, v.firm_name, v.tier, v.location, v.logo_url,
        v.whatsapp, v.email, v.about, v.instagram, v.facebook, v.website,
        u.phone
       FROM vendors v
       JOIN users u ON v.user_id = u.id
       WHERE v.id = ? AND u.is_active = true`,
      [id]
    );

    if (firms.length === 0) {
      return res.status(404).json({ error: "Firm not found." });
    }

    // Firm products
    const [products]: any = await pool.query(
      `SELECT 
        p.id, p.name, p.image_url, p.sub_category, p.description,
        c.name as category_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.vendor_id = ? AND p.status = 'approved' AND p.is_active = true
       ORDER BY p.created_at DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        firm: firms[0],
        products,
      },
    });
  } catch (error) {
    console.error("GetFirmDetail Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// ── Category Products ────────────────────────────────
export const getCategoryProducts = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;

    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid category ID." });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    // Get category + subcategories
    const [products]: any = await pool.query(
      `SELECT 
  p.id, p.name, p.image_url, p.sub_category, p.third_category, p.description,
  v.id as vendor_id, v.firm_name, v.firm_name as vendor_name, 
  v.location, v.location as vendor_location, v.logo_url, u.phone as vendor_phone,
  
  c.name as category_name
       FROM products p
       JOIN vendors v ON p.vendor_id = v.id
       JOIN users u ON v.user_id = u.id
       JOIN categories c ON p.category_id = c.id
       WHERE (p.category_id = ? OR c.parent_id = ?)
         AND p.status = 'approved'
         AND p.is_active = true
         AND u.is_active = true
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [id, id, limit, offset]
    );

    const [totalRows]: any = await pool.query(
      `SELECT COUNT(*) as count FROM products p
       JOIN categories c ON p.category_id = c.id
       JOIN users u ON (
         SELECT user_id FROM vendors WHERE id = p.vendor_id
       ) = u.id
       WHERE (p.category_id = ? OR c.parent_id = ?)
         AND p.status = 'approved' AND p.is_active = true`,
      [id, id]
    );

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total: totalRows[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalRows[0].count / limit),
      },
    });
  } catch (error) {
    console.error("GetCategoryProducts Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
export const getAllFirms = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const city = req.query.city as string || null;

    let query = `
      SELECT DISTINCT
        v.id, v.firm_name, v.tier, v.location, v.logo_url,
        v.whatsapp, u.phone,
        COUNT(p.id) as product_count
       FROM vendors v
       JOIN users u ON v.user_id = u.id
       JOIN products p ON p.vendor_id = v.id
       WHERE p.status = 'approved' AND p.is_active = true AND u.is_active = true
    `;

    const params: any[] = [];
    if (city) {
      query += ` AND v.location LIKE ?`;
      params.push(`%${city}%`);
    }

    query += ` GROUP BY v.id ORDER BY product_count DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [firms]: any = await pool.query(query, params);

    const [totalRows]: any = await pool.query(
      `SELECT COUNT(DISTINCT v.id) as count
       FROM vendors v
       JOIN users u ON v.user_id = u.id
       JOIN products p ON p.vendor_id = v.id
       WHERE p.status = 'approved' AND p.is_active = true AND u.is_active = true
       ${city ? "AND v.location LIKE ?" : ""}`,
      city ? [`%${city}%`] : []
    );

    return res.status(200).json({
      success: true,
      data: firms,
      pagination: {
        total: totalRows[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalRows[0].count / limit),
      },
    });
  } catch (error) {
    console.error("GetAllFirms Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};