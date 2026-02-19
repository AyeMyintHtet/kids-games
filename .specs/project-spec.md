# Learny Land Project Spec (Baseline)

Status: Draft  
Updated: 2026-02-19  
Scope: Current mobile app baseline + reusable spec frame for future features.

## 1. Current System Understanding

### 1.1 Product intent (inferred)
- Child-focused educational mobile app with playful feedback loops (visual, haptics, sound).
- Primary gameplay modes:
  - Math quick-answer game
  - Alphabet tap-in-order game
  - Animal memory matching game
- Primary navigation entry point is home screen with custom cloud-transition routing.

### 1.2 Route and URL structure
- `/` -> Home
- `/math-game` -> Math game screen
- `/alphabet` -> Alphabet game screen
- `/animal-flashcards` -> Animal memory game screen
- `/settings` exists but current home flow mainly uses in-place `PopBox` settings modal

### 1.3 Data model and relationships
- Global state (`Zustand` + persisted `AsyncStorage` key `app-store`):
  - `settings`:
    - `soundEnabled: boolean`
    - `hapticsEnabled: boolean`
    - `difficulty: 'easy' | 'medium' | 'hard'`
  - `progress`:
    - `totalScore: number`
    - `gamesPlayed: number`
    - `lastPlayedAt: string | null`
- Feature-local runtime state (not persisted):
  - Math: generated question + options + streak + modal state
  - Alphabet: shuffled letters + next target + wrong count + elapsed time
  - Animal memory: level config + deck + lives + timer + streak + round result

### 1.4 Database schema and migrations
- No backend database found.
- No local SQL/Realm schema or migration layer found.
- Persistence is client-side key-value via `AsyncStorage` through Zustand `persist`.

### 1.5 Controller/actions and flow
- Root providers in `app/_layout.tsx`:
  - `QueryClientProvider` (currently mostly unused by feature data)
  - music context (`useBackgroundMusic`)
  - cloud transition context
- Route changes generally use `useCloudTransition` (`navigateTo`, `replaceTo`, `goBack`).
- Score increments through store actions from game screens.
- Give-up and restart flows are handled per-feature in screen-level state.

### 1.6 Business logic and validation posture
- Game logic is mostly screen-local, imperative, and deterministic enough for UI behavior.
- No formal schema validation (`zod` or similar) currently used in app runtime.
- No API response validation needs currently visible (no remote data pipeline).

### 1.7 Security and privacy implications (current)
- No visible PII collection/storage in app logic.
- Persisted storage is unencrypted `AsyncStorage` for settings/progress.
- Remote network dependency exists for confetti Lottie JSON URI in `CelebrationEffect`.
- Android config requests microphone/audio permissions; gameplay use of microphone is not visible.

### 1.8 UI/UX and interaction patterns
- Strongly animated, tactile components (`reanimated`, haptics, audio).
- Shared reusable pieces:
  - `TactileButton`
  - `PopBox`
  - `GameCountdown`
  - `ScoreBadge`
  - `GiveUpModal`
- Consistent route-entry pattern: intro -> countdown -> play loop.

### 1.9 Performance considerations (current)
- Heavy animation usage, mostly on UI thread (`reanimated`).
- Frequent timers/intervals in gameplay loops.
- Network confetti fetch at celebration time can add runtime variance/offline failure risk.
- State updates are mostly local; no obvious expensive list virtualization needs currently.

### 1.10 Backwards compatibility and migration baseline
- Existing users may have persisted `app-store` state in `AsyncStorage`.
- Any future move to encrypted storage or changed state shape needs migration plan.

## 2. Interview Questions To Finalize Spec

Only non-obvious questions are included. These should be answered before implementation of major feature changes.

1. Product direction: should the app remain fully offline-first, or do you want any cloud sync/profile model in upcoming milestones?
2. Source of truth for difficulty: should global `settings.difficulty` control all game modes, or should each mode keep independent difficulty state?
3. Score policy: should `totalScore` be cumulative forever, seasonal/resettable, or segmented by game mode?
4. Game progress model: do you want per-game stats (best time, accuracy, streak history) persisted, or keep only current minimal fields?
5. Storage/security: do you want migration from `AsyncStorage` to encrypted storage now, or defer until PII/parental features arrive?
6. Permissions: can microphone permissions be removed from Android config if no voice/game feature is planned soon?
7. Route architecture: should settings stay an in-home modal, or move to dedicated `/settings` with one canonical settings experience?
8. Audio policy: should sound/music/haptics toggles be globally persisted and enforced consistently across all features (including button taps and countdown)?
9. Localization scope: is language switching intended to fully localize game text now (EN/ES), or remain UI placeholder-only for current release?
10. Resilience: should celebration/confetti be local bundled assets only (no runtime network dependency)?
11. Safety/compliance: do you require a parental gate before settings/exit/external links for COPPA-style controls?
12. Performance budget: do you have target device baseline (e.g., older Android low-end) and minimum FPS expectation per game screen?
13. QA strategy: what acceptance criteria do you want for each game mode (unit tests, integration tests, manual checklist)?
14. Rollout strategy: should upcoming changes preserve compatibility with existing persisted state without user reset?

## 3. Proposed Decisions (Pending Your Confirmation)

- Keep current routes and cloud-transition pattern.
- Extract game logic from screen files into feature hooks/services for testability.
- Make settings truly global and persisted (music/sfx/haptics/language/difficulty).
- Replace remote confetti URI with bundled local animation.
- Define a simple storage migration strategy before changing `app-store` shape.

## 4. Reusable Spec Skeleton For Future Features

Use this block as the default structure for all future feature specs in this project.

```md
# <Feature Name>

Status: Draft
Owner:
Updated:

## Problem
- What user problem are we solving?
- Why now?

## Scope
- In scope:
- Out of scope:

## Existing Baseline
- Routes affected:
- Global state affected:
- Components/hooks reused:

## Data Model
- New/changed fields:
- Relationships:
- Persistence strategy:
- Migration needs:

## Flow
- Entry points:
- Main user journey:
- Error and empty states:

## Business Rules
- Core logic:
- Validation:
- Edge cases:

## Security/Privacy
- Data sensitivity:
- Permissions:
- Compliance notes:

## Performance
- Target devices:
- FPS/memory constraints:
- Instrumentation:

## Backwards Compatibility
- Persisted state migration:
- Rollback plan:

## Testing
- Unit:
- Integration:
- Manual QA:

## Open Questions
1.
2.

## Decision Log
- YYYY-MM-DD:
```

