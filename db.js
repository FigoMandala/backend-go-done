import mysql from "mysql2/promise";

let pool = null;
const DEBUG = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';

async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      queueLimit: 0,
    });
  }
  return pool;
}

// ===============================================
// WRAPPER untuk kompatibilitas callback
// ===============================================
const db = {
  query(sql, params, callback) {
    // Handle call asynchronously tapi return ke callback
    getPool()
      .then(async (pool) => {
        try {
          const startTime = Date.now();
          const [results] = await pool.query(sql, params);
          const duration = Date.now() - startTime;
          
          if (DEBUG) {
            console.log("\n[DB] ✅ Query SUCCESS");
            console.log("[DB] SQL:", sql.substring(0, 100) + (sql.length > 100 ? "..." : ""));
            console.log("[DB] PARAMS:", params);
            console.log("[DB] Duration:", duration + "ms");
            console.log("[DB] Rows:", results.length || 0);
          }
          
          // Call callback dengan results
          if (typeof callback === 'function') {
            callback(null, results);
          }
        } catch (err) {
          // ALWAYS log errors
          console.error("\n[DB] ❌ ERROR:", err.message);
          console.error("[DB] SQL:", sql.substring(0, 100) + (sql.length > 100 ? "..." : ""));
          console.error("[DB] PARAMS:", params);
          if (err.sqlMessage) console.error("[DB] SQL Message:", err.sqlMessage);
          console.error("[DB] Code:", err.code);
          
          // Call callback dengan error
          if (typeof callback === 'function') {
            callback(err);
          }
        }
      })
      .catch((err) => {
        console.error("[DB] ❌ Pool error:", err.message);
        if (typeof callback === 'function') {
          callback(err);
        }
      });
  }
};

export default db;
