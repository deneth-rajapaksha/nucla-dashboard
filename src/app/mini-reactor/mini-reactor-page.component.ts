import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactorSimulatorComponent } from '../reactor-simulator';

@Component({
  selector: 'app-mini-reactor-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactorSimulatorComponent],
  template: `<app-reactor-simulator></app-reactor-simulator>`,
  styles: [`:host { display: block; }`]
})
export class MiniReactorPageComponent {}

