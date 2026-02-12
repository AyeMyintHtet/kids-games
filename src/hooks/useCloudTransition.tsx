import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useRouter, type Href } from 'expo-router';

// ─── Types ──────────────────────────────────────────────────────────────────────

type NavigateAction = {
  type: 'push' | 'replace' | 'back';
  href?: Href;
};

type CloudTransitionContextType = {
  /** Whether the cloud overlay is currently animating */
  isActive: boolean;
  /** Navigate with cloud transition — push */
  navigateTo: (href: Href) => void;
  /** Navigate with cloud transition — replace */
  replaceTo: (href: Href) => void;
  /** Navigate with cloud transition — back */
  goBack: () => void;
  /** Called by CloudTransition when clouds fully cover the screen */
  handleCovered: () => void;
  /** Called by CloudTransition when exit animation completes */
  handleFinished: () => void;
};

const CloudTransitionContext = createContext<CloudTransitionContextType>({
  isActive: false,
  navigateTo: () => { },
  replaceTo: () => { },
  goBack: () => { },
  handleCovered: () => { },
  handleFinished: () => { },
});

// ─── Provider ───────────────────────────────────────────────────────────────────

/**
 * Provides cloud transition state to the entire app.
 * Wrap this around the <Stack /> in _layout.tsx.
 */
export const CloudTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  // Ref stores the pending navigation action so it survives re-renders
  const pendingAction = useRef<NavigateAction | null>(null);

  const startTransition = useCallback((action: NavigateAction) => {
    // Ignore if already transitioning — prevents double-taps
    if (isActive) return;
    pendingAction.current = action;
    setIsActive(true);
  }, [isActive]);

  const navigateTo = useCallback((href: Href) => {
    startTransition({ type: 'push', href });
  }, [startTransition]);

  const replaceTo = useCallback((href: Href) => {
    startTransition({ type: 'replace', href });
  }, [startTransition]);

  const goBack = useCallback(() => {
    startTransition({ type: 'back' });
  }, [startTransition]);

  /**
   * Fired when the clouds have fully covered the screen.
   * This is the safe moment to perform the actual navigation
   * (user can't see the route swap).
   */
  const handleCovered = useCallback(() => {
    const action = pendingAction.current;
    if (!action) return;

    switch (action.type) {
      case 'push':
        if (action.href) router.push(action.href);
        break;
      case 'replace':
        if (action.href) router.replace(action.href);
        break;
      case 'back':
        router.back();
        break;
    }
  }, [router]);

  /**
   * Fired when the exit cloud animation is done.
   * Resets state so the component is ready for the next transition.
   */
  const handleFinished = useCallback(() => {
    pendingAction.current = null;
    setIsActive(false);
  }, []);

  return (
    <CloudTransitionContext.Provider
      value={{ isActive, navigateTo, replaceTo, goBack, handleCovered, handleFinished }}
    >
      {children}
    </CloudTransitionContext.Provider>
  );
};

// ─── Consumer Hook ──────────────────────────────────────────────────────────────

/**
 * Use this hook in any screen to navigate with the cloud transition.
 *
 * @example
 * ```tsx
 * const { navigateTo, goBack } = useCloudTransition();
 * // ...
 * <Pressable onPress={() => navigateTo('/alphabet')}>
 * ```
 */
export const useCloudTransition = () => useContext(CloudTransitionContext);
