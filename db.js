import mysql from "mysql2/promise";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

let pool = null;

// ===============================================
// CREATE POOL
// ===============================================
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

    // Test connection
    try {
      const conn = await pool.getConnection();
      console.log('✅ Database connected');
      conn.release();
    } catch (err) {
      console.error('❌ Database connection failed:', err.message);
      pool = null;
      throw err;
    }
  }
  return pool;
}

// ===============================================
// QUERY WRAPPER
// ===============================================
const db = {
  query(sql, params, callback) {
    const maxRetries = 3;
    let retryCount = 0;

    const executeQuery = async () => {
      try {
        const poolInstance = await getPool();
        const [results] = await poolInstance.query(sql, params);
        
        if (typeof callback === 'function') {
          callback(null, results);
        }
      } catch (err) {
        // Retry untuk connection error
        const isRetriableError = 
          err.code === 'ECONNREFUSED' || 
          err.code === 'PROTOCOL_CONNECTION_LOST' || 
          err.code === 'ETIMEDOUT' ||
          err.code === 'EHOSTUNREACH' ||
          err.code === 'ENOTFOUND';

        if (isRetriableError && retryCount < maxRetries) {
          retryCount++;
          const delayMs = Math.pow(2, retryCount) * 1000;
          
          console.warn(`⚠️  DB Error: ${err.code} - Retry ${retryCount}/${maxRetries} in ${delayMs}ms`);
          
          pool = null;
          setTimeout(executeQuery, delayMs);
        } else {
          // Log error final
          console.error('❌ DB Query Error:', {
            code: err.code,
            message: err.message,
            sql: sql.substring(0, 100) + '...',
            params: params
          });
          
          if (typeof callback === 'function') {
            callback(err);
          }
        }
      }
    };

    executeQuery();
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  if (pool) {
    await pool.end();
    console.log('✅ Database connection closed');
  }
  process.exit(0);
});

export default db;
