# Security Policy

## Supported Versions

We actively support and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Architecture & Sensitive Data Handling

### CWE-312 Compliance (Cleartext Storage of Sensitive Information)
- **Zero Plain-Text API Key Persistence**: User-provided API keys (such as the Gemini API key for dynamic briefings) are handled exclusively in memory or via secure environment configuration (`process.env.GEMINI_API_KEY`).
- **Sanitized Local Storage**: The game configuration saved under `CHRONO_SETTINGS_v1` actively strips out sensitive keys before serializing to `localStorage`.
- **Automatic Key Scrubbing**: Legacy or external keys stored under `GEMINI_API_KEY` or `GEMINI_API_KEY_v1` in `localStorage` are automatically purged upon application boot and settings update.
- **Offline Fallback Architecture**: The game functions 100% offline with zero external network dependencies when no API key is present. All mission dossiers, enemy dialogs, and tactical logs use local deterministic procedural generators.

## Reporting a Vulnerability

If you discover a security vulnerability within **CHRONO-STRATUM: PROTOCOL NULL**, please follow these steps:

1. **Do Not Open a Public Issue**: Please do not file public GitHub issues for security vulnerabilities.
2. **Contact the Maintainer**: Send a report directly to the repository maintainer via GitHub Security Advisories or email `LightSoulLee@gmail.com`.
3. **Include Details**:
   - Description of the vulnerability and its potential impact.
   - Step-by-step reproduction instructions or a minimal proof of concept.
   - Suggested mitigations if known.
4. **Response Timeline**:
   - You will receive an acknowledgment within 48 hours.
   - We will provide regular status updates until a patch is deployed and verified.
