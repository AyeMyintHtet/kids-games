---
description: React Native Best Practise
---

# React Native Best Practices & Architecture (2026)
## Senior Engineer Standard for 2D Child Games & Apps

## 1. Architectural Layers
To ensure scalability and testability, we separate the code into three distinct layers.

[Image of 3-tier architecture diagram showing Presentation, Business, and Data layers]

### **A. UI Layer (Presentation)**
- **Components:** Pure, "dumb" components that only receive props.
- **Screens:** Layout containers that compose components and connect to hooks.

### **B. Business Logic Layer (Domain)**
- **Custom Hooks:** All game logic (math generators, scoring logic) lives here (e.g., `useMathGame.ts`).
- **Services:** Pure JS functions for external interactions (API, Analytics).

### **C. Data Layer (Persistence)**
- **State:** Global state management (Zustand).
- **Storage:** Local encrypted or high-speed storage.

---

## 2. Professional Folder Structure
A feature-based structure is preferred over a generic one to keep related logic together.

```text
src/
├── assets/              # Images, Sounds, Lottie JSON
├── components/          # Shared atomic UI (Buttons, Cards)
├── constants/           # Colors, Typography, Config
├── features/            # Feature-encapsulated logic
│   ├── math-game/       # Specific game module
│   │   ├── components/  # Game-specific UI
│   │   ├── hooks/       # useMathEngine.ts
│   │   └── screens/     # GameScreen.tsx
│   └── flashcards/      # Flashcard module
├── navigation/          # Navigation Stacks
├── services/            # API Clients, Firebase
├── store/               # Global state (Zustand)
└── utils/               # Generic helpers (formatters)




3. Privacy & Security (Important)When building for children, privacy is a legal requirement (COPPA/GDPR)..env: Use react-native-config. Never commit keys to GitHub.Sensitive Data: Use Apple Keychain or Android Keystore.Storage: NEVER store PII (Personally Identifiable Information) in AsyncStorage as it is unencrypted. Use react-native-mmkv with encryption enabled for scores or user settings.4. Best Practices ChecklistTypeScript: Use strict typing. Define interface for all component props.Absolute Imports: Configure tsconfig.json to use @/components instead of ../../components.Performance: - Use react-native-reanimated for 60FPS animations.Use FlashList (Shopify) for any lists of flashcards.Haptics & Sound: Essential for children's games to provide sensory feedback.5. Recommended 2026 Tech StackCategoryRecommended LibraryReasonStateZustandSimple, fast, and no boilerplate.Animationreact-native-reanimatedNative-thread performance.Storagereact-native-mmkvHigh-speed C++ implementation.StylingNativeWindTailwind CSS workflow for mobile.Logic/DataTanStack QueryHandles caching and sync automatically.6. Standard Design PrinciplesDRY (Don't Repeat Yourself): Abstract shared logic into hooks.KISS (Keep It Simple, Stupid): Don't over-engineer simple flashcard transitions.Accessibility: Use accessible={true} and accessibilityLabel for screen readers.