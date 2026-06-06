import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

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
