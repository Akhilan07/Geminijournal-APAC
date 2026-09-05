---
name: journal-enhancement
description: Rules for implementing Google Maps location-aware entries, secret management, and Gemini API resilience.
---

# Project Guidelines
1. Security & Keys: Never hardcode API keys or secrets. Pull Google Maps and Gemini keys strictly from environment variables (`.env`).
2. Firestore Isolation: Always scope user journal writes strictly under `users/{uid}/journals/{entryId}`.
3. Resilience Ladder: Wrap all Gemini API calls in a fallback chain (Primary: gemini-2.5-flash, Fallback: gemini-2.5-flash-lite).
4. Code Hygiene: Write clean modular TypeScript/JavaScript with clear error handling for missing network or invalid coordinates.
