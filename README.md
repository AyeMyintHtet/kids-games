# Learny Land 🎮

A React Native (Expo) application for children's educational games built with the **2026 Senior Engineer Standard**.

## Tech Stack

| Category | Library | Reason |
|----------|---------|--------|
| **State** | Zustand | Simple, fast, no boilerplate |
| **Animation** | react-native-reanimated | Native-thread 60FPS performance |
| **Storage** | react-native-mmkv | High-speed C++ implementation |
| **Styling** | NativeWind | Tailwind CSS workflow for mobile |
| **Data** | TanStack Query | Handles caching and sync automatically |
| **Navigation** | expo-router | File-based routing |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Project Structure

```
src/
├── assets/           # Images, Sounds, Lottie JSON
├── components/       # Shared atomic UI (Buttons, Cards)
├── constants/        # Colors, Typography, Config
├── features/         # Feature-encapsulated logic
│   ├── math-game/    # Specific game module
│   └── flashcards/   # Flashcard module
├── navigation/       # Navigation Stacks
├── services/         # API Clients, Firebase
├── store/            # Global state (Zustand)
└── utils/            # Generic helpers
```

## Security & Privacy (COPPA/GDPR)

- ✅ **Environment Variables**: Use `.env` files (never commit secrets)
- ✅ **Encrypted Storage**: MMKV with encryption enabled
- ✅ **No PII**: Never store personally identifiable information in unencrypted storage

## Privacy Policy URL (Store Requirement)

- Privacy policy source file: `PRIVACY_POLICY.md`
- Public URL to submit in stores (after pushing to GitHub):
  `https://github.com/AyeMyintHtet/kids-games/blob/main/PRIVACY_POLICY.md`
- In-app location: Home -> Settings -> `Privacy Policy`

## Development Commands

```bash
npm start     # Start Expo development server
npm run ios   # Run on iOS simulator
npm run android  # Run on Android emulator
npm run web   # Run in web browser
```

---

Built with ❤️ for children's education.
