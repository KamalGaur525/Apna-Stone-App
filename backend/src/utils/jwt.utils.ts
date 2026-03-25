import jwt, { TokenExpiredError } from "jsonwebtoken";

// 1. Unnecessary dotenv.config() removed

// 2. Fallback secret removed. Server will crash if JWT_SECRET is missing (Fail-Fast approach)
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
  throw new Error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
}

export interface JwtPayload {
  id: number;
  role: "vendor" | "guest" | "admin";
}

export const generateToken = (userId: number, role: "vendor" | "guest" | "admin") => {
  return jwt.sign({ id: userId, role }, SECRET_KEY, {
    expiresIn: "7d", 
  });
};
// 4. Safe return type & Expired vs Invalid error separation
export const verifyToken = (token: string): { success: boolean; data?: JwtPayload; error?: string } => {
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    return { success: true, data: decoded };
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return { success: false, error: "Token has expired. Please login again." };
    }
    return { success: false, error: "Invalid token." };
  }
};