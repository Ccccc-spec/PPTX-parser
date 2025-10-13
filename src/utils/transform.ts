import type { BaseElement } from '../types';

/**
 * Flip group elements horizontally or vertically
 * @param elements - Array of elements to flip
 * @param direction - Flip direction ('x' or 'y')
 * @returns Flipped elements
 */
export function flipGroupElements(
  elements: BaseElement[],
  direction: 'x' | 'y'
): BaseElement[] {
  return elements.map((el) => ({
    ...el,
    left: direction === 'x' ? -el.left : el.left,
    top: direction === 'y' ? -el.top : el.top,
  }));
}

/**
 * Calculate rotated position of an element
 * @param originLeft - Origin left position
 * @param originTop - Origin top position
 * @param elLeft - Element left position
 * @param elTop - Element top position
 * @param rotate - Rotation angle in degrees
 * @returns Rotated x and y coordinates
 */
export function calculateRotatedPosition(
  originLeft: number,
  originTop: number,
  elLeft: number,
  elTop: number,
  rotate: number
): { x: number; y: number } {
  const radians = (rotate * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  const x = originLeft + elLeft * cos - elTop * sin;
  const y = originTop + elLeft * sin + elTop * cos;

  return { x, y };
}

