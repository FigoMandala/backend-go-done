import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

/* ===============================
   POOL HOLDER
   =============================== */
let pool = null;

/* ===============================
   CREATE / GET POOL
   =============================== */
async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
    });

    // Test initial connection
    const conn = await pool.getConnection();
    conn.release();
    console.log("Database connected");
  }
  return pool;
}

/* ===============================
   QUERY WRAPPER
   =============================== */
const db = {
  async query(sql, params = [], callback) {
    const maxRetries = 3;
    let retryCount = 0;

    const execute = async () => {
      let conn;
      try {
        const poolInstance = await getPool();
        conn = await poolInstance.getConnection();

        const [results] = await conn.query(sql, params);

        if (callback) callback(null, results);
      } catch (err) {
        const retriable =
          err.code === "ECONNREFUSED" ||
          err.code === "PROTOCOL_CONNECTION_LOST" ||
          err.code === "ETIMEDOUT" ||
          err.code === "EHOSTUNREACH" ||
          err.code === "ENOTFOUND";

        if (retriable && retryCount < maxRetries) {
          retryCount++;
          pool = null;
          setTimeout(execute, 2 ** retryCount * 1000);
        } else {
          if (callback) callback(err);
        }
      } finally {
        if (conn) conn.release();
      }
    };

    execute();
  },
};

/* ===============================
   GRACEFUL SHUTDOWN
   =============================== */
async function shutdown() {
  if (pool) {
    await pool.end();
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default db;
