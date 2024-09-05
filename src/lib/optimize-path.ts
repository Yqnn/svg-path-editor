import { Point, SvgPath, SvgItem } from "./svg";
import { reversePath } from "./reverse-path";

const toStr = (pt: Point) => {
  return [String(pt.x), String(pt.y)];
};

const optimizeRelativeAbsolute = (svg: SvgPath) => {
  let length = svg.asString(4, true).length;
  const o = new Point(0,0);
  for(let i=0 ; i<svg.path.length; ++i) {
    const previous = i>0 ? svg.path[i-1] : null;
    const comp = svg.path[i];
    if(comp.getType(true) === 'Z') {
      continue;
    }
    comp.setRelative(!comp.relative);
    const newLength = svg.asString(4, true).length;
    if(newLength < length) {
      length = newLength;
      comp.refresh(o, previous);
    } else {
      comp.setRelative(!comp.relative);
    }
  }
}

export const optimizePath = (svg: SvgPath, {
  removeUselessComponents = false,
  removeOrphanDots = false,
  useShorthands = false,
  useHorizontalAndVerticalLines = false,
  useRelativeAbsolute = false,
  useReverse = false,

}: {
  removeUselessComponents?: boolean;
  removeOrphanDots? : boolean; // Can have an impact on stroked paths
  useShorthands?: boolean;
  useHorizontalAndVerticalLines?: boolean;
  useRelativeAbsolute?: boolean;
  useReverse?: boolean;
}) => {
  const path = svg.path;
  const o = new Point(0,0);
  for(let i=1 ; i<path.length ; ++i) {
    const c0 = path[i-1];
    const c1 = path[i];
    const c0type = c0.getType(true);
    const c1type = c1.getType(true);

    if(removeUselessComponents) {
      if(c0type === 'M' && c1type === 'M') {
        c1.setRelative(false);
        path.splice(i-1, 1);
        i--;
        continue;
      }
      if( c0type === 'Z' && c1type === 'Z') {
        path.splice(i, 1);
        i--;
        continue;
      }
      if(c0type === 'Z' && c1type === 'M') {
        const tg = c0.targetLocation();
        if(tg.x === c1.absolutePoints[0].x && tg.y === c1.absolutePoints[0].y) {
          path.splice(i, 1);
          i--;
          continue;
        }
      }
      if(c1type === 'L' || c1type === 'V' || c1type === 'H') {
        const tg = c1.targetLocation();
        if(tg.x === c1.previousPoint.x && tg.y === c1.previousPoint.y) {
          path.splice(i, 1);
          i--;
          continue;
        }
      }
    }
    if(removeOrphanDots) {
      if( c0type === 'M' && c1type === 'Z') {
        path.splice(i, 1);
        i--;
        continue;
      }
    }
    if(useHorizontalAndVerticalLines) {
      if(c1type === 'L') {
        const tg = c1.targetLocation();
        if(tg.x === c1.previousPoint.x) {
          path[i] = SvgItem.MakeFrom(c1, c0, 'V');
          continue;
        }
        if(tg.y === c1.previousPoint.y) {
          path[i] = SvgItem.MakeFrom(c1, c0, 'H');
          continue;
        }
      }
    }
    if(useShorthands) {
      if((c0type === 'Q' || c0type === 'T') && c1type === 'Q') {
        const pt = toStr(path[i].targetLocation());
        const candidate = SvgItem.Make(['T', ...pt]);
        candidate.refresh(o, c0);
        const ctrl = candidate.controlLocations();
        if(ctrl[0].x === c1.absolutePoints[0].x && ctrl[0].y === c1.absolutePoints[0].y) {
          path[i] = candidate;
        }
      }
      if((c0type === 'C' || c0type === 'S') && c1type === 'C') {
        const pt = toStr(path[i].targetLocation());
        const ctrl = toStr(path[i].absolutePoints[1]);
        const candidate = SvgItem.Make(['S', ...ctrl, ...pt]);
        candidate.refresh(o, c0);
        const ctrl2 = candidate.controlLocations();
        if(ctrl2[0].x === c1.absolutePoints[0].x && ctrl2[0].y === c1.absolutePoints[0].y) {
          path[i] = candidate;
        }
      }
      if((c0type !== 'C' && c0type !== 'S') && c1type === 'C') {
        if(c1.previousPoint.x === c1.absolutePoints[0].x && c1.previousPoint.y === c1.absolutePoints[0].y) {
          const pt = toStr(c1.targetLocation());
          const ctrl = toStr(c1.absolutePoints[1]);
          path[i] = SvgItem.Make(['S', ...ctrl, ...pt]);
          path[i].refresh(o, c0);
        }
      }

    }
  }

  if(removeUselessComponents || removeOrphanDots) {
    if(path.length>0 && path[path.length - 1].getType(true) === 'M') {
      path.splice(path.length - 1, 1);
    }

    // With removeUselessComponents, links to previous items may become dirty:
    svg.refreshAbsolutePositions();
  }

  if(useRelativeAbsolute) {
    optimizeRelativeAbsolute(svg);
  }

  if(useReverse) {
    const length = svg.asString(4, true).length;
    const nonReversed = svg.path;
    reversePath(svg);
    if(useRelativeAbsolute) {
      optimizeRelativeAbsolute(svg);
    }
    const afterLength = svg.asString(4, true).length;
    if(afterLength >= length) {
      svg.path = nonReversed;
    }
  }
}