import express from "express";
import db from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// GET ALL
router.get("/", verifyToken, (req, res) => {
  const userId = req.user.user_id;
  db.query("SELECT * FROM task_categories WHERE user_id = ?", [userId], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Failed to fetch categories" });
    }
    res.json(result);
  });
});

// CREATE
router.post("/", verifyToken, (req, res) => {
  const userId = req.user.user_id;
  const { category_name } = req.body;

  if (!category_name)
    return res.status(400).json({ error: "Category name required" });

  db.query(
    "INSERT INTO task_categories (user_id, category_name) VALUES (?, ?)",
    [userId, category_name],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Database error", err });

      res.json({
        message: "Category created",
        category_id: result.insertId,
      });
    }
  );
});

// UPDATE
router.put("/:category_id", verifyToken, (req, res) => {
  const userId = req.user.user_id;
  const { category_id } = req.params;
  const { category_name } = req.body;

  if (!category_name)
    return res.status(400).json({ error: "Category name required" });

  // Validate category ID
  if (isNaN(category_id) || !Number.isInteger(Number(category_id))) {
    return res.status(400).json({ error: "Invalid category ID" });
  }

  db.query(
    "UPDATE task_categories SET category_name = ? WHERE category_id = ? AND user_id = ?",
    [category_name, category_id, userId],
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to update category" });
      }
      
      // Check if category was actually updated (exists and belongs to user)
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json({ message: "Category updated successfully" });
    }
  );
});

// DELETE (Soft Guard)
router.delete("/:category_id", verifyToken, (req, res) => {
  const userId = req.user.user_id;
  const { category_id } = req.params;

  // Validate category ID
  if (isNaN(category_id) || !Number.isInteger(Number(category_id))) {
    return res.status(400).json({ error: "Invalid category ID" });
  }

  db.query(
    "SELECT COUNT(*) AS used FROM tasks WHERE category_id = ? AND user_id = ?",
    [category_id, userId],
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to delete category" });
      }

      if (result[0].used > 0) {
        return res
          .status(400)
          .json({ error: "Category cannot be deleted (still used by tasks)" });
      }

      db.query(
        "DELETE FROM task_categories WHERE category_id = ? AND user_id = ?",
        [category_id, userId],
        (err) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Failed to delete category" });
          }

          res.json({ message: "Category deleted successfully" });
        }
      );
    }
  );
});

export default router;
