/**
 * Convert font size from pt to px
 * @param content - HTML content string with pt units
 * @param ratio - Conversion ratio
 * @returns Content with px units
 */
export function convertFontSizePtToPx(content: string, ratio: number): string {
  return content.replace(/(\d+)pt/g, (_match, size) => {
    const pxSize = (parseInt(size) * ratio).toFixed(1);
    return `${pxSize}px`;
  });
}

