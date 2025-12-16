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

// VERIFY TOKEN
router.get("/verify", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "Token tidak ditemukan" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cek apakah user masih ada di database
    db.query("SELECT user_id, email FROM users WHERE user_id = ?", [decoded.user_id], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Server error" });
      }

      if (result.length === 0) {
        return res.status(401).json({ success: false, message: "User tidak ditemukan" });
      }

      res.json({ success: true, message: "Token valid" });
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired" });
    }
    res.status(401).json({ success: false, message: "Token tidak valid" });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  // Token dihapus dari client-side (localStorage)
  res.json({ success: true, message: "Logout berhasil" });
});

export default router;
