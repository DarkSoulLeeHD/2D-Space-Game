# Contributing to CHRONO-STRATUM: PROTOCOL NULL

Thank you for your interest in contributing to **CHRONO-STRATUM: PROTOCOL NULL**! This document provides guidelines for contributing code, reporting bugs, and submitting feature requests.

---

## Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Getting Started

1. **Fork the Repository**: Create your own fork on GitHub.
2. **Clone the Fork**:
   ```bash
   git clone https://github.com/<your-username>/2D-Space-Game.git
   cd 2D-Space-Game
   ```
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to interact with the Astraea Model-7 Terminal.

---

## Architectural Guidelines

- **Zero Binary Assets**: Do not add external `.mp3`, `.wav`, `.png`, `.jpg`, or 3D models. All visual elements must be rendered via procedural Canvas 2D or SVG/Tailwind styling. All audio effects and musical stems must be synthesized dynamically using the native browser Web Audio API.
- **Pure Client Execution**: The game runs fully client-side and offline-first. Never introduce mandatory external databases or server requirements.
- **Security & Privacy (CWE-312)**: Sensitive keys (such as user-provided Gemini API keys) must never be written in plain text to `localStorage`. Use in-memory state or environment variables.

---

## TypeScript & Code Standards

- **Strict TypeScript**: Ensure type checks pass without warnings:
  ```bash
  npm run lint
  ```
- **Functional React 19 Style**: Use React hooks, modular component trees, and deterministic state updates.
- **Tailwind CSS**: Use Tailwind utility classes for diegetic CRT retro styling (`#070a0e`, `#00FFAA`, `#E07A5F`).
- **Clean Canvas Render Loops**: Always cancel `requestAnimationFrame` IDs on unmount, recycle particle buffers, and prevent memory leaks.

---

## Commit Message Conventions

We adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new feature or gameplay mechanic (e.g., `feat: add dual-grid causality puzzle`)
- `fix:` A bug fix or patch (e.g., `fix: prevent audio oscillator leak on unmount`)
- `perf:` Performance improvements (e.g., `perf: optimize canvas draw calls in radar`)
- `refactor:` Code restructuring without changing behavior (e.g., `refactor: extract telemetry service`)
- `docs:` Documentation updates (e.g., `docs: update keybindings table in README`)
- `chore:` Dependency or build system updates (e.g., `chore: update vite build configuration`)

---

## Submitting Pull Requests

1. Create a branch for your changes:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Verify code quality:
   ```bash
   npm run lint
   npm run build
   ```
3. Push to your fork and open a Pull Request against `main`.
4. Fill out the provided [Pull Request Template](.github/pull_request_template.md).
