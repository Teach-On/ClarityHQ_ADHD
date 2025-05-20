/**
 * Common service helper functions to reduce code duplication
 */

/**
 * Wrapper function to handle async operations with consistent error handling
 * @param fn The async function to execute
 * @param errorMsg Optional custom error message prefix
 * @returns Promise with data and error properties
 */
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  errorMsg = "Operation failed"
): Promise<{data: T | null, error: Error | null}> => {
  try {
    const result = await fn();
    return { data: result, error: null };
  } catch (err) {
    console.error(errorMsg, err);
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error(String(err)) 
    };
  }
};

/**
 * Create a safe wrapper for UUIDs in development environments
 * For development with mock IDs, this ensures we get a valid UUID format
 * In production, it passes through the actual UUID
 * 
 * @param id The ID to process
 * @returns A UUID-formatted string
 */
export const safeUUID = (id: string): string => {
  // If we're in development and the ID is clearly a test ID or invalid UUID
  if (import.meta.env.DEV && (
    id === 'test-user-id-123' || 
    id.includes('test-') || 
    id.length < 32 ||
    // Standard development UUID format check
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  )) {
    // Return a consistent development UUID
    return '12345678-1234-5678-1234-567812345678';
  }
  
  // Otherwise just return the original ID
  return id;
};