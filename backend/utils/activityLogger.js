import { logActivity as logActivityRecord } from '../services/activityService.js';

/**
 * Backward-compatible wrapper around the centralized Module 9 activity service.
 * @param {object} db - Database connection or pool instance
 * @param {number|null} userId - The user ID performing the action
 * @param {string} entityType - The type of entity (e.g., 'rfq', 'quotation', 'approval', 'purchase_order', 'invoice')
 * @param {number} entityId - The ID of the affected entity
 * @param {string} action - The action string (e.g., 'APPROVAL_APPROVED', 'APPROVAL_REJECTED')
 */
export async function logActivity(db, userId, entityType, entityId, action) {
  await logActivityRecord(
    db,
    userId,
    action,
    null,
    entityType,
    entityId,
    null,
    null
  );
}
