/**
 * Utility functions and constants for validation
 */

import isUrl from "validator/lib/isURL";

/**
 * Function to validate URL
 * @param url URL string to validate
 * @returns boolean indicating if URL is valid
 */
export const isValidUrl = (url: string): boolean => {
  return isUrl(url);
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
