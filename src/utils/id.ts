/**
 * Generate a random ID string
 * @param length - Length of the ID (default: 10)
 * @returns Random ID string
 */
export function generateId(length: number = 10): string {
  return Math.random().toString(36).substring(2, length + 2);
}

