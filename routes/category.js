import express from "express";
import db from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// GET ALL
router.get("/", verifyToken, (req, res) => {
  db.query("SELECT * FROM task_categories", [], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error", err });
    res.json(result);
  });
});

// CREATE
router.post("/", verifyToken, (req, res) => {
  const { category_name } = req.body;

  if (!category_name)
    return res.status(400).json({ error: "Category name required" });

  db.query(
    "INSERT INTO task_categories (category_name) VALUES (?)",
    [category_name],
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
  const { category_id } = req.params;
  const { category_name } = req.body;

  if (!category_name)
    return res.status(400).json({ error: "Category name required" });

  db.query(
    "UPDATE task_categories SET category_name = ? WHERE category_id = ?",
    [category_name, category_id],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error", err });
      res.json({ message: "Category updated successfully" });
    }
  );
});

// DELETE (Soft Guard)
router.delete("/:category_id", verifyToken, (req, res) => {
  const { category_id } = req.params;

  db.query(
    "SELECT COUNT(*) AS used FROM tasks WHERE category_id = ?",
    [category_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Database error", err });

      if (result[0].used > 0) {
        return res
          .status(400)
          .json({ error: "Category cannot be deleted (still used by tasks)" });
      }

      db.query(
        "DELETE FROM task_categories WHERE category_id = ?",
        [category_id],
        (err) => {
          if (err)
            return res.status(500).json({ error: "Database error", err });

          res.json({ message: "Category deleted successfully" });
        }
      );
    }
  );
});

export default router;
