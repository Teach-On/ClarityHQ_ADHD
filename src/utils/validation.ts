/**
 * Validation utilities for the application
 */

/**
 * Validates if a string is a properly formatted UUID
 * @param uuid The string to check for UUID format
 * @returns boolean indicating if the string is a valid UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  if (!uuid) return false;
  
  // In development mode, be more permissive with UUID format
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    // Just check if it's a non-empty string in dev mode
    return true;
  }
  
  // In production, strictly validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validates if a string exists and has non-whitespace content
 * @param str The string to validate
 * @returns boolean indicating if the string has content
 */
export const hasContent = (str: string | null | undefined): boolean => {
  return !!str && str.trim().length > 0;
};

/**
 * Validates an email address format
 * @param email Email address to validate
 * @returns boolean indicating if the email format is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};