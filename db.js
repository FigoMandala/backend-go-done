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
      enableKeepAlive: true,
      keepAliveInitialDelayMs: 0,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('[DB] Pool error:', err.message);
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('[DB] Connection lost, will reconnect on next query');
        pool = null;
      }
      if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
        console.log('[DB] Fatal error, will reconnect on next query');
        pool = null;
      }
      if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
        console.log('[DB] Too many connections, will reconnect on next query');
        pool = null;
      }
    });
  }
  return pool;
}

// ===============================================
// WRAPPER untuk kompatibilitas callback
// ===============================================
const db = {
  query(sql, params, callback) {
    // Retry logic dengan exponential backoff
    const maxRetries = 3;
    let retryCount = 0;

    const executeQuery = async () => {
      try {
        const startTime = Date.now();
        const poolInstance = await getPool();
        const [results] = await poolInstance.query(sql, params);
        const duration = Date.now() - startTime;
        
        if (DEBUG) {
          console.log("\n[DB] ✅ Query SUCCESS");
          console.log("[DB] SQL:", sql.substring(0, 100) + (sql.length > 100 ? "..." : ""));
          console.log("[DB] PARAMS:", params);
          console.log("[DB] Duration:", duration + "ms");
          console.log("[DB] Rows:", results.length || 0);
        }
        
        if (typeof callback === 'function') {
          callback(null, results);
        }
      } catch (err) {
        // Check if error is connection-related
        const isConnectionError = 
          err.code === 'ECONNREFUSED' || 
          err.code === 'PROTOCOL_CONNECTION_LOST' || 
          err.code === 'ETIMEDOUT' ||
          err.code === 'EHOSTUNREACH';

        if (isConnectionError && retryCount < maxRetries) {
          retryCount++;
          const delayMs = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
          
          console.warn(`[DB] ⚠️ Connection error (${err.code}), retrying in ${delayMs}ms... (Attempt ${retryCount}/${maxRetries})`);
          
          // Reset pool for next attempt
          pool = null;
          
          // Retry after delay
          setTimeout(executeQuery, delayMs);
        } else {
          // Log error
          console.error("\n[DB] ❌ ERROR:", err.message);
          console.error("[DB] SQL:", sql.substring(0, 100) + (sql.length > 100 ? "..." : ""));
          console.error("[DB] PARAMS:", params);
          if (err.sqlMessage) console.error("[DB] SQL Message:", err.sqlMessage);
          console.error("[DB] Code:", err.code);
          
          if (typeof callback === 'function') {
            callback(err);
          }
        }
      }
    };

    executeQuery();
  }
};

export default db;
