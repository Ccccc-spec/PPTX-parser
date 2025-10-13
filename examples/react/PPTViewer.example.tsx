/**
 * React PPT Viewer Example - Complete Implementation
 *
 * This example demonstrates the full rendering logic including:
 * - Virtual scrolling for performance optimization
 * - All element types rendering (text, image, shape, table, chart, etc.)
 * - Background rendering (solid, gradient, image)
 * - IntersectionObserver for visible slides detection
 *
 * Install dependencies:
 * npm install pptx-json-parser react
 */

import type {
  BaseElement,
  PPTAudioElement,
  PPTChartElement,
  PPTImageElement,
  PPTLineElement,
  PPTShapeElement,
  PPTTableElement,
  PPTTextElement,
  PPTVideoElement,
  Slide,
  SlideBackground,
} from 'pptx-json-parser';
import { parsePPTXToSlides } from 'pptx-json-parser';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface PPTViewerProps {
  url: string;
  containerWidth?: number;
  onError?: () => void;
}

export default function PPTViewer({ url, containerWidth = 800, onError }: PPTViewerProps) {
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [slideScale] = useState(1);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 加载 PPTX 文件
  useEffect(() => {
    const loadPPT = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch PPTX');

        const arrayBuffer = await response.arrayBuffer();
        const parsedSlides = await parsePPTXToSlides(arrayBuffer, {
          containerWidth,
        });

        setSlides(parsedSlides);

        // 初始化可见范围
        const bufferSize = 2;
        setVisibleRange({
          start: 0,
          end: Math.min(parsedSlides.length, bufferSize * 2 + 1),
        });
      } catch (err) {
        console.error('Error loading PPTX:', err);
        setError(true);
        onError?.();
      } finally {
        setIsLoading(false);
      }
    };

    loadPPT();
  }, [url, containerWidth, onError]);

  // 更新可见范围（虚拟滚动优化）
  const updateVisibleRange = useCallback(
    (centerIndex: number) => {
      if (!slides) return;

      const bufferSize = 3; // 前后各渲染3页
      const start = Math.max(0, centerIndex - bufferSize);
      const end = Math.min(slides.length, centerIndex + bufferSize + 1);

      setVisibleRange((prev) => {
        if (prev.start !== start || prev.end !== end) {
          return { start, end };
        }
        return prev;
      });
    },
    [slides],
  );

  // 设置 IntersectionObserver 监听可见幻灯片
  useEffect(() => {
    if (!containerRef.current || !slides || slides.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const slideIndex = parseInt(entry.target.getAttribute('data-slide-index') || '0');
            updateVisibleRange(slideIndex);
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: '300px', // 提前300px开始渲染
        threshold: 0.1,
      },
    );

    observerRef.current = observer;

    const slideElements = containerRef.current.querySelectorAll('[data-slide-index]');
    slideElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [slides, updateVisibleRange]);

  // 滚动监听优化
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !slides || slides.length === 0) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 2;

      let closestSlideIndex = 0;
      let minDistance = Infinity;

      for (let index = 0; index < slides.length; index++) {
        const slideElement = container.querySelector(`[data-slide-index="${index}"]`);
        if (slideElement) {
          const slideRect = slideElement.getBoundingClientRect();
          const slideCenter = slideRect.top + slideRect.height / 2;
          const distance = Math.abs(slideCenter - containerCenter);

          if (distance < minDistance) {
            minDistance = distance;
            closestSlideIndex = index;
          }
        }
      }

      updateVisibleRange(closestSlideIndex);
    };

    let timeoutId: NodeJS.Timeout;
    const debouncedHandleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 100);
    };

    container.addEventListener('scroll', debouncedHandleScroll);
    handleScroll(); // 初始检查

    return () => {
      container.removeEventListener('scroll', debouncedHandleScroll);
      clearTimeout(timeoutId);
    };
  }, [slides, updateVisibleRange]);

  // 渲染背景
  const renderBackground = (background: SlideBackground) => {
    const backgroundStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    };

    switch (background.type) {
      case 'solid':
        return <div style={{ ...backgroundStyle, backgroundColor: background.color || '#fff' }} />;

      case 'image':
        return (
          <div
            style={{
              ...backgroundStyle,
              backgroundImage: `url(${background.image?.src})`,
              backgroundSize: background.image?.size || 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        );

      case 'gradient': {
        const gradient = background.gradient;
        if (!gradient) return null;

        const colors = gradient.colors.map((c) => `${c.color} ${c.pos}%`).join(', ');
        const gradientString =
          gradient.type === 'linear'
            ? `linear-gradient(${gradient.rotate}deg, ${colors})`
            : `radial-gradient(${colors})`;

        return <div style={{ ...backgroundStyle, background: gradientString }} />;
      }

      default:
        return null;
    }
  };

  // 渲染单个元素
  const renderElement = (element: BaseElement, index: number) => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: element.left * slideScale,
      top: element.top * slideScale,
      width: element.width * slideScale,
      height: element.height * slideScale,
      overflow: 'hidden',
      transform: element.rotate ? `rotate(${element.rotate}deg)` : undefined,
      transformOrigin: 'center',
      zIndex: index + 1,
    };

    switch (element.type) {
      case 'text': {
        const textEl = element as PPTTextElement;
        const textStyle: React.CSSProperties = {
          fontSize: textEl.fontSize ? `${textEl.fontSize}px` : '14px',
          fontFamily: textEl.defaultFontName,
          color: textEl.defaultColor,
          fontWeight: textEl.fontWeight || 'normal',
          fontStyle: textEl.fontStyle || 'normal',
          textDecoration: textEl.textDecoration || 'none',
          textAlign: textEl.textAlign || 'left',
          lineHeight: textEl.lineHeight,
          writingMode: textEl.vertical ? 'vertical-rl' : 'horizontal-tb',
          backgroundColor: textEl.fill || 'transparent',
          opacity: textEl.opacity,
          border: textEl.outline
            ? `${textEl.outline.width}px ${textEl.outline.style} ${textEl.outline.color}`
            : 'none',
          boxShadow: textEl.shadow
            ? `${textEl.shadow.h}px ${textEl.shadow.v}px ${textEl.shadow.blur}px ${textEl.shadow.color}`
            : undefined,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        };

        return (
          <div
            key={element.id}
            style={{ ...baseStyle, ...textStyle }}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for PPT HTML content
            dangerouslySetInnerHTML={{ __html: textEl.content }}
          />
        );
      }

      case 'image': {
        const imageEl = element as PPTImageElement;
        const flipTransform = `scaleX(${imageEl.flipH ? -1 : 1}) scaleY(${imageEl.flipV ? -1 : 1})`;

        return (
          <div key={element.id} style={baseStyle}>
            <img
              alt={imageEl.alt || 'PPT Image'}
              src={imageEl.src}
              style={{
                width: '100%',
                height: '100%',
                objectFit: imageEl.objectFit,
                transform: flipTransform,
                borderRadius: imageEl.radius,
                boxShadow: imageEl.shadow
                  ? `${imageEl.shadow.h}px ${imageEl.shadow.v}px ${imageEl.shadow.blur}px ${imageEl.shadow.color}`
                  : undefined,
              }}
            />
          </div>
        );
      }

      case 'shape': {
        const shapeEl = element as PPTShapeElement;
        const flipTransform = `scaleX(${shapeEl.flipH ? -1 : 1}) scaleY(${shapeEl.flipV ? -1 : 1})`;

        // 处理渐变填充
        let fill = shapeEl.fill;
        if (shapeEl.gradient) {
          fill = `url(#gradient-${element.id})`;
        } else if (shapeEl.pattern) {
          fill = `url(#pattern-${element.id})`;
        }

        return (
          <div
            key={element.id}
            style={{ ...baseStyle, overflow: shapeEl.text ? 'visible' : 'hidden' }}
          >
            <svg
              height={shapeEl.height}
              style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
              viewBox={`0 0 ${shapeEl.viewBox[0]} ${shapeEl.viewBox[1]}`}
              width={shapeEl.width}
            >
              <defs>
                {shapeEl.gradient && (
                  <linearGradient
                    gradientTransform={`rotate(${shapeEl.gradient.rotate})`}
                    id={`gradient-${element.id}`}
                  >
                    {/* biome-ignore lint/suspicious/noArrayIndexKey: Color gradients are static */}
                    {shapeEl.gradient.colors.map((c, i) => (
                      <stop key={i} offset={`${c.pos}%`} stopColor={c.color} />
                    ))}
                  </linearGradient>
                )}
                {shapeEl.pattern && (
                  <pattern
                    height="100%"
                    id={`pattern-${element.id}`}
                    patternUnits="objectBoundingBox"
                    width="100%"
                  >
                    <image height="100%" href={shapeEl.pattern} width="100%" />
                  </pattern>
                )}
              </defs>
              <path
                d={shapeEl.path}
                fill={fill}
                stroke={shapeEl.outline?.color}
                strokeDasharray={shapeEl.outline?.style === 'dashed' ? '5,5' : undefined}
                strokeWidth={shapeEl.outline?.width}
                style={{ transform: flipTransform }}
              />
            </svg>

            {shapeEl.text && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems:
                    shapeEl.text.align === 'top'
                      ? 'flex-start'
                      : shapeEl.text.align === 'bottom'
                        ? 'flex-end'
                        : 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  color: shapeEl.text.defaultColor,
                  fontFamily: shapeEl.text.defaultFontName,
                  textAlign: 'center',
                  wordBreak: 'break-word',
                }}
                // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for PPT shape text content
                dangerouslySetInnerHTML={{ __html: shapeEl.text.content }}
              />
            )}
          </div>
        );
      }

      case 'table': {
        const tableEl = element as PPTTableElement;
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              border: `${tableEl.outline.width}px ${tableEl.outline.style} ${tableEl.outline.color}`,
            }}
          >
            <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {/* biome-ignore lint/suspicious/noArrayIndexKey: Table rows maintain order */}
                {tableEl.data.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`}>
                    {row.map((cell) => (
                      <td
                        colSpan={cell.colspan}
                        key={cell.id}
                        rowSpan={cell.rowspan}
                        style={{
                          width: `${(tableEl.colWidths[0] || 0) * 100}%`,
                          minHeight: `${tableEl.cellMinHeight}px`,
                          border: '1px solid #ddd',
                          padding: '8px',
                          textAlign: cell.style.align,
                          fontSize: cell.style.fontsize,
                          fontWeight: cell.style.bold ? 'bold' : 'normal',
                          backgroundColor: cell.style.backcolor,
                          color: cell.style.color,
                          verticalAlign: 'middle',
                        }}
                      >
                        {cell.text}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'chart': {
        const chartEl = element as PPTChartElement;
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div>Chart: {chartEl.chartType}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {chartEl.data.legends.join(', ')}
              </div>
              <small style={{ color: '#999' }}>
                Use a charting library like Chart.js or Recharts to render
              </small>
            </div>
          </div>
        );
      }

      case 'video': {
        const videoEl = element as PPTVideoElement;
        return (
          <video
            controls
            key={element.id}
            poster={videoEl.poster}
            src={videoEl.src}
            style={baseStyle}
          />
        );
      }

      case 'audio': {
        const audioEl = element as PPTAudioElement;
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <audio controls src={audioEl.src} style={{ maxWidth: '100%' }} />
          </div>
        );
      }

      case 'line': {
        const lineEl = element as PPTLineElement;
        return (
          <svg height={lineEl.height} key={element.id} style={baseStyle} width={lineEl.width}>
            <line
              stroke={lineEl.color}
              strokeDasharray={
                lineEl.style === 'dashed' ? '5,5' : lineEl.style === 'dotted' ? '2,2' : undefined
              }
              strokeWidth={lineEl.strokeWidth}
              x1={lineEl.start[0]}
              x2={lineEl.end[0]}
              y1={lineEl.start[1]}
              y2={lineEl.end[1]}
            />
          </svg>
        );
      }

      default:
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: '#f0f0f0',
              border: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
            }}
          >
            {element.type} Element
          </div>
        );
    }
  };

  // 渲染幻灯片
  const renderSlide = (slide: Slide, index: number) => {
    const targetSlideHeight = (containerWidth * 9) / 16;

    const slideStyle: React.CSSProperties = {
      position: 'relative',
      width: `${containerWidth * slideScale}px`,
      height: `${targetSlideHeight * slideScale}px`,
      overflow: 'hidden',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      margin: '0 auto',
    };

    return (
      <div key={slide.id} style={slideStyle}>
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            fontSize: '12px',
            color: '#666',
            zIndex: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
        >
          Slide {index + 1}
        </div>
        {renderBackground(slide.background)}
        {slide.elements.map((element, idx) => renderElement(element, idx))}
      </div>
    );
  };

  // 渲染加载状态
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
        }}
      >
        <div>Loading presentation...</div>
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
        }}
      >
        <div style={{ color: 'red' }}>Failed to load presentation</div>
      </div>
    );
  }

  // 渲染幻灯片列表（带虚拟滚动）
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '16px',
            backgroundColor: '#f5f5f5',
          }}
        >
          {slides?.map((slide, index) => {
            const isVisible = index >= visibleRange.start && index < visibleRange.end;
            const slideHeight = Math.round(containerWidth * 0.5625) + 40;

            if (isVisible) {
              return (
                <div data-slide-index={index} key={slide.id}>
                  {renderSlide(slide, index)}
                </div>
              );
            } else {
              // 占位符保持滚动位置
              return (
                <div
                  data-slide-index={index}
                  key={`placeholder-${slide.id}`}
                  style={{
                    height: slideHeight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e0e0e0',
                    backgroundColor: '#fafafa',
                    color: '#999',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 500 }}>Slide {index + 1}</div>
                    <div style={{ fontSize: '12px' }}>Scroll to load...</div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}
