# Svg-path-editor-lib

The library powering the [SvgPathEditor app](https://yqnn.github.io/svg-path-editor/).

## Usage


### Parse path

```typescript
import { SvgPath } from 'svg-path-editor-lib';

// Throw an error if path is invalid
const parsedPath = new SvgPath(path);
```

### Generate path

```typescript
parsedPath.asString(
    decimals,       // default `4`
    minifyOutput    // default `false`
)
```

### Operations

Scale:
```typescript
parsedPath.scale(x, y);
```

Translate:
```typescript
parsedPath.translate(x, y);
```

Rotate:
```typescript
parsedPath.rotate(x, y, angle);
```

Convert to relative:
```typescript
parsedPath.setRelative(true);
```

Convert to absolute:
```typescript
parsedPath.setRelative(false);
```

Reverse:
```typescript
import { reversePath } from 'svg-path-editor-lib';
reversePath(parsedPath);
```

Advanced optimizations:
```typescript
import { optimizePath } from 'svg-path-editor-lib';
optimizePath(parsedPath, {
  removeUselessComponents,       // default `false`
  useShorthands,                 // default `false`
  useHorizontalAndVerticalLines, // default `false`
  useRelativeAbsolute,           // default `false`
  useReverse,                    // default `false`
  removeOrphanDots ,             // default `false`, may be destructive
});
```