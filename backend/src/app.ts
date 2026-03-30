import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import pool from "./database/pool";
import authRoutes from "./routes/auth.routes";
import vendorRoutes from "./routes/vendor.routes"; 
import buyerRoutes from "./routes/buyer.routes";
import productRoutes from "./routes/product.routes";
import adminRoutes from "./routes/admin.routes";
import categoryRoutes from "./routes/category.routes";
import paymentRoutes from "./routes/payment.routes";
import serviceRoutes from "./routes/service.routes";
import planRoutes from "./routes/plan.routes";
import guestRoutes from "./routes/guest.routes";
import visualizerRouter from './routes/visualizer.routes';
import subscriptionRoutes from "./routes/subscription.routes";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.FRONTEND_URL) {
  console.error("🔴 FATAL ERROR: FRONTEND_URL is not defined in .env");
  process.exit(1);
}

// 1. Essential Security & Middlewares
app.use(helmet());
app.use(cors({
  origin: isProduction ? (process.env.FRONTEND_URL as string) : "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (!isProduction) {
  app.use(morgan("dev"));
}

// 2. Health Check API
app.get("/health", async (req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "success",
      message: "Stone Wala API is running and Database is connected!"
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({
      status: "error",
      message: "API is running, but Database connection failed."
    });
  }
});

// 3. Main API Routes
// ✅ REMOVED: express.static for /uploads — files now served from S3
app.use("/api/auth", authRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/buyer", buyerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/guest", guestRoutes);
app.use('/api/visualizer', visualizerRouter);
app.use("/api/subscriptions", subscriptionRoutes);

// 4. 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found"
  });
});

// 5. Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.status || 500;
  console.error(`[Error] ${req.method} ${req.url}:`, err.stack);
  res.status(statusCode).json({
    success: false,
    error: isProduction ? "Internal Server Error" : err.message,
    stack: isProduction ? null : err.stack
  });
});

// 6. Server Start
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT} in ${isProduction ? 'production' : 'development'} mode`);
});

export default app;