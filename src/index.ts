// Main parser function
export { parsePPTXToSlides } from './parser';

// Type definitions
export type {
  BaseElement,
  ChartItem,
  ChartOptions,
  ChartType,
  Element,
  ElementOutline,
  ElementShadow,
  Gradient,
  ImageElementClip,
  ImageElementFilters,
  ParseOptions,
  PPTAudioElement,
  PPTChartElement,
  PPTImageElement,
  PPTLatexElement,
  PPTLineElement,
  PPTShapeElement,
  PPTTableElement,
  PPTTextElement,
  PPTVideoElement,
  Slide,
  SlideBackground,
  TableCell,
  TableCellStyle,
  TextType,
} from './types';

// Utility functions
export {
  calculateRotatedPosition,
  convertFontSizePtToPx,
  flipGroupElements,
  generateId,
  getSvgPathRange,
} from './utils';

