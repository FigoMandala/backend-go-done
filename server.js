import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import taskRoutes from "./routes/task.js";
import categoryRoutes from "./routes/category.js";

dotenv.config();
const app = express();

// CORS - Restrict to frontend origin only
const allowedOrigins = [
  "http://localhost:5173",  // Local dev
  "http://127.0.0.1:5173",
  "https://go-done-production.vercel.app", // Production frontend
  process.env.FRONTEND_URL 
].filter(Boolean); // Remove undefined/empty values

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Reject silently, DO NOT throw error
    return callback(null, false);
  },
  credentials: true
}));


// Rate limiting for login (prevent brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many login attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiter for other endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Apply rate limiters
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/register", loginLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/user", generalLimiter, userRoutes);
app.use("/api/tasks", generalLimiter, taskRoutes);
app.use("/api/categories", generalLimiter, categoryRoutes);

app.listen(process.env.PORT, () =>
  console.log(`Server berjalan ${process.env.PORT}`)
);
