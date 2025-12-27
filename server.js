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

  app.use("/auth", authRoutes);
  app.use("/user", userRoutes);
  app.use("/tasks", taskRoutes);
  app.use("/categories", categoryRoutes);

  app.listen(process.env.PORT, () =>
    console.log(`GoDone Backend`)
  );

  export default app;