import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();

// =========================
// REGISTER
// =========================
router.post("/register", async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (first_name, last_name, username, email, password)
      VALUES (?, ?, ?, ?, ?)
    `;

    await db.promise().query(sql, [
      firstName,
      lastName,
      username,
      email,
      hash,
    ]);

    return res.json({
      success: true,
      message: "Register success"
    });
  } catch (err) {
    console.log("REGISTER ERROR:", err);
    return res.json({ success: false, message: "Register failed" });
  }
});

// =========================
// LOGIN
// =========================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!rows.length)
      return res.json({ success: false, message: "Email not found" });

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.json({ success: false, message: "Password incorrect" });

    const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET);

    return res.json({
      success: true,
      message: "Login success",
      token,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        photo_url: user.photo_url || null,
      }
    });
  } catch (err) {
    console.log("LOGIN ERROR:", err);
    return res.json({ success: false, message: "Login error" });
  }
});

export default router;
