import { SvgPath } from './svg';
import { optimizePath } from './optimize-path';

const f = (x: string) => x.replace(/[ \n]+/g, ' ');

const uselessMovesSection = 'M 1 1 M 2 1 L 3 2 L 4 2 L 4 0 M 6 0 Z L 7 1 L 5 2 Z M 6 0 L 9 1';
const nonSimplifiable = 'M 7 1 L 9 2 L 7 4 Z';
const uselessDrawsSection = 'Z Z M 7 4 L 7 4 L 4 5';
const curveSection = 'C 3 6 5 6 4 7 C 3 8 3 7 2 8 C 0 9 3 10 2 10 C 0 10 1 11 0 12';
const bezierSection = 'Q -1 13 2 14 Q 5 15 2 17 Q 4 17 4 19 Z';

const testSvg = `${uselessMovesSection}
  ${nonSimplifiable}
  ${uselessDrawsSection}
  ${curveSection}
  ${bezierSection}`;

const allOptimizations =  {
  useReverse: true,
  removeUselessComponents: true,
  useHorizontalAndVerticalLines: true,
  useRelativeAbsolute: true,
  useShorthands: true
};

describe('optimizePath', () => {
  it('should handle relative components', () => {
    const svg = new SvgPath(`M 3 2 m 1 0 m 0 1 m 0 1 l 1 1`);
    optimizePath(svg, {
      removeUselessComponents: true
    });
    expect(svg.asString()).toBe('M 4 4 l 1 1');
  });

  it('should handle pathologic paths', () => {
    const svg = new SvgPath('M 4 19 L 2 1 M 1 1');
    optimizePath(svg, allOptimizations);
    expect(svg.asString()).toBe('M 4 19 L 2 1');
    const empty = new SvgPath('');
    optimizePath(empty, allOptimizations);
    expect(empty.asString()).toBe('');
  });

  it('should remove useless components', () => {
    const svg = new SvgPath(testSvg);
    optimizePath(svg, {
      removeUselessComponents: true
    });
    expect(svg.asString()).toBe(f(`M 2 1 L 3 2 L 4 2 L 4 0 M 6 0 Z L 7 1 L 5 2 Z L 9 1
      ${nonSimplifiable}
      M 7 4 L 4 5
      ${curveSection}
      ${bezierSection}`));
  });

  it('should use shorthands', () => {
    const svg = new SvgPath(testSvg);
    optimizePath(svg, {
      useShorthands: true
    });
    expect(svg.asString()).toBe(f(`${uselessMovesSection}
    ${nonSimplifiable}
    ${uselessDrawsSection}
    C 3 6 5 6 4 7 S 3 7 2 8 C 0 9 3 10 2 10 C 0 10 1 11 0 12
    Q -1 13 2 14 T 2 17 Q 4 17 4 19 Z`));
  });

  it('should use horizontal and vertical lines', () => {
    const svg = new SvgPath(testSvg);
    optimizePath(svg, {
      useHorizontalAndVerticalLines: true
    });
    expect(svg.asString()).toBe(f(`M 1 1 M 2 1 L 3 2 H 4 V 0 M 6 0 Z L 7 1 L 5 2 Z M 6 0 L 9 1
      ${nonSimplifiable}
      Z Z M 7 4 V 4 L 4 5
      ${curveSection}
      ${bezierSection}`));
  });

  it('should use relative and absolute', () => {
    const svg = new SvgPath(testSvg);
    optimizePath(svg, {
      useRelativeAbsolute: true
    });
    expect(svg.asString()).toBe(f(`${uselessMovesSection}
      ${nonSimplifiable}
      ${uselessDrawsSection}
      C 3 6 5 6 4 7 C 3 8 3 7 2 8 c -2 1 1 2 0 2 c -2 0 -1 1 -2 2
      q -1 1 2 2 q 3 1 0 3 q 2 0 2 2 Z`));
  });

  it('should use reverse', () => {
    const svg = new SvgPath(testSvg);
    optimizePath(svg, {
      useReverse: true,
    });
    expect(svg.asString()).toBe(f(`M 4 19 Q 4 17 2 17 Q 5 15 2 14 T 0 12
      C 1 11 0 10 2 10 C 3 10 0 9 2 8 C 3 7 3 8 4 7 S 3 6 4 5 L 7 4 Z
      M 7 1 Z
      M 7 4 L 9 2 L 7 1 Z M 9 1 L 6 0 M 5 2 L 7 1 L 6 0 Z
      M 6 0 Z
      M 4 0 L 4 2 L 3 2 L 2 1`));
  });

  it('should all options together', () => {
    const svg = new SvgPath(testSvg);
    optimizePath(svg, allOptimizations);
    expect(svg.asString()).toBe(f(`M 2 1 L 3 2 H 4 V 0 M 6 0 Z L 7 1 L 5 2 Z L 9 1
      ${nonSimplifiable}
      M 7 4 L 4 5
      C 3 6 5 6 4 7 S 3 7 2 8 c -2 1 1 2 0 2 c -2 0 -1 1 -2 2
      q -1 1 2 2 t 0 3 q 2 0 2 2 Z`));
  });
});
