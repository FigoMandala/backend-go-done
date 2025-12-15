import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import taskRoutes from "./routes/task.js";
import categoryRoutes from "./routes/category.js";


dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/categories", categoryRoutes);

app.listen(process.env.PORT, () =>
  console.log(`Server berjalan di http://127.0.0.1:${process.env.PORT}`)
);
