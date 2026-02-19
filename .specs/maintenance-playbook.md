# Learny Land Maintenance Playbook

Updated: 2026-02-19

## What We Maintain

1. Route + cloud-transition navigation pattern.
2. Reusable kid-friendly interaction components (`TactileButton`, `GameCountdown`, `GiveUpModal`, `ScoreBadge`, `PopBox`).
3. Feature-based module structure under `src/features`.
4. Centralized tokens and constants under `src/constants`.
5. Global persisted app state contract in `src/store/useAppStore.ts`.
6. Offline-first gameplay behavior (no critical runtime dependency on network).

## Step-by-Step Workflow

### Step 1: Understand impact before coding

```bash
pwd
ls -la
rg --files
rg -n "useCloudTransition|useAppStore|TactileButton|GameCountdown" app src
```

### Step 2: Keep architecture stable

- New game logic goes inside `src/features/<feature>/...`, not in random shared files.
- Reuse shared components before creating one-off UI patterns.
- Keep route transitions through `useCloudTransition`.

### Step 3: Keep data model safe

- If changing persisted state in `useAppStore`, define migration/versioning first.
- Avoid storing sensitive data in plain storage.

### Step 4: Implement with consistency

- Use tokens from `src/constants/colors.ts` and `src/constants/typography.ts`.
- Keep touch targets child-friendly.
- Keep haptics/sound behavior controlled by global settings.

### Step 5: Verify before commit

```bash
npm run typecheck
npm run verify
npm run lint
npm run test -- --watch=false
```

### Step 6: Run app smoke check

```bash
npm start
npm run ios
npm run android
```

## Setup Commands (Best Practice)

Use these once when quality tooling is missing:

```bash
npm install
npx expo lint
npm install -D eslint@^9.0.0 eslint-config-expo@~10.0.0 jest jest-expo @types/jest @testing-library/react-native react-test-renderer@19.1.0
```

## Command Log From This Run

Commands executed while applying this maintenance pass:

```bash
pwd && ls -la
rg --files
sed -n '1,220p' README.md
sed -n '1,220p' package.json
sed -n '1,320p' app/_layout.tsx
sed -n '1,420p' app/index.tsx
sed -n '1,340p' src/features/alphabet-game/screens/AlphabetGameScreen.tsx
sed -n '1,900p' src/features/animal-flashcards/screens/AnimalFlashcardsScreen.tsx
sed -n '1,320p' src/components/TactileButton.tsx
rg -n "prisma|sequelize|typeorm|migration|sqlite|postgres|mysql|supabase|firebase|mongoose|realm|watermelon|drizzle" src app android ios package.json README.md
npm run lint
npm run test -- --watch=false
npx tsc --noEmit
npm run typecheck
git status --short
npm install -D eslint@^9.0.0 eslint-config-expo@~10.0.0 jest jest-expo @types/jest @testing-library/react-native react-test-renderer@19.1.0
npm uninstall -D @testing-library/jest-native
npm run verify
npm run lint
npm run test -- --watch=false
```

## Current Quality Gate Status

- `npm run verify`: passing.
- `npm run test -- --watch=false`: passing.
- `npm run lint`: passing with warnings (0 errors, 23 warnings).
