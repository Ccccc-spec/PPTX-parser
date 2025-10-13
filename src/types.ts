// Base element interfaces
export interface BaseElement {
  id: string;
  type: string;
  width: number;
  height: number;
  left: number;
  top: number;
  rotate?: number;
}

// Common interfaces
export interface ElementShadow {
  h: number;
  v: number;
  blur: number;
  color: string;
}

export interface ElementOutline {
  width: number;
  style: string;
  color: string;
}

export interface Gradient {
  type: 'linear' | 'radial';
  colors: Array<{
    color: string;
    pos: number;
  }>;
  rotate: number;
}

// Image element
export interface ImageElementFilters {
  brightness?: number;
  contrast?: number;
  saturate?: number;
  hue?: number;
  blur?: number;
  grayscale?: number;
  sepia?: number;
}

export interface ImageElementClip {
  shape: string;
  range: number[][];
}

export interface PPTImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt?: string;
  objectFit: 'cover' | 'contain' | 'fill';
  fixedRatio?: boolean;
  flipH?: boolean;
  flipV?: boolean;
  filters?: ImageElementFilters;
  clip?: ImageElementClip;
  colorMask?: string;
  radius?: number;
  outline?: ElementOutline;
  shadow?: ElementShadow;
}

// Text element
export type TextType = 'title' | 'content' | 'caption';

export interface PPTTextElement extends BaseElement {
  type: 'text';
  content: string;
  defaultFontName: string;
  defaultColor: string;
  outline?: ElementOutline;
  fill?: string;
  lineHeight?: number;
  wordSpace?: number;
  opacity?: number;
  shadow?: ElementShadow;
  paragraphSpace?: number;
  vertical?: boolean;
  textType?: TextType;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter' | number;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

// Shape element
export interface PPTShapeElement extends BaseElement {
  type: 'shape';
  viewBox: [number, number];
  path: string;
  fill: string;
  gradient?: Gradient;
  pattern?: string;
  fixedRatio: boolean;
  outline: ElementOutline;
  text: {
    content: string;
    defaultFontName: string;
    defaultColor: string;
    align: 'top' | 'middle' | 'bottom';
  };
  flipH?: boolean;
  flipV?: boolean;
  shadow?: ElementShadow;
  pathFormula?: string;
  keypoints?: any;
  special?: boolean;
}

// Line element
export interface PPTLineElement extends BaseElement {
  type: 'line';
  start: [number, number];
  end: [number, number];
  color: string;
  strokeWidth: number;
  style: 'solid' | 'dashed' | 'dotted';
  points: [string, string];
  broken?: [number, number];
  broken2?: [number, number];
  curve?: [number, number];
  cubic?: [[number, number], [number, number]];
}

// Table element
export interface TableCellStyle {
  fontname: string;
  color: string;
  align: 'left' | 'right' | 'center';
  fontsize?: string;
  bold?: boolean;
  backcolor?: string;
}

export interface TableCell {
  id: string;
  colspan: number;
  rowspan: number;
  text: string;
  style: TableCellStyle;
}

export interface PPTTableElement extends BaseElement {
  type: 'table';
  colWidths: number[];
  data: TableCell[][];
  outline: ElementOutline;
  cellMinHeight: number;
}

// Chart element
export type ChartType = 'bar' | 'column' | 'line' | 'area' | 'scatter' | 'pie' | 'radar' | 'ring';

export interface ChartOptions {
  stack?: boolean;
}

export interface ChartItem {
  key: string;
  xlabels: Record<string, string>;
  values: Array<{ y: number }>;
}

export interface PPTChartElement extends BaseElement {
  type: 'chart';
  chartType: ChartType;
  themeColors: string[];
  textColor: string;
  data: {
    labels: string[];
    legends: string[];
    series: number[][];
  };
  options: ChartOptions;
}

// Media elements
export interface PPTVideoElement extends BaseElement {
  type: 'video';
  src: string;
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export interface PPTAudioElement extends BaseElement {
  type: 'audio';
  src: string;
  loop?: boolean;
  autoplay?: boolean;
  color: string;
  fixedRatio?: boolean;
}

export interface PPTLatexElement extends BaseElement {
  type: 'latex';
  latex: string;
  color: string;
  strokeWidth: number;
  path: string;
  viewBox: [number, number];
}

// Slide background
export interface SlideBackground {
  type: 'solid' | 'image' | 'gradient';
  color?: string;
  image?: {
    src: string;
    size: 'cover' | 'contain' | 'stretch';
  };
  gradient?: Gradient;
}

// Slide
export interface Slide {
  id: string;
  elements: BaseElement[];
  background: SlideBackground;
  remark: string;
}

// Parser options
export interface ParseOptions {
  containerWidth?: number;
  themeColors?: string[];
}

// Raw element interface (for internal parsing)
export interface Element {
  type: string;
  order: number;
  width: number;
  height: number;
  left: number;
  top: number;
  rotate?: number;
  isFlipH?: boolean;
  isFlipV?: boolean;
  content?: string;
  src?: string;
  picBase64?: string;
  blob?: string;
  shapType?: string;
  path?: string;
  geom?: string;
  shapeType?: string;
  shape?: string;
  rect?: {
    l: number;
    t: number;
    r: number;
    b: number;
  };
  fill?: {
    type: string;
    value: string | any;
  };
  borderColor?: string;
  borderWidth?: number;
  borderType?: string;
  shadow?: ElementShadow;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontBold?: boolean;
  fontItalic?: boolean;
  fontUnderline?: boolean;
  alignment?: string;
  vAlign?: string;
  isVertical?: boolean;
  lineHeight?: number;
  elements?: Element[];
  data?: any[][];
  colWidths?: number[];
  rowHeights?: number[];
  borders?: any;
  chartType?: string;
  barDir?: string;
  grouping?: string;
  colors?: string[];
  radius?: number;
  [key: string]: any;
}

