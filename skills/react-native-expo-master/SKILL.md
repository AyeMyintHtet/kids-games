---
name: react-native-expo-master
description: Senior-level React Native + Expo engineering guidance for performance-first, no-jank app development. Use when building, reviewing, or refactoring Expo screens/components/hooks, selecting libraries, improving render performance, implementing forms/data/state/navigation, or enforcing strict TypeScript and native-feeling interaction patterns.
---

# React Native Expo Master

## Core Workflow

1. Define feature boundaries and data flow before writing JSX.
2. Move business logic into custom hooks under `/hooks`; keep components declarative.
3. Build UI with native-feeling primitives and stable render behavior.
4. Use the preferred performance stack instead of manual reimplementation.
5. Run the final performance and lifecycle checks before finishing.

## Non-Negotiable Architecture Rules

- Apply `React.memo` to all list items and heavy visual components.
- Apply `useCallback` to every function passed as a prop.
- Keep business logic in hooks; keep JSX focused on rendering and wiring.
- Minimize JS-to-Native bridge traffic for UI interactions.
- Implement movement/layout interactions with `react-native-reanimated` worklets (UI thread), not JS-thread animations.

## Component Construction Rules (No-Jank)

- Prefer `Pressable` with `android_ripple`, or `RectButton` from `react-native-gesture-handler`.
- Avoid `TouchableOpacity` unless there is a strict compatibility reason.
- Enforce minimum interactive touch target size of `44x44dp`.
- Add `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}` for small icon buttons.
- Use `expo-image` for all image rendering; do not use the default React Native `Image`.
- Use Flexbox for layout; use absolute positioning only for overlays and floating action buttons.

## Preferred High-Performance Stack

- Lists: `@shopify/flash-list` for recycled cells and high-throughput scrolling.
- State: `zustand` for atomic updates and minimal runtime overhead.
- Data fetching: `@tanstack/react-query` for cache, background sync, and loading/error states.
- Animations: `react-native-reanimated` for UI-thread execution.
- Forms: `react-hook-form` + `zod` for uncontrolled performant fields and typed validation.
- Navigation: `expo-router` for file-based routing and deep-link-ready structure.

## Code Quality and DX Standards

- Enforce strict TypeScript. Do not use `any`.
- Define component props with `interface`.
- Put static styles in `StyleSheet.create`.
- Use NativeWind utilities for rapid, readable styling where appropriate.
- Use `@expo/vector-icons` for lightweight iconography.
- Clean up listeners, timers, and subscriptions in `useEffect` cleanup blocks.

## Output Expectations for Generated Code

- Include hooks and components in separate files when logic is non-trivial.
- Keep props, state, and async data typed end-to-end.
- Avoid passing unstable inline closures to child components in lists.
- Default to libraries in this skill unless project constraints forbid them.

## Final Self-Check Before Returning

- Will this trigger unnecessary re-renders in a list?
- Are we cleaning up listeners or timers in `useEffect`?
- Is this animation running on the JS thread or the Native UI thread?
