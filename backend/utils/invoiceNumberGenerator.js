import pool from '../config/db.js';

/**
 * Generates a unique, sequential invoice number in the format INV-YYYY-XXXX.
 * If no invoice exists for the current year, it starts from 0001.
 * If the sequence exceeds 9999, it grows dynamically (e.g. 10000).
 * 
 * @param {object} [db] - Optional active database connection or transaction client. If omitted, uses the default pool.
 * @returns {Promise<string>} The generated invoice number string.
 */
export async function generateInvoiceNumber(db = pool) {
  const currentYear = new Date().getFullYear();
  const pattern = `INV-${currentYear}-%`;

  // Query the database for the latest invoice number of the current year
  const [rows] = await db.execute(
    'SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1',
    [pattern]
  );

  let nextNumber = 1;

  if (rows && rows.length > 0) {
    const lastInvoiceNumber = rows[0].invoice_number;
    const parts = lastInvoiceNumber.split('-');
    
    // Format is INV-YYYY-XXXX, split length should be 3
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextNumber = lastSeq + 1;
      }
    }
  }

  // Zero-pad the sequence to at least 4 digits
  const paddedSequence = String(nextNumber).padStart(4, '0');
  
  return `INV-${currentYear}-${paddedSequence}`;
}
