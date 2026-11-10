// app/(app)/settings.tsx
// Full Settings & Account Management screen.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  Switch,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import { API_BASE_URL } from '../../lib/api';
import Avatar from '../../components/Avatar';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ─── Token helper ─────────────────────────────────────────────────────────────
async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('userToken') : null;
  }
  return SecureStore.getItemAsync('userToken');
}

// ─── Row Components ───────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  const { theme } = useTheme();
  return (
    <Text
      style={[
        typography.labelLg,
        {
          color: theme.primary,
          marginTop: spacing.lg,
          marginBottom: spacing.xs,
          marginHorizontal: spacing.md,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          fontSize: 11,
        },
      ]}
      accessibilityRole="header"
    >
      {title}
    </Text>
  );
}

function SettingsRow({
  icon,
  label,
  sublabel,
  onPress,
  rightElement,
  danger,
  accessibilityLabel,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
  accessibilityLabel?: string;
}) {
  const { theme } = useTheme();
  const color = danger ? '#EF4444' : theme.onSurface;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.surfaceContainer,
          borderBottomColor: theme.outlineVariant,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: danger ? 'rgba(239,68,68,0.1)' : theme.surfaceContainerHigh },
        ]}
      >
        <MaterialIcons name={icon} size={20} color={danger ? '#EF4444' : theme.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[typography.bodyMd, { color, fontWeight: '600' }]}>{label}</Text>
        {sublabel ? (
          <Text style={[typography.bodySm, { color: theme.outline, marginTop: 1 }]}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      {rightElement || (
        onPress ? (
          <MaterialIcons name="chevron-right" size={20} color={theme.outline} />
        ) : null
      )}
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, signOut, token } = useAuth();

  const [deletingAccount, setDeletingAccount] = useState(false);

  // ── Account Deletion ───────────────────────────────────────────────────────
  const confirmDeleteAccount = () => {
    const msg =
      'This will permanently delete your account, all your posts, and all your data. This action cannot be undone.\n\nAre you absolutely sure?';

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(msg);
      if (confirmed) handleDeleteAccount();
    } else {
      Alert.alert(
        'Delete Account',
        msg,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete Permanently', style: 'destructive', onPress: handleDeleteAccount },
        ],
        { cancelable: true }
      );
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const storedToken = await getStoredToken();
      const authToken = token || storedToken;
      if (!authToken) throw new Error('Not authenticated.');

      await axios.delete(`${API_BASE_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      await signOut();
      router.replace('/(auth)/login');
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Could not delete account. Please try again or contact support.';
      if (Platform.OS === 'web') {
        window.alert(`Error: ${msg}`);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setDeletingAccount(false);
    }
  };

  // ── Download Data (info only) ──────────────────────────────────────────────
  const handleDownloadData = () => {
    const msg =
      'To request a copy of your data, please email [YOUR_CONTACT_EMAIL] with the subject "Data Export Request". We will respond within 7 business days as required by the DPDP Act 2023.';
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Download My Data', msg);
    }
  };

  // ── Sign Out ───────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.surfaceContainerLowest }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surfaceContainer, borderBottomColor: theme.outlineVariant },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={22} color={theme.onSurface} />
        </Pressable>
        <Text style={[typography.headlineSm, { color: theme.onSurface }]}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Account ── */}
        <SectionHeader title="Account" />
        <View style={[styles.card, { borderColor: theme.outlineVariant }]}>
          <View
            style={[
              styles.profileRow,
              { borderBottomColor: theme.outlineVariant },
            ]}
          >
            <Avatar user={user} size={52} style={{ marginRight: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.headlineSm, { color: theme.onSurface }]}>
                {user?.fullName || 'Your Name'}
              </Text>
              <Text style={[typography.bodySm, { color: theme.outline }]}>
                @{user?.username || 'username'}
              </Text>
              <Text style={[typography.bodySm, { color: theme.outline }]}>
                {user?.email || ''}
              </Text>
            </View>
          </View>

          <SettingsRow
            icon="edit"
            label="Edit Profile"
            sublabel="Update your name, bio, and photo"
            onPress={() => router.push('/(app)/profile')}
            accessibilityLabel="Edit your profile"
          />
        </View>

        {/* ── Appearance ── */}
        <SectionHeader title="Appearance" />
        <View style={[styles.card, { borderColor: theme.outlineVariant }]}>
          <SettingsRow
            icon={isDark ? 'dark-mode' : 'light-mode'}
            label={isDark ? 'Dark Mode' : 'Light Mode'}
            sublabel="Toggle the app colour theme"
            accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#ccc', true: theme.primary }}
                thumbColor="#fff"
                accessibilityLabel={`Dark mode is ${isDark ? 'on' : 'off'}`}
              />
            }
          />
        </View>

        {/* ── Privacy & Legal ── */}
        <SectionHeader title="Privacy & Legal" />
        <View style={[styles.card, { borderColor: theme.outlineVariant }]}>
          <SettingsRow
            icon="shield"
            label="Privacy Policy"
            sublabel="How we collect and use your data"
            onPress={() => router.push({ pathname: '/terms', params: { tab: 'privacy' } } as any)}
            accessibilityLabel="View Privacy Policy"
          />
          <SettingsRow
            icon="gavel"
            label="Terms & Conditions"
            sublabel="Rules for using Boolok GPT"
            onPress={() => router.push({ pathname: '/terms', params: { tab: 'terms' } } as any)}
            accessibilityLabel="View Terms and Conditions"
          />
          <SettingsRow
            icon="cookie"
            label="Cookie & Storage Policy"
            sublabel="What we store on your device"
            onPress={() => router.push({ pathname: '/terms', params: { tab: 'cookie' } } as any)}
            accessibilityLabel="View Cookie and Storage Policy"
          />
          <SettingsRow
            icon="receipt-long"
            label="Refund Policy"
            sublabel="Our refund and cancellation terms"
            onPress={() => router.push({ pathname: '/terms', params: { tab: 'refund' } } as any)}
            accessibilityLabel="View Refund Policy"
          />
        </View>

        {/* ── Data & Privacy ── */}
        <SectionHeader title="Your Data" />
        <View style={[styles.card, { borderColor: theme.outlineVariant }]}>
          <SettingsRow
            icon="download"
            label="Download My Data"
            sublabel="Request a copy of your personal data (DPDP Act 2023)"
            onPress={handleDownloadData}
            accessibilityLabel="Request a download of your personal data"
          />
        </View>

        {/* ── Contact ── */}
        <SectionHeader title="Support" />
        <View style={[styles.card, { borderColor: theme.outlineVariant }]}>
          <SettingsRow
            icon="email"
            label="Contact Us"
            sublabel="[YOUR_CONTACT_EMAIL]"
            onPress={() => Linking.openURL('mailto:[YOUR_CONTACT_EMAIL]?subject=Boolok GPT Support')}
            accessibilityLabel="Send us an email"
          />
          <SettingsRow
            icon="info-outline"
            label="App Version"
            sublabel="1.0.0  •  © 2025 Boolok GPT"
            accessibilityLabel="App version information"
          />
        </View>

        {/* ── Danger Zone ── */}
        <SectionHeader title="Account Actions" />
        <View style={[styles.card, { borderColor: theme.outlineVariant }]}>
          <SettingsRow
            icon="logout"
            label="Sign Out"
            onPress={handleSignOut}
            danger={false}
            accessibilityLabel="Sign out of your account"
          />
          <SettingsRow
            icon="delete-forever"
            label={deletingAccount ? 'Deleting Account…' : 'Delete My Account'}
            sublabel="Permanently removes all your data. Cannot be undone."
            onPress={deletingAccount ? undefined : confirmDeleteAccount}
            danger
            accessibilityLabel="Permanently delete your account and all data"
            rightElement={
              deletingAccount ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <MaterialIcons name="chevron-right" size={20} color="#EF4444" />
              )
            }
          />
        </View>

        <View style={{ height: spacing.xxl ?? 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    ...Platform.select({
      ios:     { paddingTop: spacing.xl },
      android: { paddingTop: spacing.md },
      web:     { paddingTop: spacing.md },
    }),
  },
  backButton: {
    padding: 8,
    marginRight: spacing.sm,
    borderRadius: radius.sm,
  },

  card: {
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    minHeight: 56,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
