<div align="center">

# 🛰️ CHRONO-STRATUM: PROTOCOL NULL

**Hard Sci-Fi Tactical Grid Roguelike & Diegetic Space Station Simulator**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/DarkSoulLeeHD/2D-Space-Game/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19.0.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Web Audio API](https://img.shields.io/badge/Web_Audio_API-Procedural_Sound-FF6F00?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

[**🎮 LIVE DEMO SPIELEN**](https://darksoulleehd.github.io/2D-Space-Game/) • [Dokumentation](#-architektur--system-module) • [Steuerung](#-tastatur--touch-steuerung) • [Sicherheit](SECURITY.md)

</div>

---

## 🌌 Spielübersicht (Game Overview)

Im Jahr 2026 hat eine katastrophale Kausalitäts-Bruchwelle die Raumstation **Astraea-07** in eine permanente Zeitschleife gestürzt. Als **Operative Vance** navigierst du über das verbleibende **Astraea Model-7 Terminal**, um neun instabile Sektoren zurückzuerobern und im finalen **Apex-Raid der Null-Zone** die Entropie zu stoppen.

**CHRONO-STRATUM: PROTOCOL NULL** ist ein vollwertiges, kompromissloses Retro-Terminal-Taktikspiel mit tiefgehender Systemarchitektur: Rundenbasierter AP-Kampf, QTE-Chrono-Paraden, Naniten-Waffenschmiede, postkapitalistische Fraktions-Börse und ein simultanes Dual-Grid-Endspiel.

---

## ⚡ Kern-Features (Core Features)

* **💎 Zero Binary Assets (100% Code-Nativ):**
  Keine externen MP3-, WAV-, PNG- oder GLTF-Dateien. Sämtliche Grafiken, CRT-Vektorporträts, Radarkarten und Partikeleffekte werden live im **HTML5 Canvas 2D** gezeichnet.
* **🔊 Vollprozedurale Web Audio Synthese:**
  Mehrschichtiger 120-BPM-Soundtrack mit 4 dynamischen Stems (Sub-Bass, Pulse-Lead, Hi-Hat/Arp, Tension-Pad) und reaktiven Soundeffekten (Schüsse, Klicks, Schilde, Alarmsirenen), erzeugt durch native Audio-Oszillatoren, Bandpass-Filter und Faltungshall.
* **♟️ Rundenbasierter AP-Taktikkampf (Modul 06):**
  10x10 Schlachtfeld mit 4 Aktionspunkten (AP) pro Runde für Bewegung (A* Pathfinding), Präzisionsschüsse, Nachladen und kinetische Chrono-Dashes. Feinde zeigen vorab ihre Angriffsabsichten (Intents) an.
* **⏱️ Diegetische Chrono-Parade (Modul 07):**
  1,2-Sekunden QTE-Reaktionsfenster bei Feindangriffen. Ein Klick im 160ms-Sweetspot negiert 100% des Schadens und regeneriert wertvolle Aktionspunkte.
* **🌀 Dual-Grid Bifurkations-Endspiel (Modul 14):**
  Simultanes 8x8-Gitter (Vergangenheit & Zukunft). Aktionen auf dem Vergangenheits-Grid verändern sofort die Topologie des Zukunfts-Grids über kausale Vektoren. Wöchentliche deterministische Mulberry32 PRNG-Seeds (`2026-W40-NULL`) und 50-Stufen Non-FOMO Season-Pass.
* **🧠 Gemini Flash SDK & Offline-Fallback (Modul 10):**
  Kontextsensitive Briefings und Verhör-Logs via Google Gen AI SDK (`@google/genai`). Funktioniert 100% offline ohne API-Key dank deterministischer Lore-Fallbacks.
* **🛡️ CWE-312 Konformität & Datenschutz:**
  Niemals Speicherung von Klartext-API-Keys im Browser-LocalStorage. Sanitisierte Einstellungen und sichere Speicherpersistenz mit FNV-1a Prüfsummen.
* **📊 Integriertes Engine-Telemetrie-HUD (Modul 15):**
  Live-Leistungsmonitor (`Shift + D` oder Dreifachklick auf den Terminal-Header) für FPS, Frametimes, Draw-Calls, aktive Audio-Nodes und Heap-Memory.

---

## 🎮 Tastatur- & Touch-Steuerung

| Taste / Eingabe | Kontext | Funktion |
| :--- | :--- | :--- |
| **`[1]` – `[7]`** | Hauptdeck / Menü | Direkte Befehlsauswahl (01: Einsatz, 02: Intel, 03: Arsenal, 04: Setup, 05: Reset, 06: Börse, 07: Null-Zone) |
| **`[W] [A] [S] [D]` / Pfeiltasten** | Taktik-Grid / Menü | Taktische Bewegung & Menü-Navigation |
| **`[1]`** | Kampf-Phase | **SCHUSS (2 AP)** // ARC-70 Kinetik-Feuerstoß |
| **`[2]`** | Kampf-Phase | **NACHLADEN (1 AP)** // Magazin auffüllen |
| **`[3]`** | Kampf-Phase | **CHRONO-DASH (1 AP)** // Kinetischer Sprung |
| **`[4]` / `[H]`** | Kampf-Phase | **NANITEN-HEILUNG (1 AP)** // Rig-Integrität wiederherstellen |
| **`[R]`** | Kampf-Phase | **CHRONO-REWIND** // Zug zurücksetzen |
| **`[LEERTASTE]`** | Kampf-Phase | **RUNDE BEENDEN** // Feind-Aktionsphase einleiten |
| **`[MAUSKLICK]`** | QTE-Parade | Im 160ms-Sweetspot klicken für 100% Schild-Parade |
| **`[B]`** | Hauptdeck | Direktzugriff auf **Astraea-Börse & Forschungsmatrix** |
| **`[N]`** | Hauptdeck | Direktzugriff auf **Null-Zone Apex-Raids** |
| **`Shift + D`** / 3x Klick | Global | **Echtzeit-Telemetrie & POST-Audit Overlay** öffnen/schließen |
| **`[M]`** | Global | Audio stummschalten / wieder aktivieren |
| **`[ESC]`** | Global | Aktive Modalfenster schließen / Zurück zum Hauptdeck |

---

## 🏗️ Architektur & System-Module

Das Spiel ist nach diegetischen Subsystemen modularisiert:

```
src/
├── components/                 # Modulare React 19 UI- und Canvas-Komponenten
│   ├── BootSequence.tsx        # SYS-BOOT-01: Terminal POST-Audit & Audio-Entriegelung
│   ├── HomeScreen.tsx          # SYS-CORE-02: Haupt-Befehlsdeck & Status
│   ├── RadarViewport.tsx       # SYS-CORE-02: 2D Canvas Sektor-Radar
│   ├── SettingsModal.tsx       # SYS-CONF-03: Audio-, Shader- & Keybind-Konfiguration
│   ├── ArsenalWorkshop.tsx     # SYS-ARS-04: Naniten-Waffenschmiede & Mod-Slots
│   ├── OperationsHub.tsx       # SYS-OPS-05: Sektor-Karte & Missions-Dossiers
│   ├── TacticalGridCanvas.tsx  # SYS-COMB-06: 10x10 Canvas Kampf-Schlachtfeld
│   ├── CombatHUD.tsx           # SYS-COMB-06: Kampf-Interface & Aktionspunkte
│   ├── ChronoParryOverlay.tsx  # SYS-QTE-07: 1.2s Reaktionszeit-Parade
│   ├── NarrativeTerminal.tsx   # SYS-NARR-09: Live-Funk, Spektrum & Vektorporträts
│   ├── EconomyExchange.tsx     # SYS-ECON-13: 3-Spalten Börse, Händler & Pity-Kisten
│   ├── ResearchTreeCanvas.tsx  # SYS-ECON-13: 12-Knoten Canvas Forschungsbaum
│   ├── EndgameTerminal.tsx     # SYS-ENDG-14: Apex-Raids, Live-Ops & Season-Pass
│   ├── DualGridCanvas.tsx      # SYS-ENDG-14: 8x8 Dual-Grid mit Kausalitätslinien
│   ├── EngineTelemetryOverlay.tsx # SYS-QA-15: In-Browser Performance-HUD
│   └── QaAuditModal.tsx        # SYS-QA-15: 1000-Turn Bot Stresstest & Checkliste
├── services/                   # Geschäftslogik, Audio & Algorithmen
│   ├── audioEngine.ts          # Prozedurale Web Audio SFX & Oszillatoren
│   ├── proceduralMusicEngine.ts# 120-BPM Multi-Stem Lookahead Sequenzer
│   ├── pathfinding.ts          # A* Pfadfinder mit Kachel-Kostenmatrix
│   ├── combatResolutionService.ts # Hit-Chance & Schadensberechnung
│   ├── enemyAiService.ts       # Intent- und Verhaltensbäume für Kriecher/Drohnen
│   ├── seededRng.ts            # Deterministischer Mulberry32 PRNG-Generator
│   ├── economyService.ts       # Dynamische Bepreisungsformel & Pity-Drops
│   ├── endgameService.ts       # Kausalitäts-Topologie & Leaderboard-Scoring
│   ├── storageService.ts       # Atomare LocalStorage Persistenz mit FNV-1a Hash
│   └── settingsService.ts      # CWE-312 bereinigte Konfigurationsverwaltung
└── types/                      # Strikte TypeScript Schnittstellen
```

---

## 🚀 Lokale Entwicklung (Getting Started)

### Voraussetzungen
* **Node.js** `>= 20.0.0`
* **npm** `>= 10.0.0`

### Installation & Start
```bash
# 1. Repository klonen
git clone https://github.com/DarkSoulLeeHD/2D-Space-Game.git
cd 2D-Space-Game

# 2. Abhängigkeiten installieren
npm install

# 3. Lokalen Entwicklungsserver starten
npm run dev
```
Öffne [http://localhost:3000](http://localhost:3000) im Browser.

### Produktions-Build & Validierung
```bash
# TypeScript Typecheck (Zero Warnings)
npm run lint

# Produktions-Bundle kompilieren (für GitHub Pages optimiert mit base: './')
npm run build
```

---

## 🔒 Sicherheit & Datenschutz (Security)

Dieses Projekt erfüllt die Richtlinien von **CWE-312** (Keine Speicherung von Klartext-Schlüsseln):
* Alle sensiblen API-Tokens werden vor dem Speichern in `localStorage` restlos gelöscht.
* Sämtliche Spielstände und Forschungsdaten verbleiben isoliert im Browser des Spielers.
* Detaillierte Richtlinien findest du in unserer [Sicherheitsrichtlinie (SECURITY.md)](SECURITY.md).

---

## 📄 Lizenz & Danksagung

Dieses Projekt ist unter der **[MIT License](LICENSE)** lizenziert © 2026 **DarkSoulLeeHD**.
Gebaut für anspruchsvolle Sci-Fi-Taktiker mit maximaler Performance direkt im Web-Browser!
