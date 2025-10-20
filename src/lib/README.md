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

### Global operations

All operations are performed in place.

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

Change origin:
```typescript
import { changePathOrigin } from 'svg-path-editor-lib';
changePathOrigin(parsedPath, indexOfNewOrigin);
```

Advanced optimizations:
```typescript
import { optimizePath } from 'svg-path-editor-lib';
optimizePath(parsedPath, {
  removeUselessCommands,         // default `false`
  useShorthands,                 // default `false`
  useHorizontalAndVerticalLines, // default `false`
  useRelativeAbsolute,           // default `false`
  useReverse,                    // default `false`
  removeOrphanDots,              // default `false`, may be destructive for stroked paths
  useClosePath,                  // default `false`, may be destructive for stroked paths
});
```


### Local operations

Use `parsedPath.path` to get an array of all path items.
```typescript
const item = parsedPath.path[0];
```

Insert after:
```typescript
// Insert a the end:
parsedPath.insert(SvgItem.Make(['M', '1', '1']));
// Insert after `item`:
parsedPath.insert(SvgItem.Make(['M', '1', '1']), item);
```

Modify item:
```typescript
item.values[index] = val;
parsedPath.refreshAbsolutePositions();
```

Convert to relative:
```typescript
item.setRelative(true);
```

Convert to absolute:
```typescript
item.setRelative(false);
```

Convert to another type:
```typescript
parsedPath.changeType(item, 'L');
```

Remove item:
```typescript
parsedPath.delete(item);
```