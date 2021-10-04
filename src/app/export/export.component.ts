import { Component, Input } from '@angular/core';
import { ExportConfigService } from '../config.service';

const moveRegex = 'M [0-9]{1,2} [0-9]{1,2}';
const lineRegex = 'L [0-9]{1,2} [0-9]{1,2}';
const curveRegex = 'C ([0-9]{1,2}\.?[0-9]{0,4}){6}';

const commandsRegexes = new RegExp(`(${moveRegex})|(${lineRegex}|(${curveRegex}))`, 'g');

@Component({
  selector: 'app-export',
  templateUrl: './export.component.html'
})
export class ExportComponent {
  @Input() path: string = '';
  @Input() name: string = '';

  x = 0;
  y = 0;
  width = 100;
  height = 100;

  constructor(
    public cfg: ExportConfigService
  ) {}

  // Download the SVG
  download(fileName: string, data: string) {
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const anchor = document.createElement('a');
    anchor.href = window.URL.createObjectURL(blob);
    anchor.setAttribute('download', fileName);
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => window.URL.revokeObjectURL(anchor.href), 100);
  }

  // Group M and L or M and C commands together
  groupCommands(allPathCommands: (string | number)[][]) {
    for (let i = 0; i < allPathCommands.length; i++) {
      if (allPathCommands[i][0] === 'M') {
        allPathCommands[i] = allPathCommands[i].concat(allPathCommands[i + 1] || []);

        if (allPathCommands[i + 1]) {
          allPathCommands.splice(i + 1, 1);
        }
      }
    }
  }

  // Add M (move) with the coordinates from the previous point, if there is just a line or
  // curve in the current command. This prevents a multiple line or curves to be one segment.
  createNewSegmentsWhereNeeded(allPathCommands: (string | number)[][]) {
    allPathCommands.forEach((pc, i) => { // pc = path command
      if (pc[0] === 'C' || pc[0] === 'L') {
        const prevCommand = allPathCommands[i - 1];
        pc.unshift(prevCommand[prevCommand.length - 1]); // y coordinate from the end point of the previous command
        pc.unshift(prevCommand[prevCommand.length - 2]); // x coordinate from the end point of the previous command
        pc.unshift('M');
      }
    });
  }

  // Make individual path segments be drawn from top to bottom, left to right, no matter how the user initially drew them
  adjustSegmentsDrawingDirection(allPathCommands: (string | number)[][]) {
    allPathCommands.forEach(pc => { // pc = path command

      // Make lines draw from top to bottom, left to right, even they were initially the other way around
      // Terminology:
      // pc[1] = line start point X coordinate,
      // pc[2] = line start point Y coordinate,
      // pc[4] = line end point X coordinate,
      // pc[5] = line end point Y coordinate
      if (
        pc[0] === 'M' && pc[3] === 'L' &&
        (
          pc[5] < pc[2] ||
          (pc[2] === pc[5] && pc[4] < pc[1])
        )
      ) {
        const lineXAndY = { x: pc[4], y: pc[5] };
        pc[4] = pc[1];
        pc[5] = pc[2];
        pc[1] = lineXAndY.x;
        pc[2] = lineXAndY.y;
      }

      // Make curves draw from top to bottom, left to right, even if they were initially the other way around
      // Terminology:
      // pc[1] = curve start point X coordinate,
      // pc[2] = curve start point Y coordinate,
      // pc[8] = curve end point X coordinate,
      // pc[9] = curve end point Y coordinate
      if (
        pc[0] === 'M' && pc[3] == 'C' &&
        (
          pc[9] < pc[2] ||
          (pc[2] === pc[9] && pc[8] < pc[1])
        )
      ) {
        const curveEndXandY = { x: pc[8], y: pc[9] };
        pc[8] = pc[1];
        pc[9] = pc[2];
        pc[1] = curveEndXandY.x;
        pc[2] = curveEndXandY.y;

        const curveMidXandY = { x: pc[6], y: pc[7] };
        pc[6] = pc[4];
        pc[7] = pc[5];
        pc[4] = curveMidXandY.x;
        pc[5] = curveMidXandY.y;
      }
    });
  }

  // Order segments from top to bottom, left to right
  orderSegments(allPathCommands: (string | number)[][]) {
    allPathCommands.sort((pc1, pc2) => {
      const prevCommandX = pc1[1];
      const prevCommandY = pc1[2];

      if (prevCommandY < pc2[2] || (prevCommandY === pc2[2] && prevCommandX < pc2[1])) {
        return -1
      }

      return 1;
    });
  }

  parseSvgPath(path: string) {
    let allPathCommands: (string | number)[][] = (path.match(commandsRegexes) || [])
      .map(mc => mc.trim().split(' ') // Split command into multiple command instructions (ci)
      .map(ci => isNaN(parseFloat(ci)) ? ci : parseFloat(ci))); // Convert all command instruction (ci) coords into floats

    this.groupCommands(allPathCommands);
    this.createNewSegmentsWhereNeeded(allPathCommands);
    this.adjustSegmentsDrawingDirection(allPathCommands);
    this.orderSegments(allPathCommands);

    return allPathCommands;
  }

  onExport(): void {
    const pathCommands = this.parseSvgPath(this.path);

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="tracing-svg" viewBox="${this.x} ${this.y} ${this.width} ${this.height}">
        <defs>
          ${pathCommands.map((pc, i) =>
              `<path id="path-road-${i + 1}" d="${pc.join(' ')}"/>`
            ).join('\n')
          }
        </defs>
        <g>
          ${pathCommands.map((pc, i) =>
            `<g>
              <use fill="transparent" stroke="#E2E2E2" stroke-width="8" class="road" xlink:href="#path-road-${pathCommands.length - i}" />
              <use fill="transparent" stroke="#403E50" stroke-width="8" class="progress" id="progress-${pathCommands.length - i}" xlink:href="#path-road-${pathCommands.length - i}"/>
            </g>`
          )}
        </g>
      </svg>`;

    this.download(this.name || 'svg-path.svg', svg);
  }
}
