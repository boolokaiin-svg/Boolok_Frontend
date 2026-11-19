// app/(auth)/welcome.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Image,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import BoolokLogo from '../../components/BoolokLogo';
import { colors, spacing, typography, radius } from '../../constants/theme';

const MD_BREAKPOINT = 768;

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= MD_BREAKPOINT;

  // Animated checkmark
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 90 });
    opacity.value = withTiming(1, { duration: 600 });
  }, []);

  const animatedCheckStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.root}>
      <View style={[styles.mainLayout, isWide && styles.mainLayoutRow]}>
        {/* ---------- LEFT BRAND PANEL (web/wide only) ---------- */}
        {isWide && (
          <Animated.View style={styles.brandPanel} entering={FadeIn.duration(800)}>
            {/* Background decorative element */}
            <View style={styles.glowBottom} />

            <View style={styles.brandInner}>
              <View>
                <Pressable
                  style={styles.brandLogoRow}
                  onPress={() => router.push('/brand-vision')}
                >
                  <BoolokLogo size={48} color="#fff" />
                  <Text style={[typography.headlineMd, { color: '#fff', marginLeft: spacing.base, fontFamily: 'Poppins_700Bold' }]}>
                    Boolok<Text style={{ color: colors.primary }}>One</Text>
                  </Text>
                </Pressable>

                <View style={styles.heroTextWrap}>
                  <Text style={[typography.headlineLg, { color: '#fff', marginBottom: spacing.md }]}>
                    Revolutionizing{'\n'}
                    Real Estate with{'\n'}
                    <Text style={{ color: colors.primaryContainer }}>Intelligent Precision.</Text>
                  </Text>
                  <Text style={[typography.bodyLg, { color: colors.outlineVariant, maxWidth: 360 }]}>
                    Harness the power of generative AI to decode market trends, automate valuations, and close deals faster than ever before.
                  </Text>
                </View>
              </View>

              <View style={styles.agentsWrap}>
                <View style={styles.avatarGroup}>
                  <View style={[styles.avatar, { backgroundColor: '#162338', justifyContent: 'center', alignItems: 'center', borderColor: '#daa520' }]}>
                    <Text style={{ color: '#daa520', fontWeight: '800', fontSize: 15 }}>S</Text>
                  </View>
                  <View style={[styles.avatar, styles.avatarOffset, { backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderColor: '#daa520' }]}>
                    <Text style={{ color: '#daa520', fontWeight: '800', fontSize: 15 }}>L</Text>
                  </View>
                  <View style={[styles.avatar, styles.avatarOffset, { backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', borderColor: '#daa520' }]}>
                    <Text style={{ color: '#daa520', fontWeight: '800', fontSize: 15 }}>A</Text>
                  </View>
                </View>
                <Text style={[typography.labelMd, { color: colors.primaryFixed }]}>
                  JOIN 5,000+ TOP-TIER AGENTS
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ---------- RIGHT PANEL (Success Content) ---------- */}
        <Animated.View style={styles.contentPanel} entering={FadeIn.duration(600).delay(200)}>
          <View style={styles.contentInner}>

            {/* Animated Checkmark */}
            <View style={styles.checkContainer}>
              <Animated.View style={[styles.checkCircle, animatedCheckStyle]}>
                <MaterialIcons name="check-circle" size={isWide ? 100 : 80} color={colors.primaryContainer} />
              </Animated.View>
            </View>

            {/* Text Content */}
            <Animated.View entering={FadeInUp.duration(600).delay(400)} style={styles.textContainer}>
              <Text style={[typography.headlineXl, { color: colors.onSurface, marginBottom: spacing.sm, textAlign: 'center' }]}>
                You're All Set!
              </Text>
              <Text style={[typography.bodyLg, { color: colors.onSurfaceVariant, textAlign: 'center', maxWidth: 400 }]}>
                Welcome to the future of real estate. Your AI Advisor is ready to help you navigate the market with surgical precision.
              </Text>
            </Animated.View>

            {/* Action Button */}
            <Animated.View entering={FadeInUp.duration(600).delay(600)} style={styles.actionContainer}>
              <Pressable
                onPress={() => router.push('/(app)/feed')}
                style={({ pressed, hovered }: any) => [
                  styles.goBtn,
                  (pressed || hovered) && styles.goBtnHovered,
                ]}
              >
                <Text style={[typography.labelMd, { color: colors.onPrimary }]}>
                  Go to Dashboard
                </Text>
                <MaterialIcons name="arrow-forward" size={18} color={colors.onPrimary} style={{ marginLeft: spacing.sm }} />
              </Pressable>

              <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: spacing.xl }]}>
                Need help getting started? <Text style={{ color: colors.primary, fontWeight: '600' }}>View Onboarding Guide</Text>
              </Text>
            </Animated.View>

          </View>

          {/* Footer just for looks on desktop */}
          {isWide && (
            <View style={styles.desktopFooter}>
              <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>© 2024 BoolokOne.</Text>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>Privacy</Text>
                <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>Terms</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceContainerLowest },
  mainLayout: { flex: 1, flexDirection: 'column' },
  mainLayoutRow: { flexDirection: 'row' },

  // LEFT PANEL
  brandPanel: {
    width: '40%',
    backgroundColor: '#0A0F23', // From HTML gradient-mesh base
    overflow: 'hidden',
    position: 'relative',
    padding: spacing.xl,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
  brandInner: {
    flex: 1,
    zIndex: 10,
    justifyContent: 'space-between',
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 64,
  },
  heroTextWrap: {
    marginTop: spacing.xl,
  },
  agentsWrap: {
    marginTop: spacing.xl,
  },
  avatarGroup: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#0A0F23',
  },
  avatarOffset: {
    marginLeft: -12,
  },

  // RIGHT PANEL
  contentPanel: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    position: 'relative',
  },
  contentInner: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
  },
  checkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  checkCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  actionContainer: {
    alignItems: 'center',
    width: '100%',
  },
  goBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
      } as any,
    }),
  },
  goBtnHovered: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  desktopFooter: {
    position: 'absolute',
    bottom: spacing.md,
    right: 0,
    width: '100%',
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});