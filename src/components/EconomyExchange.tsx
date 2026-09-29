import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  IMerchant,
  IMerchantItem,
  IPlayerWallet,
  IResearchNode,
  ItemCategory,
  MerchantId,
  ICrateDrop,
} from '../types/economy';
import {
  MERCHANTS,
  EconomyService,
} from '../services/economyService';
import { EconomyAudioEngine } from '../services/economyAudio';
import { ResearchTreeCanvas } from './ResearchTreeCanvas';
import { MysteryCrateModal } from './MysteryCrateModal';
import { loadGameSave } from '../services/storageService';

interface EconomyExchangeProps {
  onBackToDeck: () => void;
  sectorThreatLevel?: number;
}

export const EconomyExchange: React.FC<EconomyExchangeProps> = ({
  onBackToDeck,
  sectorThreatLevel = 2,
}) => {
  // State
  const [wallet, setWallet] = useState<IPlayerWallet>(() => EconomyService.loadWallet());
  const [researchNodes, setResearchNodes] = useState<IResearchNode[]>(() =>
    EconomyService.loadResearchNodes()
  );
  const [inventory, setInventory] = useState<Array<{ item: IMerchantItem; quantity: number }>>(() =>
    EconomyService.loadInventory()
  );
  const [activeMerchantId, setActiveMerchantId] = useState<MerchantId>('ASTRAEA_OFFICER');
  const [activeCategory, setActiveCategory] = useState<ItemCategory | 'ALL'>('ALL');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('NANITE_MAGNET');
  const [threatLevel, setThreatLevel] = useState<number>(sectorThreatLevel);

  // Status log
  const [statusMessage, setStatusMessage] = useState<string>(
    'ASTRAEA TRADE PROTOCOL // BÖRSE BEREIT. WÄHLEN SIE EINEN HÄNDLER.'
  );
  const [alertType, setAlertType] = useState<'INFO' | 'SUCCESS' | 'ERROR'>('INFO');

  // Mystery Crate modal state
  const [isCrateModalOpen, setIsCrateModalOpen] = useState(false);
  const [lastCrateDrop, setLastCrateDrop] = useState<ICrateDrop | null>(null);

  // Faction Reputations (Sync with game state / storage)
  const [reputations, setReputations] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('chrono_narrative_state_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.reputations) return parsed.reputations;
      }
    } catch {
      // Ignore
    }
    return {
      ASTRAEA: 35,
      GUILD: -10, // Schwarzmarkt / Freier Vektor
      HERETICS: -80,
    };
  });

  // Current active merchant
  const activeMerchant = useMemo(() => {
    return MERCHANTS.find((m) => m.id === activeMerchantId) || MERCHANTS[0];
  }, [activeMerchantId]);

  // Reputation for active merchant
  const activeRep = reputations[activeMerchant.factionId] ?? 0;

  // Selected research node
  const selectedNode = useMemo(() => {
    return researchNodes.find((n) => n.id === selectedNodeId) || null;
  }, [researchNodes, selectedNodeId]);

  // Active permanent bonuses
  const totalBonuses = useMemo(() => {
    return EconomyService.calculateTotalResearchBonuses(researchNodes);
  }, [researchNodes]);

  // Sync to persistence
  useEffect(() => {
    EconomyService.saveWallet(wallet);
  }, [wallet]);

  useEffect(() => {
    EconomyService.saveResearchNodes(researchNodes);
  }, [researchNodes]);

  useEffect(() => {
    EconomyService.saveInventory(inventory);
  }, [inventory]);

  // XP calculations for UI
  const xpNeeded = EconomyService.calculateXpRequired(wallet.level);
  const xpPercent = Math.min(100, Math.round((wallet.currentXp / xpNeeded) * 100));

  // Switch Merchant
  const handleSelectMerchant = (id: MerchantId) => {
    setActiveMerchantId(id);
    EconomyAudioEngine.getInstance().playMerchantSwitch();
    const target = MERCHANTS.find((m) => m.id === id);
    if (target) {
      setStatusMessage(`HÄNDLER-KANAL GEWECHSELT: ${target.name} // ${target.callsign}`);
      setAlertType('INFO');
    }
  };

  // Filter goods
  const filteredInventory = useMemo(() => {
    if (activeCategory === 'ALL') {
      return activeMerchant.inventory;
    }
    return activeMerchant.inventory.filter((item) => item.category === activeCategory);
  }, [activeMerchant, activeCategory]);

  // Purchase item logic
  const handleBuyItem = (item: IMerchantItem) => {
    const { finalPrice, isEmbargo } = EconomyService.calculateDynamicPrice(
      item.basePriceCredits,
      activeRep,
      threatLevel
    );

    if (isEmbargo) {
      EconomyAudioEngine.getInstance().playTransactionDenied();
      setStatusMessage('TRANSAKTION VERWEIGERT: EMBARGO DURCH FEINDSELIGEN RUF!');
      setAlertType('ERROR');
      return;
    }

    if (wallet.level < item.requiredLevel) {
      EconomyAudioEngine.getInstance().playTransactionDenied();
      setStatusMessage(`SICHERHEITS-STUFE UNZUREICHEND: ERFORDERT LEVEL ${item.requiredLevel}!`);
      setAlertType('ERROR');
      return;
    }

    // Check funds
    const naniteCost = item.basePriceNanites;
    const crystalCost = item.basePriceCrystals;

    if (
      wallet.credits < finalPrice ||
      wallet.nanites < naniteCost ||
      wallet.chronoCrystals < crystalCost
    ) {
      EconomyAudioEngine.getInstance().playTransactionDenied();
      setStatusMessage('GELDMITTEL UNZUREICHEND: NICHT GENÜGEND CREDITS, NANITEN ODER KRISTALLE!');
      setAlertType('ERROR');
      return;
    }

    // If it's a mystery crate, open it immediately
    if (item.category === 'CRATE') {
      const drop = EconomyService.openMysteryCrate(wallet.pityCounterCrates);
      setWallet((prev) => ({
        ...prev,
        credits: prev.credits - finalPrice,
        nanites: prev.nanites - naniteCost,
        chronoCrystals: prev.chronoCrystals - crystalCost,
        pityCounterCrates: drop.newPity,
      }));

      // Add dropped item to inventory
      setInventory((prev) => {
        const existing = prev.find((entry) => entry.item.id === drop.item.id);
        if (existing) {
          return prev.map((entry) =>
            entry.item.id === drop.item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
          );
        }
        return [...prev, { item: drop.item, quantity: 1 }];
      });

      setLastCrateDrop(drop);
      setIsCrateModalOpen(true);
      setStatusMessage(`BERGUNGS-KISTE GEÖFFNET // ERHALTEN: ${drop.item.name} [${drop.rarity}]`);
      setAlertType('SUCCESS');
      return;
    }

    // Normal item purchase
    setWallet((prev) => ({
      ...prev,
      credits: prev.credits - finalPrice,
      nanites: prev.nanites - naniteCost,
      chronoCrystals: prev.chronoCrystals - crystalCost,
    }));

    setInventory((prev) => {
      const existing = prev.find((entry) => entry.item.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.item.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      }
      return [...prev, { item, quantity: 1 }];
    });

    EconomyAudioEngine.getInstance().playPurchaseSuccess();
    setStatusMessage(`TRANSAKTION ERFOLGREICH: ${item.name} ERWORBEN.`);
    setAlertType('SUCCESS');
  };

  // Sell / Scrap item from player inventory
  const handleScrapItem = (itemId: string) => {
    const entry = inventory.find((e) => e.item.id === itemId);
    if (!entry || entry.quantity <= 0) return;

    const refundCredits = Math.round(entry.item.basePriceCredits * 0.4);
    const refundNanites = Math.round(entry.item.basePriceNanites * 0.6) + 20;

    setWallet((prev) => ({
      ...prev,
      credits: prev.credits + refundCredits,
      nanites: prev.nanites + refundNanites,
    }));

    setInventory((prev) =>
      prev
        .map((e) => (e.item.id === itemId ? { ...e, quantity: e.quantity - 1 } : e))
        .filter((e) => e.quantity > 0)
    );

    EconomyAudioEngine.getInstance().playItemSold();
    setStatusMessage(
      `GEGENSTAND RECYCELT: +${refundCredits} AC & +${refundNanites} TN ERHALTEN.`
    );
    setAlertType('INFO');
  };

  // Research unlock logic
  const handleUnlockResearch = (node: IResearchNode) => {
    if (node.unlocked) return;

    if (node.requiredNodeId) {
      const parent = researchNodes.find((n) => n.id === node.requiredNodeId);
      if (!parent || !parent.unlocked) {
        EconomyAudioEngine.getInstance().playTransactionDenied();
        setStatusMessage(`FORSCHUNG GESPERRT: ERFORDERT KNOTEN „${parent?.title || 'UNBEKANNT'}“!`);
        setAlertType('ERROR');
        return;
      }
    }

    if (wallet.chronoCrystals < node.costCrystals) {
      EconomyAudioEngine.getInstance().playTransactionDenied();
      setStatusMessage(
        `KRISTALL-DEFIZIT: BENÖTIGT ${node.costCrystals} CK (VORHANDEN: ${wallet.chronoCrystals} CK)!`
      );
      setAlertType('ERROR');
      return;
    }

    // Unlock
    setWallet((prev) => ({
      ...prev,
      chronoCrystals: prev.chronoCrystals - node.costCrystals,
    }));

    setResearchNodes((prev) =>
      prev.map((n) => (n.id === node.id ? { ...n, unlocked: true } : n))
    );

    EconomyAudioEngine.getInstance().playResearchUnlockChord();
    setStatusMessage(`NEURONALE FORSCHUNG FREIGESCHALTET: ${node.title}! ${node.effect.label}`);
    setAlertType('SUCCESS');
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCrateModalOpen) {
          setIsCrateModalOpen(false);
        } else {
          onBackToDeck();
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const ids: MerchantId[] = ['ASTRAEA_OFFICER', 'FREE_VECTOR', 'HERETIC_CULT'];
        const currentIdx = ids.indexOf(activeMerchantId);
        const nextId = ids[(currentIdx + 1) % ids.length];
        handleSelectMerchant(nextId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMerchantId, isCrateModalOpen, onBackToDeck]);

  // Demo XP gain button for testing the exponential curve
  const handleGainDemoXp = () => {
    const result = EconomyService.addXp(wallet, 250);
    setWallet(result.updatedWallet);
    if (result.leveledUp) {
      EconomyAudioEngine.getInstance().playResearchUnlockChord();
      setStatusMessage(
        `★ STUFENAUFSTIEG! VANCE ERREICHT LEVEL ${result.updatedWallet.level} (+${result.hpBonus} HP, +${result.shieldBonus} SHIELD) ★`
      );
      setAlertType('SUCCESS');
    } else {
      setStatusMessage(`+250 ERFAHRUNGSPUNKTE ERHALTEN (${result.updatedWallet.currentXp} / ${xpNeeded} XP)`);
      setAlertType('INFO');
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#070a0e] text-[#d8e2dc] font-mono flex flex-col overflow-hidden select-none">
      {/* 1. TOP HEADER: WALLET TELEMETRIE */}
      <header className="h-16 px-6 bg-[#090e15] border-b border-[#00f0ff]/30 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#00f0ff] rounded-sm animate-pulse" />
            <h1 className="text-base font-bold tracking-wider text-cyan-400">
              ASTRAEA BÖRSE // PROTOKOLL SYS-ECON-13
            </h1>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs text-gray-400 border-l border-white/10 pl-4">
            <span>BEDROHUNGS-STUFE:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setThreatLevel(lvl)}
                  className={`w-6 h-5 text-center text-[10px] font-bold border transition-colors ${
                    threatLevel === lvl
                      ? 'border-amber-400 bg-amber-950/80 text-amber-300'
                      : 'border-white/10 text-gray-500 hover:border-white/30'
                  }`}
                >
                  T{lvl}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-amber-400/80 ml-1">
              (+{Math.round(threatLevel * 15)}% Aufschlag)
            </span>
          </div>
        </div>

        {/* Currency balances & Level */}
        <div className="flex items-center gap-6 text-xs">
          {/* Credits */}
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 border border-cyan-500/30 rounded">
            <span className="text-gray-400">CREDITS:</span>
            <span className="font-bold text-cyan-300 text-sm">{wallet.credits.toLocaleString()} AC</span>
          </div>

          {/* Nanites */}
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 border border-emerald-500/30 rounded">
            <span className="text-gray-400">NANITEN:</span>
            <span className="font-bold text-emerald-300 text-sm">{wallet.nanites.toLocaleString()} TN</span>
          </div>

          {/* Chrono Crystals */}
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 border border-fuchsia-500/40 rounded">
            <span className="text-gray-400">KRISTALLE:</span>
            <span className="font-bold text-fuchsia-300 text-sm flex items-center gap-1">
              💎 {wallet.chronoCrystals} CK
            </span>
          </div>

          {/* Level & XP */}
          <div className="flex flex-col gap-1 w-44 bg-black/40 px-3 py-1 border border-white/10 rounded">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-amber-400 font-bold">STUFE {wallet.level}</span>
              <span className="text-gray-400 text-[10px]">{xpPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Quick Demo XP Button */}
          <button
            onClick={handleGainDemoXp}
            title="Simuliert Kampf-XP-Gewinn für Level-Up Demonstration"
            className="px-2 py-1 bg-white/5 border border-white/20 hover:bg-white/10 text-[10px] text-gray-300 rounded"
          >
            +250 XP
          </button>
        </div>
      </header>

      {/* 2. MASTER 3-COLUMN LAYOUT */}
      <main className="flex-1 flex overflow-hidden">
        {/* SPALTE 1: HÄNDLER-AUSWAHL (25% BREITE) */}
        <section className="w-80 lg:w-96 border-r border-white/10 flex flex-col bg-[#080d14] shrink-0">
          <div className="p-3 bg-[#0a121c] border-b border-white/10 text-xs font-bold text-cyan-400 tracking-wider">
            [1] FRAKTIONS-HÄNDLER // DECK 04
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {MERCHANTS.map((merchant, idx) => {
              const rep = reputations[merchant.factionId] ?? 0;
              const isSelected = activeMerchantId === merchant.id;
              const { discountPercent, isEmbargo } = EconomyService.calculateDynamicPrice(
                1000,
                rep,
                threatLevel
              );

              return (
                <div
                  key={merchant.id}
                  onClick={() => handleSelectMerchant(merchant.id)}
                  className={`p-4 border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                      : 'border-white/10 bg-black/30 hover:border-white/30 hover:bg-black/50'
                  }`}
                >
                  {/* Selector tag */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className="text-base">{merchant.avatarIcon}</span>
                      <span>
                        [{idx + 1}] {merchant.name}
                      </span>
                    </span>
                    {isSelected && (
                      <span className="px-1.5 py-0.5 bg-cyan-400 text-black text-[9px] font-bold tracking-widest uppercase">
                        AKTIV
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-cyan-300 font-mono mb-2">
                    {merchant.title}
                  </div>

                  <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">
                    {merchant.description}
                  </p>

                  {/* Reputation Bar */}
                  <div className="space-y-1 pt-2 border-t border-white/10">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-400">RUF: {rep > 0 ? `+${rep}` : rep}</span>
                      {isEmbargo ? (
                        <span className="text-red-400 font-bold animate-pulse">
                          EMBARGO (BLOCKIERT)
                        </span>
                      ) : discountPercent > 0 ? (
                        <span className="text-emerald-400 font-bold">
                          RABATT: -{discountPercent}%
                        </span>
                      ) : discountPercent < 0 ? (
                        <span className="text-amber-400 font-bold">
                          AUFSCHLAG: +{Math.abs(discountPercent)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">STANDARDPREIS</span>
                      )}
                    </div>
                    <div className="w-full h-1.5 bg-gray-900 rounded overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          rep >= 0 ? 'bg-cyan-400' : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(5, (rep + 100) / 2))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Vance Personal Inventory & Scrapping Dock */}
            <div className="mt-6 p-4 border border-white/10 bg-[#0a111a]">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-2">
                <span>INVENTAR & SCHROTT-DOCK</span>
                <span className="text-[10px] text-gray-400">{inventory.length} ARTIKEL</span>
              </div>
              <p className="text-[10px] text-gray-400 mb-3">
                Verkaufe ungenutzte Module oder Munition gegen Credits und Naniten.
              </p>

              {inventory.length === 0 ? (
                <div className="text-[11px] text-gray-600 italic py-2">
                  Keine Gegenstände im Frachtraum.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {inventory.map(({ item, quantity }) => (
                    <div
                      key={item.id}
                      className="p-2 border border-white/10 bg-black/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white text-[11px]">{item.name}</div>
                        <div className="text-[9px] text-gray-400">
                          Menge: {quantity}x // Scrap: +{Math.round(item.basePriceCredits * 0.4)} AC
                        </div>
                      </div>
                      <button
                        onClick={() => handleScrapItem(item.id)}
                        className="px-2 py-1 bg-red-950/60 border border-red-500/40 hover:bg-red-900 text-red-300 text-[10px]"
                      >
                        SCRAPPEN
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SPALTE 2: WAREN-KATALOG (45% BREITE) */}
        <section className="flex-1 flex flex-col bg-[#070b10] border-r border-white/10">
          {/* Category Filter Bar */}
          <div className="p-3 bg-[#0a1017] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-400 mr-2">[2] WAREN-KATALOG:</span>
              {(['ALL', 'MOD', 'AMMO', 'CRATE', 'STIM'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 text-xs font-mono font-bold tracking-wider transition-colors border ${
                    activeCategory === cat
                      ? 'border-cyan-400 bg-cyan-950/80 text-cyan-300'
                      : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {cat === 'ALL' ? 'ALLE' : cat}
                </button>
              ))}
            </div>

            <div className="text-xs text-gray-400">
              HÄNDLER: <span className="text-white font-bold">{activeMerchant.name}</span>
            </div>
          </div>

          {/* Goods Catalog Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredInventory.map((item) => {
              const { finalPrice, discountPercent, isEmbargo } = EconomyService.calculateDynamicPrice(
                item.basePriceCredits,
                activeRep,
                threatLevel
              );

              const canAffordCredits = wallet.credits >= finalPrice;
              const canAffordNanites = wallet.nanites >= item.basePriceNanites;
              const canAffordCrystals = wallet.chronoCrystals >= item.basePriceCrystals;
              const canAffordAll =
                canAffordCredits && canAffordNanites && canAffordCrystals && !isEmbargo;
              const isLevelLocked = wallet.level < item.requiredLevel;

              return (
                <div
                  key={item.id}
                  className={`p-4 border transition-all flex flex-col justify-between ${
                    isEmbargo
                      ? 'border-red-900/60 bg-red-950/10 opacity-70'
                      : item.category === 'CRATE'
                      ? 'border-amber-400/50 bg-amber-950/20 hover:border-amber-400'
                      : 'border-white/10 bg-black/40 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white tracking-wide">
                          {item.name}
                        </span>
                        {item.slot && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-white/10 text-cyan-300 rounded border border-cyan-500/20">
                            {item.slot}
                          </span>
                        )}
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            item.rarity === 'APEX'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                              : item.rarity === 'ENTROPISCH'
                              ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/50'
                              : item.rarity === 'ASTRAEA_SPEC'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                              : 'bg-white/10 text-gray-300'
                          }`}
                        >
                          {item.rarity}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        {item.description}
                      </p>

                      {item.statBonus && (
                        <div className="text-[11px] text-amber-300 font-bold mt-1.5">
                          EFFEKT: {item.statBonus}
                        </div>
                      )}

                      {isLevelLocked && (
                        <div className="text-[10px] text-red-400 mt-1 font-bold">
                          ⚠ ERFORDERT SICHERHEITS-STUFE {item.requiredLevel} (AKTUELL: {wallet.level})
                        </div>
                      )}
                    </div>

                    {/* Price and Buy Button */}
                    <div className="text-right shrink-0 flex flex-col items-end">
                      <div className="text-xs font-mono mb-2">
                        {/* Dynamic price with comparison */}
                        <div className="flex items-center justify-end gap-1.5">
                          {discountPercent !== 0 && (
                            <span className="text-[10px] text-gray-500 line-through">
                              {Math.round(item.basePriceCredits * 1.15)} AC
                            </span>
                          )}
                          <span
                            className={`font-bold text-sm ${
                              canAffordCredits ? 'text-cyan-300' : 'text-red-400'
                            }`}
                          >
                            {isEmbargo ? '---' : `${finalPrice.toLocaleString()} AC`}
                          </span>
                        </div>

                        {item.basePriceNanites > 0 && (
                          <div
                            className={`text-[11px] ${
                              canAffordNanites ? 'text-emerald-300' : 'text-red-400'
                            }`}
                          >
                            + {item.basePriceNanites} TN
                          </div>
                        )}

                        {item.basePriceCrystals > 0 && (
                          <div
                            className={`text-[11px] font-bold ${
                              canAffordCrystals ? 'text-fuchsia-300' : 'text-red-400'
                            }`}
                          >
                            + {item.basePriceCrystals} CK
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleBuyItem(item)}
                        disabled={!canAffordAll || isLevelLocked}
                        className={`px-4 py-2 text-xs font-bold font-mono tracking-wider transition-all border ${
                          isEmbargo
                            ? 'border-red-900 bg-red-950/40 text-red-500 cursor-not-allowed'
                            : isLevelLocked
                            ? 'border-gray-800 bg-gray-900 text-gray-600 cursor-not-allowed'
                            : !canAffordAll
                            ? 'border-red-900/40 bg-red-950/20 text-red-400/80 cursor-not-allowed'
                            : item.category === 'CRATE'
                            ? 'border-amber-400 bg-amber-950/80 text-amber-200 hover:bg-amber-800 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                            : 'border-cyan-400 bg-cyan-950/80 text-cyan-200 hover:bg-cyan-800 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                        }`}
                      >
                        {isEmbargo
                          ? 'EMBARGO'
                          : item.category === 'CRATE'
                          ? 'KISTE ÖFFNEN'
                          : 'KAUFEN'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SPALTE 3: ARTEFAKT- & FORSCHUNGSBAUM (30% BREITE) */}
        <section className="w-96 lg:w-[480px] flex flex-col bg-[#070a0f] shrink-0">
          <div className="p-3 bg-[#0a121c] border-b border-white/10 flex items-center justify-between text-xs font-bold text-cyan-400">
            <span>[3] ROGUELITE FORSCHUNGS-TREE</span>
            <span className="text-[10px] text-fuchsia-400 font-bold">
              {wallet.chronoCrystals} CK VERFÜGBAR
            </span>
          </div>

          {/* Interactive Canvas Graph */}
          <div className="h-3/5 border-b border-white/10">
            <ResearchTreeCanvas
              nodes={researchNodes}
              availableCrystals={wallet.chronoCrystals}
              selectedNodeId={selectedNodeId}
              onSelectNode={(node) => setSelectedNodeId(node.id)}
              onUnlockNode={handleUnlockResearch}
            />
          </div>

          {/* Selected Node Details & Unlock Panel */}
          <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto bg-[#080d14]">
            {selectedNode ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white tracking-wide">
                    {selectedNode.title}
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      selectedNode.unlocked
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400'
                        : wallet.chronoCrystals >= selectedNode.costCrystals
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400'
                        : 'bg-gray-800 text-gray-500'
                    }`}
                  >
                    {selectedNode.unlocked
                      ? 'AKTIVIERT'
                      : `KOSTEN: ${selectedNode.costCrystals} CK`}
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed font-mono">
                  {selectedNode.description}
                </p>

                <div className="p-2.5 bg-black/50 border border-cyan-500/30 rounded text-xs">
                  <span className="text-cyan-400 font-bold">PERMANENTER PERK:</span>{' '}
                  <span className="text-amber-300">{selectedNode.effect.label}</span>
                </div>

                {selectedNode.requiredNodeId && (
                  <div className="text-[11px] text-gray-400">
                    Voraussetzung:{' '}
                    <span className="text-white">
                      {researchNodes.find((n) => n.id === selectedNode.requiredNodeId)?.title ||
                        'KEINE'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-500 italic">
                Wähle einen Knotenpunkt im Graph, um Details anzuzeigen.
              </div>
            )}

            {/* Active Meta Perks Summary */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                AKTIVE PERMANENTE KLON-BONI
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-300">
                <div>• Max HP: +{totalBonuses.maxHpBonus}</div>
                <div>• Max Schild: +{totalBonuses.maxShieldBonus}</div>
                <div>• Start-AP: +{totalBonuses.apStartBonus}</div>
                <div>• Naniten-Bonus: +{totalBonuses.naniteBoostPercent}%</div>
                <div>• Bonus-Rewinds: +{totalBonuses.bonusRewinds}</div>
                <div>• Krit-Rate: +{totalBonuses.critChancePercent}%</div>
              </div>
            </div>

            {/* Unlock Button */}
            {selectedNode && !selectedNode.unlocked && (
              <button
                onClick={() => handleUnlockResearch(selectedNode)}
                disabled={wallet.chronoCrystals < selectedNode.costCrystals}
                className={`w-full mt-4 py-2.5 text-xs font-bold tracking-wider transition-all border ${
                  wallet.chronoCrystals >= selectedNode.costCrystals
                    ? 'border-amber-400 bg-amber-950/80 text-amber-200 hover:bg-amber-800 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'border-gray-800 bg-gray-900 text-gray-600 cursor-not-allowed'
                }`}
              >
                KNOTEN FREISCHALTEN ({selectedNode.costCrystals} CHRONO-KRISTALLE)
              </button>
            )}
          </div>
        </section>
      </main>

      {/* 3. BOTTOM FOOTER: TRANSAKTIONS-DOCK & STATUS BAR */}
      <footer className="h-12 px-6 bg-[#060a0f] border-t border-[#00f0ff]/30 flex items-center justify-between text-xs shrink-0 z-10">
        <div className="flex items-center gap-4">
          <span
            className={`font-bold flex items-center gap-2 ${
              alertType === 'SUCCESS'
                ? 'text-emerald-400'
                : alertType === 'ERROR'
                ? 'text-red-400'
                : 'text-cyan-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-ping" />
            {statusMessage}
          </span>
        </div>

        <div className="flex items-center gap-6 text-[11px] text-gray-400">
          <span>[TAB] HÄNDLER WECHSELN</span>
          <span>[ENTER] KAUFEN</span>
          <button
            onClick={onBackToDeck}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold tracking-wider rounded transition-colors"
          >
            [ESC] ZURÜCK ZUM HAUPTDECK
          </button>
        </div>
      </footer>

      {/* Mystery Crate Opening Modal with Pity Tracker */}
      <MysteryCrateModal
        isOpen={isCrateModalOpen}
        drop={lastCrateDrop}
        currentPity={wallet.pityCounterCrates}
        onClose={() => setIsCrateModalOpen(false)}
        costCrystals={10}
        canOpenAnother={wallet.chronoCrystals >= 10 && wallet.credits >= 500}
        onOpenAnother={() => {
          const crateItem = MERCHANTS[1].inventory[0];
          handleBuyItem(crateItem);
        }}
      />
    </div>
  );
};
