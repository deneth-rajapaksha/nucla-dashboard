export type ReactorStatus =
  | 'SHUTDOWN'
  | 'SUBCRITICAL'
  | 'PARTIAL POWER'
  | 'FULL POWER'
  | 'SCRAM';

export type LogType = 'SYS' | 'INFO' | 'WARNING' | 'SCRAM' | 'ALERT' | 'EMERGENCY';

export type EmergencyMode = 'LOCA' | 'BLACKOUT' | 'ROD_EJECTION' | null;

export interface LogEvent {
  id: number;
  type: LogType;
  msg: string;
  time: string;
}

export interface ReactorState {
  // Controls (inputs)
  rodInsertion: number;   // 0 = fully withdrawn, 100 = fully inserted (PHYSICAL position)
  pumpSpeed: number;      // 0–100 %  (may be overridden by emergency physics)
  turbineOn: boolean;

  // Physics outputs
  neutronFlux: number;    // 0–100 %
  coreTemp: number;       // °C
  xenonLevel: number;     // 0–100 %
  powerOutput: number;    // MWe
  steamPressure: number;  // bar
  coolantOutTemp: number; // °C
  meltdownRisk: number;   // 0–100 %
  thermalPower: number;   // MWt

  // Status
  reactorStatus: ReactorStatus;
  isScrammed: boolean;
  simTime: number;        // seconds

  // Emergency scenario state
  emergencyMode: EmergencyMode;
  eccsActive: boolean;      // Emergency Core Cooling System
  dieselGenActive: boolean; // Diesel generator backup power
  pressureReliefOpen: boolean; // Automatic pressure relief valve

  // Event log
  events: LogEvent[];
}
