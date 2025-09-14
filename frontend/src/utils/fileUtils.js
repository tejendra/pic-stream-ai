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

/**
 * Format file size in bytes to human readable format
 * @param {number} bytes - The file size in bytes
 * @returns {string} - Formatted file size (e.g., "1.5 MB", "500 KB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
