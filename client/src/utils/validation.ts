/**
 * Utility functions and constants for validation
 */

// URL validation regex
const URL_REGEX = /^(http[s]?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\.?/;

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

/**
 * Checks if a URL is the same as the host URL
 * @param url URL to check
 * @param hostUrl Host URL to compare against
 * @returns boolean indicating if URL is the same as host
 */
export const isSameAsHost = (url: string, hostUrl: string): boolean => {
  // Normalize both URLs for comparison
  const normalizedUrl = normalizeUrl(url);
  const normalizedHostUrl = normalizeUrl(hostUrl);

  // Remove trailing slashes for comparison
  const cleanUrl = normalizedUrl.replace(/\/+$/, "");
  const cleanHostUrl = normalizedHostUrl.replace(/\/+$/, "");

  // Check if the URL is the same as the host
  return cleanUrl === cleanHostUrl || cleanUrl.startsWith(cleanHostUrl + "/");
};

/**
 * Function to validate email
 * @param email Email string to validate
 * @returns boolean indicating if email is valid
 */
export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};
