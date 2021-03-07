import { Svg } from './svg';


const swordPath = `M 4 8 L 10 1 L 13 0 L 12 3 L 5 9 C 6 10 6 11 7 10 C 7 11 8 12 7 12 A 1.42 1.42 0 0 1 6 13 `
+ `A 5 5 0 0 0 4 10 Q 3.5 9.9 3.5 10.5 T 2 11.8 T 1.2 11 T 2.5 9.5 T 3 9 A 5 5 90 0 0 0 7 A 1.42 1.42 0 0 1 1 6 `
+ `C 1 5 2 6 3 6 C 2 7 3 7 4 8 M 10 1 L 10 3 L 12 3 L 10.2 2.8 L 10 1`;

const minifiedSwordPath = `M4 8 10 1 13 0 12 3 5 9C6 10 6 11 7 10C7 11 8 12 7 12A1.42 1.42 0 016 13A5 5 0 004 10`
+ `Q3.5 9.9 3.5 10.5T2 11.8T1.2 11T2.5 9.5T3 9A5 5 90 000 7A1.42 1.42 0 011 6C1 5 2 6 3 6C2 7 3 7 4 8M10 1 10 3`
+ ` 12 3 10.2 2.8 10 1`;

it('should decode and rencode the sword path', () => {
  const svg = new Svg(swordPath);
  expect(svg.asString()).toEqual(swordPath);
});

it('should minify the sword path', () => {
  const svg = new Svg(swordPath);
  expect(svg.asString(3, true)).toEqual(minifiedSwordPath);
});

it('should merge lines', () => {
  expect(new Svg(`m 0 0 l 1 1 l 1 2`).asString(3, true)).toEqual(`m0 0 1 1 1 2`);
  expect(new Svg(`M 0 0 L 1 1 L 1 2`).asString(3, true)).toEqual(`M0 0 1 1 1 2`);
  expect(new Svg(`m 0 0 L 1 1 l 1 2 l 3 3`).asString(3, true)).toEqual(`m0 0L1 1l1 2 3 3`);
  expect(new Svg(`M 0 0 l 1 1 L 1 2 L 3 3`).asString(3, true)).toEqual(`M0 0l1 1L1 2 3 3`);
  expect(new Svg(`m 0.1 0.2 l 0.6 0.5 l 0.3 0.4`).asString(3, true)).toEqual(`m.1.2.6.5.3.4`);
});