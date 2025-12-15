import express from "express";
import db from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// GET ALL TASKS
router.get("/", verifyToken, (req, res) => {
  const userId = req.user.user_id;

  db.query(
    `
    SELECT t.task_id, t.user_id, t.category_id, t.title, t.description, 
    t.priority, t.status, t.created_at, t.updated_at,
    DATE_FORMAT(t.deadline, '%Y-%m-%d') as deadline,
    c.category_name 
    FROM tasks t
    LEFT JOIN task_categories c ON t.category_id = c.category_id
    WHERE t.user_id = ?
    ORDER BY t.created_at DESC
    `,
    [userId],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Database error", err });
      res.json(result);
    }
  );
});

// CREATE TASK
router.post("/", verifyToken, (req, res) => {
  const userId = req.user.user_id;
  const { category_id, title, description, deadline, priority } = req.body;

  if (!category_id || !title || !description || !deadline || !priority) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Ensure deadline is in YYYY-MM-DD format
  // If it comes as ISO string, extract date part
  let deadlineForDB = deadline;
  if (deadline.includes('T')) {
    deadlineForDB = deadline.split('T')[0];
  }

  db.query(
    `
    INSERT INTO tasks (user_id, category_id, title, description, deadline, priority, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
    `,
    [userId, category_id, title, description, deadlineForDB, priority],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Database error", err });

      res.json({
        message: "Task created successfully",
        task_id: result.insertId,
      });
    }
  );
});

// UPDATE TASK
router.put("/:task_id", verifyToken, (req, res) => {
  const taskId = req.params.task_id;
  const userId = req.user.user_id;

  const { category_id, title, description, deadline, priority, status } =
    req.body;

  // Ensure deadline is in YYYY-MM-DD format
  // If it comes as ISO string, extract date part
  let deadlineForDB = deadline;
  if (deadline && deadline.includes('T')) {
    deadlineForDB = deadline.split('T')[0];
  }

  db.query(
    `
    UPDATE tasks 
    SET category_id=?, title=?, description=?, deadline=?, priority=?, status=?, updated_at=NOW()
    WHERE task_id=? AND user_id=?
    `,
    [
      category_id,
      title,
      description,
      deadlineForDB,
      priority,
      status || "pending",
      taskId,
      userId,
    ],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error", err });
      res.json({ message: "Task updated successfully" });
    }
  );
});

// DELETE TASK
router.delete("/:task_id", verifyToken, (req, res) => {
  const taskId = req.params.task_id;
  const userId = req.user.user_id;

  db.query(
    "DELETE FROM tasks WHERE task_id=? AND user_id=?",
    [taskId, userId],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error", err });
      res.json({ message: "Task deleted successfully" });
    }
  );
});

export default router;
