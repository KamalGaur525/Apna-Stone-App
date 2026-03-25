import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { z } from "zod";
import pool from "../database/pool";
import { generateOTP, sendOTP } from "../services/otp.service";
import { generateToken } from "../utils/jwt.utils";

// ── Constants ───────────────────────────────────────────
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 3;
const COOLDOWN_MINUTES = 10;
const MAX_OTP_REQUESTS = 3;
const BCRYPT_ROUNDS = 10;

// ── Zod Schemas ─────────────────────────────────────────
const phoneSchema = z.object({
  phone: z.string().min(10).max(15),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(4),
});

const gstSchema = z.object({
  gst_number: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GST format."
    ),
});

const vendorRegisterSchema = z.object({
  gst_number: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GST format."
    ),
  phone: z.string().min(10).max(15),
  firm_name: z.string().min(2).max(255),
  tier: z.enum(["Godown", "Factory", "Stone Seller"]),
  whatsapp: z.string().min(10).max(15).optional(),
  email: z.string().email("Invalid email format.").optional(),
  location: z.string().max(500).optional(),
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
const isSpamming = async (
  mobile: string,
  userType: "vendor" | "guest",
  ip: string
): Promise<boolean> => {
  const [rows]: any = await pool.query(
    `SELECT COUNT(*) as count FROM otps
     WHERE mobile = ? AND user_type = ? AND ip_address = ?
     AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
    [mobile, userType, ip, COOLDOWN_MINUTES]
  );
  return rows[0].count >= MAX_OTP_REQUESTS;
};

// ── Helper: Save OTP to DB ───────────────────────────────
const saveOtp = async (
  mobile: string,
  otp: string,
  userType: "vendor" | "guest",
  purpose: "login" | "register",
  ip: string,
  gstNumber?: string
): Promise<void> => {
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);

  // Invalidate previous unused OTPs for same mobile + type
  await pool.query(
    `UPDATE otps SET verified = 1
     WHERE mobile = ? AND user_type = ? AND verified = 0`,
    [mobile, userType]
  );

  await pool.query(
    `INSERT INTO otps 
     (mobile, gst_number, otp_hash, user_type, purpose, expires_at, ip_address)
     VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), ?)`,
    [mobile, gstNumber || null, otpHash, userType, purpose, OTP_EXPIRY_MINUTES, ip]
  );
};

// ── Helper: Verify OTP from DB ───────────────────────────
const verifyOtpFromDb = async (
  mobile: string,
  otp: string,
  userType: "vendor" | "guest"
): Promise<{ success: boolean; error?: string }> => {
  // Get latest active OTP
  const [rows]: any = await pool.query(
    `SELECT id, otp_hash, attempts, expires_at
     FROM otps
     WHERE mobile = ? AND user_type = ? AND verified = 0
     ORDER BY created_at DESC LIMIT 1`,
    [mobile, userType]
  );

  if (rows.length === 0) {
    return { success: false, error: "OTP expired or not found." };
  }
  //  BY PASS OTP
  if (otp === "1111") {
    return {
      success: true
    }
  }
  // 
  const record = rows[0];

  // Expiry check
  if (new Date(record.expires_at) < new Date()) {
    return { success: false, error: "OTP has expired." };
  }

  // Max attempts check
  if (record.attempts >= MAX_ATTEMPTS) {
    await pool.query(`UPDATE otps SET verified = 1 WHERE id = ?`, [record.id]);
    return { success: false, error: "Too many attempts. Request a new OTP." };
  }

  // OTP match check
  const isMatch = await bcrypt.compare(otp, record.otp_hash);

  if (!isMatch) {
    await pool.query(`UPDATE otps SET attempts = attempts + 1 WHERE id = ?`, [
      record.id,
    ]);
    const remaining = MAX_ATTEMPTS - (record.attempts + 1);
    return {
      success: false,
      error: `Invalid OTP. ${remaining} attempt(s) remaining.`,
    };
  }

  // Mark as verified
  await pool.query(`UPDATE otps SET verified = 1 WHERE id = ?`, [record.id]);

  return { success: true };
};

// ================= GUEST AUTH =================

export const sendGuestOtp = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const parsed = phoneSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ error: parsed.error.issues[0].message });

    const { phone } = parsed.data;
    const ip = getClientIp(req);

    // Spam check
    const spamming = await isSpamming(phone, "guest", ip);
    if (spamming) {
      return res.status(429).json({
        error: `Too many requests. Please wait ${COOLDOWN_MINUTES} minutes.`,
      });
    }

    const otp = generateOTP();
    await saveOtp(phone, otp, "guest", "login", ip);
    await sendOTP(phone, otp);

    return res.status(200).json({ message: "OTP sent successfully.", phone });
  } catch (error) {
    console.error("Error in sendGuestOtp:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const verifyGuestOtp = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0].message });

    const { phone, otp } = parsed.data;

    // Verify OTP from DB
    const result = await verifyOtpFromDb(phone, otp, "guest");
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Check user — role check pehle ✅
    const [users]: any = await pool.query(
      "SELECT id, is_active, role FROM users WHERE phone = ?",
      [phone]
    );

    // ✅ Vendor number se guest login block — generic error
    if (users.length > 0 && users[0].role === "vendor") {
      return res.status(400).json({ error: "Invalid request. Please try again." });
    }

    let userId: number;
    let isNewUser = false;

    if (users.length === 0) {
      isNewUser = true;
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [result]: any = await connection.query(
          "INSERT INTO users (phone, role, is_active) VALUES (?, 'guest', true)",
          [phone]
        );
        userId = result.insertId;
        await connection.query(
          "INSERT INTO guests (user_id, payment_status) VALUES (?, 'pending')",
          [userId]
        );
        await connection.commit();
      } catch (dbError) {
        await connection.rollback();
        throw dbError;
      } finally {
        connection.release();
      }
    } else {
      const user = users[0];
      if (!user.is_active) {
        return res.status(403).json({ error: "Account is deactivated." });
      }
      userId = user.id;
    }

    // Payment status check
    const [guests]: any = await pool.query(
      "SELECT payment_status, expiry_date FROM guests WHERE user_id = ?",
      [userId]
    );

    const guest = guests[0];
    const isPaid =
      guest.payment_status === "paid" &&
      new Date(guest.expiry_date) > new Date();

    const token = generateToken(userId!, "guest");

    return res.status(200).json({
      message: "OTP verified.",
      token,
      isNewUser,
      paymentRequired: !isPaid,
    });
  } catch (error) {
    console.error("Error in verifyGuestOtp:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
// ================= GUEST PROFILE =================

export const saveGuestProfile = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(255),
      whatsapp: z.string().min(10).max(15).optional(),
      email: z.string().email("Invalid email.").optional(),
      location: z.string().max(500).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0].message });

    const { name, whatsapp, email, location } = parsed.data;

    // Token se user_id nikalo
    const userId = (req as any).user?.id;
    if (!userId)
      return res.status(401).json({ error: "Unauthorized." });

    const [result]: any = await pool.query(
      `UPDATE guests SET 
        name = ?,
        whatsapp = ?,
        email = ?,
        location = ?
       WHERE user_id = ?`,
      [name, whatsapp || null, email || null, location || null, userId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Guest not found." });

    return res.status(200).json({
      message: "Profile saved successfully.",
    });
  } catch (error) {
    console.error("SaveGuestProfile Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// ================= VENDOR AUTH =================

export const checkGstAndSendOtp = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const parsed = gstSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ error: parsed.error.issues[0].message });

    const { gst_number } = parsed.data;
    const ip = getClientIp(req);

    // Check if GST exists
    const [vendors]: any = await pool.query(
      `SELECT u.phone, u.is_active
       FROM vendors v
       INNER JOIN users u ON v.user_id = u.id
       WHERE v.gst_number = ?`,
      [gst_number]
    );

    if (vendors.length === 0) {
      // New vendor — frontend will show registration form
      return res.status(200).json({
        exists: false,
        message: "GST not registered. Please complete registration.",
      });
    }

    const vendor = vendors[0];
    if (!vendor.is_active) {
      return res.status(403).json({ error: "Vendor account is deactivated." });
    }

    const phone = vendor.phone;

    // Spam check
    const spamming = await isSpamming(phone, "vendor", ip);
    if (spamming) {
      return res.status(429).json({
        error: `Too many requests. Please wait ${COOLDOWN_MINUTES} minutes.`,
      });
    }

    const otp = generateOTP();
    await saveOtp(phone, otp, "vendor", "login", ip, gst_number);
    await sendOTP(phone, otp);

    return res.status(200).json({
      exists: true,
      message: "OTP sent.",
      phone,
    });
  } catch (error) {
    console.error("Error in checkGstAndSendOtp:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const verifyVendorOtp = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ error: parsed.error.issues[0].message });

    const { phone, otp } = parsed.data;

    // Verify OTP from DB
    const result = await verifyOtpFromDb(phone, otp, "vendor");
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Get vendor user
    const [users]: any = await pool.query(
      "SELECT id, is_active FROM users WHERE phone = ? AND role = 'vendor'",
      [phone]
    );

    if (users.length === 0)
      return res.status(404).json({ error: "Account not found." });

    const user = users[0];
    if (!user.is_active)
      return res.status(403).json({ error: "Account deactivated." });

    // Subscription check
    const [subs]: any = await pool.query(
      `SELECT t.status, t.created_at, sp.plan_type
       FROM transactions t
       INNER JOIN subscription_plans sp ON sp.plan_type = t.type
       WHERE t.user_id = ? AND t.status = 'verified'
       ORDER BY t.created_at DESC LIMIT 1`,
      [user.id]
    );

    const hasSubscription = subs.length > 0;

    const token = generateToken(user.id, "vendor");

    return res.status(200).json({
      message: "Login successful.",
      token,
      subscriptionRequired: !hasSubscription, // Frontend isko check karega
    });
  } catch (error) {
    console.error("Error in verifyVendorOtp:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// ================= VENDOR REGISTER =================

export const registerVendor = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const parsed = vendorRegisterSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ error: parsed.error.issues[0].message });

    const { gst_number, phone, firm_name, tier } = parsed.data;
    const ip = getClientIp(req);

    // Double check — GST already registered nahi ho
    const [existing]: any = await pool.query(
      "SELECT id FROM vendors WHERE gst_number = ?",
      [gst_number]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "GST already registered." });
    }

    // Spam check
    const spamming = await isSpamming(phone, "vendor", ip);
    if (spamming) {
      return res.status(429).json({
        error: `Too many requests. Please wait ${COOLDOWN_MINUTES} minutes.`,
      });
    }

    // Save OTP to DB
    const otp = generateOTP();
    await saveOtp(phone, otp, "vendor", "register", ip, gst_number);
    await sendOTP(phone, otp);

    return res.status(200).json({
      message: "OTP sent for registration.",
      phone,
    });
  } catch (error) {
    console.error("Error in registerVendor:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const verifyVendorRegisterOtp = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const schema = z.object({
      phone: z.string().min(10).max(15),
      otp: z.string().length(4),
      gst_number: z.string(),
      firm_name: z.string().min(2),
      tier: z.enum(["Godown", "Factory", "Stone Seller"]),
      whatsapp: z.string().min(10).max(15).optional(),
      email: z.string().email().optional(),
      location: z.string().max(500).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ error: parsed.error.issues[0].message });

    const { phone, otp, gst_number, firm_name, tier, whatsapp, email, location } = parsed.data;

    // Verify OTP
    const result = await verifyOtpFromDb(phone, otp, "vendor");
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Create user + vendor in transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [userResult]: any = await connection.query(
        "INSERT INTO users (phone, role, is_active) VALUES (?, 'vendor', true)",
        [phone]
      );
      const userId = userResult.insertId;

      await connection.query(
        `INSERT INTO vendors (user_id, gst_number, firm_name, tier, whatsapp, email, location)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, gst_number, firm_name, tier, whatsapp || null, email || null, location || null]
      );

      await connection.commit();

      const token = generateToken(userId, "vendor");

      return res.status(201).json({
        message: "Registration successful.",
        token,
        subscriptionRequired: true, // Naya vendor — subscription lena padega
      });
    } catch (dbError) {
      await connection.rollback();
      throw dbError;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error in verifyVendorRegisterOtp:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};