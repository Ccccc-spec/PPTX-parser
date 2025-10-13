# pptx-json-parser

> Parse PPTX files to structured JSON data for rendering in any framework

A framework-agnostic PPTX parser that converts PowerPoint presentations into structured JSON data. Perfect for building custom presentation viewers in React, Vue, Angular, or vanilla JavaScript.

## Features

-  **Framework Agnostic** - Works with any JavaScript framework or vanilla JS
-  **Zero UI Dependencies** - Only parsing logic, no rendering code
-  **Full TypeScript Support** - Complete type definitions included
-  **Comprehensive Element Support** - Text, images, shapes, tables, charts, audio, video
-  **Automatic Scaling** - Responsive slide sizing
-  **Customizable** - Full control over rendering implementation

## Installation

```bash
npm install pptx-json-parser
```

Or using pnpm:

```bash
pnpm add pptx-json-parser
```

## Quick Start

```typescript
import { parsePPTXToSlides } from 'pptx-json-parser';

// Fetch PPTX file
const response = await fetch('presentation.pptx');
const arrayBuffer = await response.arrayBuffer();

// Parse to structured data
const slides = await parsePPTXToSlides(arrayBuffer, {
  containerWidth: 800, // Optional: target width (default: 800)
  themeColors: ['#1890ff', '#52c41a'], // Optional: custom theme colors
});

console.log(slides);
// Output: Array of Slide objects with structured element data
```

## Data Structure

### Slide Object

```typescript
interface Slide {
  id: string;
  elements: BaseElement[];
  background: SlideBackground;
  remark: string;
}
```

### Supported Element Types

- **Text** (`PPTTextElement`) - Rich text with formatting
- **Image** (`PPTImageElement`) - Images with clipping and effects
- **Shape** (`PPTShapeElement`) - Vector shapes with fills and gradients
- **Table** (`PPTTableElement`) - Tables with cell styling
- **Chart** (`PPTChartElement`) - Charts (bar, line, pie, etc.)
- **Video** (`PPTVideoElement`) - Video elements
- **Audio** (`PPTAudioElement`) - Audio elements
- **Line** (`PPTLineElement`) - Lines and connectors

## Rendering Examples

### React Example

```tsx
import { parsePPTXToSlides, Slide, BaseElement } from 'pptx-json-parser';
import { useEffect, useState } from 'react';

function PPTViewer({ url }: { url: string }) {
  const [slides, setSlides] = useState<Slide[]>([]);

  useEffect(() => {
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((buffer) => parsePPTXToSlides(buffer))
      .then(setSlides);
  }, [url]);

  const renderBackground = (background: Slide['background']) => {
    if (background.type === 'solid') {
      return { backgroundColor: background.color };
    } else if (background.type === 'image') {
      return {
        backgroundImage: `url(${background.image?.src})`,
        backgroundSize: background.image?.size || 'cover',
      };
    } else if (background.type === 'gradient') {
      const { gradient } = background;
      const colors = gradient?.colors.map((c) => `${c.color} ${c.pos}%`).join(', ');
      return {
        background:
          gradient?.type === 'linear'
            ? `linear-gradient(${gradient.rotate}deg, ${colors})`
            : `radial-gradient(${colors})`,
      };
    }
  };

  const renderElement = (element: BaseElement) => {
    const baseStyle = {
      position: 'absolute',
      left: element.left,
      top: element.top,
      width: element.width,
      height: element.height,
      transform: element.rotate ? `rotate(${element.rotate}deg)` : undefined,
    };

    switch (element.type) {
      case 'text':
        const textEl = element as PPTTextElement;
        return (
          <div
            style={baseStyle}
            dangerouslySetInnerHTML={{ __html: textEl.content }}
          />
        );

      case 'image':
        const imageEl = element as PPTImageElement;
        return (
          <img
            src={imageEl.src}
            style={{
              ...baseStyle,
              objectFit: imageEl.objectFit,
            }}
            alt={imageEl.alt}
          />
        );

      // Add more element types as needed...
      default:
        return null;
    }
  };

  return (
    <div className="ppt-container">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className="slide"
          style={{
            position: 'relative',
            width: 800,
            height: 450,
            ...renderBackground(slide.background),
          }}
        >
          <div className="slide-number">Slide {index + 1}</div>
          {slide.elements.map((element) => (
            <div key={element.id}>{renderElement(element)}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### Vue Example

```vue
<template>
  <div class="ppt-container">
    <div
      v-for="(slide, index) in slides"
      :key="slide.id"
      class="slide"
      :style="getBackgroundStyle(slide.background)"
    >
      <div class="slide-number">Slide {{ index + 1 }}</div>
      <component
        v-for="element in slide.elements"
        :key="element.id"
        :is="getElementComponent(element.type)"
        :element="element"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { parsePPTXToSlides, type Slide } from 'pptx-json-parser';

const props = defineProps<{ url: string }>();
const slides = ref<Slide[]>([]);

onMounted(async () => {
  const response = await fetch(props.url);
  const buffer = await response.arrayBuffer();
  slides.value = await parsePPTXToSlides(buffer);
});

const getBackgroundStyle = (background: Slide['background']) => {
  // Implementation similar to React example
};
</script>
```

### Vanilla JavaScript Example

```javascript
import { parsePPTXToSlides } from 'pptx-json-parser';

async function loadPresentation(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const slides = await parsePPTXToSlides(buffer);

  const container = document.getElementById('ppt-container');

  slides.forEach((slide, index) => {
    const slideEl = document.createElement('div');
    slideEl.className = 'slide';
    slideEl.style.position = 'relative';
    slideEl.style.width = '800px';
    slideEl.style.height = '450px';

    // Render background
    if (slide.background.type === 'solid') {
      slideEl.style.backgroundColor = slide.background.color;
    }

    // Render elements
    slide.elements.forEach((element) => {
      const elementEl = document.createElement('div');
      elementEl.style.position = 'absolute';
      elementEl.style.left = element.left + 'px';
      elementEl.style.top = element.top + 'px';
      elementEl.style.width = element.width + 'px';
      elementEl.style.height = element.height + 'px';

      if (element.type === 'text') {
        elementEl.innerHTML = element.content;
      } else if (element.type === 'image') {
        const img = document.createElement('img');
        img.src = element.src;
        elementEl.appendChild(img);
      }

      slideEl.appendChild(elementEl);
    });

    container.appendChild(slideEl);
  });
}

loadPresentation('presentation.pptx');
```

## API Reference

### `parsePPTXToSlides(arrayBuffer, options?)`

Parses a PPTX file ArrayBuffer into structured slide data.

**Parameters:**

- `arrayBuffer` (ArrayBuffer): The PPTX file data
- `options` (ParseOptions, optional):
  - `containerWidth` (number): Target slide width (default: 800)
  - `themeColors` (string[]): Custom theme colors

**Returns:** `Promise<Slide[]>`

### Type Exports

```typescript
import type {
  Slide,
  BaseElement,
  PPTTextElement,
  PPTImageElement,
  PPTShapeElement,
  PPTTableElement,
  PPTChartElement,
  // ... and many more
} from 'pptx-json-parser';
```

### Utility Functions

```typescript
import {
  generateId,
  convertFontSizePtToPx,
  getSvgPathRange,
  calculateRotatedPosition,
  flipGroupElements,
} from 'pptx-json-parser';
```

## 🔧 Advanced Usage

### Custom Theme Colors

```typescript
const slides = await parsePPTXToSlides(arrayBuffer, {
  themeColors: [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
  ],
});
```

### Responsive Sizing

```typescript
const containerWidth = window.innerWidth;
const slides = await parsePPTXToSlides(arrayBuffer, { containerWidth });
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Related Projects

- [pptxtojson](https://www.npmjs.com/package/pptxtojson) - The underlying PPTX parser

## FAQ

### Why framework-agnostic?

By separating parsing from rendering, you can:

- Use any UI framework you prefer
- Customize rendering to your exact needs
- Keep the package lightweight
- Avoid framework version conflicts

### How do I handle large presentations?

Implement virtual scrolling/pagination in your renderer to only render visible slides.

### Can I use this server-side?

Yes! The parser works in Node.js environments. Just note that some features like table parsing may require DOM APIs (you can use jsdom).

## Acknowledgments

Built with using [pptxtojson](https://www.npmjs.com/package/pptxtojson)

