// ============================================================
//  reactor.models.ts
//  All shared interfaces and types for the SMR simulator.
// ============================================================

export type ReactorStatus =
  | 'SHUTDOWN'
  | 'SUBCRITICAL'
  | 'PARTIAL POWER'
  | 'FULL POWER'
  | 'SCRAM';

export type LogType = 'SYS' | 'INFO' | 'WARNING' | 'SCRAM' | 'ALERT';

export interface LogEvent {
  id: number;
  type: LogType;
  msg: string;
  time: string;
}

export interface ReactorState {
  // Controls (inputs)
  rodInsertion: number; // 0 = fully withdrawn, 100 = fully inserted
  pumpSpeed: number; // 0–100 %
  turbineOn: boolean;

  // Physics outputs
  neutronFlux: number; // 0–100 %
  coreTemp: number; // °C
  xenonLevel: number; // 0–100 %
  powerOutput: number; // MWe
  steamPressure: number; // bar
  coolantOutTemp: number; // °C
  meltdownRisk: number; // 0–100 %
  thermalPower: number; // MWt

  // Status
  reactorStatus: ReactorStatus;
  isScrammed: boolean;
  simTime: number; // seconds

  // Event log
  events: LogEvent[];
}

export interface GaugeConfig {
  label: string;
  key: keyof ReactorState;
  cssClass: string;
  valueFormatter: (s: ReactorState) => string;
  percentFn: (s: ReactorState) => number;
}

