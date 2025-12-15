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

// ===============================================
// GLOBAL SQL LOGGER
// ===============================================
const originalQuery = pool.query;

pool.query = function (...args) {
  const sql = args[0];
  const params = args[1];

  console.log("\n====================================");
  console.log("🔍 EXECUTING SQL QUERY");
  console.log("SQL     :", sql);
  console.log("PARAMS  :", params);
  console.log("====================================");

  const callback = args[2];

  return originalQuery.call(pool, sql, params, function (err, results) {
    if (err) {
      console.log("❌ SQL ERROR:", err.sqlMessage || err);
    }
    return callback(err, results);
  });
};

export default pool;
