import { useState, useEffect } from 'react';
import { IPlayerState, IGameSaveData } from '../types/game';

const SAVE_KEY = 'CHRONO_SAVE_v1';

export const DEFAULT_PLAYER_STATE: IPlayerState = {
  callsign: 'Operative Vance',
  level: 1,
  credits: 500,
  nanites: 2450,
  chronoCrystals: 4,
  rigIntegrity: 92,
  equippedWeapon: {
    id: 'arc-70',
    name: 'ARC-70 Impuls',
    damage: 34,
    ammoCurrent: 36,
    ammoMax: 36,
  },
  activeSector: 5, // Sektor 05: Hangar (Basis)
  unlockedSectors: [1, 2, 4, 5, 6],
};

export const DEFAULT_SAVE_DATA: IGameSaveData = {
  version: '1.0.0',
  timestamp: Date.now(),
  player: DEFAULT_PLAYER_STATE,
  unlockedLogsCount: 3,
  settings: {
    crtOpacity: 0.7,
    audioVolume: 0.8,
    colorTheme: 'CYAN',
  },
};

export function loadGameSave(): IGameSaveData {
  if (typeof window === 'undefined') return DEFAULT_SAVE_DATA;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return DEFAULT_SAVE_DATA;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.player) {
      return {
        ...DEFAULT_SAVE_DATA,
        ...parsed,
        player: { ...DEFAULT_PLAYER_STATE, ...parsed.player },
      };
    }
    return DEFAULT_SAVE_DATA;
  } catch (err) {
    console.warn('Fehler beim Laden des Spielstands aus LocalStorage:', err);
    return DEFAULT_SAVE_DATA;
  }
}

export function saveGameData(data: Partial<IGameSaveData>): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const current = loadGameSave();
    const updated: IGameSaveData = {
      ...current,
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('LocalStorage Speicherkapazität überschritten oder blockiert:', err);
    return false;
  }
}

export function resetGameSave(): IGameSaveData {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // Ignored
    }
  }
  return DEFAULT_SAVE_DATA;
}

export function exportSaveAsJson(data: IGameSaveData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chrono_save_${data.player.callsign.toLowerCase().replace(/\s+/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getStorageUsageKb(): string {
  if (typeof window === 'undefined') return '0 KB';
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return '0.4 KB';
    const bytes = new Blob([raw]).size;
    return `${(bytes / 1024).toFixed(1)} KB`;
  } catch {
    return '0.4 KB';
  }
}

export function useGameStorage() {
  const [saveData, setSaveData] = useState<IGameSaveData>(() => loadGameSave());

  useEffect(() => {
    // Check save validity
    const loaded = loadGameSave();
    setSaveData(loaded);
  }, []);

  const updatePlayer = (updater: (prev: IPlayerState) => IPlayerState) => {
    setSaveData((prev) => {
      const nextPlayer = updater(prev.player);
      const nextData: IGameSaveData = { ...prev, player: nextPlayer, timestamp: Date.now() };
      saveGameData(nextData);
      return nextData;
    });
  };

  const handleReset = () => {
    const fresh = resetGameSave();
    setSaveData(fresh);
    return fresh;
  };

  return {
    saveData,
    player: saveData.player,
    updatePlayer,
    resetSave: handleReset,
    exportSave: () => exportSaveAsJson(saveData),
  };
}
