// AI Generated - Needs Review

/**
 * Formats a date object into a localized date string
 * Handles various date formats including Firestore Timestamp objects
 * @param {Object|Date} date - The date to format (Firestore Timestamp, Date object, or plain object with _seconds)
 * @param {Object} options - Optional formatting options
 * @param {string} options.format - Format string ('short', 'long', 'numeric', 'custom')
 * @param {string} options.locale - Locale for formatting (default: browser locale)
 * @param {boolean} options.includeTime - Whether to include time in the output
 * @returns {string} - Formatted date string or 'Invalid Date' if date is invalid
 */
export const formatDate = (date, options = {}) => {
  if (!date) {
    return 'Invalid Date';
  }
  
  let dateObj;
  if (typeof date.toDate === 'function') {
    // Firestore Timestamp object
    dateObj = date.toDate();
  } else if (date._seconds) {
    // Plain object with _seconds and _nanoseconds
    dateObj = new Date(date._seconds * 1000);
  } else if (date instanceof Date) {
    // JavaScript Date object
    dateObj = date;
  } else {
    console.error('Invalid date format:', date);
    return 'Invalid Date';
  }
  
  // Format the date
  try {
    return dateObj.toLocaleDateString(options.locale ?? 'en-US', options.format ?? 'short');
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateObj.toLocaleDateString();
  }
};

/**
 * Calculates the number of days until a date expires
 * Handles various date formats including Firestore Timestamp objects
 * @param {Object|Date} expirationDate - The expiration date to check
 * @returns {number} - Number of days until expiry (negative if expired, -1 if invalid)
 */
export const getDaysUntilExpiry = (expirationDate) => {
  if (!expirationDate) {
    return -1; // Treat as expired
  }
  
  let expiryDate;
  if (typeof expirationDate.toDate === 'function') {
    // Firestore Timestamp object
    expiryDate = expirationDate.toDate();
  } else if (expirationDate._seconds) {
    // Plain object with _seconds and _nanoseconds
    expiryDate = new Date(expirationDate._seconds * 1000);
  } else if (expirationDate instanceof Date) {
    // JavaScript Date object
    expiryDate = expirationDate;
  } else {
    console.error('Invalid expiration date format:', expirationDate);
    return -1; // Treat as expired
  }
  
  const now = new Date();
  const diffTime = expiryDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

