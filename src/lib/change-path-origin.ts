import { SvgPath, SvgItem } from "./svg";
import { optimizePath } from "./optimize-path";
import { getSubPathBounds } from "./get-sub-path-bounds";
import type { SvgCommandTypeAny } from "./svg-command-types";

export const changePathOrigin = (svg: SvgPath, newOriginIndex: number, subpath?: boolean)=> {
  if(svg.path.length <= newOriginIndex || newOriginIndex === 0) {
    return;
  }

  const {start, end} = getSubPathBounds(svg, subpath ? newOriginIndex : undefined);
  const l = end - start;

  const isBeforeRelative = end < svg.path.length && svg.path[end].relative;
  if(isBeforeRelative) {
    svg.path[end].setRelative(false);
  }
  
  const newFirstItem = svg.path[newOriginIndex];
  const newLastItem = svg.path[newOriginIndex - 1];
  const firstItemType = newFirstItem.getType().toUpperCase();
  // Shorthands must be converted to be used as origin
  if (firstItemType === 'S') {
    svg.changeType(newFirstItem, (newFirstItem.relative ? 'c' : 'C') as SvgCommandTypeAny);
  } else if (firstItemType === 'T') {
    svg.changeType(newFirstItem, (newFirstItem.relative ? 'q' : 'Q') as SvgCommandTypeAny);
  }
  for(let i=newOriginIndex ; i<end ; ++i) {
    // Z that comes after new origin must be converted to L, up to the first M
    const item = svg.path[i]; 
    const type = item.getType().toUpperCase();
    if(type === 'Z') {
      svg.changeType(item, 'L');
    }
    if(type === 'M') {
      break;
    }
  }

  const outputPath: SvgItem[] = [];
  const subPath = svg.path.slice(start, end);
  const firstItem = subPath[0];
  const lastItem = subPath[l-1];

  for(let i=0 ; i<l ; ++i) {
    if(i===0) {
      const newOrigin = newLastItem.targetLocation();
      outputPath.push(SvgItem.Make(['M', String(newOrigin.x), String(newOrigin.y)]));
    }
    if(newOriginIndex+i===start + l) {
      // We may be able to remove the initial M if last item has the same target
      const tg1 = firstItem.targetLocation();
      const tg2 = lastItem.targetLocation();
      if(tg1.x === tg2.x && tg1.y === tg2.y) {
        const followingM = subPath.findIndex((i, idx) => idx > 0 && i.getType().toUpperCase() === 'M');
        const firstZ = subPath.findIndex(i => i.getType().toUpperCase() === 'Z');
        if(firstZ === -1 || (followingM !== -1 && firstZ > followingM)) {
          // We can remove inital M if there is no Z in the following subpath
          continue;
        }
      }
    }
    outputPath.push(subPath[(newOriginIndex - start + i)%l]);

  }

  svg.path = [
    ...svg.path.slice(0, start),
    ...outputPath,
    ...svg.path.slice(end),
  ];
  svg.refreshAbsolutePositions();
  if(isBeforeRelative) {
    svg.path[start + outputPath.length].setRelative(true);
  }
  optimizePath(svg, {
    removeUselessCommands: true,
    useShorthands: true,
    useClosePath: true,
  });
};