import { PathParser } from './path-parser';

const parse = PathParser.parse;

describe('PathParser', () => {
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

  it('initial move missing', () => {
    expect(() => { parse('l 1 1'); }).toThrowError(/malformed/);
  });

  it('curveTo', () => {
    const a = parse('m0 0c 50,0 50,100 100,100 50,0 50,-100 100,-100');
    const b = parse('m0 0c 50,0 50,100 100,100 c 50,0 50,-100 100,-100');
    expect(a).toEqual([
      ['m', '0', '0'],
      ['c', '50', '0', '50', '100', '100', '100'],
      ['c', '50', '0', '50', '-100', '100', '-100']
    ]);
    expect(a).toEqual(b);
  });

  it('lineTo', () => {
    expect(() => { parse('m0 0l 10 10 0'); }).toThrowError(/malformed/);
    expect(parse('m0 0l 10,10')).toEqual([['m', '0', '0'], ['l', '10', '10']]);
    expect(parse('m0 0l10 10 10 10')).toEqual([
      ['m', '0', '0'],
      ['l', '10', '10'],
      ['l', '10', '10']
    ]);
  });

  it('horizontalTo', () => {
    expect(parse('m0 0 h 10.5')).toEqual([['m', '0', '0'], ['h', '10.5']]);
  });

  it('verticalTo', () => {
    expect(parse('m0 0 v 10.5')).toEqual([['m', '0', '0'], ['v', '10.5']]);
  });

  it('arcTo', () => {
    expect(parse('M0 0A 30 50 0 0 1 162.55 162.45')).toEqual([
      ['M', '0', '0'],
      ['A', '30', '50', '0', '0', '1', '162.55', '162.45']
    ]);
    expect(parse('M0 0A 60 60 0 01100 100')).toEqual([
      ['M', '0', '0'],
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
    expect(parse('M0 0 S 1 2, 3 4')).toEqual([['M', '0', '0'], ['S', '1', '2', '3', '4']]);
  });

  it('smooth quadratic curveTo', () => {
    expect(() => parse('M0 0 t 1 2 3')).toThrow();
    expect(parse('M0 0 T 1 -200')).toEqual([['M', '0', '0'], ['T', '1', '-200']]);
  });

  it('close', () => {
    expect(parse('m0 0z')).toEqual([['m', '0', '0'], ['z']]);
  });
});