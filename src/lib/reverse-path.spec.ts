import { reversePath } from './reverse-path';
import { SvgPath } from './svg';

const f = (x: string) => x.replace(/[ \n]+/g, ' ');

describe('reversePath', () => {
  it('should reverse path with Z', () => {
    const svg = new SvgPath('M 5 2 L 9 2 L 9 6 Z L 1 7 L 4 9 Z L 6 9 L 8 7 Z');
    reversePath(svg); 
    expect(svg.asString()).toBe('M 8 7 L 6 9 L 5 2 Z M 4 9 L 1 7 L 5 2 Z M 9 6 L 9 2 L 5 2 Z');

  });

  it('should reverse complex path', () => {
    const svg = new SvgPath(`M 4 8 L 10 1 L 13 0 L 12 3 L 5 9 C 6 10 6 11 7 10 C 7 11 8 12 7 12
      A 1.42 1.42 0 0 1 6 13 A 5 5 0 0 0 4 10 Q 3.5 9.9 3.5 10.5 T 2 11.8 T 1.2 11 T 2.5 9.5
      T 3 9 A 5 5 90 0 0 0 7 A 1.42 1.42 0 0 1 1 6 C 1 5 2 6 3 6 C 2 7 3 7 4 8 M 10 1 L 10 3
      L 12 3 L 10.2 2.8 L 10 1 M 10 8 C 9 7 11 7 12 7 S 14 7 13 8 S 13 9 13 10 Z M 9 10
      L 10 10 L 10 11 M 11 11 L 12 11 L 12 12 L 10 12 Z M 14 3 C 14.3333 2.6667 14 2 15 2
      C 16 2 15.6667 2.6667 16 3`);
    reversePath(svg); 
    expect(svg.asString()).toBe(f(`M 16 3 C 15.6667 2.6667 16 2 15 2 S 14.3333 2.6667 14 3
      M 10 12 L 12 12 L 12 11 L 11 11 Z M 10 11 L 10 10 L 9 10 M 13 10 C 13 9 12 9 13 8
      S 13 7 12 7 S 9 7 10 8 Z M 10 1 L 10.2 2.8 L 12 3 L 10 3 L 10 1 M 4 8 C 3 7 2 7 3 6
      C 2 6 1 5 1 6 A 1.42 1.42 0 0 0 0 7 A 5 5 90 0 1 3 9 Q 3.1 9.5 2.5 9.5 T 1.2 11
      T 2 11.8 T 3.5 10.5 T 4 10 A 5 5 0 0 1 6 13 A 1.42 1.42 0 0 0 7 12 C 8 12 7 11 7 10
      C 6 11 6 10 5 9 L 12 3 L 13 0 L 10 1 L 4 8`));
  });

  it('should handle shorthands', () => {
    const svg = new SvgPath('M 2 2 C 3 1 5 1 6 2 S 7 5 6 6 C 6 7 3 9 2 6');
    reversePath(svg); 
    expect(svg.asString()).toBe('M 2 6 C 3 9 6 7 6 6 C 7 5 7 3 6 2 S 3 1 2 2');
  });
});