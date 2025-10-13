# Examples

This directory contains reference implementations for rendering PPTX presentations using `@43x/pptx-parser`.

## 📁 Available Examples

### React

- **PPTViewer.example.tsx** - Complete React component showing how to render all element types

## 🚀 How to Use

### Copy the Example

1. Copy the example file to your project
2. Install the package: `npm install @43x/pptx-parser`
3. Import and use the component

### Basic Usage

```tsx
import PPTViewer from './PPTViewer.example';

function App() {
  return (
    <PPTViewer 
      url="https://example.com/presentation.pptx"
      onError={() => console.error('Failed to load')}
    />
  );
}
```

## 🎨 Customization Tips

### Styling

Add your own CSS classes or styled-components:

```tsx
const StyledSlide = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;
```

### Chart Rendering

For better chart rendering, integrate a charting library:

```tsx
import { Chart } from 'chart.js';

case 'chart': {
  const chartEl = element as PPTChartElement;
  return <ChartComponent data={chartEl.data} type={chartEl.chartType} />;
}
```

### Virtual Scrolling

For large presentations, use react-window or similar:

```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={slides.length}
  itemSize={500}
>
  {({ index, style }) => (
    <div style={style}>
      {renderSlide(slides[index])}
    </div>
  )}
</FixedSizeList>
```

## 📚 Next Steps

1. Review the example implementation
2. Adapt the rendering logic to your needs
3. Add animations and transitions
4. Implement navigation controls
5. Add presentation mode features

## 🤝 Contributing

Feel free to submit your own examples for other frameworks (Vue, Angular, Svelte, etc.)!

