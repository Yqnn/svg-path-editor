import { changePathOrigin } from './change-path-origin';
import { SvgPath } from './svg';

const validate = (test: {input: string, output:string, newOriginIdx: number, subpath?: boolean}[]) => {
  test.forEach(({input, output, newOriginIdx, subpath}) => {
    const svg = new SvgPath(input);
    changePathOrigin(svg, newOriginIdx, subpath); 
    expect(svg.asString()).toBe(output);
  });
}

describe('changePathOrigin', () => {
  it('should change origin of basic closed paths', () => {
    validate([{
      input: 'M 2 2 L 6 2 L 2 5 L 2 2 L 5 0 L 5 -1 L 1 -2 L -1 0 L 2 2',
      output: 'M 1 -2 L -1 0 L 2 2 L 6 2 L 2 5 L 2 2 L 5 0 L 5 -1 Z',
      newOriginIdx: 7
    }]);
  });

  it('should change subpath origin', () => {
    validate([{
      input:  'M 3 4 L 4 4 L 4 5 L 3 5 Z M 5 5 L 6 4 L 7 4 L 8 5 L 8 6 L 7 7 L 6 7 L 5 6 Z M 9 6 L 10 6 L 10 7 L 9 7 Z',
      output: 'M 3 4 L 4 4 L 4 5 L 3 5 Z M 7 4 L 8 5 L 8 6 L 7 7 L 6 7 L 5 6 L 5 5 L 6 4 Z M 9 6 L 10 6 L 10 7 L 9 7 Z',
      newOriginIdx: 8,
      subpath: true,
    }]);
  });

  it('should preserve relative moveTo', () => {
    validate([{
      input:  'M 3 4 L 4 4 L 4 5 L 3 5 Z M 5 5 L 6 4 L 7 4 L 8 5 L 8 6 L 7 7 L 6 7 L 5 6 Z m 9 6 L 10 6 L 10 7 L 9 7 Z',
      output: 'M 3 4 L 4 4 L 4 5 L 3 5 Z M 7 4 L 8 5 L 8 6 L 7 7 L 6 7 L 5 6 L 5 5 L 6 4 Z m 7 7 L 10 6 L 10 7 L 9 7 Z',
      newOriginIdx: 8,
      subpath: true,
    }]);
  });


  it('should do nothing if new origin is out of bound or 0', () => {
    const path = 'M 2 2 L 6 2 L 2 6';
    validate([
      {
        input: path,
        output: path,
        newOriginIdx: 0
      },
      {
        input: path,
        output: path,
        newOriginIdx: 99
      }
    ]);
  });

  it('should remove initial M if there is no Z after', () => {
    validate([{
      input: 'M 2 -3 L 3 -3 L 2 -2 L 2 -3 M 3 -2 L 4 -2 L 3 -1 Z M 2 -3 L 2 -5 L 4 -4 L 2 -3',
      output: 'M 2 -5 L 4 -4 L 2 -3 L 3 -3 L 2 -2 L 2 -3 M 3 -2 L 4 -2 L 3 -1 Z M 2 -3 L 2 -5',
      newOriginIdx: 10
    }]);
  });

  it('shouldn\'t remove initial M if there is a Z after', () => {
    validate([{
      input: 'M 2 2 L 6 2 L 2 5 Z L 5 0 L 5 -1 L 1 -2 L -1 0 L 2 2',
      output: 'M 1 -2 L -1 0 L 2 2 M 2 2 L 6 2 L 2 5 Z L 5 0 L 5 -1 L 1 -2',
      newOriginIdx: 7
    }]);
  });

  it('should convert S to C ', () => {
    validate([
      {
        input: 'M 5 5 L 10 5 C 12 5 12 6 12 7 S 13 11 12 10 Z',
        output: 'M 12 7 C 12 8 13 11 12 10 L 5 5 L 10 5 C 12 5 12 6 12 7',
        newOriginIdx: 3
      },
      {
        input: 'M 5 5 L 10 5 C 12 5 12 6 12 7 s 1 4 0 3 Z',
        output: 'M 12 7 c 0 1 1 4 0 3 L 5 5 L 10 5 C 12 5 12 6 12 7',
        newOriginIdx: 3
      }
    ]);
  });


  it('should convert T to Q ', () => {
    validate([
      {
        input: 'M 5 5 L 10 5 Q 10 7 12 7 T 12 10 Z',
        output: 'M 12 7 Q 14 7 12 10 L 5 5 L 10 5 Q 10 7 12 7',
        newOriginIdx: 3
      },
      {
        input: 'M 5 5 L 10 5 Q 10 7 12 7 t 12 10 Z',
        output: 'M 12 7 q 2 0 12 10 L 5 5 L 10 5 Q 10 7 12 7',
        newOriginIdx: 3
      }
    ]);
  });

  it('should convert Z that comes after new origin to L', () => {
    validate([
      {
        input: 'M 2 2 L 4 2 L 4 3 Z L 2 4 L 1 4 Z L 0 2 L 0 1 Z',
        output: 'M 2 4 L 1 4 L 2 2 L 0 2 L 0 1 L 2 2 M 2 2 L 4 2 L 4 3 Z L 2 4',
        newOriginIdx: 5
      },
      {
        input: 'M 2 2 L 4 2 L 4 3 Z L 2 4 L 1 4 Z L 0 2 L 0 1 Z L 2 0 L 3 0 Z M 2 -2 L 3 -2 L 2 -3 Z L 1 -2 L 2 -1 Z',
        output: 'M 2 4 L 1 4 L 2 2 L 0 2 L 0 1 L 2 2 L 2 0 L 3 0 L 2 2 M 2 -2 L 3 -2 L 2 -3 Z L 1 -2 L 2 -1 Z M 2 2 L 4 2 L 4 3 Z L 2 4',
        newOriginIdx: 5
      }
    ]);
  });
});