import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file relative to this script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Create the connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Immediately test connection to ensure config is correct
pool.getConnection()
  .then((connection) => {
    console.log('Database connection pool established successfully.');
    connection.release();
  })
  .catch((err) => {
    console.error('Failed to establish database connection:', err.message);
  });

export default pool;
