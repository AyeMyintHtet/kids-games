import React, { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Image,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  BounceIn,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';

import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { TactileButton } from '../src/components/TactileButton';
import { Colors } from '../src/constants/colors';

// Background music asset
const BACKGROUND_MUSIC = require('../src/assets/sounds/learny_land_main_sound1.mp3');

// Icon assets
const SETTINGS_ICON = require('../src/assets/images/settings.png');
const SPEAKER_ICON = require('../src/assets/images/speaker.png');
const MUTE_ICON = require('../src/assets/images/mute.png');

import { PopBox } from '../src/components/PopBox';
import { ScoreBadge } from '../src/components/ScoreBadge';
import { Switch } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Responsive sizing utilities.
 * Scales based on screen size while maintaining minimum touch targets.
 */
const scale = (size: number): number => {
  const baseWidth = 375;
  return (SCREEN_WIDTH / baseWidth) * size;
};

const verticalScale = (size: number): number => {
  const baseHeight = 812;
  return (SCREEN_HEIGHT / baseHeight) * size;
};

// ───────────────────────────────────────────────────────────────────────────────
// Animated Background Elements
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Floating cloud component for background decoration.
 */
const FloatingCloud: React.FC<{ delay: number; startX: number; top: number }> = ({
  delay,
  startX,
  top,
}) => {
  const translateX = useSharedValue(startX);

  useEffect(() => {
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(SCREEN_WIDTH + 100, { duration: 15000, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.Text style={[styles.cloud, { top }, animatedStyle]}>☁️</Animated.Text>
  );
};

/**
 * Floating translucent bubble that rises from the bottom.
 * Creates a magical, underwater-like atmosphere that children love.
 * Each bubble has a unique size, color, speed, and sway pattern.
 */
const FloatingBubble: React.FC<{
  color: string;
  size: number;
  startX: number;
  delay: number;
  duration: number;
}> = ({ color, size, startX, delay, duration }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const bubbleOpacity = useSharedValue(0);

  useEffect(() => {
    // Float upward continuously from bottom to top
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-SCREEN_HEIGHT * 0.8, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );

    // Gentle horizontal sway — sine wave for organic motion
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(20, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(-20, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    // Fade lifecycle: appear → stay visible → fade near top
    bubbleOpacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: duration * 0.15 }),
          withTiming(0.4, { duration: duration * 0.6 }),
          withTiming(0, { duration: duration * 0.25 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
    opacity: bubbleOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: -size,
          left: startX,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          // Glossy highlight effect
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.4)',
        },
        animatedStyle,
      ]}
    />
  );
};

/**
 * Animated sun with pulsing glow and slow rotation.
 * Positioned in the sky area for a warm, cheerful atmosphere.
 */
const AnimatedSun: React.FC = () => {
  const sunRotate = useSharedValue(0);
  const sunScale = useSharedValue(1);

  useEffect(() => {
    // Slow rotation for dynamic feel
    sunRotate.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );

    // Breathing pulse — sun grows/shrinks subtly
    sunScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${sunRotate.value}deg` },
      { scale: sunScale.value },
    ],
  }));

  return (
    <Animated.Text
      style={[
        {
          position: 'absolute',
          top: verticalScale(35),
          right: scale(50),
          fontSize: scale(55),
          zIndex: 5,
        },
        animatedStyle,
      ]}
    >
      ☀️
    </Animated.Text>
  );
};

/**
 * Twinkling sparkle that fades in/out at a fixed position.
 * Adds magical "pixie dust" atmosphere to the scene.
 */
const TwinklingSparkle: React.FC<{
  x: number;
  y: number;
  delay: number;
  emoji?: string;
}> = ({ x, y, delay, emoji = '✨' }) => {
  const sparkleOpacity = useSharedValue(0);
  const sparkleScale = useSharedValue(0.5);

  useEffect(() => {
    // Twinkle pattern: flash on → fade off → pause → repeat
    sparkleOpacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 }),
          withTiming(0, { duration: 800 }) // Pause between twinkles
        ),
        -1,
        false
      )
    );

    sparkleScale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.3, { duration: 400 }),
          withTiming(0.5, { duration: 400 }),
          withTiming(0.5, { duration: 800 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
    transform: [{ scale: sparkleScale.value }],
  }));

  return (
    <Animated.Text
      style={[
        { position: 'absolute', left: x, top: y, fontSize: scale(18), zIndex: 3 },
        animatedStyle,
      ]}
    >
      {emoji}
    </Animated.Text>
  );
};

/**
 * Dancing butterfly that flutters along a figure-8 path.
 * Adds life and movement to the nature scene.
 */
const DancingButterfly: React.FC<{
  startX: number;
  startY: number;
  delay: number;
}> = ({ startX, startY, delay }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Horizontal sweep — wider range for visible movement
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(40, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(-40, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    // Vertical bob — offset from horizontal for figure-8 illusion
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
          withTiming(20, { duration: 1500, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.Text
      style={[
        {
          position: 'absolute',
          left: startX,
          top: startY,
          fontSize: scale(28),
          zIndex: 4,
        },
        animatedStyle,
      ]}
    >
      🦋
    </Animated.Text>
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// UI Sub-Components
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Animated mascot owl component.
 */
const MascotOwl: React.FC = () => {
  const bounce = useSharedValue(0);

  useEffect(() => {
    // Gentle bouncing
    bounce.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  return (
    <Animated.View style={[styles.mascotContainer, animatedStyle]}>
      <Text style={styles.mascot}>🦉</Text>
      <View style={styles.graduationCap}>
        <Text style={styles.capEmoji}>🎓</Text>
      </View>
    </Animated.View>
  );
};

/**
 * Full rainbow arc component with gradient colors.
 */
const AnimatedRainbow: React.FC = () => {
  const rainbowOpacity = useSharedValue(0.7);
  const rainbowScale = useSharedValue(1);

  useEffect(() => {
    rainbowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.7, { duration: 2000 })
      ),
      -1,
      true
    );

    rainbowScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [rainbowOpacity, rainbowScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: rainbowOpacity.value,
    transform: [{ scale: rainbowScale.value }],
  }));

  const rainbowColors = [
    '#FF0000', '#FF7F00', '#FFFF00', '#00FF00',
    '#0000FF', '#4B0082', '#9400D3',
  ];

  const arcWidth = scale(280);
  const bandWidth = scale(15);

  return (
    <Animated.View style={[styles.rainbowContainer, animatedStyle]}>
      {rainbowColors.map((color, index) => {
        const size = arcWidth - index * bandWidth * 2;
        return (
          <View
            key={index}
            style={[
              styles.rainbowBand,
              {
                width: size,
                height: size / 2,
                borderTopLeftRadius: size / 2,
                borderTopRightRadius: size / 2,
                borderColor: color,
                borderTopWidth: bandWidth,
                borderLeftWidth: bandWidth,
                borderRightWidth: bandWidth,
                borderBottomWidth: 0,
              },
            ]}
          />
        );
      })}
    </Animated.View>
  );
};

/**
 * Settings button (top-left).
 */
/**
 * Settings button (top-left).
 */
const SettingsButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  return (
    <TactileButton
      onPress={onPress}
      color={Colors.white}
      shadowColor="#A5B8D1"
      size="small"
      style={styles.cornerButton}
    >
      <Image source={SETTINGS_ICON} style={styles.iconImage} />
    </TactileButton>
  );
};

/**
 * Sound toggle button (bottom-left).
 */
const SoundButton: React.FC<{ onPress: () => void; isMuted: boolean }> = ({
  onPress,
  isMuted,
}) => {
  return (
    <TactileButton
      onPress={onPress}
      color={Colors.white}
      shadowColor="#A5B8D1"
      size="small"
      style={styles.cornerButton}
    >
      <Image
        source={isMuted ? MUTE_ICON : SPEAKER_ICON}
        style={styles.iconImage}
      />
    </TactileButton>
  );
};

/**
 * Parent Gate button (top-right).
 */
const ParentGateButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  return (
    <View style={styles.parentGateContainer}>
      <TactileButton
        onPress={onPress}
        color={Colors.fun.purple}
        size="small"
        style={styles.cornerButton}
      >
        <Text style={styles.cornerButtonEmoji}>ℹ️</Text>
      </TactileButton>
      <Text style={styles.parentGateLabel}>Parent{'\n'}Gate</Text>
    </View>
  );
};

/**
 * Wavy Divider Component.
 */
const WavyDivider: React.FC = () => {
  return (
    <View style={styles.wavyDividerContainer}>
      <Text style={styles.wavyText} numberOfLines={1} ellipsizeMode="clip">
        {'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'}
      </Text>
    </View>
  );
};

/**
 * Child-friendly Language Dropdown Component.
 */
const LanguageDropdown: React.FC<{
  selected: 'en' | 'es';
  onSelect: (lang: 'en' | 'es') => void;
}> = ({ selected, onSelect }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const rotation = useSharedValue(0);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    rotation.value = withTiming(isOpen ? 0 : 180);
  };

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const renderOption = (lang: 'en' | 'es', label: string, icon: string, isSelected: boolean) => (
    <TouchableOpacity
      key={lang}
      onPress={() => {
        onSelect(lang);
        setIsOpen(false);
        rotation.value = withTiming(0);
        Haptics.selectionAsync();
      }}
      style={[
        styles.languageOption,
        isSelected && styles.languageOptionSelected,
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.languageOptionContent}>
        <Text style={styles.languageIcon}>{icon}</Text>
        <Text style={[styles.languageText, isSelected && styles.languageTextSelected]}>
          {label}
        </Text>
      </View>
      {isSelected && <Text style={styles.checkMark}>✓</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.languageContainer}>
      <View style={styles.languageHeaderRow}>
        <Text style={styles.settingLabel}>Language</Text>
        <Text style={styles.wavyLineSmall}>~~~~~~</Text>
      </View>

      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          onPress={toggleDropdown}
          style={styles.dropdownTrigger}
          activeOpacity={0.8}
        >
          <View style={styles.triggerContent}>
            <Text style={styles.languageIcon}>
              {selected === 'en' ? '🌍' : '🧱'}
            </Text>
            <Text style={styles.triggerText}>
              {selected === 'en' ? 'English' : 'Español'}
            </Text>
          </View>
          <Animated.Text style={[styles.dropdownArrow, arrowStyle]}>
            ▼
          </Animated.Text>
        </TouchableOpacity>

        {isOpen && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            layout={Layout.springify()}
            style={styles.dropdownList}
          >
            {renderOption('en', 'English', '🌍', selected === 'en')}
            {renderOption('es', 'Español', '🧱', selected === 'es')}
          </Animated.View>
        )}
      </View>
    </View>
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// Main HomeScreen
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Main HomeScreen Component.
 *
 * Implements 2026 kid-friendly UI standards:
 * - Floating bubbles + sparkles for magical atmosphere
 * - Animated sun, butterflies, and nature elements
 * - Staggered bouncy entrance animations for game buttons
 * - Spring-based animations throughout
 * - Multi-sensory feedback (visual + haptic)
 * - Rounded, friendly typography (SuperWonder)
 * - Responsive design for all devices
 */
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isMuted, setIsMuted] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [language, setLanguage] = React.useState<'en' | 'es'>('en');
  const soundRef = useRef<Audio.Sound | null>(null);



  /**
   * Background music setup.
   */
  useEffect(() => {
    let isMounted = true;

    const loadAndPlayMusic = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          BACKGROUND_MUSIC,
          {
            isLooping: true,
            volume: 0.5,
            shouldPlay: true,
          }
        );

        if (isMounted) {
          soundRef.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch (error) {
        console.log('Error loading background music:', error);
      }
    };

    loadAndPlayMusic();

    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  /**
   * Handle mute/unmute for background music.
   */
  useEffect(() => {
    const updateVolume = async () => {
      if (soundRef.current) {
        try {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
            await soundRef.current.setVolumeAsync(isMuted ? 0 : 0.5);
          }
        } catch (error) {
          console.log('Error setting volume:', error);
        }
      }
    };

    updateVolume();
  }, [isMuted]);

  // Enhanced title animation — wobble + scale for playful, attention-grabbing feel
  const titleScale = useSharedValue(1);
  const titleRotate = useSharedValue(0);

  useEffect(() => {
    // Bouncy scale pulse
    titleScale.value = withRepeat(
      withSequence(
        withSpring(1.05, { damping: 8 }),
        withSpring(1, { damping: 8 })
      ),
      -1,
      true
    );

    // Gentle wobble rotation (±2 degrees)
    titleRotate.value = withRepeat(
      withSequence(
        withTiming(2, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-2, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: titleScale.value },
      { rotate: `${titleRotate.value}deg` },
    ],
  }));

  // Button handlers with haptic feedback
  const handleMathPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/math-game');
  }, [router]);

  const handleLettersPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    console.log('Letters game pressed');
  }, []);

  const handleVideosPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    console.log('Videos pressed');
  }, []);

  // const handleSoundToggle = useCallback(() => {
  //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  //   setIsMuted((prev) => !prev);
  // }, []);



  // Bubble configurations — candy colors floating upward
  const bubbles = [
    { color: Colors.candy.pink, size: 30, startX: SCREEN_WIDTH * 0.1, delay: 0, duration: 8000 },
    { color: Colors.candy.lavender, size: 22, startX: SCREEN_WIDTH * 0.3, delay: 2000, duration: 10000 },
    { color: Colors.candy.mint, size: 35, startX: SCREEN_WIDTH * 0.55, delay: 4000, duration: 9000 },
    { color: Colors.candy.lemon, size: 18, startX: SCREEN_WIDTH * 0.75, delay: 1000, duration: 11000 },
    { color: Colors.candy.skyBlue, size: 26, startX: SCREEN_WIDTH * 0.9, delay: 3000, duration: 7000 },
    { color: Colors.candy.peach, size: 20, startX: SCREEN_WIDTH * 0.45, delay: 5000, duration: 12000 },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Sky gradient background */}
      <LinearGradient
        colors={['#87CEEB', '#B0E0E6', '#98D8C8']}
        style={styles.backgroundGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Grass at bottom */}
      <LinearGradient
        colors={['#7CB342', '#558B2F', '#33691E']}
        style={styles.grass}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* ☀️ Animated sun with pulsing glow */}
      <AnimatedSun />

      {/* Floating clouds */}
      <FloatingCloud delay={0} startX={-100} top={verticalScale(60)} />
      <FloatingCloud delay={5000} startX={-150} top={verticalScale(120)} />
      <FloatingCloud delay={8000} startX={-60} top={verticalScale(180)} />
      <FloatingCloud delay={7000} startX={-40} top={verticalScale(150)} />
      <FloatingCloud delay={9000} startX={-20} top={verticalScale(120)} />
      <FloatingCloud delay={3000} startX={-40} top={verticalScale(90)} />
      <FloatingCloud delay={5000} startX={-70} top={verticalScale(60)} />
      <FloatingCloud delay={6000} startX={-90} top={verticalScale(30)} />

      {/* 🫧 Floating translucent bubbles — magical atmosphere */}
      {bubbles.map((bubble, index) => (
        <FloatingBubble
          key={`bubble-${index}`}
          color={bubble.color}
          size={bubble.size}
          startX={bubble.startX}
          delay={bubble.delay}
          duration={bubble.duration}
        />
      ))}

      {/* ✨ Twinkling sparkles scattered across the sky */}
      <TwinklingSparkle x={scale(30)} y={verticalScale(100)} delay={0} emoji="✨" />
      <TwinklingSparkle x={scale(280)} y={verticalScale(70)} delay={500} emoji="⭐" />
      <TwinklingSparkle x={scale(180)} y={verticalScale(150)} delay={1200} emoji="💫" />
      <TwinklingSparkle x={scale(60)} y={verticalScale(200)} delay={800} emoji="✨" />
      <TwinklingSparkle x={scale(320)} y={verticalScale(130)} delay={1500} emoji="🌟" />

      {/* 🦋 Dancing butterflies */}
      <DancingButterfly startX={scale(50)} startY={verticalScale(250)} delay={0} />
      <DancingButterfly startX={scale(280)} startY={verticalScale(300)} delay={1500} />

      {/* Rainbow decoration */}
      <AnimatedRainbow />

      {/* Trees on sides */}
      <Text style={[styles.tree, styles.treeLeft]}>🌳</Text>
      <Text style={[styles.tree, styles.treeRight]}>🌳</Text>

      {/* Flowers — more for a lush garden feel */}
      <Text style={[styles.flower, { left: scale(20), bottom: verticalScale(80) }]}>🌸</Text>
      <Text style={[styles.flower, { right: scale(30), bottom: verticalScale(90) }]}></Text>
      <Text style={[styles.flower, { left: scale(60), bottom: verticalScale(70) }]}>🌷</Text>
      <Text style={[styles.flower, { right: scale(70), bottom: verticalScale(75) }]}>🌻</Text>
      <Text style={[styles.flower, { left: scale(100), bottom: verticalScale(85) }]}>🌼</Text>
      <Text style={[styles.flower, { right: scale(10), bottom: verticalScale(65) }]}>🌺</Text>

      {/* 🐝 Buzzing bee near flowers */}
      <DancingButterfly startX={scale(120)} startY={verticalScale(600)} delay={800} />

      {/* Top controls */}
      <View style={styles.topControls}>
        <SettingsButton onPress={() => setIsSettingsOpen(true)} />
        {/* <ParentGateButton onPress={() => console.log('Parent Gate')} /> */}
      </View>

      {/* Main content */}
      <View style={styles.mainContent}>
        {/* Enhanced title with wobble animation */}
        <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
          <Text style={styles.title}>LEARNY LAND</Text>
          <Text style={styles.subtitle}>MATH & ADVENTURES</Text>
        </Animated.View>

        {/* Mascot */}
        <MascotOwl />

        {/* Books stack under mascot */}
        <Text style={styles.books}>📚</Text>
      </View>

      {/* Game buttons with staggered bouncy entrance 🎯 */}
      <View style={styles.gameButtonsContainer}>
        {/* Math button — bounces in first (300ms delay) */}
        <Animated.View
          entering={BounceIn.delay(300).springify()}
          style={[styles.gameButtonWrapper, { marginBottom: scale(50) }]}
        >
          <TactileButton
            onPress={handleMathPress}
            color="#FF6B6B"
            size="large"
            style={styles.gameButton}
          >
            <Text style={styles.gameButtonText}>1+2=?</Text>
            <Text style={styles.gameButtonEmoji}>🚀</Text>
          </TactileButton>
        </Animated.View>

        {/* Letters/ABC button — bounces in second (600ms delay) */}
        <Animated.View
          entering={BounceIn.delay(600).springify()}
          style={[styles.gameButtonWrapper, styles.centerButton]}
        >
          <TactileButton
            onPress={handleLettersPress}
            color={Colors.secondary.main}
            size="large"
            style={styles.gameButton}
          >
            <Text style={styles.gameButtonEmoji}>🔤</Text>
            <Text style={styles.abcText}>ABC</Text>
          </TactileButton>
        </Animated.View>

        {/* Videos/Play button — bounces in third (900ms delay) */}
        <Animated.View
          entering={BounceIn.delay(900).springify()}
          style={[styles.gameButtonWrapper, { marginBottom: scale(50) }]}
        >
          <TactileButton
            onPress={handleVideosPress}
            color={Colors.primary.main}
            size="large"
            style={styles.gameButton}
          >
            <Text style={styles.playIcon}>▶️</Text>
            <Text style={styles.chestEmoji}>📦</Text>
          </TactileButton>
        </Animated.View>
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 10 }]}>
        {/* <SoundButton onPress={handleSoundToggle} isMuted={isMuted} /> */}
        <ScoreBadge />
      </View>

      {/* Settings PopBox */}
      <PopBox
        visible={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Settings"
        variant="blue"
      >
        <View style={styles.settingsRow}>
          <Text style={styles.settingLabel}>Music 🎵</Text>
          <Switch
            value={!isMuted}
            onValueChange={(val) => {
              setIsMuted(!val);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            trackColor={{ false: Colors.neutral[300], true: Colors.success }}
            thumbColor={Colors.white}
          />
        </View>

        <View style={styles.settingsDivider} />

        <LanguageDropdown
          selected={language}
          onSelect={setLanguage}
        />

        <WavyDivider />

        <View style={styles.settingsButtonsRow}>
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: Colors.primary.main }]}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setIsSettingsOpen(false);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.settingsButtonText}>⭐️ Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: Colors.fun.purple }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.settingsButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </PopBox>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: SCREEN_HEIGHT * 0.7,
  },
  grass: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.35,
    borderTopLeftRadius: scale(100),
    borderTopRightRadius: scale(100),
  },
  cloud: {
    position: 'absolute',
    fontSize: scale(50),
    opacity: 0.9,
  },
  rainbowContainer: {
    position: 'absolute',
    top: verticalScale(80),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: scale(280),
    height: scale(140),
    overflow: 'hidden',
  },
  rainbowBand: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  tree: {
    position: 'absolute',
    fontSize: scale(80),
    bottom: verticalScale(200),
  },
  treeLeft: {
    left: -scale(15),
  },
  treeRight: {
    right: -scale(15),
  },
  flower: {
    position: 'absolute',
    fontSize: scale(28),
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    zIndex: 100,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: scale(16),
    zIndex: 100,
  },
  cornerButton: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
  },
  cornerButtonEmoji: {
    fontSize: scale(28),
  },
  iconImage: {
    width: scale(32),
    height: scale(32),
    resizeMode: 'contain',
  },
  parentGateContainer: {
    alignItems: 'center',
  },
  parentGateLabel: {
    fontFamily: 'SuperWonder',
    fontSize: scale(10),
    color: Colors.fun.purple,
    textAlign: 'center',
    marginTop: 4,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: verticalScale(150),
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  title: {
    fontFamily: 'SuperWonder',
    fontSize: scale(38),
    color: '#FF6B9D',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'SuperWonder',
    fontSize: scale(16),
    color: Colors.fun.purple,
    marginTop: 4,
    letterSpacing: 1,
  },
  mascotContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  mascot: {
    fontSize: scale(100),
  },
  graduationCap: {
    position: 'absolute',
    top: -scale(15),
    left: scale(25),
  },
  capEmoji: {
    fontSize: scale(40),
    transform: [{ rotate: '-15deg' }],
  },
  books: {
    fontSize: scale(60),
    marginTop: -scale(20),
  },
  gameButtonsContainer: {
    position: 'absolute',
    bottom: verticalScale(100),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: scale(10),
    gap: scale(15),
  },
  gameButtonWrapper: {
    alignItems: 'center',
  },
  centerButton: {
    marginTop: verticalScale(30),
  },
  gameButton: {
    width: scale(120),
    height: scale(120),
  },
  gameButtonText: {
    fontFamily: 'SuperWonder',
    fontSize: scale(24),
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gameButtonEmoji: {
    fontSize: scale(30),
    marginTop: 4,
  },
  abcText: {
    fontFamily: 'SuperWonder',
    fontSize: scale(20),
    color: Colors.white,
  },
  playIcon: {
    fontSize: scale(40),
  },
  chestEmoji: {
    fontSize: scale(28),
    marginTop: 4,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.main,
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    borderBottomWidth: 4,
    borderBottomColor: Colors.accent.dark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  trophyEmoji: {
    fontSize: scale(24),
    marginRight: 8,
  },
  scoreText: {
    fontFamily: 'SuperWonder',
    fontSize: scale(16),
    color: Colors.neutral[800],
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontFamily: 'SuperWonder',
    fontSize: 18,
    color: Colors.secondary[900],
  },
  settingsDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 16,
  },
  // Language Dropdown Styles
  languageContainer: {
    marginTop: 8,
    marginBottom: 8,
    zIndex: 10, // Ensure dropdown floats above if needed
  },
  languageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  wavyLineSmall: {
    color: Colors.primary.main,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: -4,
    marginTop: 4,
    opacity: 0.6,
  },
  dropdownContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.white,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownArrow: {
    fontSize: 14,
    color: Colors.neutral[500],
  },
  triggerText: {
    fontFamily: 'SuperWonder',
    fontSize: 18,
    color: Colors.neutral[800],
  },
  dropdownList: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
    backgroundColor: Colors.neutral[50],
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  languageOptionSelected: {
    backgroundColor: Colors.primary[50],
  },
  languageOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageIcon: {
    fontSize: 24,
  },
  languageText: {
    fontFamily: 'SuperWonder',
    fontSize: 18,
    color: Colors.neutral[600],
  },
  languageTextSelected: {
    color: Colors.primary.main,
    fontFamily: 'SuperWonder',
  },
  checkMark: {
    fontSize: 18,
    color: Colors.primary.main,
    fontWeight: 'bold',
  },

  wavyDividerContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
    opacity: 0.5,
    overflow: 'hidden',
  },
  wavyText: {
    color: Colors.primary.main,
    fontSize: 24,
    lineHeight: 24,
    fontWeight: 'bold',
    letterSpacing: -7,
    marginTop: -8,
  },
  settingsButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  settingsButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  settingsButtonText: {
    fontFamily: 'SuperWonder',
    fontSize: 18,
    color: Colors.white,
  },
  versionText: {
    fontFamily: 'SuperWonder',
    fontSize: 12,
    color: Colors.neutral[400],
    textAlign: 'center',
    marginTop: 12,
  },
});
