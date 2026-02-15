import { parse } from 'pptxtojson';
import type {
  BaseElement,
  ChartItem,
  ChartOptions,
  ChartType,
  Element,
  Gradient,
  ParseOptions,
  PPTAudioElement,
  PPTChartElement,
  PPTImageElement,
  PPTShapeElement,
  PPTTableElement,
  PPTTextElement,
  PPTVideoElement,
  Slide,
  SlideBackground,
  TableCell,
  TableCellStyle,
} from './types';
import {
  calculateRotatedPosition,
  convertFontSizePtToPx,
  flipGroupElements,
  generateId,
  getSvgPathRange,
} from './utils';

const shapeList: any[] = [];
const SHAPE_PATH_FORMULAS: any = {};

const defaultTheme = {
  fontName: 'Arial',
  fontColor: '#000000',
  themeColors: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'],
};

function parseLineElement(el: Element, ratio: number): any {
  return {
    type: 'line',
    id: generateId(10),
    width: el.width * ratio,
    height: el.height * ratio,
    left: el.left * ratio,
    top: el.top * ratio,
    rotate: el.rotate || 0,
    start: [0, 0],
    end: [el.width * ratio, el.height * ratio],
    color: el.stroke || '#000000',
    strokeWidth: (el.strokeWidth || 1) * ratio,
    style: 'solid',
    points: el.points || ['', ''],
    broken: el.broken || [0, 0],
    broken2: el.broken2 || [0, 0],
    curve: el.curve || [0, 0],
    cubic: el.cubic || [[0, 0], [0, 0]],
    dash: el.dash || [0, 0],
    dashPhase: el.dashPhase || 0,
    dashLength: el.dashLength || 0,
    dashOffset: el.dashOffset || 0,
    dashArray: el.dashArray || [0, 0],
    dashCap: el.dashCap || 'butt',
    dashJoin: el.dashJoin || 'miter',
  };
}

/**
 * Parse PPTX ArrayBuffer to structured Slide data
 * @param arrayBuffer - PPTX file as ArrayBuffer
 * @param options - Parse options
 * @returns Array of Slide objects
 */
export async function parsePPTXToSlides(
  arrayBuffer: ArrayBuffer,
  options: ParseOptions = {}
): Promise<Slide[]> {
  const { containerWidth = 800, themeColors = defaultTheme.themeColors } = options;

  try {
    let jsonData: any;
    try {
      jsonData = await parse(arrayBuffer);
    } catch (parseError) {
      console.warn('pptxtojson parse error:', parseError);
      throw new Error('Unable to parse PPTX file');
    }

    const slides: Slide[] = [];
    const targetSlideWidth = containerWidth;
    const targetSlideHeight = (targetSlideWidth * 9) / 16;

    const originalWidth = jsonData.size?.width;
    const originalHeight = jsonData.size?.height;

    const scaleX = targetSlideWidth / originalWidth;
    const scaleY = targetSlideHeight / originalHeight;
    const ratio = Math.min(scaleX, scaleY);

    const finalThemeColors = jsonData.themeColors || themeColors;

    for (const item of jsonData.slides) {
      const { type, value } = item.fill;
      let background: SlideBackground;

      if (type === 'image') {
        background = {
          type: 'image',
          image: {
            src: value.picBase64,
            size: 'cover',
          },
        };
      } else if (type === 'gradient') {
        background = {
          type: 'gradient',
          gradient: {
            type: value.path === 'line' ? 'linear' : 'radial',
            colors: value.colors.map((item: any) => ({
              ...item,
              pos: parseInt(item.pos),
            })),
            rotate: value.rot + 90,
          },
        };
      } else {
        background = {
          type: 'solid',
          color: value || '#fff',
        };
      }

      const slide: Slide = {
        id: generateId(10),
        elements: [],
        background,
        remark: item.note || '',
      };

      const parseElements = (elements: Element[]) => {
        const sortedElements = elements.sort((a, b) => a.order - b.order);

        for (const el of sortedElements) {
          const originWidth = el.width || 1;
          const originHeight = el.height || 1;
          const originLeft = el.left;
          const originTop = el.top;

          el.width = el.width * ratio;
          el.height = el.height * ratio;
          el.left = el.left * ratio;
          el.top = el.top * ratio;

          if (el.type === 'text') {
            const textEl: PPTTextElement = {
              type: 'text',
              id: generateId(10),
              width: el.width,
              height: el.height,
              left: el.left,
              top: el.top,
              rotate: el.rotate,
              defaultFontName: el.fontFamily || defaultTheme.fontName,
              defaultColor: el.color || defaultTheme.fontColor,
              content: convertFontSizePtToPx(el.content || '', ratio),
              lineHeight: el.lineHeight || 1,
              outline: {
                color: el.borderColor || '#000000',
                width: +((el.borderWidth || 0) * ratio).toFixed(2),
                style: el.borderType || 'solid',
              },
              fill: el.fill?.type === 'color' ? el.fill.value : '',
              vertical: el.isVertical || false,
              fontSize: el.fontSize ? el.fontSize * ratio : undefined,
              fontWeight: el.fontBold ? 'bold' : 'normal',
              fontStyle: el.fontItalic ? 'italic' : 'normal',
              textDecoration: el.fontUnderline ? 'underline' : 'none',
              textAlign: (el.alignment as 'left' | 'center' | 'right' | 'justify') || 'left',
              verticalAlign: (el.vAlign as 'top' | 'middle' | 'bottom') || 'top',
            };
            if (el.shadow) {
              textEl.shadow = {
                h: el.shadow.h * ratio,
                v: el.shadow.v * ratio,
                blur: el.shadow.blur * ratio,
                color: el.shadow.color,
              };
            }
            slide.elements.push(textEl);
          } else if (el.type === 'image') {
            const element: PPTImageElement = {
              type: 'image',
              id: generateId(10),
              src: el.src || el.picBase64 || '',
              alt: 'PPT Image',
              objectFit: 'cover',
              width: el.width,
              height: el.height,
              left: el.left,
              top: el.top,
              fixedRatio: true,
              rotate: el.rotate,
              flipH: el.isFlipH,
              flipV: el.isFlipV,
            };

            if (el.borderWidth) {
              element.outline = {
                color: el.borderColor || '#000000',
                width: +((el.borderWidth || 0) * ratio).toFixed(2),
                style: el.borderType || 'solid',
              };
            }

            const clipShapeTypes = [
              'roundRect',
              'ellipse',
              'triangle',
              'rhombus',
              'pentagon',
              'hexagon',
              'heptagon',
              'octagon',
              'parallelogram',
              'trapezoid',
              'rect2',
              'rect3',
              'triangle2',
              'triangle3',
              'chevron',
              'point',
              'arrow',
              'parallelogram2',
              'trapezoid2',
            ];

            const shapeInfo = el.geom || el.shapType || el.shapeType || el.shape || el.type;

            if (el.rect) {
              element.clip = {
                shape: shapeInfo && clipShapeTypes.includes(shapeInfo) ? shapeInfo : 'rect',
                range: [
                  [el.rect.l || 0, el.rect.t || 0],
                  [100 - (el.rect.r || 0), 100 - (el.rect.b || 0)],
                ],
              };
            } else if (shapeInfo && clipShapeTypes.includes(shapeInfo)) {
              element.clip = {
                shape: shapeInfo,
                range: [
                  [0, 0],
                  [100, 100],
                ],
              };
            }

            if (el.radius !== undefined) {
              element.radius = el.radius;
              if (!element.clip) {
                element.clip = {
                  shape: 'roundRect',
                  range: [
                    [0, 0],
                    [100, 100],
                  ],
                };
              } else if (element.clip.shape === 'rect') {
                element.clip.shape = 'roundRect';
              }
            }

            const possibleRadiusFields = ['borderRadius', 'cornerRadius', 'roundRadius', 'round'];
            for (const field of possibleRadiusFields) {
              if (el[field] !== undefined) {
                element.radius = el[field];
                if (!element.clip) {
                  element.clip = {
                    shape: 'roundRect',
                    range: [
                      [0, 0],
                      [100, 100],
                    ],
                  };
                } else if (element.clip.shape === 'rect') {
                  element.clip.shape = 'roundRect';
                }
                break;
              }
            }

            slide.elements.push(element);
          } else if (el.type === 'math') {
            slide.elements.push({
              type: 'image',
              id: generateId(10),
              src: el.picBase64 || '',
              width: el.width,
              height: el.height,
              left: el.left,
              top: el.top,
              fixedRatio: true,
              rotate: 0,
              objectFit: 'cover',
            } as PPTImageElement);
          } else if (el.type === 'audio') {
            slide.elements.push({
              type: 'audio',
              id: generateId(10),
              src: el.blob || '',
              width: el.width,
              height: el.height,
              left: el.left,
              top: el.top,
              rotate: 0,
              fixedRatio: false,
              color: finalThemeColors[0],
              loop: false,
              autoplay: false,
            } as PPTAudioElement);
          } else if (el.type === 'video') {
            slide.elements.push({
              type: 'video',
              id: generateId(10),
              src: (el.blob || el.src)!,
              width: el.width,
              height: el.height,
              left: el.left,
              top: el.top,
              rotate: 0,
              autoplay: false,
            } as PPTVideoElement);
          } else if (el.type === 'shape') {
            if (el.shapType === 'line' || /Connector/.test(el.shapType || '')) {
              const lineElement = parseLineElement(el, ratio);
              slide.elements.push(lineElement);
            } else {
              const shape = shapeList.find((item) => item.pptxShapeType === el.shapType);

              const vAlignMap: { [key: string]: 'top' | 'middle' | 'bottom' } = {
                mid: 'middle',
                down: 'bottom',
                up: 'top',
              };

              const gradient: Gradient | undefined =
                el.fill?.type === 'gradient'
                  ? {
                      type: el.fill.value.path === 'line' ? 'linear' : 'radial',
                      colors: el.fill.value.colors.map((item: any) => ({
                        ...item,
                        pos: parseInt(item.pos),
                      })),
                      rotate: el.fill.value.rot,
                    }
                  : undefined;

              const pattern: string | undefined =
                el.fill?.type === 'image' ? el.fill.value.picBase64 : undefined;

              const fill = el.fill?.type === 'color' ? el.fill.value : '';

              const element: PPTShapeElement = {
                type: 'shape',
                id: generateId(10),
                width: el.width,
                height: el.height,
                left: el.left,
                top: el.top,
                viewBox: [200, 200] as [number, number],
                path: 'M 0 0 L 200 0 L 200 200 L 0 200 Z',
                fill,
                gradient,
                pattern,
                fixedRatio: false,
                rotate: el.rotate,
                outline: {
                  color: el.borderColor || '#000000',
                  width: +((el.borderWidth || 0) * ratio).toFixed(2),
                  style: el.borderType || 'solid',
                },
                text: {
                  content: convertFontSizePtToPx(el.content || '', ratio),
                  defaultFontName: defaultTheme.fontName,
                  defaultColor: defaultTheme.fontColor,
                  align: vAlignMap[el.vAlign || ''] || 'middle',
                },
                flipH: el.isFlipH,
                flipV: el.isFlipV,
              };

              if (el.shadow) {
                element.shadow = {
                  h: el.shadow.h * ratio,
                  v: el.shadow.v * ratio,
                  blur: el.shadow.blur * ratio,
                  color: el.shadow.color,
                };
              }

              if (shape) {
                element.path = shape.path;
                element.viewBox = shape.viewBox;

                if (shape.pathFormula) {
                  element.pathFormula = shape.pathFormula;
                  element.viewBox = [el.width, el.height] as [number, number];

                  const pathFormula = SHAPE_PATH_FORMULAS[shape.pathFormula];
                  if ('editable' in pathFormula && pathFormula.editable) {
                    element.path = pathFormula.formula(
                      el.width,
                      el.height,
                      pathFormula.defaultValue
                    );
                    element.keypoints = pathFormula.defaultValue;
                  } else element.path = pathFormula.formula(el.width, el.height);
                }
              } else if (el.path && el.path.indexOf('NaN') === -1) {
                const { maxX, maxY } = getSvgPathRange(el.path);
                element.path = el.path;
                if (maxX / maxY > originWidth / originHeight) {
                  element.viewBox = [maxX, (maxX * originHeight) / originWidth] as [
                    number,
                    number,
                  ];
                } else {
                  element.viewBox = [(maxY * originWidth) / originHeight, maxY] as [
                    number,
                    number,
                  ];
                }
              }

              if (el.shapType === 'custom') {
                if (el.path!.indexOf('NaN') !== -1) {
                  if (element.width === 0) element.width = 0.1;
                  if (element.height === 0) element.height = 0.1;
                  element.path = el.path!.replace(/NaN/g, '0');
                } else {
                  element.special = true;
                  element.path = el.path!;
                }
                const { maxX, maxY } = getSvgPathRange(element.path);
                if (maxX / maxY > originWidth / originHeight) {
                  element.viewBox = [maxX, (maxX * originHeight) / originWidth] as [
                    number,
                    number,
                  ];
                } else {
                  element.viewBox = [(maxY * originWidth) / originHeight, maxY] as [
                    number,
                    number,
                  ];
                }
              }

              if (element.path) slide.elements.push(element);
            }
          } else if (el.type === 'table') {
            if (!el.data || !Array.isArray(el.data) || el.data.length === 0) continue;
            const row = el.data.length;
            const col = el.data[0]?.length || 0;

            const style: TableCellStyle = {
              fontname: defaultTheme.fontName,
              color: defaultTheme.fontColor,
              align: 'left',
            };
            const data: TableCell[][] = [];

            for (let i = 0; i < row; i++) {
              const rowCells: TableCell[] = [];
              for (let j = 0; j < col; j++) {
                const cellData = el.data?.[i]?.[j];

                let textDiv: HTMLDivElement | null = document.createElement('div');
                textDiv.innerHTML = cellData?.text || '';
                const p = textDiv.querySelector('p');
                const align = p?.style.textAlign || 'left';

                const span = textDiv.querySelector('span');
                const fontsize = span?.style.fontSize
                  ? (parseInt(span?.style.fontSize) * ratio).toFixed(1) + 'px'
                  : '';
                const fontname = span?.style.fontFamily || '';
                const color = span?.style.color || cellData?.fontColor;

                rowCells.push({
                  id: generateId(10),
                  colspan: cellData?.colSpan || 1,
                  rowspan: cellData?.rowSpan || 1,
                  text: textDiv.innerText,
                  style: {
                    ...style,
                    align: ['left', 'right', 'center'].includes(align)
                      ? (align as 'left' | 'right' | 'center')
                      : 'left',
                    fontsize,
                    fontname,
                    color,
                    bold: cellData?.fontBold,
                    backcolor: cellData?.fillColor,
                  },
                });
                textDiv = null;
              }
              data.push(rowCells);
            }

            const allWidth = (el.colWidths || []).reduce((a, b) => a + b, 0);
            const colWidths: number[] = (el.colWidths || []).map((item) => item / allWidth);

            const firstCell = el.data?.[0]?.[0] || {};
            const border =
              firstCell?.borders?.top ||
              firstCell?.borders?.bottom ||
              el.borders?.top ||
              el.borders?.bottom ||
              firstCell?.borders?.left ||
              firstCell?.borders?.right ||
              el.borders?.left ||
              el.borders?.right;
            const borderWidth = border?.borderWidth || 0;
            const borderStyle = border?.borderType || 'solid';
            const borderColor = border?.borderColor || '#eeece1';

            slide.elements.push({
              type: 'table',
              id: generateId(10),
              width: el.width,
              height: el.height,
              left: el.left,
              top: el.top,
              colWidths,
              rotate: 0,
              data,
              outline: {
                width: +(borderWidth * ratio || 2).toFixed(2),
                style: borderStyle,
                color: borderColor,
              },
              cellMinHeight: el.rowHeights?.[0] ? el.rowHeights[0] * ratio : 36,
            } as PPTTableElement);
          } else if (el.type === 'chart') {
            if (!el.data || !Array.isArray(el.data) || el.data.length === 0) continue;

            let labels: string[];
            let legends: string[];
            let series: number[][];

            if (el.chartType === 'scatterChart' || el.chartType === 'bubbleChart') {
              labels = el.data?.[0]?.map((_item: any, index: number) => `坐标${index + 1}`) || [];
              legends = ['X', 'Y'];
              series = el.data || [];
            } else {
              const data = el.data as unknown as ChartItem[];
              labels = Object.values(data?.[0]?.xlabels || {});
              legends = data.map((item) => item.key);
              series = data.map((item) => item.values.map((v) => v.y));
            }

            const options: ChartOptions = {};
            let chartType: ChartType = 'bar';

            switch (el.chartType) {
              case 'barChart':
              case 'bar3DChart':
                chartType = 'bar';
                if (el.barDir === 'bar') chartType = 'column';
                if (el.grouping === 'stacked' || el.grouping === 'percentStacked')
                  options.stack = true;
                break;
              case 'lineChart':
              case 'line3DChart':
                if (el.grouping === 'stacked' || el.grouping === 'percentStacked')
                  options.stack = true;
                chartType = 'line';
                break;
              case 'areaChart':
              case 'area3DChart':
                if (el.grouping === 'stacked' || el.grouping === 'percentStacked')
                  options.stack = true;
                chartType = 'area';
                break;
              case 'scatterChart':
              case 'bubbleChart':
                chartType = 'scatter';
                break;
              case 'pieChart':
              case 'pie3DChart':
                chartType = 'pie';
                break;
              case 'radarChart':
                chartType = 'radar';
                break;
              case 'doughnutChart':
                chartType = 'ring';
                break;
              default:
            }

            slide.elements.push({
              type: 'chart',
              id: generateId(10),
              chartType: chartType,
              width: el.width,
              height: el.height,
              left: el.left,
              top: el.top,
              rotate: 0,
              themeColors: el.colors?.length ? el.colors : finalThemeColors,
              textColor: defaultTheme.fontColor,
              data: {
                labels,
                legends,
                series,
              },
              options,
            } as PPTChartElement);
          } else if (el.type === 'group') {
            if (!el.elements || !Array.isArray(el.elements)) continue;
            let elements: BaseElement[] = el.elements.map((_el: any) => {
              let left = _el.left + originLeft;
              let top = _el.top + originTop;

              if (el.rotate) {
                const { x, y } = calculateRotatedPosition(
                  originLeft,
                  originTop,
                  _el.left,
                  _el.top,
                  el.rotate
                );
                left = x;
                top = y;
              }

              const element = {
                ..._el,
                left,
                top,
              };
              if (el.isFlipH && 'isFlipH' in element) element.isFlipH = true;
              if (el.isFlipV && 'isFlipV' in element) element.isFlipV = true;

              return element;
            });
            if (el.isFlipH) elements = flipGroupElements(elements, 'y');
            if (el.isFlipV) elements = flipGroupElements(elements, 'x');
            parseElements(elements as unknown as Element[]);
          } else if (el.type === 'diagram') {
            if (!el.elements || !Array.isArray(el.elements)) continue;
            const elements = el.elements.map((_el: any) => ({
              ..._el,
              left: _el.left + originLeft,
              top: _el.top + originTop,
            }));
            parseElements(elements);
          }
        }
      };

      parseElements([...item.elements, ...item.layoutElements]);
      slides.push(slide);
    }

    return slides;
  } catch (error) {
    console.error('Error parsing PPTX to Slides:', error);
    throw new Error('Failed to parse PPTX file');
  }
}

