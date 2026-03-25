import { Response } from "express";
import pool from "../database/pool";
import { AuthRequest } from "../middleware/auth.middleware";

/**
 * API: Guest User QR Payment Submission
 * Route: POST /api/buyer/pay-unlock
 */
export const initiateGuestPayment = async (req: AuthRequest, res: Response): Promise<any> => {
  let connection;
  try {
    // 1. Authentication Check
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User authentication failed." });
    }

    const { transaction_id } = req.body;

    // 2. Input Validation
    if (!transaction_id || transaction_id.trim().length < 5) {
      return res.status(400).json({ error: "A valid Transaction ID is required (min 5 chars)." });
    }

    // 3. Status Lock: Check current payment status
    // User already 'paid' hai toh usse paise kyun lena? 
    // User already 'pending' hai toh double request block karo.
    const [guestProfile]: any = await pool.query(
      "SELECT payment_status FROM guests WHERE user_id = ?",
      [userId]
    );

    if (guestProfile.length === 0) {
      return res.status(404).json({ error: "Guest profile not found." });
    }

    const currentStatus = guestProfile[0].payment_status;

    if (currentStatus === 'paid') {
      return res.status(400).json({ error: "You already have full access. No payment needed." });
    }

    if (currentStatus === 'pending') {
      return res.status(400).json({ error: "Your previous payment is already under verification. Please wait." });
    }

    // 4. Global Duplicate Check: Transaction ID must be unique in the system
    const [existingTx]: any = await pool.query(
      "SELECT id FROM transactions WHERE transaction_id = ?",
      [transaction_id]
    );
    if (existingTx.length > 0) {
      return res.status(400).json({ error: "This Transaction ID has already been used/submitted." });
    }

    // 5. Atomic Transaction: Record payment and update profile
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Insert into transactions
    await connection.query(
      "INSERT INTO transactions (user_id, amount, transaction_id, type, status) VALUES (?, ?, ?, ?, ?)",
      [userId, 500.00, transaction_id.trim(), 'guest_unlock', 'pending']
    );

    // Update Guest status to pending
    await connection.query(
      "UPDATE guests SET payment_status = 'pending' WHERE user_id = ?",
      [userId]
    );

    await connection.commit();

    return res.status(200).json({ 
      message: "Payment details submitted successfully. Admin will verify it soon.",
      status: "pending" 
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error in initiateGuestPayment:", error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * API: Check Access Status
 * Route: GET /api/buyer/status
 */
export const checkAccessStatus = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Not authenticated." });

    const [rows]: any = await pool.query(
      "SELECT payment_status FROM guests WHERE user_id = ?",
      [userId]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Profile not found." });

    return res.status(200).json({ 
      status: rows[0].payment_status,
      can_access_marketplace: rows[0].payment_status === 'paid'
    });
  } catch (error) {
    console.error("Error in checkAccessStatus:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};