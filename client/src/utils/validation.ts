/**
 * Utility functions and constants for validation
 */

/**
 * URL validation regex pattern
 * This pattern checks for a valid URL format with protocol (http/https)
 */
export const URL_REGEX = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

/**
 * Function to validate URL
 * @param url URL string to validate
 * @returns boolean indicating if URL is valid
 */
export const isValidUrl = (url: string): boolean => {
  return URL_REGEX.test(url);
};

/**
 * Ensures URL has a protocol (https://)
 * @param url URL string to normalize
 * @returns URL with protocol
 */
export const normalizeUrl = (url: string): string => {
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
};
