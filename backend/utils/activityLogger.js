/**
 * Activity Logger Utility
 * Logs actions in the activity_logs table without interrupting the main application flow.
 */

/**
 * Inserts a record into the activity_logs table.
 * @param {object} db - Database connection or pool instance
 * @param {number|null} userId - The user ID performing the action
 * @param {string} entityType - The type of entity (e.g., 'rfq', 'quotation', 'approval', 'purchase_order', 'invoice')
 * @param {number} entityId - The ID of the affected entity
 * @param {string} action - The action string (e.g., 'APPROVAL_APPROVED', 'APPROVAL_REJECTED')
 */
export async function logActivity(db, userId, entityType, entityId, action) {
  try {
    const sql = `
      INSERT INTO activity_logs (user_id, entity_type, entity_id, action, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;
    await db.execute(sql, [userId || null, entityType, entityId, action]);
  } catch (error) {
    // Handle error silently, logging to stderr so main process flow does not crash
    console.error('Activity logging failed:', error.message);
  }
}
