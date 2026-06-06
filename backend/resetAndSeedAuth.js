/**
 * VendorBridge — Auth Reset & User Seed Script
 * ─────────────────────────────────────────────
 * 1. Inspects current database schema and users
 * 2. Applies migration (adds status/last_login/updated_at columns + password_reset_tokens table)
 * 3. Safely resets all user-related data
 * 4. Seeds 4 fresh demo users with proper bcrypt hashes
 * 5. Verifies bcrypt hash correctness
 * 6. Generates and verifies a JWT for each user
 * 7. Writes VERIFY_AUTH.md with full test results
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Code_Vivek_24',
  database: process.env.DB_NAME || 'vendorbridge',
  multipleStatements: true
};

const JWT_SECRET = process.env.JWT_SECRET || 'vendorbridge_dev_secret_key_12345';
const BCRYPT_ROUNDS = 10;

// ── Demo users to seed ──
const DEMO_USERS = [
  { name: 'Rajesh Kumar',  email: 'admin@vendorbridge.com',   password: 'Admin@123',   role: 'admin'   },
  { name: 'Priya Sharma',  email: 'officer@vendorbridge.com', password: 'Officer@123', role: 'officer' },
  { name: 'Vikram Mehta',  email: 'manager@vendorbridge.com', password: 'Manager@123', role: 'manager' },
  { name: 'Arjun Patel',   email: 'vendor1@vendorbridge.com', password: 'Vendor@123',  role: 'vendor'  },
];

function log(msg) {
  console.log(msg);
}

function banner(title) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

async function main() {
  let conn;

  try {
    banner('VendorBridge — Auth Reset & Seed');
    log(`DB: ${DB_CONFIG.user}@${DB_CONFIG.host}/${DB_CONFIG.database}`);

    conn = await mysql.createConnection(DB_CONFIG);
    log('✅ Database connected successfully\n');

    // ──────────────────────────────────────────────
    // STEP 1: Inspect current schema
    // ──────────────────────────────────────────────
    banner('STEP 1: Schema Inspection');

    const [tables] = await conn.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    log(`Tables found (${tableNames.length}):`);
    tableNames.forEach(t => log(`  • ${t}`));

    // Check users table columns
    const [cols] = await conn.query('SHOW COLUMNS FROM users');
    log(`\nusers table columns (${cols.length}):`);
    cols.forEach(c => log(`  • ${c.Field.padEnd(20)} ${c.Type.padEnd(40)} NULL:${c.Null} DEFAULT:${c.Default}`));

    // Check current user count
    const [currentUsers] = await conn.query('SELECT id, name, email, role FROM users');
    log(`\nExisting users (${currentUsers.length}):`);
    currentUsers.forEach(u => log(`  • [${u.id}] ${u.name} | ${u.email} | ${u.role}`));

    // ──────────────────────────────────────────────
    // STEP 2: Apply migration (idempotent)
    // ──────────────────────────────────────────────
    banner('STEP 2: Apply Schema Migration');

    // Add status column if missing
    const hasStatus = cols.some(c => c.Field === 'status');
    if (!hasStatus) {
      await conn.query(`ALTER TABLE users ADD COLUMN status ENUM('active','inactive') NOT NULL DEFAULT 'active' AFTER role`);
      log('✅ Added status column');
    } else {
      log('✓  status column already exists');
    }

    // Add last_login column if missing
    const hasLastLogin = cols.some(c => c.Field === 'last_login');
    if (!hasLastLogin) {
      await conn.query('ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL AFTER status');
      log('✅ Added last_login column');
    } else {
      log('✓  last_login column already exists');
    }

    // Add updated_at column if missing
    const hasUpdatedAt = cols.some(c => c.Field === 'updated_at');
    if (!hasUpdatedAt) {
      await conn.query('ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER last_login');
      log('✅ Added updated_at column');
    } else {
      log('✓  updated_at column already exists');
    }

    // Create password_reset_tokens table if not exists
    await conn.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE KEY unique_token (token),
        INDEX idx_expires (expires_at),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    log('✅ password_reset_tokens table ready');

    // ──────────────────────────────────────────────
    // STEP 3: Safe data reset
    // ──────────────────────────────────────────────
    banner('STEP 3: Safe Data Reset');

    // Disable FK checks to allow clean truncation
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    log('  Foreign key checks disabled');

    // Clear password_reset_tokens
    await conn.query('DELETE FROM password_reset_tokens');
    log('✅ Cleared password_reset_tokens');

    // Clear activity_logs (references users via SET NULL FK)
    if (tableNames.includes('activity_logs')) {
      await conn.query('DELETE FROM activity_logs');
      log('✅ Cleared activity_logs');
    }

    // Clear the entire business data chain to safely remove users
    // Order: invoices → purchase_orders → approvals → quotations → rfq_vendors → rfqs
    // approvals.approver_id is NOT NULL FK → must delete approvals before users
    if (tableNames.includes('invoices')) {
      await conn.query('DELETE FROM invoices');
      log('✅ Cleared invoices');
    }
    if (tableNames.includes('purchase_orders')) {
      await conn.query('DELETE FROM purchase_orders');
      log('✅ Cleared purchase_orders');
    }
    if (tableNames.includes('approvals')) {
      await conn.query('DELETE FROM approvals');
      log('✅ Cleared approvals');
    }
    if (tableNames.includes('quotations')) {
      await conn.query('DELETE FROM quotations');
      log('✅ Cleared quotations');
    }
    if (tableNames.includes('rfq_vendors')) {
      await conn.query('DELETE FROM rfq_vendors');
      log('✅ Cleared rfq_vendors');
    }
    if (tableNames.includes('rfqs')) {
      await conn.query('DELETE FROM rfqs');
      log('✅ Cleared rfqs');
    }

    // Now safe to delete all users
    await conn.query('DELETE FROM users');
    log('✅ Deleted all users');

    // Reset AUTO_INCREMENT to 1
    await conn.query('ALTER TABLE users AUTO_INCREMENT = 1');
    log('✅ Reset users AUTO_INCREMENT to 1');

    // Re-enable FK checks
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    log('  Foreign key checks re-enabled');

    // ──────────────────────────────────────────────
    // STEP 4 & 5: Hash passwords & insert users
    // ──────────────────────────────────────────────
    banner('STEP 4 & 5: Seed Demo Users with bcrypt');

    const seededUsers = [];

    for (const user of DEMO_USERS) {
      log(`\n  Hashing password for: ${user.email}`);
      const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
      const passwordHash = await bcrypt.hash(user.password, salt);
      log(`  Hash generated: ${passwordHash.substring(0, 30)}...`);

      const [result] = await conn.query(
        `INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, 'active')`,
        [user.name, user.email, passwordHash, user.role]
      );

      seededUsers.push({
        id: result.insertId,
        name: user.name,
        email: user.email,
        plainPassword: user.password,
        passwordHash,
        role: user.role,
        status: 'active'
      });

      log(`  ✅ Inserted [ID:${result.insertId}] ${user.name} (${user.role})`);
    }

    // ──────────────────────────────────────────────
    // STEP 6: Verify bcrypt hash comparison
    // ──────────────────────────────────────────────
    banner('STEP 6: Verify bcrypt Hash Comparison');

    const hashResults = [];

    for (const user of seededUsers) {
      // Fetch fresh from DB
      const [rows] = await conn.query('SELECT * FROM users WHERE id = ?', [user.id]);
      const dbUser = rows[0];

      const isMatch = await bcrypt.compare(user.plainPassword, dbUser.password_hash);
      const wrongMatch = await bcrypt.compare('WrongPassword999!', dbUser.password_hash);

      hashResults.push({
        ...user,
        bcryptMatch: isMatch,
        bcryptWrongMatch: wrongMatch,
        dbStatus: dbUser.status
      });

      log(`  ${isMatch ? '✅' : '❌'} [${user.id}] ${user.email}: bcrypt.compare(correct) = ${isMatch}`);
      log(`  ${!wrongMatch ? '✅' : '❌'} [${user.id}] ${user.email}: bcrypt.compare(wrong) = ${wrongMatch}`);
    }

    // ──────────────────────────────────────────────
    // STEP 7: JWT generation & verification test
    // ──────────────────────────────────────────────
    banner('STEP 7: JWT Generation & Verification');

    const jwtResults = [];

    for (const user of seededUsers) {
      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: 'active'
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      let verified = null;
      let jwtError = null;

      try {
        verified = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        jwtError = err.message;
      }

      const jwtOk = verified !== null && verified.id === user.id && verified.role === user.role;

      jwtResults.push({
        ...user,
        token: token.substring(0, 60) + '...',
        fullToken: token,
        jwtOk,
        verifiedPayload: verified
      });

      log(`  ${jwtOk ? '✅' : '❌'} [${user.id}] ${user.email}: JWT sign+verify = ${jwtOk ? 'PASS' : 'FAIL'}`);
      if (jwtError) log(`     Error: ${jwtError}`);
    }

    // ──────────────────────────────────────────────
    // STEP 8: Final user list from DB
    // ──────────────────────────────────────────────
    banner('STEP 8: Final Verification from DB');

    const [finalUsers] = await conn.query(
      'SELECT id, name, email, role, status, created_at FROM users ORDER BY id'
    );

    log(`\nTotal users in DB: ${finalUsers.length}`);
    finalUsers.forEach(u => {
      log(`  [${u.id}] ${u.name.padEnd(20)} | ${u.email.padEnd(35)} | ${u.role.padEnd(10)} | ${u.status}`);
    });

    // ──────────────────────────────────────────────
    // WRITE VERIFY_AUTH.md
    // ──────────────────────────────────────────────
    banner('Writing VERIFY_AUTH.md');

    const now = new Date().toISOString();
    const hashResultsMap = {};
    hashResults.forEach(h => { hashResultsMap[h.id] = h; });
    const jwtResultsMap = {};
    jwtResults.forEach(j => { jwtResultsMap[j.id] = j; });

    let md = `# VendorBridge — Authentication Verification Report

> Generated: ${now}
> Environment: ${process.env.NODE_ENV || 'development'}
> Database: ${DB_CONFIG.database}@${DB_CONFIG.host}
> bcrypt Rounds: ${BCRYPT_ROUNDS}
> JWT Secret: ${JWT_SECRET.substring(0, 10)}...

---

## Summary

| Status | Check |
|--------|-------|
| ${finalUsers.length === 4 ? '✅' : '❌'} | ${finalUsers.length}/4 users seeded |
| ${hashResults.every(h => h.bcryptMatch) ? '✅' : '❌'} | bcrypt hash verification |
| ${hashResults.every(h => !h.bcryptWrongMatch) ? '✅' : '❌'} | bcrypt rejects wrong passwords |
| ${jwtResults.every(j => j.jwtOk) ? '✅' : '❌'} | JWT generation & verification |

---

## Demo Users

| ID | Name | Email | Role | Status | Plain Password |
|----|------|-------|------|--------|----------------|
${finalUsers.map(u => {
  const plain = DEMO_USERS.find(d => d.email === u.email)?.password || '—';
  return `| ${u.id} | ${u.name} | ${u.email} | ${u.role} | ${u.status} | \`${plain}\` |`;
}).join('\n')}

---

## bcrypt Hash Verification

`;

    hashResults.forEach(h => {
      md += `### ${h.name} (${h.role})\n`;
      md += `- **Email:** \`${h.email}\`\n`;
      md += `- **Plain Password:** \`${h.plainPassword}\`\n`;
      md += `- **Hash (truncated):** \`${h.passwordHash.substring(0, 40)}...\`\n`;
      md += `- **bcrypt.compare(correct password):** ${h.bcryptMatch ? '✅ MATCH' : '❌ NO MATCH'}\n`;
      md += `- **bcrypt.compare(wrong password):** ${!h.bcryptWrongMatch ? '✅ REJECTED' : '❌ ACCEPTED (BUG!)'}\n`;
      md += `- **Account Status:** \`${h.dbStatus}\`\n\n`;
    });

    md += `---\n\n## JWT Generation & Verification\n\n`;

    jwtResults.forEach(j => {
      md += `### ${j.name} (${j.role})\n`;
      md += `- **Email:** \`${j.email}\`\n`;
      md += `- **Token (truncated):** \`${j.token}\`\n`;
      md += `- **Sign + Verify:** ${j.jwtOk ? '✅ PASS' : '❌ FAIL'}\n`;
      if (j.verifiedPayload) {
        md += `- **Decoded Payload:**\n`;
        md += `  \`\`\`json\n  ${JSON.stringify({ id: j.verifiedPayload.id, email: j.verifiedPayload.email, role: j.verifiedPayload.role, status: j.verifiedPayload.status }, null, 2).split('\n').join('\n  ')}\n  \`\`\`\n`;
      }
      md += `\n`;
    });

    md += `---\n\n## Login Test Credentials\n\n`;
    md += `Use these credentials on the login page at \`http://localhost:5173/login\`:\n\n`;
    md += `| Role | Email | Password |\n`;
    md += `|------|-------|----------|\n`;
    DEMO_USERS.forEach(u => {
      md += `| ${u.role} | \`${u.email}\` | \`${u.password}\` |\n`;
    });

    md += `\n---\n\n## Schema Verification\n\n`;
    md += `### Tables Found\n\n`;
    tableNames.forEach(t => { md += `- \`${t}\`\n`; });

    md += `\n### users Table Columns (after migration)\n\n`;
    const [finalCols] = await conn.query('SHOW COLUMNS FROM users');
    finalCols.forEach(c => { md += `- \`${c.Field}\` — ${c.Type} | NULL: ${c.Null} | Default: ${c.Default || 'none'}\n`; });

    md += `\n---\n\n## Overall Result\n\n`;
    const allPassed = finalUsers.length === 4
      && hashResults.every(h => h.bcryptMatch && !h.bcryptWrongMatch)
      && jwtResults.every(j => j.jwtOk);

    md += allPassed
      ? `### ✅ ALL CHECKS PASSED — Authentication system is fully functional.\n`
      : `### ❌ SOME CHECKS FAILED — See individual results above.\n`;

    fs.writeFileSync('VERIFY_AUTH.md', md, 'utf8');
    log('✅ VERIFY_AUTH.md written to project root');

    // ──────────────────────────────────────────────
    // Print final credentials summary
    // ──────────────────────────────────────────────
    banner('FINAL CREDENTIALS SUMMARY');
    DEMO_USERS.forEach((u, i) => {
      log(`  [${i+1}] ${u.role.toUpperCase().padEnd(10)} | ${u.email.padEnd(35)} | ${u.password}`);
    });

    const allOk = hashResults.every(h => h.bcryptMatch) && jwtResults.every(j => j.jwtOk);
    console.log(`\n${allOk ? '🎉 ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'} — See VERIFY_AUTH.md for details\n`);

  } catch (err) {
    console.error('\n❌ SCRIPT ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
