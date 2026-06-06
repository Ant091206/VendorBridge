/**
 * CSV Download Utility
 * Triggers a file download from a blob response.
 *
 * @param {Promise<Blob>} blobPromise - A promise that resolves to a Blob (from an axios call with responseType: 'blob')
 * @param {string} filename - The filename for the downloaded file (e.g. 'vendors-2026.csv')
 * @returns {Promise<void>}
 */
export async function downloadCSV(blobPromise, filename) {
  try {
    const blob = await blobPromise;

    // Create a local blob URL from the response data
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));

    // Mount a temporary anchor element to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);

    document.body.appendChild(link);
    link.click();

    // Clean up temporary DOM references and revoke the blob URL
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading CSV file:', error);
    throw error;
  }
}
