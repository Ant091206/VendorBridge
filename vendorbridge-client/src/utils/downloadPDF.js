import { downloadPDF } from '../api/invoiceApi';

/**
 * Downloads the invoice PDF programmatically without page reloads.
 * 
 * @param {number|string} invoiceId - The database invoice ID
 * @param {string} invoiceNumber - The filename label (e.g. INV-2026-0001)
 * @returns {Promise<void>} Resolves when download is successfully triggered
 */
export async function downloadInvoicePDF(invoiceId, invoiceNumber) {
  try {
    const blob = await downloadPDF(invoiceId);
    
    // Create local blob URL
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    
    // Mount temporary anchor element
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${invoiceNumber}.pdf`);
    
    document.body.appendChild(link);
    link.click();
    
    // Clean up temporary DOM references
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading invoice PDF:', error);
    throw error;
  }
}
