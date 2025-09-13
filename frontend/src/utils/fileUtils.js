/**
 * Sanitize filename for safe download and display
 * @param {string} filename - The original filename to sanitize
 * @returns {string} - The sanitized filename
 */
export const sanitizeFilename = (filename) => {
  if (!filename) {
    return 'download';
  }

  return filename.replace(/[^a-zA-Z0-9._-]/g, '').substring(0, 100) || 'download';
};
