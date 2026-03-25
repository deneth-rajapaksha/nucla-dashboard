// ============================================================
//  index.ts  —  Public API barrel for reactor-simulator feature
//  Import the component from this path in your Angular app:
//
//    import { ReactorSimulatorComponent }
//      from './reactor-simulator';          // or wherever you put it
// ============================================================

export { ReactorSimulatorComponent } from './reactor-simulator.component';
export { ReactorSimulatorService } from './services/reactor-simulator.service';
export { ReactorRendererService } from './services/reactor-renderer.service';

export type { ReactorState, ReactorStatus, LogEvent, LogType } from './models/reactor.models';

