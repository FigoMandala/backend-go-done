import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import taskRoutes from "./routes/task.js";
import categoryRoutes from "./routes/category.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ===============================
   CORS CONFIG
   =============================== */
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://frontend-go-done.vercel.app/"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow Postman / curl
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error("❌ CORS BLOCKED:", origin);
      callback(new Error("CORS not allowed"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

/* ===============================
   MIDDLEWARE
   =============================== */
app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* ===============================
   ROUTES
   =============================== */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "GoDone Backend"
  });
});

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/tasks", taskRoutes);
app.use("/categories", categoryRoutes);

/* ===============================
   ERROR HANDLER
   =============================== */
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({ error: err.message });
});

/* ===============================
   START SERVER
   =============================== */
app.listen(PORT, () => {
  console.log(`✅ GoDone Backend running on port ${PORT}`);
});

export default app;
