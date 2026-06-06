import pool from '../config/db.js';

/**
 * Generates a unique, sequential purchase order number in the format PO-YYYY-XXXX.
 * If no PO exists for the current year, it starts from 0001.
 * If the sequence exceeds 9999, it grows dynamically (e.g. 10000).
 * 
 * @param {object} [db] - Optional active database connection or transaction client. If omitted, uses the default pool.
 * @returns {Promise<string>} The generated PO number string.
 */
export async function generatePONumber(db = pool) {
  const currentYear = new Date().getFullYear();
  const pattern = `PO-${currentYear}-%`;

  // Query the database for the latest PO number of the current year
  const [rows] = await db.execute(
    'SELECT po_number FROM purchase_orders WHERE po_number LIKE ? ORDER BY id DESC LIMIT 1',
    [pattern]
  );

  let nextNumber = 1;

  if (rows && rows.length > 0) {
    const lastPoNumber = rows[0].po_number;
    const parts = lastPoNumber.split('-');
    
    // Format is PO-YYYY-XXXX, split length should be 3
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextNumber = lastSeq + 1;
      }
    }
  }

  // Zero-pad the sequence to at least 4 digits
  const paddedSequence = String(nextNumber).padStart(4, '0');
  
  return `PO-${currentYear}-${paddedSequence}`;
}
