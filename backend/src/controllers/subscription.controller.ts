// backend/src/controllers/subscription.controller.ts
import { Response } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import pool from "../database/pool";
import { AuthRequest } from "../middleware/auth.middleware";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ── 1. GET /api/subscriptions/plans ───────────────────────────────
export const getPlans = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const role = req.user?.role;
    if (!role || role === "admin") {
      return res.status(403).json({ error: "Access denied." });
    }

    const type = role === "vendor" ? "vendor" : "guest";

    const [plans]: any = await pool.query(
      `SELECT id, plan_name, type, price, duration_days, description
       FROM subscription_plans
       WHERE type = ? AND is_active = true`,
      [type]
    );

    return res.status(200).json({ success: true, data: plans });
  } catch (error) {
    console.error("GetPlans Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// ── 2. POST /api/subscriptions/initiate ───────────────────────────
export const initiatePurchase = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized." });

    const { plan_id } = req.body;
    if (!plan_id || isNaN(Number(plan_id))) {
      return res.status(400).json({ error: "Valid plan_id required." });
    }

    const [rows]: any = await pool.query(
      "SELECT id, price, plan_name FROM subscription_plans WHERE id = ? AND is_active = true",
      [plan_id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Plan not found." });
    }

    const plan = rows[0];

    const order = await razorpay.orders.create({
      amount: plan.price * 100, // paise
      currency: "INR",
      receipt: `sub_${userId}_${Date.now()}`,
    });

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      plan_name: plan.plan_name,
    });
  } catch (error) {
    console.error("InitiatePurchase Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// ── 3. POST /api/subscriptions/purchase ───────────────────────────
export const completePurchase = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) return res.status(401).json({ error: "Unauthorized." });

    const { plan_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!plan_id || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: "All payment fields required." });
    }

    // ── Verify Razorpay signature ──────────────────────────────────
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    // const expectedSignature = crypto
    //   .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    //   .update(body)
    //   .digest("hex");

    // if (expectedSignature !== razorpay_signature) {
    //   return res.status(400).json({ error: "Payment verification failed. Invalid signature." });
    // }

    // ── Fetch plan ─────────────────────────────────────────────────
    const [planRows]: any = await pool.query(
      "SELECT id, price, plan_name, duration_days, type FROM  subscription_plans WHERE id = ? AND is_active = true",
      [plan_id]
    );

    if (!planRows || planRows.length === 0) {
      return res.status(404).json({ error: "Plan not found." });
    }

    const plan = planRows[0];
    const expectedType = role === "vendor" ? "vendor" : "guest";
if (plan.type !== expectedType) {
  return res.status(403).json({ error: "You cannot purchase this plan." });
}

    // ── Insert transaction ─────────────────────────────────────────
    const type = role === "vendor" ? "vendor_tier" : "guest_unlock";

    await pool.query(
      `INSERT INTO transactions
         (user_id, amount, transaction_id, status, type, plan_id, plan_expires_at)
       VALUES (?, ?, ?, 'verified', ?, ?,
               DATE_ADD(NOW(), INTERVAL ? DAY))`,
      [userId, plan.price, razorpay_payment_id, type, plan.id, plan.duration_days]
    );

    // ── Update vendor/guest table ──────────────────────────────────
    if (role === "vendor") {
      await pool.query(
        `UPDATE vendors SET current_plan_id = ?, plan_expires_at = DATE_ADD(NOW(), INTERVAL ? DAY)
         WHERE user_id = ?`,
        [plan.id, plan.duration_days, userId]
      );
    } else if (role === "guest") {
      await pool.query(
        `UPDATE guests SET current_plan_id = ?, plan_expires_at = DATE_ADD(NOW(), INTERVAL ? DAY)
         WHERE user_id = ?`,
        [plan.id, plan.duration_days, userId]
      );
    }

    // ── Fetch updated expiry ───────────────────────────────────────
    const table = role === "vendor" ? "vendors" : "guests";
    const [updated]: any = await pool.query(
      `SELECT plan_expires_at FROM ${table} WHERE user_id = ?`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      plan: { id: plan.id, plan_name: plan.plan_name, price: plan.price },
      expires_at: updated[0]?.plan_expires_at,
    });
  } catch (error) {
    console.error("CompletePurchase Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// ── 4. GET /api/subscriptions/my-plan ─────────────────────────────
export const getMyPlan = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) return res.status(401).json({ error: "Unauthorized." });

    const [rows]: any = await pool.query(
      `SELECT t.id, t.amount, t.transaction_id, t.created_at,
              t.plan_expires_at, sp.plan_name, sp.type, sp.duration_days
       FROM transactions t
       JOIN subscription_plans sp ON t.plan_id = sp.id
       WHERE t.user_id = ?
         AND t.status = 'verified'
         AND t.plan_expires_at > NOW()
       ORDER BY t.created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (!rows || rows.length === 0) {
      return res.status(200).json({ success: true, hasActivePlan: false });
    }

    return res.status(200).json({
      success: true,
      hasActivePlan: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("GetMyPlan Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// ── 5. GET /api/subscriptions/history ─────────────────────────────
export const getTransactionHistory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized." });

    const [rows]: any = await pool.query(
      `SELECT 
         t.id, t.amount, t.transaction_id, t.status, t.type,
         t.created_at, t.plan_expires_at,
         sp.plan_name
       FROM transactions t
       JOIN subscription_plans sp ON t.plan_id = sp.id
       WHERE t.user_id = ? AND t.status = 'verified'
       ORDER BY t.created_at DESC`,
      [userId]
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("GetTransactionHistory Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};