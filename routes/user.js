import express from "express";
import db from "../db.js";
import bcrypt from "bcryptjs";
import { verifyToken } from "../middleware/auth.js";
import multer from "multer";
import cloudinary from "../cloudinary.js";

const router = express.Router();

/* ============================================================
   MULTER (MEMORY STORAGE)
   ============================================================ */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

/* ============================================================
   GET USER PROFILE
   ============================================================ */
router.get("/me", verifyToken, (req, res) => {
  const userId = req.user.user_id;

  db.query(
    "SELECT user_id, first_name, last_name, username, email, photo_url FROM users WHERE user_id=?",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Server error" });
      if (!rows.length) return res.status(404).json({ message: "User not found" });
      res.json(rows[0]);
    }
  );
});

/* ============================================================
   UPLOAD / REPLACE FOTO PROFIL (CLOUDINARY)
   ============================================================ */
router.post(
  "/photo",
  verifyToken,
  upload.single("photo"),
  async (req, res) => {
    try {
      const userId = req.user.user_id;

      if (!req.file) {
        return res.json({ success: false, message: "No file uploaded" });
      }

      // ambil foto lama
      const [rows] = await db
        .promise()
        .query(
          "SELECT cloudinary_public_id FROM users WHERE user_id=?",
          [userId]
        );

      // hapus foto lama di Cloudinary
      if (rows[0]?.cloudinary_public_id) {
        await cloudinary.uploader.destroy(rows[0].cloudinary_public_id);
      }

      // upload foto baru
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "profile_photos",
          public_id: `user-${userId}`,
          overwrite: true,
          resource_type: "image",
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" }
          ]
        },
        async (error, result) => {
          if (error) throw error;

          await db
            .promise()
            .query(
              "UPDATE users SET photo_url=?, cloudinary_public_id=? WHERE user_id=?",
              [result.secure_url, result.public_id, userId]
            );

          res.json({
            success: true,
            message: "Photo updated",
            photo_url: result.secure_url
          });
        }
      );

      stream.end(req.file.buffer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Upload failed" });
    }
  }
);

/* ============================================================
   UPDATE PROFILE + PASSWORD
   ============================================================ */
router.put("/update", verifyToken, (req, res) => {
  const userId = req.user.user_id;
  const { first_name, last_name, email, currentPassword, newPassword } = req.body;

  db.query("SELECT * FROM users WHERE user_id=?", [userId], (err, rows) => {
    if (err || !rows.length)
      return res.json({ success: false, message: "User not found" });

    const user = rows[0];
    const changePassword = currentPassword && newPassword;

    if (changePassword) {
      if (!bcrypt.compareSync(currentPassword, user.password)) {
        return res.json({ success: false, message: "Current password incorrect" });
      }
      if (newPassword.length < 6) {
        return res.json({ success: false, message: "Password min 6 chars" });
      }
    }

    const hashed = changePassword
      ? bcrypt.hashSync(newPassword, 10)
      : user.password;

    db.query(
      "UPDATE users SET first_name=?, last_name=?, email=?, password=? WHERE user_id=?",
      [first_name, last_name, email, hashed, userId],
      () => res.json({ success: true, message: "Profile updated" })
    );
  });
});

/* ============================================================
   DELETE FOTO PROFIL (CLOUDINARY)
   ============================================================ */
router.delete("/photo", verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [rows] = await db
      .promise()
      .query(
        "SELECT cloudinary_public_id FROM users WHERE user_id=?",
        [userId]
      );

    if (rows[0]?.cloudinary_public_id) {
      await cloudinary.uploader.destroy(rows[0].cloudinary_public_id);
    }

    await db
      .promise()
      .query(
        "UPDATE users SET photo_url=NULL, cloudinary_public_id=NULL WHERE user_id=?",
        [userId]
      );

    res.json({ success: true, message: "Photo removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to remove photo" });
  }
});

/* ============================================================
   DELETE ACCOUNT (CASCADE DELETE)
   ============================================================ */
router.delete("/delete", verifyToken, (req, res) => {
  const userId = req.user.user_id;

  // Delete tasks first (foreign key constraint)
  db.query(
    "DELETE FROM tasks WHERE user_id=?",
    [userId],
    (err1) => {
      if (err1) {
        return res.status(500).json({ success: false, message: "Error deleting tasks" });
      }

      // Delete categories
      db.query(
        "DELETE FROM task_categories WHERE user_id=?",
        [userId],
        (err2) => {
          if (err2) {
            return res.status(500).json({ success: false, message: "Error deleting categories" });
          }

          // Finally delete user
          db.query(
            "DELETE FROM users WHERE user_id=?",
            [userId],
            (err3) => {
              if (err3) {
                return res.status(500).json({ success: false, message: "Error deleting account" });
              }
              res.json({ success: true, message: "Account deleted" });
            }
          );
        }
      );
    }
  );
});

export default router;
