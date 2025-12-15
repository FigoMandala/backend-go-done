import express from "express";
import db from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// REGISTER
router.post("/register", (req, res) => {
  const { first_name, last_name, username, email, password } = req.body;

  if (!first_name || !last_name || !username || !email || !password) {
    return res.json({ success: false, message: "Semua field wajib diisi!" });
  }

  // Check duplicate email
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) return res.json({ success: false, message: "Server error!" });

    if (result.length > 0) {
      return res.json({
        success: false,
        message: "Email sudah digunakan!"
      });
    }

    const hashed = bcrypt.hashSync(password, 10);

    db.query(
      "INSERT INTO users (first_name, last_name, username, email, password) VALUES (?, ?, ?, ?, ?)",
      [first_name, last_name, username, email, hashed],
      (err2) => {
        if (err2) return res.json({ success: false, message: "Gagal registrasi" });

        res.json({ success: true, message: "Registrasi berhasil!" });
      }
    );
  });
});

// LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) return res.json({ success: false, message: "Server error" });

    if (result.length === 0)
      return res.json({ success: false, message: "Email tidak ditemukan!" });

    const user = result[0];

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid)
      return res.json({ success: false, message: "Password salah!" });

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login berhasil",
      token,
      user: {
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
      },
    });
  });
});

export default router;
