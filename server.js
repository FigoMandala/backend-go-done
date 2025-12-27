import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import taskRoutes from "./routes/task.js";
import categoryRoutes from "./routes/category.js";

dotenv.config();
const app = express();

/* =========================
   CORS (WAJIB)
   ========================= */
app.use(cors({
  origin: [
    "http://localhost:5174",
    "http://localhost:5173",
    "https://frontend-go-done.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options("*", cors());

/* =========================
   BODY & STATIC
   ========================= */
app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* =========================
   RATE LIMITER
   ========================= */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again later",
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

/* =========================
   ROUTES
   ========================= */
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/register", loginLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/user", generalLimiter, userRoutes);
app.use("/api/tasks", generalLimiter, taskRoutes);
app.use("/api/categories", generalLimiter, categoryRoutes);

/* =========================
   START SERVER
   ========================= */
const PORT = process.env.PORT || 8000;
app.listen(PORT, () =>
  console.log(`Server berjalan di port ${PORT}`)
);
