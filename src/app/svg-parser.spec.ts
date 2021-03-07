import { SvgParser } from './svg-parser';

const parse = SvgParser.parse;

it('moveTo', () => {
  expect(() => parse('m 10')).toThrow();
  expect(parse('m 10 20')).toEqual([['m', '10', '20']]);
});

it('exponents', () => {
  expect(parse('m 1e3 2e-3')).toEqual([['m', '1e3', '2e-3']]);
});

it('no whitespace between negative sign', () => {
  expect(parse('M46-86')).toEqual([['M', '46', '-86']]);
});

it('overloaded moveTo', () => {
  expect(parse('m 12.5,52 39,0 0,-40 -39,0 z')).toEqual([
    ['m', '12.5', '52'],
    ['l', '39', '0'],
    ['l', '0', '-40'],
    ['l', '-39', '0'],
    ['z']
  ]);
});

it('curveTo', () => {
  const a = parse('c 50,0 50,100 100,100 50,0 50,-100 100,-100');
  const b = parse('c 50,0 50,100 100,100 c 50,0 50,-100 100,-100');
  expect(a).toEqual([
    ['c', '50', '0', '50', '100', '100', '100'],
    ['c', '50', '0', '50', '-100', '100', '-100']
  ]);
  expect(a).toEqual(b);
});

it('lineTo', () => {
  expect(() => { parse('l 10 10 0'); }).toThrowError(/malformed/);
  expect(parse('l 10,10')).toEqual([['l', '10', '10']]);
  expect(parse('l10 10 10 10')).toEqual([
    ['l', '10', '10'],
    ['l', '10', '10']
  ]);
});

it('horizontalTo', () => {
  expect(parse('h 10.5')).toEqual([['h', '10.5']]);
});

it('verticalTo', () => {
  expect(parse('v 10.5')).toEqual([['v', '10.5']]);
});

it('arcTo', () => {
  expect(parse('A 30 50 0 0 1 162.55 162.45')).toEqual([
    ['A', '30', '50', '0', '0', '1', '162.55', '162.45']
  ]);
  expect(parse('A 60 60 0 01100 100')).toEqual([
    ['A', '60', '60', '0', '0', '1', '100', '100']
  ]);
});

it('quadratic curveTo', () => {
  expect(parse('M10 80 Q 95 10 180 80')).toEqual([
    ['M', '10', '80'],
    ['Q', '95', '10', '180', '80']
  ]);
});

it('smooth curveTo', () => {
  expect(parse('S 1 2, 3 4')).toEqual([['S', '1', '2', '3', '4']]);
});

it('smooth quadratic curveTo', () => {
  expect(() => parse('t 1 2 3')).toThrow();
  expect(parse('T 1 -200')).toEqual([['T', '1', '-200']]);
});

it('close', () => {
  expect(parse('z')).toEqual([['z']]);
});
