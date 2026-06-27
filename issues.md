# Code Review: Face Filter & Kiosk Components

**Date:** 2026-06-27  
**Tests:** 45/45 passing (24 business logic + 13 CameraCapture + 8 integration)  
**TypeScript:** No errors

---

## Fixed Issues

These were found during review and have been resolved:

- ~~**Bug: Duplicate rotation on sparkle effect** — Removed duplicate `rotate-45` Tailwind class from the sparkle `<span>` in `LiveSingleFaceEffect` to prevent compounding with the inline `rotate(45deg)`.~~
- ~~**Tests added: CameraCapture component tests (13)** — Covers rendering, photo style/face effect selection, countdown/capture flow, retake, and camera error states.~~
- ~~**Tests added: Camera system integration tests (8)** — Tests CameraCapture within `LogForm`, including full capture-and-submit flow with and without face effects, photo style filtering, save button enable/disable logic, and camera error handling.~~

---

## Remaining Issues

### Issue: Redundant streak badge condition hides lightning bolt icon

**File:** `components/kiosk/LogForm.tsx:224`  
**Severity:** Medium

```tsx
if (streak >= 5 || streak >= 3) {       // logically = streak >= 3
  // pushes 🔥 "5-Day Streak" icon
} else if (streak > 0 && action === "login") {
  // pushes ⚡ "Xd Streak" icon — NEVER reached for streak >= 3
}
```

`streak >= 5 || streak >= 3` simplifies to `streak >= 3`. The `else if` branch (showing the ⚡ lightning bolt for 1-2 day streaks) is **unreachable for streaks 3–4** — they get the 🔥 fire icon with "3-Day Streak" / "4-Day Streak" text instead. The intent was likely:

- `>= 5` → 🔥 "5-Day Streak"
- `>= 3` → ⚡ "3-Day Streak"
- `> 0`  → ⚡ "Xd Streak"

---

### Issue: `next lint` command unavailable

**File:** `package.json` (lint script)  
**Severity:** Low

Running `npm run lint` fails with `Invalid project directory provided`. Next.js 16 appears to have removed the `lint` CLI command. There is no ESLint config file (`.eslintrc*`, `eslint.config.*`) in the project. The lint script in `package.json` points to a command that no longer exists.

---

### Enhancement: Redundant role filtering in SuggestionsDropdown

**File:** `components/kiosk/PersonForm.tsx:83` + `components/kiosk/SuggestionsDropdown.tsx:21`  
**Severity:** Low

`PersonForm` already filters `suggestions` by `person.role` before passing to `SuggestionsDropdown`, which then filters again by `selectedRole`. The inner filter is redundant and can be removed.

---

### Enhancement: AudioContext created per-sound (resource leak risk)

**File:** `lib/audio.ts:3-7`  
**Severity:** Low

Each `play*Sound` call creates a new `AudioContext`. Browsers limit the number of simultaneous AudioContexts (typically 4–6). Reuse a singleton context instead.
