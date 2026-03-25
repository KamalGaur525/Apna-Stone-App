import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt.utils";
import pool from "../database/pool"; 

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * 1. Base Authentication Middleware
 */
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): any => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized. Token missing." });
    }

    const token = authHeader.split(" ")[1];
    const result = verifyToken(token);
    
    if (!result.success || !result.data) {
      return res.status(401).json({ error: result.error });
    }

    req.user = result.data;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ error: "Internal server error during auth." });
  }
};

/**
 * 2. Role-Based Protection Middleware
 */
export const requireRole = (roles: Array<"vendor" | "guest" | "admin">) => {
  return (req: AuthRequest, res: Response, next: NextFunction): any => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden. Access restricted." });
    }
    next();
  };
};

/**
 * 3. Marketplace Access Check Middleware (Simplified ✅)
 * Logic:
 * - Admin: Hamesha Allowed
 * - Vendor: Agar profile exists (GST Registered) -> Allowed
 * - Guest: Agar payment_status === 'paid' -> Allowed
 */
export const checkMarketplaceAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized. Please login." });

    // A. Admin Bypass
    if (user.role === 'admin') return next();

    // B. Vendor Check (Simplified 🚀)
    if (user.role === 'vendor') {
      const [vendor]: any = await pool.query(
        "SELECT id FROM vendors WHERE user_id = ?",
        [user.id]
      );

      if (!vendor || vendor.length === 0) {
        return res.status(403).json({ error: "Vendor profile missing. Please complete registration." });
      }

      // GST Registered Vendor = Always Allowed
      return next();
    }

    // C. Guest Check (Payment & Expiry Required)
    if (user.role === 'guest') {
      // 🟢 Expiry date bhi fetch kar rahe hain ab
      const [guestRows]: any = await pool.query(
        "SELECT payment_status, expiry_date FROM guests WHERE user_id = ?",
        [user.id]
      );

      if (!guestRows || guestRows.length === 0) {
        return res.status(403).json({ error: "Guest profile not found." });
      }

      const guest = guestRows[0];

      // 1. Paid status check
      if (guest.payment_status !== 'paid') {
        return res.status(403).json({ 
          error: "Marketplace Locked", 
          message: "Please complete your payment to unlock marketplace products." 
        });
      }

      // 2. 🟢 NEW: Expiry Date Check
      if (guest.expiry_date) {
        const currentDate = new Date();
        const expiryDate = new Date(guest.expiry_date);
 
        if (currentDate > expiryDate) { 
          await pool.query(
            "UPDATE guests SET payment_status = 'pending' WHERE user_id = ?", 
            [user.id]
          );

          return res.status(403).json({ 
            error: "Subscription Expired",
            message: "Your subscription has expired. Please renew to access the marketplace." 
          });
        }
      }
 
      return next();
    }
    
    return res.status(403).json({ error: "Invalid role for marketplace access." });

  } catch (error) {
    console.error("Access Check Error:", error);
    return res.status(500).json({ error: "Internal server error during access check." });
  }
};