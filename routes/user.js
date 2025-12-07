import express from "express";
import db from "../db.js";
import bcrypt from "bcryptjs";
import { verifyToken } from "../middleware/auth.js";
import multer from "multer";
import fs from "fs";

const router = express.Router();

/* ============================================================
   MULTER CONFIG (UPLOAD FOTO PROFIL)
   ============================================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/profile");
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, `user-${Date.now()}.${ext}`);
  }
});

const upload = multer({ storage });

/* ============================================================
   GET USER PROFILE
   ============================================================ */
router.get("/me", verifyToken, (req, res) => {
  const userId = req.user.user_id;

  db.query(
    "SELECT user_id, first_name, last_name, username, email, photo_url FROM users WHERE user_id = ?",
    [userId],
    (err, result) => {
      if (err) {
        console.log("GET /me ERROR:", err);
        return res.status(500).json({ message: "Server error" });
      }

      if (result.length === 0)
        return res.status(404).json({ message: "User not found" });

      res.json(result[0]);
    }
  );
});

/* ============================================================
   UPLOAD FOTO PROFIL (WITH CROP)
   ============================================================ */
router.post("/photo", verifyToken, upload.single("photo"), (req, res) => {
  const userId = req.user.user_id;

  if (!req.file) {
    return res.json({
      success: false,
      message: "No file uploaded"
    });
  }

  const newPhotoURL = `/uploads/profile/${req.file.filename}`;

  // STEP 1: ambil foto lama
  db.query("SELECT photo_url FROM users WHERE user_id = ?", [userId], (err, rows) => {
    if (err) {
      console.log("PHOTO SELECT ERROR:", err);
      return res.json({ success: false, message: "Server error" });
    }

    const oldPhotoURL = rows[0]?.photo_url;

    // STEP 2: hapus file lama jika ada
    if (oldPhotoURL) {
      const filePath = `.${oldPhotoURL}`;
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.log("Failed to delete old photo:", err);
        });
      }
    }

    // STEP 3: simpan foto baru
    db.query(
      "UPDATE users SET photo_url = ? WHERE user_id = ?",
      [newPhotoURL, userId],
      (err2) => {
        if (err2) {
          console.log("PHOTO UPDATE ERROR:", err2);
          return res.json({
            success: false,
            message: "Failed to update photo"
          });
        }

        res.json({
          success: true,
          message: "Photo updated successfully",
          photo_url: newPhotoURL,
        });
      }
    );
  });
});


/* ============================================================
   UPDATE USER PROFILE + PASSWORD
   ============================================================ */
router.put("/update", verifyToken, (req, res) => {
  const userId = req.user.user_id;
  const { first_name, last_name, email, currentPassword, newPassword } = req.body;

  db.query("SELECT * FROM users WHERE user_id = ?", [userId], (err, rows) => {
    if (err) return res.json({ success: false, message: "Server error" });
    if (rows.length === 0)
      return res.json({ success: false, message: "User not found" });

    const user = rows[0];

    const isChangingPassword = currentPassword || newPassword;

    if (isChangingPassword) {
      const validPass = bcrypt.compareSync(currentPassword, user.password);

      if (!validPass) {
        return res.json({
          success: false,
          message: "Current password incorrect"
        });
      }

      if (!newPassword || newPassword.length < 6) {
        return res.json({
          success: false,
          message: "New password must be at least 6 characters"
        });
      }
    }

    const hashedPassword = isChangingPassword
      ? bcrypt.hashSync(newPassword, 10)
      : user.password;

    db.query(
      "SELECT * FROM users WHERE email = ? AND user_id != ?",
      [email, userId],
      (err2, emailCheck) => {
        if (err2) return res.json({ success: false, message: "Server error" });

        if (emailCheck.length > 0) {
          return res.json({
            success: false,
            message: "Email already used by another account"
          });
        }

        db.query(
          `UPDATE users 
           SET first_name=?, last_name=?, email=?, password=? 
           WHERE user_id=?`,
          [first_name, last_name, email, hashedPassword, userId],
          (err3) => {
            if (err3) {
              console.log("UPDATE ERROR:", err3);

              if (err3.code === "ER_DUP_ENTRY") {
                return res.json({
                  success: false,
                  message: "Email already used by another account"
                });
              }

              return res.json({
                success: false,
                message: "Failed to update"
              });
            }

            return res.json({
              success: true,
              message: "Profile updated successfully!"
            });
          }
        );
      }
    );
  });
});

/* ============================================================
   DELETE USER ACCOUNT
   ============================================================ */
router.delete("/delete", verifyToken, (req, res) => {
  const userId = req.user.user_id;

  db.query(
    "DELETE FROM users WHERE user_id = ?",
    [userId],
    (err) => {
      if (err) {
        console.log("DELETE ERROR:", err);
        return res.json({
          success: false,
          message: "Failed to delete account"
        });
      }

      return res.json({
        success: true,
        message: "Account deleted successfully"
      });
    }
  );
});

/* ============================================================
   DELETE USER PHOTO
   ============================================================ */

router.delete("/photo", verifyToken, (req, res) => {
  const userId = req.user.user_id;

  db.query("SELECT photo_url FROM users WHERE user_id = ?", [userId], (err, rows) => {
    if (err) return res.json({ success: false, message: "Server error" });

    if (!rows.length) return res.json({ success: false, message: "User not found" });

    const photoPath = rows[0].photo_url;

    if (photoPath) {
      const filePath = `.${photoPath}`;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); 
      }
    }

    db.query(
      "UPDATE users SET photo_url = NULL WHERE user_id = ?",
      [userId],
      (err2) => {
        if (err2) {
          return res.json({ success: false, message: "Failed to remove photo" });
        }

        res.json({ success: true, message: "Photo removed" });
      }
    );
  });
});

export default router;
