import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vendorbridge',
};

async function checkAndAddColumn(connection, tableName, columnName, columnDefinition) {
  const [columns] = await connection.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [connectionConfig.database, tableName, columnName]
  );
  
  if (columns.length === 0) {
    console.log(`Adding column '${columnName}' to table '${tableName}'...`);
    await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`);
    console.log(`Column '${columnName}' added successfully.`);
  } else {
    console.log(`Column '${columnName}' already exists in table '${tableName}'.`);
  }
}

async function checkAndAddIndex(connection, tableName, indexName, columnsStr) {
  const [indexes] = await connection.query(
    `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [connectionConfig.database, tableName, indexName]
  );

  if (indexes.length === 0) {
    console.log(`Adding index '${indexName}' on table '${tableName}'(${columnsStr})...`);
    await connection.query(`ALTER TABLE \`${tableName}\` ADD INDEX \`${indexName}\` (${columnsStr})`);
    console.log(`Index '${indexName}' added successfully.`);
  } else {
    console.log(`Index '${indexName}' already exists on table '${tableName}'.`);
  }
}

async function runSchemaUpdate() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection(connectionConfig);
  console.log('Database connected.');

  try {
    // 1. Update activity_logs table columns
    console.log('Checking activity_logs table columns...');
    await checkAndAddColumn(connection, 'activity_logs', 'user_name', 'VARCHAR(255) NULL AFTER user_id');
    await checkAndAddColumn(connection, 'activity_logs', 'role', 'VARCHAR(50) NULL AFTER user_name');
    await checkAndAddColumn(connection, 'activity_logs', 'module_name', 'VARCHAR(100) NULL AFTER role');
    await checkAndAddColumn(connection, 'activity_logs', 'action_type', 'VARCHAR(255) NOT NULL AFTER entity_id');
    await checkAndAddColumn(connection, 'activity_logs', 'old_value', 'JSON NULL AFTER action_type');
    await checkAndAddColumn(connection, 'activity_logs', 'new_value', 'JSON NULL AFTER old_value');
    await checkAndAddColumn(connection, 'activity_logs', 'description', 'TEXT NULL AFTER new_value');
    await checkAndAddColumn(connection, 'activity_logs', 'ip_address', 'VARCHAR(45) NULL AFTER description');
    await checkAndAddColumn(connection, 'activity_logs', 'device_info', 'VARCHAR(255) NULL AFTER ip_address');

    // 2. Create notifications table
    console.log('Creating notifications table if not exists...');
    const createNotificationsTable = `
      CREATE TABLE IF NOT EXISTS \`notifications\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`message\` TEXT NOT NULL,
        \`status\` ENUM('Unread', 'Read', 'Archived', 'Dismissed') NOT NULL DEFAULT 'Unread',
        \`notification_type\` VARCHAR(50) NOT NULL,
        \`reference_module\` VARCHAR(50) NULL,
        \`reference_id\` INT NULL,
        \`read_at\` TIMESTAMP NULL DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createNotificationsTable);
    console.log('Notifications table checked/created.');

    // 3. Add Indexes for Performance optimization
    console.log('Adding performance indexes...');
    await checkAndAddIndex(connection, 'activity_logs', 'idx_activity_logs_created_at', '`created_at` DESC');
    await checkAndAddIndex(connection, 'activity_logs', 'idx_logs_module_name', '`module_name`');
    await checkAndAddIndex(connection, 'activity_logs', 'idx_activity_logs_user_id', '`user_id`');
    await checkAndAddIndex(connection, 'activity_logs', 'idx_logs_action_type', '`action_type`');
    await checkAndAddIndex(connection, 'activity_logs', 'idx_logs_user_created', '`user_id`, `created_at` DESC');
    await checkAndAddIndex(connection, 'activity_logs', 'idx_logs_module_created', '`module_name`, `created_at` DESC');
    
    await checkAndAddIndex(connection, 'notifications', 'idx_notif_user_status', '`user_id`, `status`');
    await checkAndAddIndex(connection, 'notifications', 'idx_notif_type', '`notification_type`');
    await checkAndAddIndex(connection, 'notifications', 'idx_notif_status', '`status`');
    await checkAndAddIndex(connection, 'notifications', 'idx_notif_created_at', '`created_at` DESC');
    await checkAndAddIndex(connection, 'notifications', 'idx_notif_user_created', '`user_id`, `created_at` DESC');
    
    await checkAndAddIndex(connection, 'vendors', 'idx_vendors_email_status', '`email`, `status`');
    await checkAndAddIndex(connection, 'rfqs', 'idx_rfqs_status_deadline', '`status`, `submission_deadline`');
    await checkAndAddIndex(connection, 'quotations', 'idx_quotations_rfq_vendor', '`rfq_id`, `vendor_id`, `status`');
    await checkAndAddIndex(connection, 'purchase_orders', 'idx_purchase_orders_created', '`status`, `created_at` DESC');
    await checkAndAddIndex(connection, 'invoices', 'idx_invoices_issued', '`po_id`, `status`, `issue_date` DESC');

    console.log('Database schema update and index creation completed successfully!');
  } catch (error) {
    console.error('Error during database update:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

runSchemaUpdate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
