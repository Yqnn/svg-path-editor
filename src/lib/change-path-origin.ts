import { SvgPath, SvgItem } from "./svg";
import { optimizePath } from "./optimize-path";

export const changePathOrigin = (svg: SvgPath, newOriginIndex: number)=> {
  if(svg.path.length <= newOriginIndex || newOriginIndex === 0) {
    return;
  }

  const outputPath: SvgItem[] = [];
  const l = svg.path.length;
  const newFirstItem = svg.path[newOriginIndex];
  const newLastItem = svg.path[newOriginIndex - 1];
  const firstItem = svg.path[0];
  const lastItem = svg.path[l-1];
  switch(newFirstItem.getType().toUpperCase()) {
    // Shorthands must be converted to be used as origin
    case 'S': svg.changeType(newFirstItem, newFirstItem.relative ? 'c' : 'C'); break;
    case 'T': svg.changeType(newFirstItem, newFirstItem.relative ? 'q' : 'Q'); break;
  }
  for(let i=newOriginIndex ; i<l ; ++i) {
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

  for(let i=0 ; i<l ; ++i) {
    if(i===0) {
      const newOrigin = newLastItem.targetLocation();
      outputPath.push(SvgItem.Make(['M', String(newOrigin.x), String(newOrigin.y)]));
    }
    if(newOriginIndex+i===l) {
      // We may be able to remove the initial M if last item has the same target
      const tg1 = firstItem.targetLocation();
      const tg2 = lastItem.targetLocation();
      if(tg1.x === tg2.x && tg1.y === tg2.y) {
        const followingM = svg.path.findIndex((i, idx) => idx > 0 && i.getType().toUpperCase() === 'M');
        const firstZ = svg.path.findIndex(i => i.getType().toUpperCase() === 'Z');
        if(firstZ === -1 || (followingM !== -1 && firstZ > followingM)) {
          // We can remove inital M if there is no Z in the following subpath
          continue;
        }
      }
    }
    outputPath.push(svg.path[(newOriginIndex + i)%l]);

  }

  svg.path = outputPath;
  svg.refreshAbsolutePositions();
  optimizePath(svg, {
    removeUselessComponents: true,
    useShorthands: true
  });
};