import { Point, SvgPath, SvgItem } from "./svg";
import { optimizePath } from "./optimize-path";

const toStr = (pt: Point) => {
  return [String(pt.x), String(pt.y)];
};

export const reversePath = (svg: SvgPath)=> {
  if(svg.path.length <= 1) {
    return;
  }

  const outputPath: SvgItem[] = [];
  const reversedPath = [...svg.path].reverse().slice(0, -1);

  const startPoint = reversedPath[0].targetLocation();
  outputPath.push(SvgItem.Make(['M', ...toStr(startPoint)]));
  let previousType = '';
  let isClosed = false;

  for(const component of reversedPath) {
    const pt = toStr(component.previousPoint);
    const ctrl = component.absolutePoints.map(toStr);
    const type = component.getType(true);
    switch(type) {
      case 'M' :
      case 'Z' :
        if(isClosed) {
          outputPath.push(SvgItem.Make(['Z']));
        }
        isClosed = type === 'Z';
        if(outputPath[outputPath.length - 1].getType(true) === 'M') {
          outputPath[outputPath.length - 1] = SvgItem.Make(['M',  ...pt]);
        } else {
          outputPath.push(SvgItem.Make(['M',  ...pt]));
        }
        break;
      case 'L' :
        outputPath.push(SvgItem.Make(['L', ...pt]));
        break;
      case 'H' :
        outputPath.push(SvgItem.Make(['H', pt[0]]));
        break;
      case 'V' :
        outputPath.push(SvgItem.Make(['V', pt[1]]));
        break;
      case 'C' :
        outputPath.push(SvgItem.Make(['C', ...ctrl[1], ...ctrl[0], ...pt]));
        break;
      case 'S' : {
        const a = toStr(component.controlLocations()[0]);
        if(previousType !== 'S') {
          outputPath.push(SvgItem.Make(['C', ...ctrl[0], ...a, ...pt])); 
        } else {
          outputPath.push(SvgItem.Make(['S', ...a, ...pt]));
        }
        break;
      }
      case 'Q' :
        outputPath.push(SvgItem.Make(['Q', ...ctrl[0], ...pt]));
        break;
      case 'T' : {
        if(previousType !== 'T') {
          const a = toStr(component.controlLocations()[0]);
          outputPath.push(SvgItem.Make(['Q', ...a, ...pt]));
        } else {
          outputPath.push(SvgItem.Make(['T', ...pt]));
        }
        break;
      }
      case 'A' :
        outputPath.push(SvgItem.Make(['A', ...(component.values.slice(0, 4).map(String)), String(1-component.values[4]) , ...pt]));
        break;
    }
    previousType = type;
  }
  if(isClosed) {
    outputPath.push(SvgItem.Make(['Z']));
  }
  svg.path = outputPath;
  svg.refreshAbsolutePositions();

  optimizePath(svg, {
    removeUselessComponents: true,
    useShorthands: true
  });
};