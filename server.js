import express from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import taskRoutes from "./routes/task.js";
import categoryRoutes from "./routes/category.js";

dotenv.config();
const app = express();

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
