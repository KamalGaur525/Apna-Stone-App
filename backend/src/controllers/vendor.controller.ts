import { Request, Response } from "express";
import { z } from "zod";
import pool from "../database/pool";
import { generateToken } from "../utils/jwt.utils";
import { AuthRequest } from "../middleware/auth.middleware";

// --- Register Vendor Section ---

/* const TIER_PRICES = {
  "Godown": 300,
  "Factory": 500,
  "Stone Seller": 800,
}; 
*/

const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const registerVendorSchema = z.object({
  phone: z.string().min(10, "Invalid phone number").max(15),
  gst_number: z.string().regex(gstRegex, "Invalid GST format"),
  firm_name: z.string().min(2, "Firm name is required"),
  tier: z.enum(["Godown", "Factory", "Stone Seller"], {
    message: "Invalid tier selected. Must be Godown, Factory, or Stone Seller.",
  }),
  payment_ref_id: z.string().min(5, "Payment Reference ID is required"), 
});

export const registerVendor = async (req: Request, res: Response): Promise<any> => {
  let connection; 
  try {
    const parsed = registerVendorSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const { phone, gst_number, firm_name, tier, payment_ref_id } = parsed.data;

    // 1. Check if user already exists in USERS table (The ONLY source of truth for phone)
    const [existingUser]: any = await pool.query("SELECT id FROM users WHERE phone = ?", [phone]);
    if (existingUser.length > 0) return res.status(400).json({ error: "Phone number already registered." });

    // 2. Check GST in VENDORS table
    const [existingGst]: any = await pool.query("SELECT id FROM vendors WHERE gst_number = ?", [gst_number]);
    if (existingGst.length > 0) return res.status(400).json({ error: "GST number already registered." });

    if (payment_ref_id === "FAILED") return res.status(400).json({ error: "Payment verification failed." });

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 3. Create User first
    const [userResult]: any = await connection.query(
      "INSERT INTO users (phone, role, is_active) VALUES (?, 'vendor', true)",
      [phone]
    );
    const userId = userResult.insertId;

    // 4. Create Vendor profile (Linking to User via ID, no phone stored here)
    await connection.query(
      "INSERT INTO vendors (user_id, gst_number, firm_name, tier) VALUES (?, ?, ?, ?)",
      [userId, gst_number, firm_name, tier]
    );

    await connection.commit();
    const token = generateToken(userId, "vendor");

    return res.status(201).json({ success: true, message: "Vendor registered!", token });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Critical Reg Error:", error);
    return res.status(500).json({ error: "Registration failed." });
  } finally {
    if (connection) connection.release();
  }
};



export const updateVendorProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    // 🔴 Severity Fix: User ID check (Security)
    if (!userId) return res.status(401).json({ error: "Unauthorized. User ID missing." });

    const { 
      firm_name, 
      gst_number, 
      tier, 
      logo_url, 
      whatsapp, 
      email, 
      location, 
      about,
  facebook,    
  instagram,   
  website,  
    } = req.body;

    // 🔴 1. Critical Validation: GST Regex (Indian Standard)
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    const cleanGST = gst_number?.toUpperCase().trim();

    if (!cleanGST || !gstRegex.test(cleanGST)) {
      return res.status(400).json({ 
        error: "Invalid GST Format. Ek valid 15-digit GST number zaroori hai." 
      });
    }

    if (!firm_name || firm_name.trim().length < 3) {
      return res.status(400).json({ error: "Valid Firm Name (min 3 chars) mandatory hai." });
    }

    // 🟢 2. Update Query
    // 🟡 Severity Fix: Using '??' instead of '||' to preserve empty values if needed
    const [result]: any = await pool.query(
      `UPDATE vendors SET 
        gst_number = ?, 
        firm_name = ?, 
        tier = ?, 
        logo_url = ?, 
        whatsapp = ?, 
        email = ?, 
          facebook = ?,     
  instagram = ?,    
  website = ?,   
        location = ?, 
        about = ? 
       WHERE user_id = ?`,
      [
        cleanGST,
        firm_name.trim(),
        tier ?? 'Stone Seller',
        logo_url ?? null,
        whatsapp ?? null,
        email ?? null,
        facebook ?? null,
  instagram ?? null,
  website ?? null,
        location ?? null,
        about ?? null,
        userId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Vendor profile not found." });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Vendor profile updated successfully!" 
    });

  } catch (error: any) {
    // 🟢 Fixed: Structured console logging
    console.error("UpdateVendor Error:", error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Ye GST Number pehle se registered hai." });
    }
    
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── GET Vendor Dashboard Stats ──────────────────────
export const getVendorDashboard = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ error: "Unauthorized." });

    // Vendor ID nikalo
    const [vendors]: any = await pool.query(
      "SELECT id, firm_name, tier, logo_url FROM vendors WHERE user_id = ?",
      [userId]
    );

    if (vendors.length === 0)
      return res.status(404).json({ error: "Vendor not found." });

    const vendor = vendors[0];

    // Products stats
    const [productStats]: any = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
       FROM products WHERE vendor_id = ?`,
      [vendor.id]
    );

    // Subscription status
    const [subs]: any = await pool.query(
      `SELECT t.status, t.created_at, sp.plan_type
       FROM transactions t
       INNER JOIN subscription_plans sp ON sp.plan_type = t.type
       WHERE t.user_id = ? AND t.status = 'verified'
       ORDER BY t.created_at DESC LIMIT 1`,
      [userId]
    );

    const hasSubscription = subs.length > 0;

    return res.status(200).json({
      success: true,
      data: {
        firm_name: vendor.firm_name,
        tier: vendor.tier,
        logo_url: vendor.logo_url,
        subscription: {
          isActive: hasSubscription,
          planName: hasSubscription ? subs[0].plan_type : null,
        },
        products: {
          total: productStats[0].total || 0,
          approved: productStats[0].approved || 0,
          pending: productStats[0].pending || 0,
          rejected: productStats[0].rejected || 0,
        },
      },
    });
  } catch (error) {
    console.error("GetVendorDashboard Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// ── GET Vendor Profile ───────────────────────────────
export const getVendorProfile = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ error: "Unauthorized." });

    const [vendors]: any = await pool.query(
      `SELECT v.*, u.phone
       FROM vendors v
       JOIN users u ON v.user_id = u.id
       WHERE v.user_id = ?`,
      [userId]
    );

    if (vendors.length === 0)
      return res.status(404).json({ error: "Vendor not found." });

    return res.status(200).json({
      success: true,
      data: vendors[0],
    });
  } catch (error) {
    console.error("GetVendorProfile Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// ── Get Subscription Plans ───────────────────────────
export const getSubscriptionPlans = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const [plans]: any = await pool.query(
      "SELECT id, plan_type, price FROM subscription_plans WHERE is_active = true ORDER BY price ASC"
    );
    return res.status(200).json({ success: true, data: plans });
  } catch (error) {
    console.error("GetSubscriptionPlans Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const uploadVendorLogo = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized. User ID missing." });

    if (!req.file) return res.status(400).json({ error: "No logo file provided." });

    // ✅ Same path pattern as products: /uploads/logos/filename.ext
    const logoUrl = `/uploads/logos/${req.file.filename}`;

    const [result]: any = await pool.query(
      "UPDATE vendors SET logo_url = ? WHERE user_id = ?",
      [logoUrl, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Vendor not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Logo uploaded successfully!",
      logo_url: logoUrl,
    });
  } catch (error) {
    console.error("UploadVendorLogo Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};