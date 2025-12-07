import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";

dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// ================================
// SYSTEM HEALTH CHECK
// ================================
app.get("/status", (req, res) => {
  db.query("SELECT NOW() AS time", [], (err, result) => {
    if (err) {
      return res.json({
        server: "ON",
        database: "OFF",
        error: err.message
      });
    }

    res.json({
      server: "ON",
      database: "ON",
      time: result[0].time
    });
  });
});

// Start server
app.listen(process.env.PORT, () =>
  console.log(`Server berjalan di http://127.0.0.1:${process.env.PORT}`)
);
