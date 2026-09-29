export interface IBootTelemetry {
  webGlSupported: boolean;
  audioUnlocked: boolean;
  userAgent: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  networkLatency: number;
  screenWidth: number;
  screenHeight: number;
  localStorageAvailable: boolean;
}

export type BootPhase =
  | 'POWER_OFF'
  | 'HARDWARE_PROBE'
  | 'AWAITING_USER_GESTURE'
  | 'PHOSPHOR_IGNITION'
  | 'ATTRACT_ACTIVE'
  | 'TRANSITIONING_HOME';
