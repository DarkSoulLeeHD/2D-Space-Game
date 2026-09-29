import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  IWeaponChassis,
  IWeaponMod,
  WeaponSlotType,
  IDroneState,
  DroneBehaviorMode,
  RARITY_COLORS,
  ItemRarity,
} from '../types/arsenal';
import { useGameStorage } from '../services/storageService';
import { ProceduralAudioEngine } from '../services/audioEngine';
import { WeaponBlueprintCanvas } from './WeaponBlueprintCanvas';

interface ArsenalWorkshopProps {
  onBackToDeck: () => void;
}

// Initial Starter Weapon Chassis: ARC-70 Impulskarabiner
const STARTER_PRIMARY_WEAPON: IWeaponChassis = {
  id: 'arc-70',
  name: 'ARC-70 IMPULS',
  typeLabel: 'STURM-KARABINER',
  baseDamage: 34,
  baseRpm: 650,
  baseMagSize: 36,
  baseCritChance: 0.1,
  baseHeatCooldown: 4.2,
  installedMods: {
    barrel: {
      id: 'mod-barrel-01',
      name: 'WOLFRAM-KOMPENSATOR',
      slot: 'barrel',
      rarity: 'VERSTÄRKT',
      description: 'Präzisions-Kompensator für stabilere Projektilbahnen.',
      stats: {
        damageBonus: 6,
        rpmBonus: 0,
        critChanceBonus: 0.05,
        heatReduction: 0.05,
        spreadReduction: 0.15,
      },
      scrapYield: 45,
    },
    magazine: {
      id: 'mod-mag-01',
      name: 'MAG-KOPPLER 45S',
      slot: 'magazine',
      rarity: 'STANDARD',
      description: 'Erweitertes Magazingehäuse mit Federdruck-Zuführung.',
      stats: {
        damageBonus: 0,
        rpmBonus: 0,
        critChanceBonus: 0,
        heatReduction: 0,
        spreadReduction: 0,
      },
      scrapYield: 25,
    },
  },
};

// Secondary Weapon: Volt-Pistole
const STARTER_SECONDARY_WEAPON: IWeaponChassis = {
  id: 'volt-pistol',
  name: 'VOLT-PISTOLE MK-II',
  typeLabel: 'ENERGIE-SEITENWAFFE',
  baseDamage: 22,
  baseRpm: 420,
  baseMagSize: 18,
  baseCritChance: 0.15,
  baseHeatCooldown: 2.8,
  installedMods: {},
};

// Starter Scarab-IV Drone
const STARTER_DRONE: IDroneState = {
  id: 'scarab-iv',
  name: 'SCARAB-IV',
  hullHp: 250,
  maxHullHp: 250,
  batteryRounds: 4,
  maxBatteryRounds: 4,
  behaviorMode: 'SHIELD_LINK',
};

// Initial Inventory pool (6 starter items, rest empty in 24-slot matrix)
const STARTER_INVENTORY: (IWeaponMod | null)[] = [
  {
    id: 'inv-optic-01',
    name: 'HOLO-MATRIX 2.0x',
    slot: 'optic',
    rarity: 'ASTRAEA_SPEC',
    description: 'Vergrößerungs-Visier mit taktischer Feind-Markierung.',
    stats: {
      damageBonus: 4,
      rpmBonus: 0,
      critChanceBonus: 0.14,
      heatReduction: 0,
      spreadReduction: 0.25,
    },
    scrapYield: 85,
  },
  {
    id: 'inv-stock-01',
    name: 'TITAN-SKELETTSCHAFT',
    slot: 'stock',
    rarity: 'STANDARD',
    description: 'Leichtgewichtiger Schaft für schnellere Zielaufnahme.',
    stats: {
      damageBonus: 0,
      rpmBonus: 25,
      critChanceBonus: 0,
      heatReduction: 0.1,
      spreadReduction: 0.2,
    },
    scrapYield: 30,
  },
  {
    id: 'inv-chrono-01',
    name: 'CHRONO-RESONATOR MK-I',
    slot: 'catalyst',
    rarity: 'ENTROPISCH',
    description: 'Zerrüttet die lokale Raumzeit bei kritischen Treffern.',
    stats: {
      damageBonus: 12,
      rpmBonus: 50,
      critChanceBonus: 0.08,
      heatReduction: 0.15,
      spreadReduction: 0,
    },
    scrapYield: 150,
  },
  {
    id: 'inv-body-01',
    name: 'ÜBERDRUCK-GASKOLBEN',
    slot: 'body',
    rarity: 'VERSTÄRKT',
    description: 'Erhöht die Zyklen-Frequenz der Verschlusskammer.',
    stats: {
      damageBonus: 2,
      rpmBonus: 80,
      critChanceBonus: 0,
      heatReduction: -0.05,
      spreadReduction: -0.05,
    },
    scrapYield: 55,
  },
  {
    id: 'inv-barrel-02',
    name: 'SCHALLDÄMPFER-KERN',
    slot: 'barrel',
    rarity: 'STANDARD',
    description: 'Dämpft Signatur bei Infiltrationen.',
    stats: {
      damageBonus: -2,
      rpmBonus: 0,
      critChanceBonus: 0.05,
      heatReduction: 0.1,
      spreadReduction: 0.1,
    },
    scrapYield: 20,
  },
  {
    id: 'inv-apex-01',
    name: 'SINGULARITÄTS-TREIBER',
    slot: 'catalyst',
    rarity: 'APEX',
    description: 'Reines Apex-Bauteil. Konzentriert kinetische Energie in Raumspalten.',
    stats: {
      damageBonus: 28,
      rpmBonus: 120,
      critChanceBonus: 0.22,
      heatReduction: 0.25,
      spreadReduction: 0.35,
    },
    scrapYield: 350,
  },
  // remaining slots null up to 24
  ...Array(18).fill(null),
];

export const ArsenalWorkshop: React.FC<ArsenalWorkshopProps> = ({ onBackToDeck }) => {
  const { player, updatePlayer } = useGameStorage();
  const [activeWeapon, setActiveWeapon] = useState<IWeaponChassis>(STARTER_PRIMARY_WEAPON);
  const [secondaryWeapon, setSecondaryWeapon] = useState<IWeaponChassis>(STARTER_SECONDARY_WEAPON);
  const [drone, setDrone] = useState<IDroneState>(STARTER_DRONE);
  const [inventory, setInventory] = useState<(IWeaponMod | null)[]>(STARTER_INVENTORY);

  const [selectedSlot, setSelectedSlot] = useState<WeaponSlotType | null>('barrel');
  const [selectedInvIndex, setSelectedInvIndex] = useState<number | null>(0);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'BARREL' | 'OPTIC' | 'MAG' | 'CATALYST'>('ALL');
  const [activeTab, setActiveTab] = useState<'WEAPON' | 'DRONE' | 'EXOSUIT'>('WEAPON');
  const [notification, setNotification] = useState<string | null>(null);
  const [isFoldAnimating, setIsFoldAnimating] = useState(false);

  const audio = ProceduralAudioEngine.getInstance();

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Rechnerische DPS- und Attribut-Formeln aus Spezifikation
  const calculatedStats = useMemo(() => {
    const mods = Object.values(activeWeapon.installedMods).filter(Boolean) as IWeaponMod[];

    const dmgBonus = mods.reduce((sum, m) => sum + (m.stats.damageBonus || 0), 0);
    const rpmBonus = mods.reduce((sum, m) => sum + (m.stats.rpmBonus || 0), 0);
    const critBonus = mods.reduce((sum, m) => sum + (m.stats.critChanceBonus || 0), 0);
    const heatReduction = mods.reduce((sum, m) => sum + (m.stats.heatReduction || 0), 0);
    const spreadReduction = mods.reduce((sum, m) => sum + (m.stats.spreadReduction || 0), 0);

    const effectiveDamage = Math.max(1, activeWeapon.baseDamage + dmgBonus);
    const effectiveRpm = Math.max(100, activeWeapon.baseRpm + rpmBonus);
    const fireRatePerSec = effectiveRpm / 60;
    const effectiveCritChance = Math.min(0.9, Math.max(0.05, activeWeapon.baseCritChance + critBonus));

    // Kinetische DPS = Effektiver Schaden * Feuerrate * (1.0 + CritChance * 0.5)
    const kineticDps = effectiveDamage * fireRatePerSec * (1.0 + effectiveCritChance * 0.5);

    return {
      effectiveDamage,
      effectiveRpm,
      effectiveCritChance,
      kineticDps: Math.round(kineticDps * 10) / 10,
      heatCooldown: Math.max(1.0, activeWeapon.baseHeatCooldown * (1 - heatReduction)),
      spreadVal: Math.max(0.05, 0.45 * (1 - spreadReduction)),
      magSize: activeWeapon.baseMagSize + (activeWeapon.installedMods.magazine ? 9 : 0),
    };
  }, [activeWeapon]);

  // Install / Equip selected inventory mod into matching weapon socket
  const handleInstallMod = useCallback((invIdx: number) => {
    const item = inventory[invIdx];
    if (!item) return;

    audio.playModuleSnap();

    // Check if slot currently has a mod, if so swap back to inventory
    const currentInstalled = activeWeapon.installedMods[item.slot];

    setActiveWeapon((prev) => ({
      ...prev,
      installedMods: {
        ...prev.installedMods,
        [item.slot]: item,
      },
    }));

    setInventory((prev) => {
      const next = [...prev];
      next[invIdx] = currentInstalled || null;
      return next;
    });

    setSelectedSlot(item.slot);
    showToast(`MODUL INSTALLIERT: ${item.name}`);
  }, [inventory, activeWeapon, audio]);

  // Uninstall / Detach mod from weapon socket back to inventory
  const handleUninstallMod = useCallback((slot: WeaponSlotType) => {
    const mod = activeWeapon.installedMods[slot];
    if (!mod) return;

    // Find first empty inventory slot
    const emptyIdx = inventory.findIndex((it) => it === null);
    if (emptyIdx === -1) {
      showToast('INVENTAR VOLL: KEIN FREIER PLATZ');
      return;
    }

    audio.playModuleSnap();

    setActiveWeapon((prev) => {
      const updatedMods = { ...prev.installedMods };
      delete updatedMods[slot];
      return {
        ...prev,
        installedMods: updatedMods,
      };
    });

    setInventory((prev) => {
      const next = [...prev];
      next[emptyIdx] = mod;
      return next;
    });

    showToast(`MODUL AUSGEBAUT: ${mod.name}`);
  }, [activeWeapon, inventory, audio]);

  // Scrap item from inventory for Nanites
  const handleScrapItem = useCallback((invIdx: number) => {
    const item = inventory[invIdx];
    if (!item) return;

    audio.playForgeWeld();
    const yieldAmount = item.scrapYield;

    updatePlayer((prev) => ({
      ...prev,
      nanites: prev.nanites + yieldAmount,
    }));

    setInventory((prev) => {
      const next = [...prev];
      next[invIdx] = null;
      return next;
    });

    showToast(`SCHROTT DEMONTIERT: +${yieldAmount} NANITEN`);
  }, [inventory, audio, updatePlayer]);

  // Overclock / Upgrade selected mod to next rarity tier
  const handleOverclockMod = useCallback((invIdx: number) => {
    const item = inventory[invIdx];
    if (!item) return;

    const naniteCost = 120;
    const crystalCost = 1;

    if (player.nanites < naniteCost || player.chronoCrystals < crystalCost) {
      showToast('UNZUREICHENDE RESSOURCEN (120 TN + 1 CK BENÖTIGT)');
      return;
    }

    const tiers: ItemRarity[] = ['STANDARD', 'VERSTÄRKT', 'ASTRAEA_SPEC', 'ENTROPISCH', 'APEX'];
    const currentTierIdx = tiers.indexOf(item.rarity);
    if (currentTierIdx >= tiers.length - 1) {
      showToast('BEREITS MAXIMALE SELTENHEIT (APEX)');
      return;
    }

    audio.playForgeWeld();

    // Deduct cost
    updatePlayer((prev) => ({
      ...prev,
      nanites: prev.nanites - naniteCost,
      chronoCrystals: prev.chronoCrystals - crystalCost,
    }));

    // 80% Success Chance
    const isSuccess = Math.random() < 0.8;
    if (isSuccess) {
      const nextTier = tiers[currentTierIdx + 1];
      const upgraded: IWeaponMod = {
        ...item,
        name: `${item.name.replace(/ Mk\.\w+/, '')} Mk.${currentTierIdx + 2}`,
        rarity: nextTier,
        stats: {
          damageBonus: Math.round(item.stats.damageBonus * 1.35) + 3,
          rpmBonus: Math.round(item.stats.rpmBonus * 1.25),
          critChanceBonus: Math.round((item.stats.critChanceBonus + 0.04) * 100) / 100,
          heatReduction: Math.min(0.5, item.stats.heatReduction + 0.05),
          spreadReduction: Math.min(0.5, item.stats.spreadReduction + 0.05),
        },
        scrapYield: Math.round(item.scrapYield * 1.6),
      };

      setInventory((prev) => {
        const next = [...prev];
        next[invIdx] = upgraded;
        return next;
      });

      audio.playSelectClick();
      showToast(`VEREDELUNG ERFOLGREICH: ${upgraded.rarity}`);
    } else {
      // 50% nanite recovery on fail
      updatePlayer((prev) => ({
        ...prev,
        nanites: prev.nanites + 60,
      }));
      showToast('VEREDELUNG FEHLGESCHLAGEN // 60 TN GERETTET');
    }
  }, [inventory, player, audio, updatePlayer]);

  // Handle Hotkeys [1-6], [E], [X], [TAB], [ESC]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const socketKeys: Record<string, WeaponSlotType> = {
        '1': 'barrel',
        '2': 'optic',
        '3': 'body',
        '4': 'magazine',
        '5': 'stock',
        '6': 'catalyst',
      };

      if (socketKeys[e.key]) {
        setSelectedSlot(socketKeys[e.key]);
        audio.playHoverPing();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setActiveTab((prev) => (prev === 'WEAPON' ? 'DRONE' : prev === 'DRONE' ? 'EXOSUIT' : 'WEAPON'));
        audio.playSelectClick();
      } else if (e.key.toLowerCase() === 'e') {
        if (selectedInvIndex !== null && inventory[selectedInvIndex]) {
          handleInstallMod(selectedInvIndex);
        }
      } else if (e.key.toLowerCase() === 'x') {
        if (selectedInvIndex !== null && inventory[selectedInvIndex]) {
          handleScrapItem(selectedInvIndex);
        }
      } else if (e.key === 'Escape') {
        // Exit to main deck with fold animation
        setIsFoldAnimating(true);
        setTimeout(() => {
          onBackToDeck();
        }, 150);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedInvIndex, inventory, handleInstallMod, handleScrapItem, onBackToDeck, audio]);

  // Filtered inventory slots
  const filteredInventory = useMemo(() => {
    return inventory.map((item, originalIdx) => ({ item, originalIdx }));
  }, [inventory]);

  const selectedInventoryItem = selectedInvIndex !== null ? inventory[selectedInvIndex] : null;

  return (
    <div className="relative w-screen h-screen bg-[#06090e] text-[#d8e2dc] font-mono overflow-hidden select-none flex flex-col justify-between">
      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-16 right-8 z-50 bg-cyan-950/95 border border-cyan-400 px-4 py-2 text-xs text-cyan-300 shadow-[0_0_20px_rgba(0,255,170,0.5)]">
          &gt; {notification}
        </div>
      )}

      {/* CRT Scanline Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-75"
      />

      {/* ========================================================================= */}
      {/* ARSENAL-HEADER: RESSOURCEN & AUSRÜSTUNGS-STATUS */}
      {/* ========================================================================= */}
      <header className="relative z-30 h-14 px-4 sm:px-6 flex items-center justify-between border-b border-cyan-900/60 bg-[#070b10] text-xs text-cyan-400 shrink-0">
        <div className="flex items-center gap-3 sm:gap-6 truncate">
          <div className="flex items-center gap-2 font-bold tracking-widest text-[#00FFAA]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FFAA] animate-pulse" />
            ASTRAEA FORGE-LINK // CAD-SUBSYSTEM v4.2
          </div>
          <span className="hidden md:inline text-cyan-600">// AUTORISIERUNG: OPERATIVE VANCE</span>
        </div>

        {/* Resources Telemetry */}
        <div className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-xs">
          <div className="px-2.5 py-1 bg-cyan-950/40 border border-cyan-800/60">
            <span className="text-cyan-500/70">TITAN-NANITEN:</span>{' '}
            <strong className="text-[#00FFAA] font-bold">{player.nanites} TN</strong>
          </div>
          <div className="px-2.5 py-1 bg-cyan-950/40 border border-cyan-800/60">
            <span className="text-cyan-500/70">CHRONO-KRISTALLE:</span>{' '}
            <strong className="text-amber-400 font-bold">{player.chronoCrystals} CK</strong>
          </div>
          <div className="hidden sm:flex px-2.5 py-1 bg-cyan-950/40 border border-cyan-800/60">
            <span className="text-cyan-500/70">CREDITS:</span>{' '}
            <strong className="text-gray-100 font-bold">{player.credits} AC</strong>
          </div>
          <div className="px-2.5 py-1 bg-cyan-950/40 border border-cyan-800/60">
            <span className="text-cyan-500/70">RIG:</span>{' '}
            <strong className="text-cyan-300 font-bold">{player.rigIntegrity}%</strong>
          </div>
          <button
            onClick={() => {
              setIsFoldAnimating(true);
              setTimeout(() => onBackToDeck(), 150);
            }}
            className="px-3 py-1 bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold hover:bg-cyan-500 hover:text-black transition-colors"
          >
            [ESC / DECK]
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3-SPALTEN-MASTER-GRID (SPALTE 1: INVENTAR // SPALTE 2: CAD // SPALTE 3: STATS) */}
      {/* ========================================================================= */}
      <main className="relative flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* ----------------------------------------------------------------------- */}
        {/* SPALTE 1: INVENTAR & AUSRÜSTUNGS-SLOTS (3 SPALTEN // 25% BREITE) */}
        {/* ----------------------------------------------------------------------- */}
        <section className="lg:col-span-3 border-r border-cyan-900/60 bg-[#070a0f] p-3 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Top Sub-Tab Selector: Primärwaffe / Drohne / Exoskelett */}
            <div className="grid grid-cols-3 gap-1 mb-3 text-[10px] font-bold">
              {[
                { id: 'WEAPON' as const, label: 'WAFFE' },
                { id: 'DRONE' as const, label: 'DROHNE' },
                { id: 'EXOSUIT' as const, label: 'EXO-RIG' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id);
                    audio.playHoverPing();
                  }}
                  className={`py-1.5 border text-center cursor-pointer transition-colors ${
                    activeTab === t.id
                      ? 'border-cyan-400 bg-cyan-950/70 text-cyan-300 font-bold'
                      : 'border-cyan-900/40 bg-black/40 text-gray-400 hover:border-cyan-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Weapon Selector */}
            {activeTab === 'WEAPON' && (
              <div className="space-y-1.5 mb-3">
                <button
                  onClick={() => {
                    setActiveWeapon(STARTER_PRIMARY_WEAPON);
                    audio.playSelectClick();
                  }}
                  className={`w-full p-2 text-left border flex items-center justify-between text-xs cursor-pointer ${
                    activeWeapon.id === 'arc-70'
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300'
                      : 'border-cyan-900/50 bg-black/30 text-gray-400 hover:border-cyan-700'
                  }`}
                >
                  <div>
                    <div className="font-bold">PRIMÄR: ARC-70 IMPULS</div>
                    <div className="text-[10px] opacity-70">Sturm-Karabiner // 36 Schuss</div>
                  </div>
                  <span className="text-[10px] text-cyan-400 border border-cyan-800 px-1.5 py-0.5">AKTIV</span>
                </button>

                <button
                  onClick={() => {
                    setActiveWeapon(STARTER_SECONDARY_WEAPON);
                    audio.playSelectClick();
                  }}
                  className={`w-full p-2 text-left border flex items-center justify-between text-xs cursor-pointer ${
                    activeWeapon.id === 'volt-pistol'
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300'
                      : 'border-cyan-900/50 bg-black/30 text-gray-400 hover:border-cyan-700'
                  }`}
                >
                  <div>
                    <div className="font-bold">SEKUNDÄR: VOLT-PISTOLE</div>
                    <div className="text-[10px] opacity-70">Kompakte Energie-Waffe // 18 Schuss</div>
                  </div>
                  <span className="text-[10px] text-gray-500 border border-gray-800 px-1.5 py-0.5">BEREIT</span>
                </button>
              </div>
            )}

            {/* Tactical Drone Subsystem View */}
            {activeTab === 'DRONE' && (
              <div className="p-3 bg-cyan-950/20 border border-cyan-800/60 mb-3 space-y-2 text-xs">
                <div className="flex justify-between items-center text-[10px] text-cyan-400 font-bold border-b border-cyan-900 pb-1">
                  <span>DROHNEN-CHASSIS: {drone.name}</span>
                  <span>HP: {drone.hullHp}/{drone.maxHullHp}</span>
                </div>
                <div className="text-[11px] text-gray-300">
                  Autonomie: <strong>{drone.batteryRounds} Runden / Ladezyklus</strong>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] text-cyan-500 font-bold">PROTOKOLL-EINSTELLUNG:</div>
                  {[
                    { id: 'SHIELD_LINK' as DroneBehaviorMode, label: 'SCHILD-LINK', desc: '+25 Schild-Regen / Runde' },
                    { id: 'DEFENSE_TURRET' as DroneBehaviorMode, label: 'ABWEHR-TURM', desc: 'Sperrfeuer im 3-Felder-Radius' },
                    { id: 'EMP_MINE' as DroneBehaviorMode, label: 'EMP-MINE', desc: 'Detoniert mit 2 Runden Stasis' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setDrone((prev) => ({ ...prev, behaviorMode: m.id }));
                        audio.playSelectClick();
                      }}
                      className={`w-full p-2 border text-left cursor-pointer transition-colors ${
                        drone.behaviorMode === m.id
                          ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 font-bold'
                          : 'border-cyan-900/40 bg-black/40 text-gray-400 hover:border-cyan-700'
                      }`}
                    >
                      <div className="text-xs">[{drone.behaviorMode === m.id ? '•' : ' '}] {m.label}</div>
                      <div className="text-[10px] opacity-75">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Exosuit Info View */}
            {activeTab === 'EXOSUIT' && (
              <div className="p-3 bg-cyan-950/20 border border-cyan-800/60 mb-3 space-y-2 text-xs">
                <div className="text-cyan-400 font-bold border-b border-cyan-900 pb-1 text-[11px]">
                  TITAN-EXOHARNISCH MK-IV
                </div>
                <div className="space-y-1 text-[11px] text-gray-300">
                  <div>&bull; Kinetischer Schild: <strong>150 MJ Kapazität</strong></div>
                  <div>&bull; Schild-Absorption: <strong>100% Kinetik</strong></div>
                  <div>&bull; Absorptionsrate: <strong>+25 MJ / Runde</strong></div>
                  <div>&bull; Status: <strong className="text-emerald-400">OPTIMAL ({player.rigIntegrity}%)</strong></div>
                </div>
              </div>
            )}

            {/* 24-Slot Inventory Matrix */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-cyan-500 font-bold border-b border-cyan-950 pb-1">
                <span>INVENTAR-RASTER (4x6 // 24 SLOTS)</span>
                <span>TASTE [E] INSTALLIERT</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 p-1 bg-black/50 border border-cyan-900/50">
                {filteredInventory.map(({ item, originalIdx }) => {
                  const isSelected = selectedInvIndex === originalIdx;
                  const rarity = item ? RARITY_COLORS[item.rarity] : null;

                  return (
                    <button
                      key={originalIdx}
                      onClick={() => {
                        setSelectedInvIndex(originalIdx);
                        audio.playHoverPing();
                      }}
                      className={`h-14 border flex flex-col items-center justify-between p-1 transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-white bg-cyan-950/80 shadow-[0_0_10px_rgba(0,255,170,0.4)]'
                          : item
                          ? `${rarity?.border} ${rarity?.bg} hover:border-cyan-400`
                          : 'border-cyan-950 bg-black/30 hover:border-cyan-800'
                      }`}
                    >
                      <span className="text-[8px] text-gray-400 self-start">#{originalIdx + 1}</span>
                      {item ? (
                        <>
                          <div className={`text-[9px] font-bold text-center leading-tight truncate w-full ${rarity?.text}`}>
                            {item.name.slice(0, 8)}
                          </div>
                          <span className="text-[7px] text-cyan-500/80 uppercase font-mono">
                            {item.slot}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-700 text-xs self-center my-auto">+</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Inventory Item Quick Actions */}
          {selectedInventoryItem ? (
            <div className="p-3 bg-black/60 border border-cyan-800/80 text-xs space-y-2 mt-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs font-bold text-cyan-300">{selectedInventoryItem.name}</div>
                  <div className="text-[10px] text-gray-400">{selectedInventoryItem.description}</div>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 border ${RARITY_COLORS[selectedInventoryItem.rarity].border} ${RARITY_COLORS[selectedInventoryItem.rarity].text}`}>
                  {selectedInventoryItem.rarity}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[10px] text-cyan-400/90 pt-1 border-t border-cyan-950">
                {selectedInventoryItem.stats.damageBonus !== 0 && (
                  <div>DMG: +{selectedInventoryItem.stats.damageBonus}</div>
                )}
                {selectedInventoryItem.stats.rpmBonus !== 0 && (
                  <div>RPM: +{selectedInventoryItem.stats.rpmBonus}</div>
                )}
                {selectedInventoryItem.stats.critChanceBonus !== 0 && (
                  <div>CRIT: +{Math.round(selectedInventoryItem.stats.critChanceBonus * 100)}%</div>
                )}
                {selectedInventoryItem.stats.spreadReduction !== 0 && (
                  <div>STREUUNG: -{Math.round(selectedInventoryItem.stats.spreadReduction * 100)}%</div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleInstallMod(selectedInvIndex!)}
                  className="flex-1 py-1.5 bg-[#00FFAA] text-black font-bold text-[10px] hover:bg-white tracking-wider"
                >
                  [E] INSTALLIEREN
                </button>
                <button
                  onClick={() => handleScrapItem(selectedInvIndex!)}
                  className="px-2 py-1.5 bg-red-950/60 border border-red-500 text-red-300 font-bold text-[10px] hover:bg-red-600 hover:text-white"
                  title="Zerlegen"
                >
                  [X] ZERLEGEN (+{selectedInventoryItem.scrapYield} TN)
                </button>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-gray-500 text-center p-3 border border-cyan-950">
              WÄHLE EIN INVENTAR-FELD ZUR INSPEKTION
            </div>
          )}
        </section>

        {/* ----------------------------------------------------------------------- */}
        {/* SPALTE 2: CAD-BAUPLAN-CANVAS (6 SPALTEN // 50% BREITE) */}
        {/* ----------------------------------------------------------------------- */}
        <section className="lg:col-span-6 relative border-r border-cyan-900/60 bg-[#06080d] flex flex-col overflow-hidden">
          {/* Sockets Quick Navigation Bar */}
          <div className="h-10 px-3 bg-[#080c12] border-b border-cyan-900/60 flex items-center justify-between text-[11px] text-cyan-400">
            <span className="font-bold tracking-widest text-[10px]">
              SOCKEL-MATRIX [1-6]:
            </span>
            <div className="flex gap-1">
              {(['barrel', 'optic', 'body', 'magazine', 'stock', 'catalyst'] as WeaponSlotType[]).map((s, idx) => {
                const isSelected = selectedSlot === s;
                const isEquipped = !!activeWeapon.installedMods[s];
                return (
                  <button
                    key={s}
                    onClick={() => {
                      setSelectedSlot(s);
                      audio.playHoverPing();
                    }}
                    className={`px-2 py-0.5 border text-[10px] font-mono cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950 text-cyan-300 font-bold'
                        : isEquipped
                        ? 'border-cyan-700 bg-black/40 text-cyan-400'
                        : 'border-gray-800 bg-black/30 text-gray-600 hover:border-cyan-800'
                    }`}
                  >
                    [{idx + 1}] {s.slice(0, 3).toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive CAD Canvas Viewport */}
          <div className="relative flex-1 w-full min-h-[360px]">
            <WeaponBlueprintCanvas
              weapon={activeWeapon}
              selectedSocketId={selectedSlot}
              onSelectSocket={(s) => setSelectedSlot(s)}
              isFoldAnimating={isFoldAnimating}
            />
          </div>

          {/* Selected Socket Inspector Tray */}
          {selectedSlot && (
            <div className="h-28 p-3 bg-[#090d14] border-t border-cyan-900/60 flex items-center justify-between text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-500 font-bold text-[10px] tracking-widest uppercase">
                    SOCKEL: [{selectedSlot.toUpperCase()}]
                  </span>
                  <span
                    className={`px-1.5 py-0.2 border text-[9px] font-bold ${
                      activeWeapon.installedMods[selectedSlot]
                        ? 'bg-cyan-950 text-[#00FFAA] border-cyan-500'
                        : 'bg-black text-gray-500 border-gray-800'
                    }`}
                  >
                    {activeWeapon.installedMods[selectedSlot] ? 'BELEGT' : 'LEER'}
                  </span>
                </div>

                {activeWeapon.installedMods[selectedSlot] ? (
                  <>
                    <div className="font-bold text-gray-200">
                      {activeWeapon.installedMods[selectedSlot]?.name}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {activeWeapon.installedMods[selectedSlot]?.description}
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] text-gray-500">
                    Kein Modul installiert. Wähle ein kompatibles Modul im Inventar links aus.
                  </div>
                )}
              </div>

              {activeWeapon.installedMods[selectedSlot] && (
                <button
                  onClick={() => handleUninstallMod(selectedSlot)}
                  className="px-3 py-2 bg-red-950/40 border border-red-500 text-red-300 font-bold text-[11px] hover:bg-red-600 hover:text-white transition-colors"
                >
                  MODUL AUSBAUEN
                </button>
              )}
            </div>
          )}
        </section>

        {/* ----------------------------------------------------------------------- */}
        {/* SPALTE 3: STAT-ANALYSE & NANITEN-SCHMIEDE (3 SPALTEN // 25% BREITE) */}
        {/* ----------------------------------------------------------------------- */}
        <section className="lg:col-span-3 bg-[#070b10] p-4 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Stat Analysis Block */}
            <div className="border-b border-cyan-900/60 pb-3 mb-4">
              <div className="text-xs font-bold text-cyan-400 tracking-wider mb-2">
                [BALLISTIK- &amp; DPS-ANALYSE]
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Kinetic DPS */}
                <div className="p-2.5 bg-black/50 border border-cyan-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-cyan-500/80 font-bold">KINETIK-DPS</div>
                    <div className="text-xl font-black text-[#00FFAA]">{calculatedStats.kineticDps}</div>
                  </div>
                  <div className="text-[10px] text-right text-gray-400">
                    <div>SCHADEN: <strong className="text-white">{calculatedStats.effectiveDamage}</strong></div>
                    <div>CRIT: <strong className="text-white">{Math.round(calculatedStats.effectiveCritChance * 100)}%</strong></div>
                  </div>
                </div>

                {/* Fire Rate & Mag */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-black/40 border border-cyan-950">
                    <div className="text-[10px] text-gray-400">FEUERRATE</div>
                    <div className="font-bold text-cyan-300">{calculatedStats.effectiveRpm} S/m</div>
                  </div>
                  <div className="p-2 bg-black/40 border border-cyan-950">
                    <div className="text-[10px] text-gray-400">MAGAZIN</div>
                    <div className="font-bold text-cyan-300">{calculatedStats.magSize} Schuss</div>
                  </div>
                </div>

                {/* Heat & Spread */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-black/40 border border-cyan-950">
                    <div className="text-[10px] text-gray-400">ABKÜHLZEIT</div>
                    <div className="font-bold text-cyan-300">{calculatedStats.heatCooldown.toFixed(1)}s</div>
                  </div>
                  <div className="p-2 bg-black/40 border border-cyan-950">
                    <div className="text-[10px] text-gray-400">STREUUNG</div>
                    <div className="font-bold text-cyan-300">{(calculatedStats.spreadVal * 10).toFixed(1)}°</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Naniten-Schmiede Actions */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-cyan-400 tracking-wider">
                [NANITEN-SCHMIEDE // ACTIONS]
              </div>

              {selectedInventoryItem ? (
                <div className="space-y-2 p-3 bg-black/40 border border-cyan-900/60 text-xs">
                  <div className="text-[11px] text-gray-200 font-bold">
                    FOKUSSIERT: {selectedInventoryItem.name}
                  </div>

                  {/* Overclock Action */}
                  <button
                    onClick={() => handleOverclockMod(selectedInvIndex!)}
                    className="w-full py-2.5 bg-cyan-950 border border-cyan-400 text-cyan-300 font-bold hover:bg-cyan-500 hover:text-black transition-colors text-[11px] cursor-pointer"
                  >
                    [1] MODUL VEREDELN (OVERCLOCK)
                    <div className="text-[9px] font-normal opacity-80 mt-0.5">
                      Kosten: 120 TN + 1 CK // Chance: 80%
                    </div>
                  </button>

                  {/* Scrap Action */}
                  <button
                    onClick={() => handleScrapItem(selectedInvIndex!)}
                    className="w-full py-2 bg-red-950/40 border border-red-500/80 text-red-300 font-bold hover:bg-red-600 hover:text-white transition-colors text-[11px] cursor-pointer"
                  >
                    [2] SCHROTT DEMONTIEREN (SCRAP)
                    <div className="text-[9px] font-normal opacity-80 mt-0.5">
                      Ertrag: +{selectedInventoryItem.scrapYield} Titan-Naniten
                    </div>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-black/30 border border-cyan-950 text-[11px] text-gray-400 text-center leading-relaxed">
                  Wähle ein Modul im Inventar, um Schmiede-Operationen (Veredelung, Zerlegen) durchzuführen.
                </div>
              )}
            </div>
          </div>

          {/* Quick Return to Main Deck */}
          <div className="pt-3 border-t border-cyan-950">
            <button
              onClick={() => {
                setIsFoldAnimating(true);
                setTimeout(() => onBackToDeck(), 150);
              }}
              className="w-full py-3 bg-[#00FFAA] text-black font-bold tracking-widest text-xs hover:bg-white transition-colors text-center"
            >
              [ &lt; ] ZUM TAKTISCHEN HAUPTDECK (ESC)
            </button>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* ARSENAL-FOOTER: BEFEHLS-DOCK */}
      {/* ========================================================================= */}
      <footer className="relative z-30 h-12 px-4 sm:px-6 flex items-center justify-between border-t border-cyan-900/60 bg-[#070b10] text-[10px] sm:text-xs text-cyan-400 shrink-0">
        <div className="flex items-center gap-4 text-gray-400">
          <span>[1-6] SOCKEL WÄHLEN</span>
          <span className="hidden sm:inline">[E] INSTALLIEREN</span>
          <span className="hidden md:inline">[X] ZERLEGEN</span>
          <span className="hidden lg:inline">[TAB] REITER WECHSELN</span>
          <span>[ESC] HAUPTDECK</span>
        </div>

        <div className="text-cyan-500/80">
          NANITEN-INJEKTOR: <strong className="text-[#00FFAA]">BEREIT</strong> // 60 FPS
        </div>
      </footer>
    </div>
  );
};
