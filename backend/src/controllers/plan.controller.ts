import { Request, Response } from "express";
import pool from "../database/pool";
import { AuthRequest } from "../middleware/auth.middleware";

export const getActivePlans = async (req: Request, res: Response): Promise<any> => {
  try {
    const [plans]: any = await pool.query(
      "SELECT id, plan_type, price FROM subscription_plans WHERE is_active = true"
    );
    return res.status(200).json({ success: true, data: plans });
  } catch (error) {
    console.error("GetActivePlans Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updatePlanPrice = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { plan_type } = req.params;
    const { price } = req.body;

    if (!price || isNaN(Number(price))) {
      return res.status(400).json({ error: "Valid price is required." });
    }

    if (!['monthly', 'yearly'].includes(plan_type as  string)) {
      return res.status(400).json({ error: "plan_type must be 'monthly' or 'yearly'" });
    }

    const [result]: any = await pool.query(
      "UPDATE subscription_plans SET price = ? WHERE plan_type = ?",
      [Number(price), plan_type as string]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Plan type not found." });
    }

    return res.status(200).json({ 
      success: true, 
      message: `Price updated for ${plan_type} plan!` 
    });
  } catch (error) {
    console.error("UpdatePlanPrice Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};