-- Database Schema for GoDone Task Manager

-- Make sure deadline column is DATE type (not DATETIME)
-- If it's currently DATETIME, run this to fix it:

ALTER TABLE tasks MODIFY COLUMN deadline DATE NULL;

-- If table doesn't exist yet, here's the full schema:
/*
CREATE TABLE tasks (
  task_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  deadline DATE,  <-- MUST BE DATE type, not DATETIME
  priority VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (category_id) REFERENCES task_categories(category_id)
);
*/
