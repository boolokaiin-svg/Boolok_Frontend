// components/StorageConsentBanner.tsx
// Shown once on first app launch to inform users of storage usage.
// Dismissed state is persisted so it never shows again.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, radius } from '../constants/theme';

const CONSENT_KEY = 'boolok_consent_v1';

async function getConsentDismissed(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined'
        ? localStorage.getItem(CONSENT_KEY) === 'true'
        : false;
    }
    const SecureStore = require('expo-secure-store');
    const val = await SecureStore.getItemAsync(CONSENT_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

async function setConsentDismissed(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CONSENT_KEY, 'true');
      }
      return;
    }
    const SecureStore = require('expo-secure-store');
    await SecureStore.setItemAsync(CONSENT_KEY, 'true');
  } catch {
    // Silent fail — banner will reappear next launch but that's acceptable
  }
}

export default function StorageConsentBanner() {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(120)).current;

  useEffect(() => {
    getConsentDismissed().then((dismissed) => {
      if (!dismissed) {
        setVisible(true);
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 200,
        }).start();
      }
    });
  }, []);

  const dismiss = async () => {
    Animated.timing(slideAnim, {
      toValue: 160,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setVisible(false));
    await setConsentDismissed();
  };

  const viewPolicy = () => {
    dismiss();
    router.push({ pathname: '/terms', params: { tab: 'cookie' } } as any);
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: theme.surfaceContainer,
          borderTopColor: theme.outlineVariant,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 12,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel="Storage usage notice"
    >
      <View style={styles.iconRow}>
        <MaterialIcons name="lock" size={20} color={theme.primary} style={{ marginRight: 8 }} />
        <Text style={[typography.headlineSm, { color: theme.onSurface, flex: 1 }]}>
          Storage Notice
        </Text>
        <Pressable
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="Close storage notice"
          style={styles.closeBtn}
        >
          <MaterialIcons name="close" size={18} color={theme.outline} />
        </Pressable>
      </View>

      <Text
        style={[
          typography.bodySm,
          { color: theme.onSurfaceVariant, lineHeight: 20, marginBottom: spacing.md },
        ]}
      >
        BoolokOne uses{' '}
        <Text style={{ fontWeight: '700' }}>secure local storage only</Text> to keep you
        logged in. We use{' '}
        <Text style={{ fontWeight: '700' }}>no advertising cookies</Text> and no cross-site
        tracking. Your data stays private.
      </Text>

      <View style={styles.buttonRow}>
        <Pressable
          onPress={viewPolicy}
          accessibilityRole="button"
          accessibilityLabel="View our Cookie and Storage Policy"
          style={[styles.outlineBtn, { borderColor: theme.primary }]}
        >
          <Text style={[typography.labelMd, { color: theme.primary }]}>View Policy</Text>
        </Pressable>

        <Pressable
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="Accept and continue using BoolokOne"
          style={[styles.fillBtn, { backgroundColor: theme.primary }]}
        >
          <Text style={[typography.labelMd, { color: '#fff' }]}>Accept &amp; Continue</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    borderTopWidth: 1,
    zIndex: 9999,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  closeBtn: {
    padding: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  fillBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
});
