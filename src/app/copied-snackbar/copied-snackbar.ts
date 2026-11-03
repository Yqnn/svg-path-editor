import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIcon } from '@angular/material/icon';


@Component({
    selector: 'app-copied-snackbar',
    templateUrl: 'copied-snackbar.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatIcon]
})
export class CopiedSnackbar {
}
