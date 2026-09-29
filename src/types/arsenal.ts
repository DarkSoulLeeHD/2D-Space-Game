// types/arsenal.ts - Datenstrukturen für Waffen, Module, Drohnen und Inventar

export type ItemRarity = 'STANDARD' | 'VERSTÄRKT' | 'ASTRAEA_SPEC' | 'ENTROPISCH' | 'APEX';

export type WeaponSlotType = 'barrel' | 'optic' | 'magazine' | 'stock' | 'catalyst' | 'body';

export interface IWeaponMod {
  id: string;
  name: string;
  slot: WeaponSlotType;
  rarity: ItemRarity;
  description: string;
  stats: {
    damageBonus: number;     // z.B. +14
    rpmBonus: number;        // z.B. +80
    critChanceBonus: number; // z.B. +0.08 (8%)
    heatReduction: number;   // z.B. 0.15 (15% weniger Hitze)
    spreadReduction: number; // z.B. 0.20 (20% weniger Streuung)
  };
  scrapYield: number;        // Naniten-Ertrag beim Zerlegen
}

export interface IWeaponChassis {
  id: string;
  name: string;
  typeLabel: string;
  baseDamage: number;
  baseRpm: number;
  baseMagSize: number;
  baseCritChance: number;
  baseHeatCooldown: number; // Sekunden
  installedMods: {
    barrel?: IWeaponMod;
    optic?: IWeaponMod;
    magazine?: IWeaponMod;
    stock?: IWeaponMod;
    catalyst?: IWeaponMod;
    body?: IWeaponMod;
  };
}

export type DroneBehaviorMode = 'SHIELD_LINK' | 'DEFENSE_TURRET' | 'EMP_MINE';

export interface IDroneState {
  id: string;
  name: string;
  hullHp: number;
  maxHullHp: number;
  batteryRounds: number;
  maxBatteryRounds: number;
  behaviorMode: DroneBehaviorMode;
}

export interface IInventoryState {
  items: (IWeaponMod | null)[]; // 24 Slots
  activeWeapon: IWeaponChassis;
  secondaryWeapon: IWeaponChassis;
  drone: IDroneState;
  nanites: number;
  chronoCrystals: number;
  credits: number;
}

export const RARITY_COLORS: Record<ItemRarity, {
  text: string;
  border: string;
  bg: string;
  label: string;
}> = {
  STANDARD: {
    text: 'text-gray-300',
    border: 'border-gray-600',
    bg: 'bg-gray-800/30',
    label: 'STANDARD',
  },
  VERSTÄRKT: {
    text: 'text-emerald-400',
    border: 'border-emerald-500',
    bg: 'bg-emerald-950/30',
    label: 'VERSTÄRKT',
  },
  ASTRAEA_SPEC: {
    text: 'text-cyan-400',
    border: 'border-cyan-400',
    bg: 'bg-cyan-950/30',
    label: 'ASTRAEA SPEC',
  },
  ENTROPISCH: {
    text: 'text-purple-400',
    border: 'border-purple-500',
    bg: 'bg-purple-950/30',
    label: 'ENTROPISCH',
  },
  APEX: {
    text: 'text-amber-400',
    border: 'border-amber-400',
    bg: 'bg-amber-950/30',
    label: 'APEX KERN',
  },
};
