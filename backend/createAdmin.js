import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, './.env') });

const createPool = () => mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'vendorbridge',
  waitForConnections: true,
  connectionLimit: 1
});

const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Usage: node createAdmin.js "<name>" "<email>" "<password>"');
  process.exit(1);
}

const [name, email, password] = args;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('Error: Invalid email format.');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Error: Password must be at least 8 characters long.');
  process.exit(1);
}

const run = async () => {
  const pool = createPool();

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.error(`Error: User with email "${email}" already exists.`);
      process.exit(1);
    }

    await pool.execute(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, \'admin\', \'active\')',
      [name, email, passwordHash]
    );

    console.log(`Admin account created: ${name} <${email}>`);
    process.exit(0);
  } catch (err) {
    console.error('Database error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

run();
