/// <reference types="nativewind/types" />

// This file is used to declare global types for NativeWind
// and other libraries that extend React Native types.

declare module '*.png' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '*.jpg' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '*.json' {
  const value: Record<string, unknown>;
  export default value;
}
