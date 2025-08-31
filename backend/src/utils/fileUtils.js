/**
 * Sanitize filename to prevent path traversal and invalid characters
 * @param {string} filename - The original filename to sanitize
 * @returns {string} - The sanitized filename
 */
const sanitizeFilename = (filename) => {
  if (!filename) return 'file';
  
  // Remove any path traversal attempts and invalid characters
  const sanitized = filename
    .replace(/[^a-zA-Z0-9._-]/g, '') // Keep letters, numbers, dots, underscores, hyphens
    .replace(/\.\./g, '') // Remove directory traversal attempts
    .replace(/^[\/\\]+/, '') // Remove leading slashes
    .replace(/[\/\\]+$/, '') // Remove trailing slashes
    .substring(0, 255); // Limit length
  
  return sanitized || 'file';
};

module.exports = {
  sanitizeFilename
};
