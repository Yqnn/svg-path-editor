import { Component, Input } from '@angular/core';
import { ExportConfigService } from '../config.service';

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

  onExport(): void {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${this.x} ${this.y} ${this.width} ${this.height}">
        <path d="${this.path}"${this.cfg.stroke ? ` stroke="${this.cfg.strokeColor}" stroke-width="${this.cfg.strokeWidth}"` : ''} fill="${this.cfg.fill ? this.cfg.fillColor : 'none'}"/>
      </svg>`;

    this.download(this.name || 'svg-path.svg', svg);
  }
}
