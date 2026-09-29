## Description
<!-- Provide a clear and concise description of what this PR introduces or fixes. -->

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding gameplay or engine functionality)
- [ ] Performance optimization (improving FPS, memory, or draw calls)
- [ ] Refactoring (code restructuring without logic changes)
- [ ] Documentation update

## Diegetic Architecture Verification
- [ ] **Zero Binary Assets**: No external sound or image files added.
- [ ] **Web Audio Safety**: Audio nodes are properly cleaned up / disposed.
- [ ] **CWE-312 Compliance**: No sensitive API keys stored in plain text in `localStorage`.
- [ ] **Offline Fallback**: Game functions deterministically without external API dependencies.

## Testing & Quality Assurance
- [ ] `npm run lint` passes with 0 errors.
- [ ] `npm run build` generates the production bundle cleanly.
- [ ] Verified in browser:
  - [ ] Tested on Chromium / Firefox
  - [ ] Tested keyboard navigation (`[1]-[7]`, `WASD`, `Space`, `[ESC]`)
  - [ ] Tested performance via Telemetry HUD (`Shift + D`)

## Related Issues
<!-- Closes #123 -->
