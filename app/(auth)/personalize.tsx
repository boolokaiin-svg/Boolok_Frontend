// app/(auth)/personalize.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import axios from 'axios';
import { API_BASE_URL } from '../../lib/api';
import BoolokLogo from '../../components/BoolokLogo';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

const MD_BREAKPOINT = 768;

const GOALS = [
  {
    id: 'buying',
    icon: 'home',
    title: 'Buying a Home',
    desc: 'Finding the perfect residence for you and your family.',
  },
  {
    id: 'selling',
    icon: 'sell',
    title: 'Selling Property',
    desc: 'Maximizing value and streamlining the selling process.',
  },
  {
    id: 'investing',
    icon: 'payments',
    title: 'Real Estate Investing',
    desc: 'Building a portfolio and analyzing long-term ROI.',
  },
  {
    id: 'analysis',
    icon: 'query-stats',
    title: 'Market Analysis',
    desc: 'Tracking trends and neighborhood data points.',
  },
] as const;

export default function PersonalizeScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= MD_BREAKPOINT;
  const { token, user, signIn, updateUser } = useAuth();

  const [selectedGoal, setSelectedGoal] = useState<string | null>('buying');
  const [profilePicture, setProfilePicture] = useState<string | null>(user?.profilePicture || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickFromDevice = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const avatarData = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setProfilePicture(avatarData);
      }
    } catch (e) {
      console.error('Pick error:', e);
    }
  };

  const handleTakeCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const avatarData = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setProfilePicture(avatarData);
      }
    } catch (e) {
      console.error('Camera error:', e);
    }
  };

  const handleContinue = async () => {
    if (!token) return;
    setIsSubmitting(true);

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/auth/personalize`,
        { goal: selectedGoal || 'buying', profilePicture },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local context with new user data
      if (response.data.user) {
        await signIn(token, response.data.user);
      }

      router.push('/(auth)/welcome');
    } catch (error: any) {
      console.error('Personalize failed:', error.response?.data?.message || error.message);
      alert(error.response?.data?.message || 'Failed to save preference.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/welcome');
  };

  return (
    <ScrollView
      style={styles.rootScroll}
      contentContainerStyle={styles.rootScrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.mainLayout, isWide && styles.mainLayoutRow]}>
        {/* ---------- LEFT BRAND PANEL (web/wide only) ---------- */}
        {isWide && (
          <Animated.View style={styles.brandPanel} entering={FadeIn.duration(800)}>
            <View style={styles.glowPrimary} />
            <View style={styles.glowSecondary} />

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
                  <Text style={[typography.headlineLg, { color: colors.primaryContainer, marginBottom: spacing.md }]}>
                    Intelligence that moves with you.
                  </Text>
                  <Text style={[typography.bodyLg, { color: colors.onSurfaceVariant, maxWidth: 320 }]}>
                    Precision market analysis and property insights powered by our proprietary real estate AI engine.
                  </Text>
                </View>
              </View>

              <View style={styles.aiTipBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                  <MaterialIcons name="auto-awesome" size={18} color={colors.primary} />
                  <Text style={[typography.labelMd, { color: '#fff', marginLeft: spacing.xs }]}>
                    AI TIP
                  </Text>
                </View>
                <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
                  Defining your primary goal helps our AI curate listings and news specific to your financial objectives and risk profile.
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ---------- RIGHT PANEL (Selection Flow) ---------- */}
        <Animated.View style={styles.formPanel} entering={FadeIn.duration(600).delay(200)}>
          {!isWide && (
            <View style={styles.mobileLogoBlock}>
              <BoolokLogo size={40} color={colors.primary} />
            </View>
          )}

          <View style={styles.formContainer}>
            <View style={styles.stepBadge}>
              <View style={styles.stepDot} />
              <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>STEP 01/03</Text>
            </View>

            <Text style={[typography.headlineXl, { color: colors.onSurface, marginBottom: spacing.sm }]}>
              Personalize Your AI Experience
            </Text>
            <Text style={[typography.bodyLg, { color: colors.onSurfaceVariant, marginBottom: spacing.xl }]}>
              Tell us your primary goal so BoolokOne can better assist you.
            </Text>

            {/* Profile Picture Setup Section */}
            <View style={{ backgroundColor: '#070e1a', borderRadius: 16, borderWidth: 1, borderColor: '#1a273c', padding: 16, marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#ffffff', marginBottom: 4 }}>
                Profile Picture
              </Text>
              <Text style={{ fontSize: 12, color: '#8b9bb4', marginBottom: 14 }}>
                {user?.authProvider === 'google'
                  ? 'Your Google profile photo is automatically synced with your account.'
                  : 'Upload your photo or use your default initial avatar.'}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                {profilePicture ? (
                  <Image source={{ uri: profilePicture }} style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#daa520' }} />
                ) : (
                  <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#162338', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#daa520' }}>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: '#daa520' }}>
                      {(user?.fullName || 'U')[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1 }}>
                  <Pressable
                    onPress={handlePickFromDevice}
                    style={{ backgroundColor: '#142033', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#24354d', flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  >
                    <MaterialIcons name="photo-library" size={16} color="#60a5fa" />
                    <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>Upload Photo</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleTakeCamera}
                    style={{ backgroundColor: '#142033', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#24354d', flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  >
                    <MaterialIcons name="photo-camera" size={16} color="#34d399" />
                    <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>Take Picture</Text>
                  </Pressable>

                  {profilePicture && (
                    <Pressable
                      onPress={() => setProfilePicture(null)}
                      style={{ backgroundColor: '#142033', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ef4444', flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                      <MaterialIcons name="close" size={14} color="#ef4444" />
                      <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>Reset</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>

            {/* Selection Grid */}
            <View style={styles.grid}>
              {GOALS.map((goal) => {
                const isSelected = selectedGoal === goal.id;
                return (
                  <Pressable
                    key={goal.id}
                    onPress={() => setSelectedGoal(goal.id)}
                    style={({ pressed, hovered }: any) => [
                      styles.card,
                      isSelected && styles.cardSelected,
                      (pressed || hovered) && styles.cardHovered,
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                        <MaterialIcons
                          name={goal.icon as any}
                          size={24}
                          color={isSelected ? colors.onPrimary : colors.primary}
                        />
                      </View>
                      {isSelected && (
                        <Animated.View entering={FadeIn}>
                          <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                        </Animated.View>
                      )}
                    </View>
                    <Text style={[typography.headlineSm, { color: colors.onSurface, marginBottom: spacing.xs }]}>
                      {goal.title}
                    </Text>
                    <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
                      {goal.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Footer Actions */}
            <View style={styles.footer}>
              <Pressable onPress={handleSkip}>
                <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>
                  Skip for now
                </Text>
              </Pressable>

              <Pressable
                onPress={handleContinue}
                disabled={!selectedGoal || isSubmitting}
                style={({ pressed, hovered }: any) => [
                  styles.continueBtn,
                  (!selectedGoal || isSubmitting) && styles.continueBtnDisabled,
                  (pressed || hovered) && !(!selectedGoal || isSubmitting) && styles.continueBtnHovered,
                ]}
              >
                <Text style={[typography.labelMd, { color: colors.onPrimary }]}>
                  {isSubmitting ? 'Saving...' : 'Continue'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rootScroll: { flex: 1, backgroundColor: colors.background },
  rootScrollContent: { flexGrow: 1 },
  mainLayout: { flex: 1, flexDirection: 'column' },
  mainLayoutRow: { flexDirection: 'row' },

  // LEFT PANEL
  brandPanel: {
    width: '33.333%',
    backgroundColor: colors.onBackground,
    overflow: 'hidden',
    position: 'relative',
    padding: spacing.xl,
  },
  glowPrimary: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primary,
    opacity: 0.15,
  },
  glowSecondary: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.primaryFixed,
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
  aiTipBox: {
    backgroundColor: colors.inverseSurface,
    borderColor: colors.outlineVariant,
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: radius.xl,
    marginTop: spacing.xl,
  },

  // RIGHT PANEL
  formPanel: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileLogoBlock: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  formContainer: {
    width: '100%',
    maxWidth: 700,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.xs,
  },

  // GRID
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  card: {
    width: Platform.OS === 'web' ? 'calc(50% - 12px)' : '100%',
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    // Provide a default transition-like effect for web
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
      } as any,
    }),
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(218, 165, 32, 0.05)',
  },
  cardHovered: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    transform: [{ scale: 1.02 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapSelected: {
    backgroundColor: colors.primaryContainer,
  },

  // FOOTER
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingTop: spacing.md,
  },
  continueBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
      } as any,
    }),
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnHovered: {
    backgroundColor: colors.primaryContainer,
    transform: [{ scale: 0.98 }],
  },
});