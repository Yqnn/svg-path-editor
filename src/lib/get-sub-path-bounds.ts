import { SvgPath } from "./svg";

const findPreviousMoveTo = (svg: SvgPath, index: number) => {
  let i = index;
  while (i > 0 && svg.path[i].getType(true) !== 'M') {
    i--;
  }
  return i;
};
const findNextMoveTo = (svg: SvgPath, index: number) => {
  let i = index + 1;
  while (i < svg.path.length && svg.path[i].getType(true) !== 'M') {
    i++;
  }
  return i;
};
export const getSubPathBounds = (svg: SvgPath, index?: number) => {
  const start = index === undefined ? 0 : findPreviousMoveTo(svg, index);
  const end = index === undefined ? svg.path.length : findNextMoveTo(svg, index);
  return { start, end };
};
