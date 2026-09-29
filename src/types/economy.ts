// types/economy.ts - Datenstrukturen für das Progressions- & Wirtschaftssystem (SYS-ECON-13)

export type ItemCategory = 'MOD' | 'AMMO' | 'CRATE' | 'STIM';
export type ItemRarity = 'STANDARD' | 'VERSTÄRKT' | 'ASTRAEA_SPEC' | 'ENTROPISCH' | 'APEX';

export interface IMerchantItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  basePriceCredits: number;
  basePriceNanites: number;
  basePriceCrystals: number;
  requiredLevel: number;
  stock: number;
  rarity: ItemRarity;
  slot?: 'BARREL' | 'MAGAZINE' | 'RECEIVER' | 'CORE' | 'CONSUMABLE';
  statBonus?: string;
}

export type MerchantId = 'ASTRAEA_OFFICER' | 'FREE_VECTOR' | 'HERETIC_CULT';

export interface IMerchant {
  id: MerchantId;
  name: string;
  title: string;
  factionId: 'ASTRAEA' | 'HERETICS' | 'GUILD';
  description: string;
  callsign: string;
  avatarIcon: string;
  inventory: IMerchantItem[];
}

export interface IResearchNode {
  id: string;
  title: string;
  description: string;
  costCrystals: number;
  unlocked: boolean;
  requiredNodeId: string | null;
  tier: number;
  x: number; // Normalized 0..1 coordinates for canvas rendering
  y: number;
  effect: {
    stat: 'MAX_HP' | 'MAX_SHIELD' | 'AP_START' | 'NANITE_BOOST' | 'REWINDS' | 'SPREAD_REDUCTION' | 'OVERCLOCK_CHANCE' | 'CRIT_CHANCE' | 'HEAT_REDUCTION';
    value: number;
    label: string;
  };
}

export interface IPlayerWallet {
  credits: number;
  nanites: number;
  chronoCrystals: number;
  level: number;
  currentXp: number;
  pityCounterCrates: number;
}

export interface IEconomyState {
  wallet: IPlayerWallet;
  activeMerchantId: MerchantId;
  researchNodes: IResearchNode[];
  inventory: Array<{
    item: IMerchantItem;
    quantity: number;
  }>;
}

export interface ICrateDrop {
  item: IMerchantItem;
  rarity: ItemRarity;
  isGuaranteedApex: boolean;
  newPity: number;
}
