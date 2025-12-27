import dotenv from "dotenv";
dotenv.config();

import express from "express";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import taskRoutes from "./routes/task.js";
import categoryRoutes from "./routes/category.js";

const app = express();

/* ===============================
   RATE LIMITERS
   =============================== */

// Login rate limiter (ketat)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5,
  message: "Too many login attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiter (longgar)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

/* ===============================
   MIDDLEWARES
   =============================== */

app.use(express.json());
app.use("/uploads", express.static("uploads"));

// limiter global
app.use(generalLimiter);

/* ===============================
   ROUTES
   =============================== */

// login limiter hanya untuk auth
app.use("/api/auth", loginLimiter, authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/categories", categoryRoutes);

/* ===============================
   SERVER
   =============================== */

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://127.0.0.1:${PORT}`);
});

export default app;
