import { Response } from "express";
import pool from "../database/pool";
import { AuthRequest } from "../middleware/auth.middleware";

/**
 * @route   POST /api/payments/submit
 * @desc    Guest submits transaction ID for marketplace unlock
 */
export const submitPayment = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    // 🔴 Severity Fix: Undefined Check
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized. User ID missing." });

    const { transaction_id } = req.body;

    if (!transaction_id || transaction_id.trim().length < 5) {
      return res.status(400).json({ error: "Valid Transaction ID required." });
    }

    // 🟡 Fix: Check current status before updating
    const [existing]: any = await pool.query(
      "SELECT payment_status FROM guests WHERE user_id = ?",
      [userId]
    );

    if (existing.length === 0) return res.status(404).json({ error: "Guest profile not found." });

    const currentStatus = existing[0].payment_status;

    // Check if already paid
    if (currentStatus === 'paid') {
      return res.status(400).json({ error: "Marketplace already unlocked." });
    }

    // 🟡 Issue 3 Fixed: Pending Resubmit Block (New Line Added)
    if (currentStatus === 'pending') {
      return res.status(400).json({ error: "Aapki request abhi pending hai. Admin verification ka wait karein." });
    }

    // 🟢 Update Logic (Only proceeds if status is 'rejected' or first-time 'pending')
    await pool.query(
      "UPDATE guests SET transaction_id = ?, payment_status = 'pending', payment_date = NOW(), admin_note = NULL WHERE user_id = ?",
      [transaction_id.trim(), userId]
    );

    return res.status(200).json({ success: true, message: "Payment submitted successfully." });

  } catch (error) {
    console.error("Payment Submit Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * @route   PATCH /api/payments/verify/:guest_id
 * @desc    Admin verification logic
 */
export const verifyPayment = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { guest_id } = req.params;
    const { status, note } = req.body;

    // 🔴 Severity Fix: ID Validation
    if (!guest_id || isNaN(Number(guest_id))) {
      return res.status(400).json({ error: "Invalid Guest ID format." });
    }

    if (!['paid', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'paid' or 'rejected'." });
    }

    const [result]: any = await pool.query(
      "UPDATE guests SET payment_status = ?, admin_note = ? WHERE id = ?",
      [status, note || null, guest_id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Guest not found." });

    return res.status(200).json({ success: true, message: `Payment marked as ${status}.` });

  } catch (error) {
    console.error("Payment Verify Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};