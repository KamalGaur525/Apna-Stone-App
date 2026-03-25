import { Request, Response } from "express";
import pool from "../database/pool";
import { AuthRequest } from "../middleware/auth.middleware";
import { generateOTP, sendOTP } from "../services/otp.service";
import { generateToken } from "../utils/jwt.utils";

// ── Constants ───────────────────────────────────────────
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 3;
const COOLDOWN_MINUTES = 10;
const MAX_OTP_REQUESTS = 3;
const BCRYPT_ROUNDS = 10;

// ── Zod Schemas ─────────────────────────────────────────
import { z } from "zod";
import bcrypt from "bcrypt";

const phoneSchema = z.object({
  phone: z.string().min(10).max(15),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(4),
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

// ── Helper: Verify OTP ───────────────────────────────────
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

    const [admins]: any = await pool.query(
      "SELECT id FROM users WHERE phone = ? AND role = 'admin' AND is_active = true",
      [phone]
    );
    if (admins.length === 0)
      return res.status(403).json({ error: "Access Denied." });

    const spamming = await isSpamming(phone, ip);
    if (spamming)
      return res.status(429).json({
        error: `Too many requests. Wait ${COOLDOWN_MINUTES} minutes.`,
      });

    const otp = generateOTP();
    await saveAdminOtp(phone, otp, ip);
    await sendOTP(phone, otp);

    return res.status(200).json({ message: "OTP sent.", phone });
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

    const record = await verifyOtpFromDb(phone);
    if (!record)
      return res.status(400).json({ error: "OTP expired or not found." });

    if (new Date(record.expires_at) < new Date())
      return res.status(400).json({ error: "OTP has expired." });

    if (record.attempts >= MAX_ATTEMPTS) {
      await pool.query(`UPDATE otps SET verified = 1 WHERE id = ?`, [record.id]);
      return res.status(429).json({ error: "Too many attempts." });
    }

    const isMatch = await bcrypt.compare(otp, record.otp_hash);
    if (!isMatch) {
      await pool.query(`UPDATE otps SET attempts = attempts + 1 WHERE id = ?`, [record.id]);
      const remaining = MAX_ATTEMPTS - (record.attempts + 1);
      return res.status(400).json({
        error: `Invalid OTP. ${remaining} attempt(s) remaining.`,
      });
    }

    await pool.query(`UPDATE otps SET verified = 1 WHERE id = ?`, [record.id]);

    const [admins]: any = await pool.query(
      "SELECT id FROM users WHERE phone = ? AND role = 'admin'",
      [phone]
    );
    const token = generateToken(admins[0].id, "admin");

    return res.status(200).json({ message: "Admin authenticated.", token });
  } catch (error) {
    console.error("Admin Verify Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// ================= DASHBOARD =================

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const [stats]: any = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM guests WHERE payment_status = 'pending') as pending_payments,
        (SELECT COUNT(*) FROM products WHERE status = 'approved' AND is_active = true) as total_live_products,
        (SELECT COUNT(*) FROM products WHERE status = 'pending') as pending_products,
        (SELECT COUNT(*) FROM users WHERE role = 'vendor' AND is_active = true) as total_vendors,
        (SELECT COUNT(*) FROM users WHERE role = 'guest') as total_guests
    `);
    return res.status(200).json({ success: true, data: stats[0] });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// ================= PRODUCT MANAGEMENT =================

export const getPendingProducts = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
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
        total: totalRows[0].count,
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
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
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
        total: totalRows[0].count,
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
    const { id } = req.params;
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
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    const [vendors]: any = await pool.query(
      `SELECT v.id, v.firm_name, v.gst_number, v.tier, v.phone,
              u.id as user_id, u.is_active, u.created_at
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
        total: totalRows[0].count,
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
      message: `Vendor ${newStatus ? "unblocked" : "blocked"} successfully.`,
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
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    const [guests]: any = await pool.query(
      `SELECT g.id, g.payment_status, g.plan_type, g.expiry_date,
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
        total: totalRows[0].count,
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
      message: `Guest ${newStatus ? "unblocked" : "blocked"} successfully.`,
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
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
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
        total: totalRows[0].count,
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
    const { plan_type } = req.body;

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

      // Update guest payment status
      const [result]: any = await connection.query(
        `UPDATE guests SET 
          payment_status = 'paid',
          payment_date = NOW(),
          expiry_date = ?,
          plan_type = ?
         WHERE user_id = ?`,
        [expiryDate, plan_type, guest_user_id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Guest not found." });
      }

      // Update transaction record
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
      success: true,
      message: `Payment approved. Guest unlocked on ${plan_type} plan.`,
      expiry_date: expiryDate,
    });
  } catch (error) {
    console.error("ApproveGuestPayment Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};