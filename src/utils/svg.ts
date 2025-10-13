/**
 * Get the bounding box range of an SVG path
 * @param path - SVG path string
 * @returns Maximum X and Y coordinates
 */
export function getSvgPathRange(path: string): { maxX: number; maxY: number } {
  const numbers = path.match(/-?\d+\.?\d*/g) || [];
  const coords = numbers.map(Number);
  const xCoords = coords.filter((_, i) => i % 2 === 0);
  const yCoords = coords.filter((_, i) => i % 2 === 1);

  return {
    maxX: Math.max(...xCoords, 0),
    maxY: Math.max(...yCoords, 0),
  };
}

