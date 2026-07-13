/**
 * invoiceNumberGenerator.js
 * Generates sequential invoice numbers: INV-YYYY-XXXX
 * Uses the invoices table to find the last number for the current year.
 */

/**
 * Generate the next invoice number atomically (within a transaction connection).
 * @param {object} conn - Active MySQL connection (from pool.getConnection())
 * @returns {Promise<string>} e.g. "INV-2026-0001"
 */
export const generateInvoiceNumber = async (conn) => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const [rows] = await conn.execute(
    `SELECT invoice_number FROM invoices 
     WHERE invoice_number LIKE ? 
     ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextSeq = 1;
  if (rows.length > 0) {
    const lastNum = rows[0].invoice_number;
    const lastSeq = parseInt(lastNum.split('-')[2], 10);
    nextSeq = lastSeq + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
};
