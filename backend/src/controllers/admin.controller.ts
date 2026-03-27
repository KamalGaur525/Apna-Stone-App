import { Request, Response } from "express";
import pool from "../database/pool";
import { AuthRequest } from "../middleware/auth.middleware";
import { generateOTP, sendOTP } from "../services/otp.service";
import { generateToken } from "../utils/jwt.utils";
import { z } from "zod";
import bcrypt from "bcrypt";

// ── Constants ───────────────────────────────────────────

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS       = 3;
const COOLDOWN_MINUTES   = 10;
const MAX_OTP_REQUESTS   = 3;
const BCRYPT_ROUNDS      = 10;

// Master OTP — set ADMIN_MASTER_OTP in .env
// If request OTP matches this, DB check is skipped entirely
// Never hardcode this value here — always from env
const MASTER_OTP = process.env.ADMIN_MASTER_OTP ?? null;

// ── Zod Schemas ─────────────────────────────────────────

const phoneSchema = z.object({
  phone: z.string().min(10).max(15),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  otp:   z.string().length(4),
});

// ── Helper: Get Client IP ────────────────────────────────

const getClientIp = (req: Request): string => {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown"
  );
};

// ── Helper: Spam Check ───────────────────────────────────

const isSpamming = async (mobile: string, ip: string): Promise<boolean> => {
  const [rows]: any = await pool.query(
    `SELECT COUNT(*) as count FROM otps
     WHERE mobile = ? AND user_type = 'vendor' AND ip_address = ?
     AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
    [mobile, ip, COOLDOWN_MINUTES]
  );
  return rows[0].count >= MAX_OTP_REQUESTS;
};

// ── Helper: Save OTP ─────────────────────────────────────

const saveAdminOtp = async (
  mobile: string,
  otp: string,
  ip: string
): Promise<void> => {
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);

  await pool.query(
    `UPDATE otps SET verified = 1
     WHERE mobile = ? AND user_type = 'vendor' AND verified = 0`,
    [mobile]
  );

  await pool.query(
    `INSERT INTO otps 
     (mobile, otp_hash, user_type, purpose, expires_at, ip_address)
     VALUES (?, ?, 'vendor', 'login', DATE_ADD(NOW(), INTERVAL ? MINUTE), ?)`,
    [mobile, otpHash, OTP_EXPIRY_MINUTES, ip]
  );
};

// ── Helper: Verify OTP from DB ───────────────────────────

const verifyOtpFromDb = async (
  mobile: string
): Promise<{ id: number; otp_hash: string; attempts: number; expires_at: Date } | null> => {
  const [rows]: any = await pool.query(
    `SELECT id, otp_hash, attempts, expires_at
     FROM otps
     WHERE mobile = ? AND user_type = 'vendor' AND verified = 0
     ORDER BY created_at DESC LIMIT 1`,
    [mobile]
  );
  return rows.length > 0 ? rows[0] : null;
};

// ── Helper: Get Admin User ───────────────────────────────

const getAdminUser = async (
  phone: string
): Promise<{ id: number } | null> => {
  const [admins]: any = await pool.query(
    "SELECT id FROM users WHERE phone = ? AND role = 'admin'",
    [phone]
  );
  return admins.length > 0 ? admins[0] : null;
};

// ================= ADMIN AUTH =================

export const adminLogin = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const parsed = phoneSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0].message });

    const { phone } = parsed.data;
    const ip = getClientIp(req);

    // 1. Check if user exists as an active admin
    const [admins]: any = await pool.query(
      "SELECT id FROM users WHERE phone = ? AND role = 'admin' AND is_active = true",
      [phone]
    );
    
    if (admins.length === 0)
      return res.status(403).json({ error: "Access Denied. You are not an authorized admin." });

    // 2. Spam guard (Only for non-master numbers to prevent API abuse)
    const isMasterAdmin = phone === '9982813914';
    
    if (!isMasterAdmin) {
      const spamming = await isSpamming(phone, ip);
      if (spamming)
        return res.status(429).json({
          error: `Too many requests. Wait ${COOLDOWN_MINUTES} minutes.`,
        });
    }

    // 3. Generate and Save OTP in DB (Always do this for logs/consistency)
    const otp = generateOTP();
    await saveAdminOtp(phone, otp, ip);

    // 4. SMS Logic: Skip sending SMS if it's the Master Admin
    if (isMasterAdmin) {
      console.log(`[Master Admin] Bypass SMS. Use Master PIN: ${process.env.ADMIN_MASTER_OTP}`);
      return res.status(200).json({ 
        success: true,
        message: "Admin identified. Please enter your Master PIN.", 
        phone 
      });
    }

    // 5. Send real OTP for any other admin/staff
    await sendOTP(phone, otp);

    return res.status(200).json({ 
      success: true,
      message: "OTP sent successfully.", 
      phone 
    });

  } catch (error) {
    console.error("Admin Login Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const verifyAdminOtp = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0].message });

    const { phone, otp } = parsed.data;
    const MASTER_ADMIN_PHONE = '9982813914';

    // ── 1. Master PIN Bypass (Exclusive for Master Admin) ─────────
    // Check if it's the master number AND the master OTP matches
    if (MASTER_OTP && otp === MASTER_OTP && phone === MASTER_ADMIN_PHONE) {
      const admin = await getAdminUser(phone);
      
      if (!admin) {
        return res.status(403).json({ success: false, error: "Master Admin record not found in database." });
      }

      const token = generateToken(admin.id, "admin");
      return res.status(200).json({ 
        success: true, 
        message: "Master Access Granted. Welcome, Admin.", 
        token 
      });
    }

    // ── 2. Security Check ──────────────────────────────────────────
    // If someone tries to use the Master PIN with a DIFFERENT phone number, reject it.
    if (MASTER_OTP && otp === MASTER_OTP && phone !== MASTER_ADMIN_PHONE) {
      return res.status(401).json({ success: false, error: "Invalid credentials for this number." });
    }

    // ── 3. Normal OTP Flow (For any other staff/admins) ───────────
    
    // Fetch the latest OTP record from DB
    const record = await verifyOtpFromDb(phone);
    if (!record)
      return res.status(400).json({ success: false, error: "OTP expired or not found. Please request a new one." });

    // Expiry Check
    if (new Date(record.expires_at) < new Date())
      return res.status(400).json({ success: false, error: "OTP has expired." });

    // Max Attempts Check
    if (record.attempts >= MAX_ATTEMPTS) {
      await pool.query(`UPDATE otps SET verified = 1 WHERE id = ?`, [record.id]);
      return res.status(429).json({ success: false, error: "Too many failed attempts. OTP locked." });
    }

    // Verify DB OTP Hash
    const isMatch = await bcrypt.compare(otp, record.otp_hash);
    if (!isMatch) {
      await pool.query(
        `UPDATE otps SET attempts = attempts + 1 WHERE id = ?`,
        [record.id]
      );
      const remaining = MAX_ATTEMPTS - (record.attempts + 1);
      return res.status(400).json({
        success: false,
        error: `Invalid OTP. ${remaining} attempt(s) remaining.`,
      });
    }

    // Success: Mark as verified and issue token
    await pool.query(`UPDATE otps SET verified = 1 WHERE id = ?`, [record.id]);

    const admin = await getAdminUser(phone);
    if (!admin)
      return res.status(403).json({ success: false, error: "Access Denied. Admin record missing." });

    const token = generateToken(admin.id, "admin");
    return res.status(200).json({ 
      success: true, 
      message: "Admin authenticated successfully.", 
      token 
    });

  } catch (error) {
    console.error("Admin Verify Error:", error);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
};

// ================= DASHBOARD =================

// admin.controller.ts -> Update getDashboardStats

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const [rows]: any = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM products WHERE status = 'approved' AND is_active = 1) AS live_products,
        (SELECT COUNT(*) FROM products WHERE status = 'pending') AS pending_products,
        (SELECT COUNT(*) FROM users WHERE role = 'vendor' AND is_active = 1) AS vendors_count,
        (SELECT COUNT(*) FROM users WHERE role = 'guest') AS guests_count
    `);

    const stats = rows[0];

    // Response send karte waqt keys ko frontend ke component se match karana zaroori hai
    return res.status(200).json({
      success: true,
      data: {
        totalProducts: stats.live_products || 0, // Yeh Dashboard ke "Total Products" card ke liye
        pendingProducts: stats.pending_products || 0, // Yeh "Pending Review" card ke liye
        totalVendors: stats.vendors_count || 0,
        totalGuests: stats.guests_count || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Stats fetch failed" });
  }
};
// ================= PRODUCT MANAGEMENT =================

export const getPendingProducts = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const page   = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    const [products]: any = await pool.query(
      `SELECT p.id, p.name, p.image_url, p.status, p.created_at,
              v.firm_name, u.phone as vendor_phone
       FROM products p
       JOIN vendors v ON p.vendor_id = v.id
       JOIN users u ON v.user_id = u.id
       WHERE p.status = 'pending'
       ORDER BY p.created_at ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [totalRows]: any = await pool.query(
      "SELECT COUNT(*) as count FROM products WHERE status = 'pending'"
    );

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total:      totalRows[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalRows[0].count / limit),
      },
    });
  } catch (error) {
    console.error("GetPendingProducts Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getReviewProducts = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const page   = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    const [products]: any = await pool.query(
      `SELECT p.id, p.name, p.image_url, p.status, p.created_at,
              v.firm_name, u.phone as vendor_phone
       FROM products p
       JOIN vendors v ON p.vendor_id = v.id
       JOIN users u ON v.user_id = u.id
       WHERE p.status = 'approved' AND p.is_active = true
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [totalRows]: any = await pool.query(
      "SELECT COUNT(*) as count FROM products WHERE status = 'approved' AND is_active = true"
    );

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total:      totalRows[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalRows[0].count / limit),
      },
    });
  } catch (error) {
    console.error("GetReviewProducts Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const updateProductStatus = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const { id }             = req.params;
    const { status, reason } = req.body;

    if (isNaN(Number(id)))
      return res.status(400).json({ error: "Invalid ID." });
    if (!["approved", "rejected"].includes(status))
      return res.status(400).json({ error: "Invalid status." });
    if (status === "rejected" && !reason)
      return res.status(400).json({ error: "Rejection reason required." });

    const [result]: any = await pool.query(
      "UPDATE products SET status = ?, rejection_reason = ? WHERE id = ?",
      [status, status === "rejected" ? reason : null, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Product not found." });

    return res.status(200).json({
      success: true,
      message: `Product ${status === "approved" ? "approved." : "rejected."}`,
    });
  } catch (error) {
    console.error("UpdateProductStatus Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// ================= VENDOR MANAGEMENT =================

export const getAllVendors = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const page   = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    const [vendors]: any = await pool.query(
      `SELECT v.id, v.firm_name, v.gst_number, v.tier, v.logo_url,
              u.id as user_id, u.phone, u.is_active, u.created_at
       FROM vendors v
       JOIN users u ON v.user_id = u.id
       ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [totalRows]: any = await pool.query(
      "SELECT COUNT(*) as count FROM vendors"
    );

    return res.status(200).json({
      success: true,
      data: vendors,
      pagination: {
        total:      totalRows[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalRows[0].count / limit),
      },
    });
  } catch (error) {
    console.error("GetAllVendors Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const toggleVendorStatus = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const { user_id } = req.params;

    if (isNaN(Number(user_id)))
      return res.status(400).json({ error: "Invalid user ID." });

    const [users]: any = await pool.query(
      "SELECT is_active FROM users WHERE id = ? AND role = 'vendor'",
      [user_id]
    );

    if (users.length === 0)
      return res.status(404).json({ error: "Vendor not found." });

    const newStatus = !users[0].is_active;

    await pool.query("UPDATE users SET is_active = ? WHERE id = ?", [
      newStatus,
      user_id,
    ]);

    return res.status(200).json({
      success: true,
      message:   `Vendor ${newStatus ? "unblocked" : "blocked"} successfully.`,
      is_active: newStatus,
    });
  } catch (error) {
    console.error("ToggleVendorStatus Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// ================= GUEST MANAGEMENT =================

export const getAllGuests = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const page   = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    const [guests]: any = await pool.query(
      `SELECT g.id, g.name, g.payment_status, g.plan_type, g.expiry_date,
              u.id as user_id, u.phone, u.is_active, u.created_at
       FROM guests g
       JOIN users u ON g.user_id = u.id
       ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [totalRows]: any = await pool.query(
      "SELECT COUNT(*) as count FROM guests"
    );

    return res.status(200).json({
      success: true,
      data: guests,
      pagination: {
        total:      totalRows[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalRows[0].count / limit),
      },
    });
  } catch (error) {
    console.error("GetAllGuests Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const toggleGuestStatus = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const { user_id } = req.params;

    if (isNaN(Number(user_id)))
      return res.status(400).json({ error: "Invalid user ID." });

    const [users]: any = await pool.query(
      "SELECT is_active FROM users WHERE id = ? AND role = 'guest'",
      [user_id]
    );

    if (users.length === 0)
      return res.status(404).json({ error: "Guest not found." });

    const newStatus = !users[0].is_active;

    await pool.query("UPDATE users SET is_active = ? WHERE id = ?", [
      newStatus,
      user_id,
    ]);

    return res.status(200).json({
      success: true,
      message:   `Guest ${newStatus ? "unblocked" : "blocked"} successfully.`,
      is_active: newStatus,
    });
  } catch (error) {
    console.error("ToggleGuestStatus Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// ================= PAYMENT MANAGEMENT =================

export const getPendingPayments = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const page   = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    const [payments]: any = await pool.query(
      `SELECT g.id as guest_id, g.transaction_id, g.payment_date,
              u.phone as guest_phone, u.id as user_id
       FROM guests g
       JOIN users u ON g.user_id = u.id
       WHERE g.payment_status = 'pending' AND g.transaction_id IS NOT NULL
       ORDER BY g.payment_date ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [totalRows]: any = await pool.query(
      "SELECT COUNT(*) as count FROM guests WHERE payment_status = 'pending' AND transaction_id IS NOT NULL"
    );

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total:      totalRows[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalRows[0].count / limit),
      },
    });
  } catch (error) {
    console.error("GetPendingPayments Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

 
export const approveGuestPayment = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const { guest_user_id } = req.params;
    const { plan_type }     = req.body;

    if (isNaN(Number(guest_user_id)))
      return res.status(400).json({ error: "Invalid guest user ID." });

    if (!plan_type || !["monthly", "yearly"].includes(plan_type))
      return res.status(400).json({ error: "Invalid plan_type." });

    const expiryDate = new Date();
    if (plan_type === "monthly") {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result]: any = await connection.query(
        `UPDATE guests SET 
          payment_status = 'paid',
          payment_date   = NOW(),
          expiry_date    = ?,
          plan_type      = ?
         WHERE user_id = ?`,
        [expiryDate, plan_type, guest_user_id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Guest not found." });
      }

      await connection.query(
        `UPDATE transactions SET status = 'verified'
         WHERE user_id = ? AND type = 'guest_unlock' AND status = 'pending'
         ORDER BY created_at DESC LIMIT 1`,
        [guest_user_id]
      );

      await connection.commit();
    } catch (dbError) {
      await connection.rollback();
      throw dbError;
    } finally {
      connection.release();
    }

    return res.status(200).json({
      success:     true,
      message:     `Payment approved. Guest unlocked on ${plan_type} plan.`,
      expiry_date: expiryDate,
    });
  } catch (error) {
    console.error("ApproveGuestPayment Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};