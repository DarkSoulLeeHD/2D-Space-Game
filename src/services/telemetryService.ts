// services/telemetryService.ts - Live-Telemetrie-Logger & Performance-Auditor (SYS-QA-15)

export interface ITelemetryEvent {
  id: string;
  timestamp: string;
  source: 'WebAudio' | 'A* Pathfinding' | 'LocalStorage' | 'Canvas2D' | 'Kausalität';
  message: string;
}

export class TelemetryService {
  private static events: ITelemetryEvent[] = [
    {
      id: 'e-1',
      timestamp: '14:02:41',
      source: 'A* Pathfinding',
      message: 'Pfad berechnet für Kriecher_01 (4 Kacheln, 0.42ms)',
    },
    {
      id: 'e-2',
      timestamp: '14:02:42',
      source: 'WebAudio',
      message: 'Sound gequeued: playGunfireTransient (Buffer freigegeben)',
    },
    {
      id: 'e-3',
      timestamp: '14:02:43',
      source: 'LocalStorage',
      message: "Commit erfolgreich: Checksum '9f44bc2a' validiert",
    },
    {
      id: 'e-4',
      timestamp: '14:02:44',
      source: 'Canvas2D',
      message: 'Dual-Grid Bifurkation synchron gerendert (120 FPS)',
    },
    {
      id: 'e-5',
      timestamp: '14:02:45',
      source: 'Kausalität',
      message: 'Terminal Alpha zerstört -> Schott 30J geöffnet',
    },
  ];

  public static getRecentEvents(): ITelemetryEvent[] {
    return [...this.events];
  }

  public static logEvent(
    source: ITelemetryEvent['source'],
    message: string
  ): void {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newEv: ITelemetryEvent = {
      id: `e-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: timeStr,
      source,
      message,
    };
    this.events.unshift(newEv);
    if (this.events.length > 8) {
      this.events.pop();
    }
  }

  public static getLocalStorageSizeKb(): number {
    try {
      let totalBytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          totalBytes += key.length + (localStorage.getItem(key)?.length || 0);
        }
      }
      return parseFloat((totalBytes / 1024).toFixed(1));
    } catch {
      return 24.5;
    }
  }
}
