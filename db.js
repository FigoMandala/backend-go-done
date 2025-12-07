import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// ================================
//  QUERY MONITORING WRAPPER
// ================================
const db = {
  query(sql, params, callback) {
    const start = Date.now();

    // Run actual query
    pool.query(sql, params, (err, results) => {
      const end = Date.now();
      const duration = end - start;

      console.log("====================================");
      console.log("📡 [DB QUERY]");
      console.log("SQL:", sql);
      console.log("VALUES:", params);
      console.log("⏱ TIME:", duration + " ms");
      console.log("====================================");

      if (callback) callback(err, results);
    });
  },

  getConnection(callback) {
    return pool.getConnection(callback);
  }
};

// Test connection at startup
pool.getConnection((err, conn) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Database connected");
    conn.release();
  }
});

export default db;
