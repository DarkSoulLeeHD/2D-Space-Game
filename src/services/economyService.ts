// services/economyService.ts - Mathematische Wirtschafts-Engine, Dynamische Bepreisung & Meta-Progression

import {
  IMerchant,
  IMerchantItem,
  IPlayerWallet,
  IResearchNode,
  MerchantId,
  ItemRarity,
  ICrateDrop,
} from '../types/economy';
import { CloudPersistenceService } from './supabaseClient';

const WALLET_STORAGE_KEY = 'chrono_wallet_v13';
const RESEARCH_STORAGE_KEY = 'chrono_research_v13';
const INVENTORY_STORAGE_KEY = 'chrono_inventory_v13';

// 1. Initialer 12-Knoten Meta-Forschungsbaum mit Canvas-Koordinaten (Tier 0 bis 5)
export const INITIAL_RESEARCH_NODES: IResearchNode[] = [
  {
    id: 'ORIGIN',
    title: 'KERN-STABILITÄT',
    description: 'Neuronale Basissynchronisation des Klon-Speichers.',
    costCrystals: 0,
    unlocked: true,
    requiredNodeId: null,
    tier: 0,
    x: 0.5,
    y: 0.08,
    effect: {
      stat: 'MAX_HP',
      value: 0,
      label: 'Basis-Systeme online',
    },
  },
  // Tier 1
  {
    id: 'NANITE_MAGNET',
    title: '1. NANITEN-MAGNET',
    description: 'Magnetische Erntevorrichtung zieht Schrott automatisch an.',
    costCrystals: 2,
    unlocked: false,
    requiredNodeId: 'ORIGIN',
    tier: 1,
    x: 0.22,
    y: 0.25,
    effect: {
      stat: 'NANITE_BOOST',
      value: 15,
      label: '+15% Naniten bei Feindvernichtung',
    },
  },
  {
    id: 'SHIELD_EXPANDER',
    title: '2. SCHILD-EXPANDER',
    description: 'Erweiterte Plasma-Kavitäten erhöhen die Schildkapazität.',
    costCrystals: 2,
    unlocked: false,
    requiredNodeId: 'ORIGIN',
    tier: 1,
    x: 0.5,
    y: 0.25,
    effect: {
      stat: 'MAX_SHIELD',
      value: 25,
      label: '+25 Max-Schildenergie',
    },
  },
  {
    id: 'BIO_EFFICIENCY',
    title: '3. BIO-EFFIZIENZ',
    description: 'Optimierte Zellrezeptoren verarbeiten Med-Stims effektiver.',
    costCrystals: 2,
    unlocked: false,
    requiredNodeId: 'ORIGIN',
    tier: 1,
    x: 0.78,
    y: 0.25,
    effect: {
      stat: 'MAX_HP',
      value: 15,
      label: 'Med-Stims heilen +15 zusätzliche HP',
    },
  },
  // Tier 2
  {
    id: 'RECOIL_DAMPER',
    title: '4. RECOIL-DÄMPFER',
    description: 'Hydraulische Gelenkstabilisierung minimiert Projektil-Streuung.',
    costCrystals: 5,
    unlocked: false,
    requiredNodeId: 'NANITE_MAGNET',
    tier: 2,
    x: 0.22,
    y: 0.44,
    effect: {
      stat: 'SPREAD_REDUCTION',
      value: 20,
      label: '-20% Streuung auf dem Taktik-Grid',
    },
  },
  {
    id: 'OVERCLOCK_CHANCE',
    title: '5. OVERCLOCK-CHANCE',
    description: 'Verbesserte Hitzeverträglichkeit der Waffen-Schmiede.',
    costCrystals: 5,
    unlocked: false,
    requiredNodeId: 'SHIELD_EXPANDER',
    tier: 2,
    x: 0.5,
    y: 0.44,
    effect: {
      stat: 'OVERCLOCK_CHANCE',
      value: 15,
      label: '+15% Erfolgschance beim Schmieden',
    },
  },
  {
    id: 'CHRONO_ANCHOR',
    title: '6. CHRONO-ANKER',
    description: 'Verstärkte Tachyon-Fasern ermöglichen zusätzlichen Zeitsprung.',
    costCrystals: 6,
    unlocked: false,
    requiredNodeId: 'BIO_EFFICIENCY',
    tier: 2,
    x: 0.78,
    y: 0.44,
    effect: {
      stat: 'REWINDS',
      value: 1,
      label: 'Startet jeden Einsatz mit +1 Chrono-Rewind',
    },
  },
  // Tier 3
  {
    id: 'TACTICAL_SCANNER',
    title: '7. TAKTISCHER SCANNER',
    description: 'Prädiktive Schwachstellenanalyse deckt vitale Feind-Sensoren auf.',
    costCrystals: 8,
    unlocked: false,
    requiredNodeId: 'RECOIL_DAMPER',
    tier: 3,
    x: 0.22,
    y: 0.63,
    effect: {
      stat: 'CRIT_CHANCE',
      value: 10,
      label: '+10% Kritische Trefferchance',
    },
  },
  {
    id: 'PHASE_ABSORBER',
    title: '8. PHASEN-ABSORBER',
    description: 'Streu-Barrieren dissipieren Strahlung und Elementarentladungen.',
    costCrystals: 8,
    unlocked: false,
    requiredNodeId: 'OVERCLOCK_CHANCE',
    tier: 3,
    x: 0.5,
    y: 0.63,
    effect: {
      stat: 'MAX_SHIELD',
      value: 30,
      label: '+30 Schild & Schutz vor Strahlungsbrand',
    },
  },
  {
    id: 'ENTROPY_CATALYST',
    title: '9. ENTROPIE-KATALYSATOR',
    description: 'Resonanzwellen verstärken Schäden an zeitverzerrten Zielen.',
    costCrystals: 10,
    unlocked: false,
    requiredNodeId: 'CHRONO_ANCHOR',
    tier: 3,
    x: 0.78,
    y: 0.63,
    effect: {
      stat: 'NANITE_BOOST',
      value: 20,
      label: '+20% Schaden an geschwächten Feinden',
    },
  },
  // Tier 4
  {
    id: 'QUANTUM_COOLING',
    title: '10. QUANTUM-KÜHLUNG',
    description: 'Kryogene Mikroleiter kühlen Energiewaffen nach jedem Schuss.',
    costCrystals: 12,
    unlocked: false,
    requiredNodeId: 'TACTICAL_SCANNER',
    tier: 4,
    x: 0.35,
    y: 0.80,
    effect: {
      stat: 'HEAT_REDUCTION',
      value: 25,
      label: '-25% Waffen-Überhitzung pro Schuss',
    },
  },
  {
    id: 'CAUSAL_RESONANCE',
    title: '11. KAUSAL-RESONANZ',
    description: 'Die temporale Rückkopplung regeneriert Schilde im Moment des Rewinds.',
    costCrystals: 15,
    unlocked: false,
    requiredNodeId: 'ENTROPY_CATALYST',
    tier: 4,
    x: 0.65,
    y: 0.80,
    effect: {
      stat: 'REWINDS',
      value: 1,
      label: 'Chrono-Rewind stellt sofort 35% Schild her',
    },
  },
  // Tier 5 - Apex Apex
  {
    id: 'NEURAL_MASTERPIECE',
    title: '12. NEURALES MEISTERSTÜCK',
    description: 'Perfektionierte Synapsen-Verknüpfung der Astraea-Kommando-Matrix.',
    costCrystals: 25,
    unlocked: false,
    requiredNodeId: 'PHASE_ABSORBER',
    tier: 5,
    x: 0.5,
    y: 0.94,
    effect: {
      stat: 'AP_START',
      value: 1,
      label: 'PERMANENT +1 AKTIONSPUNKT (AP) PRO RUNDE!',
    },
  },
];

// 2. Die Händler-Kataloge
export const MERCHANTS: IMerchant[] = [
  {
    id: 'ASTRAEA_OFFICER',
    name: 'QUARTIERMEISTER KAELEN',
    title: 'Astraea-Militär-Depot // Deck 04',
    factionId: 'ASTRAEA',
    description: 'Strikter Verwalter offizieller Flottenreserven. Verlangt militärische Disziplin und Loyalität.',
    callsign: 'DEPOT-41',
    avatarIcon: '🛡️',
    inventory: [
      {
        id: 'MOD_WOLFRAM_COMP',
        name: '[T3] WOLFRAM-KOMPENSATOR',
        description: 'Schwerer Legierungslauf, mindert Rückstoß drastisch.',
        category: 'MOD',
        slot: 'BARREL',
        basePriceCredits: 850,
        basePriceNanites: 450,
        basePriceCrystals: 0,
        requiredLevel: 2,
        stock: 3,
        rarity: 'ASTRAEA_SPEC',
        statBonus: '+14 DMG // -15% Streuung',
      },
      {
        id: 'MOD_MAG_COUPLER',
        name: '[T2] MAG-KOPPLER (45 SCHUSS)',
        description: 'Trommelmagazin für ausgedehnte Salvenfeuer-Phasen.',
        category: 'MOD',
        slot: 'MAGAZINE',
        basePriceCredits: 620,
        basePriceNanites: 320,
        basePriceCrystals: 0,
        requiredLevel: 1,
        stock: 5,
        rarity: 'VERSTÄRKT',
        statBonus: '+15 Schuss Magazinkapazität',
      },
      {
        id: 'AMMO_KINETIC_PACK',
        name: 'FLOTTEN-KINETIK-BOX (200x)',
        description: 'Genormte panzerbrechende Munition für Railguns & Karabiner.',
        category: 'AMMO',
        basePriceCredits: 250,
        basePriceNanites: 60,
        basePriceCrystals: 0,
        requiredLevel: 1,
        stock: 20,
        rarity: 'STANDARD',
        statBonus: '+200 Kinetik-Geschosse',
      },
      {
        id: 'STIM_SHIELD_CELL',
        name: 'ASTRAEA NANO-SCHILDZELLE',
        description: 'Lädt 75 Schildpunkte im Gefecht sofort auf.',
        category: 'STIM',
        basePriceCredits: 380,
        basePriceNanites: 90,
        basePriceCrystals: 0,
        requiredLevel: 1,
        stock: 8,
        rarity: 'STANDARD',
        statBonus: '+75 Sofort-Schildenergie',
      },
      {
        id: 'MOD_TITAN_RECEIVER',
        name: '[T4] TITAN-GEHÄUSE REINFORCED',
        description: 'Militärischer Hochleistungs-Verschluss mit Partikelfilter.',
        category: 'MOD',
        slot: 'RECEIVER',
        basePriceCredits: 1400,
        basePriceNanites: 800,
        basePriceCrystals: 2,
        requiredLevel: 5,
        stock: 1,
        rarity: 'ASTRAEA_SPEC',
        statBonus: '+22 DMG // +10% Krit-Rate',
      },
    ],
  },
  {
    id: 'FREE_VECTOR',
    name: 'SCHWARZMARKT-VEKTOR „VEX“',
    title: 'Der Freie Vektor // Schmuggel-Schleuse 07',
    factionId: 'GUILD',
    description: 'Zwielichtige Händlerin ohne Loyalität. Verkauft modifizierte Schwarzmarkt-Tech und seltene Anomalie-Beute.',
    callsign: 'NULL-VEX',
    avatarIcon: '👁️',
    inventory: [
      {
        id: 'CRATE_MYSTERY',
        name: '[MYSTERY-FRACHT-KISTE]',
        description: 'Ungeöffnete Bergungskiste aus den Tiefen von Sektor 09. Garantiert APEX nach 4 Nieten!',
        category: 'CRATE',
        basePriceCredits: 500,
        basePriceNanites: 200,
        basePriceCrystals: 10,
        requiredLevel: 1,
        stock: 99,
        rarity: 'APEX',
        statBonus: 'Zufälliges T3/T4 Modul (Pity-System aktiv)',
      },
      {
        id: 'MOD_TACHYON_COIL',
        name: '[T4] TACHYON-SPULE ILLEGAL',
        description: 'Übertakteter Energiefilter. Ignoriert 50% gegnerische Panzerung.',
        category: 'MOD',
        slot: 'CORE',
        basePriceCredits: 1200,
        basePriceNanites: 650,
        basePriceCrystals: 4,
        requiredLevel: 4,
        stock: 2,
        rarity: 'ENTROPISCH',
        statBonus: '+28 DMG // 50% Rüstungsdurchschlag',
      },
      {
        id: 'AMMO_URANIUM_SLUGS',
        name: 'GEQUETSCHTE ABG. URAN-GESCHOSSE',
        description: 'Hinterlässt giftige Strahlungswolke auf Einschlagkachel.',
        category: 'AMMO',
        basePriceCredits: 420,
        basePriceNanites: 150,
        basePriceCrystals: 1,
        requiredLevel: 2,
        stock: 12,
        rarity: 'VERSTÄRKT',
        statBonus: 'Strahlungs-Dot // +18 Kinetikschaden',
      },
      {
        id: 'STIM_NEURO_RUSH',
        name: 'ADRENALIN-NEUROSTIMULANS',
        description: 'Verleiht für 2 Runden +2 zusätzliche Aktionspunkte (AP).',
        category: 'STIM',
        basePriceCredits: 550,
        basePriceNanites: 120,
        basePriceCrystals: 1,
        requiredLevel: 3,
        stock: 6,
        rarity: 'VERSTÄRKT',
        statBonus: '+2 AP für 2 Züge',
      },
    ],
  },
  {
    id: 'HERETIC_CULT',
    name: 'KETZER-SCHAMANE ORAN',
    title: 'Bio-Transmutation // Resonanz-Schrein',
    factionId: 'HERETICS',
    description: 'Fanatischer Kultist des Zeit-Risses. Handelt nur mit jenen, die das Dogma der Station brechen.',
    callsign: 'KULT-NULL',
    avatarIcon: '🩸',
    inventory: [
      {
        id: 'STIM_CHRONO_ESSENCE',
        name: 'CHRONO-ESSENZ KAPSEL',
        description: 'Kondensiertes Zeitplasma. Setzt Abklingzeiten aller Techs zurück.',
        category: 'STIM',
        basePriceCredits: 400,
        basePriceNanites: 100,
        basePriceCrystals: 3,
        requiredLevel: 2,
        stock: 4,
        rarity: 'ENTROPISCH',
        statBonus: 'Sofortiger Reset aller Fähigkeiten-Cooldowns',
      },
      {
        id: 'MOD_HERETIC_RESONATOR',
        name: '[T4] BIO-RESONANZ TRANSMUTER',
        description: 'Wandelt 10% zugefügten Schaden in Schildregeneration um.',
        category: 'MOD',
        slot: 'CORE',
        basePriceCredits: 1600,
        basePriceNanites: 900,
        basePriceCrystals: 5,
        requiredLevel: 5,
        stock: 1,
        rarity: 'APEX',
        statBonus: '10% Vampirismus // Schild-Leech',
      },
      {
        id: 'AMMO_VOID_CHARGES',
        name: 'DUNKLER VAKUUM-SPRENGSATZ (5x)',
        description: 'Reißt Kacheln im 2x2 Radius in die Leere.',
        category: 'AMMO',
        basePriceCredits: 750,
        basePriceNanites: 300,
        basePriceCrystals: 4,
        requiredLevel: 4,
        stock: 5,
        rarity: 'ENTROPISCH',
        statBonus: 'Zerstört Kacheln // 45 Leereschaden',
      },
      {
        id: 'CRATE_HERETIC_RELIC',
        name: 'TRANSMUTIERTE FRACHT-RELIQUIE',
        description: 'Ein pulsierender Kokon. Birgt verbotene Apex-Biotech.',
        category: 'CRATE',
        basePriceCredits: 800,
        basePriceNanites: 350,
        basePriceCrystals: 12,
        requiredLevel: 3,
        stock: 99,
        rarity: 'APEX',
        statBonus: 'Garantiert seltene Ketzer-Artefakte',
      },
    ],
  },
];

// APEX Mystery Loot Pool
const APEX_MYSTERY_LOOT_POOL: IMerchantItem[] = [
  {
    id: 'APEX_GRAV_BARREL',
    name: '[APEX] GRAVITATIONS-LAUF-PROTOTYP',
    description: 'Erzeugt ein Mikroschwarzes-Loch bei kritischen Treffern.',
    category: 'MOD',
    slot: 'BARREL',
    basePriceCredits: 3500,
    basePriceNanites: 1800,
    basePriceCrystals: 15,
    requiredLevel: 5,
    stock: 1,
    rarity: 'APEX',
    statBonus: '+38 DMG // Gravitations-Sog auf Kachel',
  },
  {
    id: 'APEX_CHRONO_CORE',
    name: '[APEX] KONDENSATOR DER 5. DIMENSION',
    description: 'Ermöglicht das Stoppen der Zeit für 1 gesamte Runde.',
    category: 'MOD',
    slot: 'CORE',
    basePriceCredits: 4000,
    basePriceNanites: 2000,
    basePriceCrystals: 20,
    requiredLevel: 6,
    stock: 1,
    rarity: 'APEX',
    statBonus: '+2 AP // 100% Entropie-Immunität',
  },
  {
    id: 'APEX_TITAN_MAG',
    name: '[APEX] INFINITY-MAGAZIN KINETIK',
    description: 'Quanten-Naniten replizieren Munition während des Schießens.',
    category: 'MOD',
    slot: 'MAGAZINE',
    basePriceCredits: 3200,
    basePriceNanites: 1500,
    basePriceCrystals: 14,
    requiredLevel: 5,
    stock: 1,
    rarity: 'APEX',
    statBonus: '+30 Schuss // 25% Chance auf Freischuss',
  },
  {
    id: 'ENTROPIC_NULL_CANNON',
    name: '[ENTROPISCH] NULL-STRAHL INJEKTOR',
    description: 'Feuert einen kontinuierlichen Tachyon-Vektor quer über das Grid.',
    category: 'MOD',
    slot: 'RECEIVER',
    basePriceCredits: 2200,
    basePriceNanites: 1100,
    basePriceCrystals: 8,
    requiredLevel: 4,
    stock: 1,
    rarity: 'ENTROPISCH',
    statBonus: '+30 DMG // Durchdringt alle Deckungen',
  },
];

export class EconomyService {
  // 1. Die mathematische XP-Kurve
  // XP_Required(L) = Round(120 * L^1.65 + 60)
  public static calculateXpRequired(level: number): number {
    return Math.round(120 * Math.pow(level, 1.65) + 60);
  }

  // XP hinzufügen & Level-Ups berechnen
  public static addXp(
    currentWallet: IPlayerWallet,
    xpGained: number
  ): {
    updatedWallet: IPlayerWallet;
    leveledUp: boolean;
    levelsGained: number;
    hpBonus: number;
    shieldBonus: number;
  } {
    let { level, currentXp } = currentWallet;
    currentXp += xpGained;
    let leveledUp = false;
    let levelsGained = 0;

    while (currentXp >= this.calculateXpRequired(level) && level < 30) {
      currentXp -= this.calculateXpRequired(level);
      level += 1;
      leveledUp = true;
      levelsGained += 1;
    }

    const updatedWallet: IPlayerWallet = {
      ...currentWallet,
      level,
      currentXp,
    };

    return {
      updatedWallet,
      leveledUp,
      levelsGained,
      hpBonus: levelsGained * 5,
      shieldBonus: levelsGained * 5,
    };
  }

  // 2. Die Dynamische Preis-Formel
  // P_End = Round( P_Base * (1.0 - Rep / 200) * (1.0 + ThreatLevel * 0.15) )
  public static calculateDynamicPrice(
    basePrice: number,
    reputation: number, // -100 bis +100
    threatLevel: number // 1 bis 5
  ): {
    finalPrice: number;
    discountPercent: number;
    isEmbargo: boolean;
  } {
    // Bei Ruf <= -100 herrscht absolutes Embargo
    if (reputation <= -99) {
      return {
        finalPrice: 999999,
        discountPercent: -100,
        isEmbargo: true,
      };
    }

    // Rep-Modifikator: -100 -> 1.5 (+50%), 0 -> 1.0, +100 -> 0.5 (-50%)
    const clampedRep = Math.max(-100, Math.min(100, reputation));
    const repMultiplier = 1.0 - clampedRep / 200;

    // Bedrohungsaufschlag: Stufe 1 -> 1.15, Stufe 5 -> 1.75
    const threatMultiplier = 1.0 + Math.max(1, Math.min(5, threatLevel)) * 0.15;

    const rawPrice = basePrice * repMultiplier * threatMultiplier;
    const finalPrice = Math.max(1, Math.round(rawPrice));

    // Rabatt gegenüber Basispreis mit Standard-Bedrohung 1
    const standardCost = basePrice * 1.15;
    const discountPercent = Math.round(((standardCost - finalPrice) / standardCost) * 100);

    return {
      finalPrice,
      discountPercent,
      isEmbargo: false,
    };
  }

  // 3. Pity Crate Öffnung
  public static openMysteryCrate(pityCount: number): ICrateDrop {
    let rarity: ItemRarity = 'VERSTÄRKT';
    let isGuaranteedApex = false;
    let newPity = pityCount + 1;

    // Pity-Schutz: Wenn 4 Kisten in Folge keine Apex-Ware brachten -> 5. Kiste ist garantiert APEX!
    if (pityCount >= 4) {
      rarity = 'APEX';
      isGuaranteedApex = true;
      newPity = 0;
    } else {
      const roll = Math.random() * 100;
      if (roll < 55) {
        rarity = 'VERSTÄRKT';
        newPity = pityCount + 1;
      } else if (roll < 85) {
        rarity = 'ASTRAEA_SPEC';
        newPity = pityCount + 1;
      } else if (roll < 97) {
        rarity = 'ENTROPISCH';
        newPity = pityCount + 1;
      } else {
        rarity = 'APEX';
        isGuaranteedApex = true;
        newPity = 0;
      }
    }

    // Wähle passenden Drop
    let selectedItem: IMerchantItem;
    if (rarity === 'APEX') {
      const pool = APEX_MYSTERY_LOOT_POOL.filter((i) => i.rarity === 'APEX');
      selectedItem = pool[Math.floor(Math.random() * pool.length)];
    } else if (rarity === 'ENTROPISCH') {
      selectedItem =
        APEX_MYSTERY_LOOT_POOL.find((i) => i.rarity === 'ENTROPISCH') ||
        APEX_MYSTERY_LOOT_POOL[0];
    } else {
      // Modifikationen aus den Händlerbeständen
      const standardMods: IMerchantItem[] = [
        {
          id: 'DROP_TITAN_BARREL',
          name: '[VERSTÄRKT] TITAN-MAGNUM-LAUF',
          description: 'Hoher Mündungsdruck erhöht Schadenswirkung.',
          category: 'MOD',
          slot: 'BARREL',
          basePriceCredits: 750,
          basePriceNanites: 300,
          basePriceCrystals: 0,
          requiredLevel: 2,
          stock: 1,
          rarity,
          statBonus: '+16 DMG // +5% Streuung',
        },
        {
          id: 'DROP_EXTENDED_MAG',
          name: '[SPEC] KRYO-MAGAZIN KOPPLER',
          description: 'Flüssigstickstoff-Kühlung verringert Überhitzung.',
          category: 'MOD',
          slot: 'MAGAZINE',
          basePriceCredits: 900,
          basePriceNanites: 400,
          basePriceCrystals: 0,
          requiredLevel: 2,
          stock: 1,
          rarity,
          statBonus: '+12 Schuss // -10% Hitze',
        },
      ];
      selectedItem = standardMods[Math.floor(Math.random() * standardMods.length)];
    }

    return {
      item: selectedItem,
      rarity,
      isGuaranteedApex,
      newPity,
    };
  }

  // 4. Persistence Helpers
  public static loadWallet(): IPlayerWallet {
    try {
      const saved = localStorage.getItem(WALLET_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
    return {
      credits: 14820,
      nanites: 2450,
      chronoCrystals: 18,
      level: 14,
      currentXp: 1840,
      pityCounterCrates: 0,
    };
  }

  public static saveWallet(wallet: IPlayerWallet): void {
    try {
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));

      const currentUser = CloudPersistenceService.getCurrentUser();
      if (currentUser) {
        CloudPersistenceService.syncProgression(currentUser.id, {
          credits: wallet.credits,
          nanites: wallet.nanites,
          chrono_crystals: wallet.chronoCrystals,
          high_score: wallet.level,
        }).catch((err) => {
          console.warn('[EconomyService] Failed to sync wallet to Supabase:', err);
        });
      }
    } catch {
      // Ignore
    }
  }

  public static loadResearchNodes(): IResearchNode[] {
    try {
      const saved = localStorage.getItem(RESEARCH_STORAGE_KEY);
      if (saved) {
        const storedList: Array<{ id: string; unlocked: boolean }> = JSON.parse(saved);
        const map = new Map(storedList.map((n) => [n.id, n.unlocked]));
        return INITIAL_RESEARCH_NODES.map((node) => ({
          ...node,
          unlocked: node.id === 'ORIGIN' ? true : map.get(node.id) || false,
        }));
      }
    } catch {
      // Ignore
    }
    return INITIAL_RESEARCH_NODES;
  }

  public static saveResearchNodes(nodes: IResearchNode[]): void {
    try {
      const compact = nodes.map((n) => ({ id: n.id, unlocked: n.unlocked }));
      localStorage.setItem(RESEARCH_STORAGE_KEY, JSON.stringify(compact));
    } catch {
      // Ignore
    }
  }

  public static loadInventory(): Array<{ item: IMerchantItem; quantity: number }> {
    try {
      const saved = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
    return [
      {
        item: MERCHANTS[0].inventory[2], // Kinetik-Pack
        quantity: 2,
      },
      {
        item: MERCHANTS[0].inventory[3], // Schildzelle
        quantity: 1,
      },
    ];
  }

  public static saveInventory(inventory: Array<{ item: IMerchantItem; quantity: number }>): void {
    try {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
    } catch {
      // Ignore
    }
  }

  // Gesamte permanente Boni aus freigeschalteter Forschung ermitteln
  public static calculateTotalResearchBonuses(nodes: IResearchNode[]): {
    maxHpBonus: number;
    maxShieldBonus: number;
    apStartBonus: number;
    naniteBoostPercent: number;
    bonusRewinds: number;
    spreadReductionPercent: number;
    overclockChancePercent: number;
    critChancePercent: number;
    heatReductionPercent: number;
  } {
    let maxHpBonus = 0;
    let maxShieldBonus = 0;
    let apStartBonus = 0;
    let naniteBoostPercent = 0;
    let bonusRewinds = 0;
    let spreadReductionPercent = 0;
    let overclockChancePercent = 0;
    let critChancePercent = 0;
    let heatReductionPercent = 0;

    for (const node of nodes) {
      if (!node.unlocked) continue;
      switch (node.effect.stat) {
        case 'MAX_HP':
          maxHpBonus += node.effect.value;
          break;
        case 'MAX_SHIELD':
          maxShieldBonus += node.effect.value;
          break;
        case 'AP_START':
          apStartBonus += node.effect.value;
          break;
        case 'NANITE_BOOST':
          naniteBoostPercent += node.effect.value;
          break;
        case 'REWINDS':
          bonusRewinds += node.effect.value;
          break;
        case 'SPREAD_REDUCTION':
          spreadReductionPercent += node.effect.value;
          break;
        case 'OVERCLOCK_CHANCE':
          overclockChancePercent += node.effect.value;
          break;
        case 'CRIT_CHANCE':
          critChancePercent += node.effect.value;
          break;
        case 'HEAT_REDUCTION':
          heatReductionPercent += node.effect.value;
          break;
      }
    }

    return {
      maxHpBonus,
      maxShieldBonus,
      apStartBonus,
      naniteBoostPercent,
      bonusRewinds,
      spreadReductionPercent,
      overclockChancePercent,
      critChancePercent,
      heatReductionPercent,
    };
  }
}
