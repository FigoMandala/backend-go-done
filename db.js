import mysql from "mysql2/promise";

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ===============================================
// WRAPPER untuk kompatibilitas callback
// ===============================================
const db = {
  query(sql, params, callback) {
    pool.query(sql, params)
      .then(([results]) => {
        console.log("\n====================================");
        console.log("🔍 EXECUTING SQL QUERY");
        console.log("SQL     :", sql);
        console.log("PARAMS  :", params);
        console.log("✅ SUCCESS");
        console.log("====================================");
        callback(null, results);
      })
      .catch((err) => {
        console.log("\n====================================");
        console.log("🔍 EXECUTING SQL QUERY");
        console.log("SQL     :", sql);
        console.log("PARAMS  :", params);
        console.log("❌ SQL ERROR:", err.sqlMessage || err.message);
        console.log("====================================");
        callback(err);
      });
  }
};

export default db;
