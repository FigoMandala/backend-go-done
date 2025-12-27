import express from "express";
import db from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// GET ALL TASKS (including completed)
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
    ORDER BY CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END ASC, t.created_at DESC
    `,
    [userId],
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch tasks" });
      }
      res.json(result);
    }
  );
});

// CREATE TASK
router.post("/", verifyToken, (req, res) => {
  const userId = req.user.user_id;
  const { category_id, title, description, deadline, priority } = req.body;

  // Strict validation - tidak boleh null atau kosong
  if (!category_id || !title || !description || !deadline || !priority) {
    return res.status(400).json({ error: "All fields are required: category_id, title, description, deadline, priority" });
  }

  // Trim dan cek lagi
  const trimmedTitle = String(title).trim();
  const trimmedDesc = String(description).trim();
  
  if (!trimmedTitle) {
    return res.status(400).json({ error: "Task title cannot be empty" });
  }
  
  if (!trimmedDesc) {
    return res.status(400).json({ error: "Task description cannot be empty" });
  }

  // Validate inputs
  if (isNaN(category_id) || !Number.isInteger(Number(category_id))) {
    return res.status(400).json({ error: "Invalid category ID" });
  }

  if (!["Low", "Medium", "High"].includes(priority)) {
    return res.status(400).json({ error: "Invalid priority. Must be Low, Medium, or High" });
  }

  // Validate deadline format
  if (!deadline || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    return res.status(400).json({ error: "Invalid deadline format. Must be YYYY-MM-DD" });
  }

  // Validate that category exists and belongs to user
  db.query(
    "SELECT category_id FROM task_categories WHERE category_id = ? AND user_id = ?",
    [category_id, userId],
    (err, catResult) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to create task" });
      }
      
      if (!catResult || catResult.length === 0) {
        return res.status(400).json({ error: "Invalid category - category does not exist or does not belong to you" });
      }

      db.query(
        `
        INSERT INTO tasks (user_id, category_id, title, description, deadline, priority, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
        `,
        [userId, category_id, trimmedTitle, trimmedDesc, deadline, priority],
        (err, result) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Failed to create task" });
          }

          res.json({
            message: "Task created successfully",
            task_id: result.insertId,
          });
        }
      );
    }
  );
});

// UPDATE TASK
router.put("/:task_id", verifyToken, (req, res) => {
  const taskId = req.params.task_id;
  const userId = req.user.user_id;

  const { category_id, title, description, deadline, priority, status } = req.body;

  // Whitelist allowed columns for update
  const allowedColumns = ['category_id', 'title', 'description', 'deadline', 'priority', 'status'];
  const updates = [];
  const params = [];

  if (category_id !== undefined) {
    updates.push("category_id=?");
    params.push(category_id);
  }

  if (title !== undefined) {
    if (!title.trim()) {
      return res.status(400).json({ error: "Title cannot be empty" });
    }
    updates.push("title=?");
    params.push(title);
  }

  if (description !== undefined) {
    if (!description.trim()) {
      return res.status(400).json({ error: "Description cannot be empty" });
    }
    updates.push("description=?");
    params.push(description);
  }

  if (deadline !== undefined) {
    let deadlineForDB = deadline;
    if (deadline.includes("T")) {
      deadlineForDB = deadline.split("T")[0];
    }
    updates.push("deadline=?");
    params.push(deadlineForDB);
  }

  if (priority !== undefined) {
    if (!["Low", "Medium", "High"].includes(priority)) {
      return res.status(400).json({ error: "Invalid priority" });
    }
    updates.push("priority=?");
    params.push(priority);
  }

  if (status !== undefined) {
    if (!["pending", "Done"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    // Normalize status to correct case
    const normalizedStatus = status === "pending" ? "pending" : "Done";
    updates.push("status=?");
    params.push(normalizedStatus);
  }

  updates.push("updated_at=NOW()");

  if (updates.length === 1) {
    return res.status(400).json({ error: "No fields to update" });
  }

  params.push(taskId, userId);

  db.query(
    `UPDATE tasks SET ${updates.join(", ")} WHERE task_id=? AND user_id=?`,
    params,
    (err) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to update task" });
      }
      res.json({ message: "Task updated successfully" });
    }
  );
});


// DELETE TASK
router.delete("/:task_id", verifyToken, (req, res) => {
  const taskId = req.params.task_id;
  const userId = req.user.user_id;

  // Validate task ID
  if (isNaN(taskId) || !Number.isInteger(Number(taskId))) {
    return res.status(400).json({ error: "Invalid task ID" });
  }

  db.query(
    "DELETE FROM tasks WHERE task_id=? AND user_id=?",
    [taskId, userId],
    (err) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to delete task" });
      }
      res.json({ message: "Task deleted successfully" });
    }
  );
});

export default router;
