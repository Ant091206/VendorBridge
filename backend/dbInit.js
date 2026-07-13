import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, './.env') });

const initDb = async () => {
  console.log('Initializing database from schema.sql...');

  const schemaPath = path.resolve(__dirname, '../database/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error(`Schema file not found at: ${schemaPath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(schemaPath, 'utf8');

  // Remove single line SQL comments first
  const cleanSqlContent = sqlContent
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  const queries = cleanSqlContent
    .split(';')
    .map(q => q.trim())
    .filter(q => q.length > 0);

  try {
    // Connect without specifying DB name first, since database might not exist yet
    const connection = await mysql.createConnection({
      host:     process.env.DB_HOST     || 'localhost',
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true // Allow executing USE vendorbridge; CREATE TABLE...
    });

    console.log('Connected to MySQL server.');

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      // Clean query lines: filter out comment lines inside blocks
      const cleanQuery = query
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim();

      if (cleanQuery) {
        console.log(`Executing query ${i + 1}/${queries.length}...`);
        await connection.query(cleanQuery);
      }
    }

    console.log('Database and schema initialized successfully!');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    process.exit(1);
  }
};

initDb();
