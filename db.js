import mysql from "mysql2/promise";

let pool = null;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 5,
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
          const [results] = await pool.query(sql, params);
          
          console.log("\n====================================");
          console.log("🔍 EXECUTING SQL QUERY");
          console.log("SQL     :", sql);
          console.log("PARAMS  :", params);
          console.log("✅ SUCCESS");
          console.log("====================================");
          
          // Call callback dengan results
          if (typeof callback === 'function') {
            callback(null, results);
          }
        } catch (err) {
          console.log("\n====================================");
          console.log("🔍 EXECUTING SQL QUERY");
          console.log("SQL     :", sql);
          console.log("PARAMS  :", params);
          console.log("❌ SQL ERROR:");
          console.log("Message:", err.message);
          console.log("Code:", err.code);
          if (err.sqlMessage) console.log("SQL Message:", err.sqlMessage);
          console.log("====================================");
          
          // Call callback dengan error
          if (typeof callback === 'function') {
            callback(err);
          }
        }
      })
      .catch((err) => {
        console.log("❌ Pool error:", err.message);
        if (typeof callback === 'function') {
          callback(err);
        }
      });
  }
};

export default db;
