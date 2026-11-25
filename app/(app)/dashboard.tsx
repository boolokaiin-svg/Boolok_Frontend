import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius, shadows } from '../../constants/theme';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import LoadingScreen from '../../components/LoadingScreen';
import BlueprintPreviewIllustration from '../../components/BlueprintPreviewIllustration';
import { DashboardTool, RecentDashboardTool, orderedDashboardTools, readRecentDashboardTools } from '../../lib/recentDashboardTools';

export default function FeedScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const accountId = user?.id || user?._id || '';
  const [recentTools, setRecentTools] = useState<{ accountId: string; tools: RecentDashboardTool[] }>({ accountId: '', tools: [] });
  const recent = recentTools.accountId === accountId ? recentTools.tools : [];
  const toolOrder = orderedDashboardTools(recent);

  useFocusEffect(useCallback(() => {
    let active = true;
    void readRecentDashboardTools(accountId).then(tools => {
      if (active) setRecentTools({ accountId, tools });
    });
    return () => { active = false; };
  }, [accountId]));

  const recentBadge = (tool: DashboardTool) => {
    const index = recent.findIndex(item => item.id === tool);
    if (index < 0) return null;
    const latest = index === 0;
    return (
      <View style={[styles.recentBadge, {
        backgroundColor: latest ? (isDark ? 'rgba(233,184,74,0.12)' : '#FFF5DD') : theme.surfaceContainer,
        borderColor: latest ? 'rgba(218,165,32,0.3)' : theme.outlineVariant,
      }]}>
        <MaterialIcons name={latest ? 'history' : 'schedule'} size={14} color={latest ? theme.primary : theme.onSurfaceVariant} />
        <Text style={{ color: latest ? theme.primary : theme.onSurfaceVariant, fontSize: 11, fontWeight: '600' }}>
          {latest ? 'Recently used' : 'Previously opened'}
        </Text>
      </View>
    );
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const data = await apiFetch('/api/dashboard/stats');

      setStats({
        complianceAlert: '',
        marketPredictions: {
          location: '',
          growthIndex: '',
          value: '',
          volatility: '',
          growthPercent: '',
          peakDate: '',
        },
        ...data,
        recentInquiries: Array.isArray(data?.recentInquiries)
          ? data.recentInquiries
          : [],
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({
        recentInquiries: [],
        complianceAlert: 'Could not load data. Check your connection.',
        marketPredictions: {
          location: '—',
          growthIndex: '—',
          value: '—',
          volatility: '—',
          growthPercent: '—',
          peakDate: '—',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const cards: Record<DashboardTool, React.ReactNode> = {
    legal: (
          <Pressable
            key="legal"
            onPress={() => router.push('/(app)/legal')}
            style={({ pressed, hovered }: any) => [
              styles.card,
              { padding: isWide ? spacing.xl : spacing.md },
              {
                backgroundColor: theme.surface,
                borderColor: isDark
                  ? theme.outlineVariant
                  : 'rgba(218, 165, 32, 0.35)',
                cursor: 'pointer',
              },
              isWide && toolOrder[2] !== 'legal' ? { width: Platform.OS === 'web' ? 'calc(50% - 12px)' : '48%' } : { width: '100%' },
              styles.legalCard,
              recent[0]?.id === 'legal' && { borderColor: 'rgba(218,165,32,0.55)' },
              (pressed || hovered) && {
                transform: [{ scale: 1.02 }],
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 15,
                borderColor: 'rgba(218, 165, 32, 0.4)',
              },
            ]}
          >
            {recentBadge('legal')}
            <View style={styles.cardHeaderRow}>
              <Text
                style={[typography.headlineSm, { color: theme.onSurface }]}
              >
                Title & Legal AI
              </Text>
              <MaterialIcons name="verified-user" size={24} color={theme.primary} />
            </View>

            <View
              style={[
                styles.alertBox,
                {
                  backgroundColor: 'rgba(218, 165, 32, 0.1)',
                  borderColor: 'rgba(218, 165, 32, 0.25)',
                },
              ]}
            >
              <MaterialIcons
                name="shield"
                size={24}
                color={theme.primary}
                style={{ marginRight: spacing.sm, marginTop: 2 }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: theme.onSurface,
                    marginBottom: 2,
                  }}
                >
                  Deed & EC Verification
                </Text>
                <Text
                  style={{ fontSize: 13, color: theme.onSurfaceVariant }}
                >
                  Autonomous TNREGINET audit, bilingual OCR & lien detection
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.activeReviewsRow,
                { backgroundColor: theme.surfaceContainer },
              ]}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme.onSurface,
                }}
              >
                Registry Status
              </Text>
              <View
                style={[
                  styles.pendingBadge,
                  { backgroundColor: '#10B981' },
                ]}
              >
                <Text
                  style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}
                >
                  ONLINE
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: theme.primary,
                marginTop: 'auto',
              }}
            >
              Verify Title Deed →
            </Text>
          </Pressable>
    ),
    blueprint: (
          <Pressable
            key="blueprint"
            onPress={() => router.push('/(app)/blueprint')}
            style={({ pressed, hovered }: any) => [
              styles.card,
              { padding: isWide ? spacing.xl : spacing.md },
              {
                backgroundColor: theme.surface,
                borderColor: isDark
                  ? theme.outlineVariant
                  : 'rgba(218, 165, 32, 0.35)',
                cursor: 'pointer',
              },
              isWide && toolOrder[2] !== 'blueprint' ? { width: Platform.OS === 'web' ? 'calc(50% - 12px)' : '48%' } : { width: '100%' },
              styles.blueprintCard,
              recent[0]?.id === 'blueprint' && { borderColor: 'rgba(218,165,32,0.55)' },
              (pressed || hovered) && {
                transform: [{ scale: 1.02 }],
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 15,
                borderColor: 'rgba(218, 165, 32, 0.4)',
              },
            ]}
          >
            {recentBadge('blueprint')}
            <View style={styles.blueprintPreview} pointerEvents="none">
              <BlueprintPreviewIllustration isDark={isDark} />
            </View>

            <View style={{ marginTop: 'auto' }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: spacing.xs,
                }}
              >
                <MaterialIcons
                  name="architecture"
                  size={18}
                  color={theme.primary}
                />
                <Text
                  style={[
                    typography.headlineSm,
                    { color: theme.onSurface, marginLeft: 6 },
                  ]}
                >
                  Blueprint Architect
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.onSurfaceVariant,
                  marginBottom: spacing.md,
                }}
              >
                Turn your plot and room requirements into a detailed 2D plan
                and furnished 3D preview.
              </Text>
              <Pressable
                onPress={() => router.push('/(app)/blueprint')}
                style={({ pressed, hovered }: any) => [
                  styles.generateBtn,
                  { backgroundColor: theme.primary, cursor: 'pointer' },
                  (pressed || hovered) && { transform: [{ scale: 0.98 }] },
                ]}
              >
                <Text
                  style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}
                >
                  Generate New Plan
                </Text>
              </Pressable>
            </View>
          </Pressable>
    ),
    predictions: (
          <Pressable
            key="predictions"
            onPress={() => router.push('/(app)/predictions')}
            style={({ pressed, hovered }: any) => [
              styles.card,
              { padding: isWide ? spacing.xl : spacing.md },
              {
                backgroundColor: theme.surface,
                borderColor: isDark
                  ? theme.outlineVariant
                  : 'rgba(218, 165, 32, 0.35)',
                cursor: 'pointer',
              },
              isWide && toolOrder[2] !== 'predictions' ? { width: Platform.OS === 'web' ? 'calc(50% - 12px)' : '48%' } : { width: '100%' },
              styles.predictionsCard,
              recent[0]?.id === 'predictions' && { borderColor: 'rgba(218,165,32,0.55)' },
              (pressed || hovered) && {
                transform: [{ scale: 1.01 }],
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 15,
                borderColor: 'rgba(218, 165, 32, 0.4)',
              },
            ]}
          >
            {recentBadge('predictions')}
            <View style={styles.cardHeaderRow}>
              <View style={{ flexShrink: 1, marginRight: spacing.md }}>
                <Text
                  style={[typography.headlineSm, { color: theme.onSurface }]}
                >
                  Market Predictions
                </Text>
                <Text
                  style={{ fontSize: 12, color: theme.onSurfaceVariant }}
                >
                  Global growth index:{' '}
                  {stats?.marketPredictions?.growthIndex}
                </Text>
              </View>
              <View
                style={[
                  styles.locationBadge,
                  { backgroundColor: theme.surfaceContainer },
                ]}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: theme.onSurfaceVariant,
                  }}
                >
                  {stats?.marketPredictions?.location}
                </Text>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={16}
                  color={theme.onSurfaceVariant}
                  style={{ marginLeft: 4 }}
                />
              </View>
            </View>

            {/* Chart Area */}
            <View style={styles.chartArea}>
              <Text style={styles.bullishText}>BULLISH</Text>
              <Text style={[styles.peakDate, { color: theme.primary }]}>
                PREDICTED PEAK: {stats?.marketPredictions?.peakDate}
              </Text>
              {Platform.OS === 'web' ? (
                <svg
                  width="100%"
                  height="150"
                  viewBox="0 0 800 150"
                  preserveAspectRatio="none"
                  style={{ position: 'absolute', bottom: 0, left: 0 }}
                >
                  <path
                    d="M0,100 C150,120 250,140 350,100 C450,60 550,20 650,50 C700,65 750,120 800,20"
                    fill="none"
                    stroke="#DAA520"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <Svg
                  height="150"
                  width="100%"
                  viewBox="0 0 800 150"
                  style={{ position: 'absolute', bottom: 0, left: 0 }}
                >
                  <Path
                    d="M0,100 C150,120 250,140 350,100 C450,60 550,20 650,50 C700,65 750,120 800,20"
                    fill="none"
                    stroke="#DAA520"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </Svg>
              )}
            </View>

            <View style={styles.metricsRow}>
              <View>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: theme.outline,
                    textTransform: 'uppercase',
                  }}
                >
                  Value
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '800',
                    color: theme.onSurface,
                  }}
                >
                  {stats?.marketPredictions?.value}
                </Text>
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: theme.outline,
                    textTransform: 'uppercase',
                  }}
                >
                  Volatility
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '800',
                    color: theme.onSurface,
                  }}
                >
                  {stats?.marketPredictions?.volatility}
                </Text>
              </View>
              <View style={{ marginLeft: 'auto', alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: theme.primary,
                    textTransform: 'uppercase',
                  }}
                >
                  Growth
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '800',
                    color: theme.onSurface,
                  }}
                >
                  {stats?.marketPredictions?.growthPercent}
                </Text>
              </View>
            </View>
          </Pressable>
    ),
  };

  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(400)}>
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: theme.background },
        ]}
        contentContainerStyle={[
          styles.contentContainer,
          { padding: isWide ? spacing.xl : spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.workspaceHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.headlineSm, { color: theme.onSurface }]}>Your workspace</Text>
            <Text style={{ fontSize: 13, lineHeight: 20, color: theme.onSurfaceVariant, marginTop: 4 }}>
              {recent.length ? 'Pick up where you left off. Your latest tool comes first.' : 'Choose a tool to start your next property project.'}
            </Text>
          </View>
          <View style={[styles.workspaceIcon, { backgroundColor: isDark ? 'rgba(218,165,32,0.1)' : '#FFF5DD' }]}>
            <MaterialIcons name={recent.length ? 'history' : 'dashboard'} size={22} color={theme.primary} />
          </View>
        </View>
        <View style={styles.grid}>
          {toolOrder.map(tool => cards[tool])}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: spacing.xl },
  workspaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: spacing.lg,
  },
  workspaceIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: spacing.md,
  },
  grid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.gutter,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    ...Platform.select({
      web: {
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.06), 0 2px 4px -1px rgba(15, 23, 42, 0.04)',
      } as any,
    }),
  },

  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  iconBox: {
    padding: 8,
    borderRadius: radius.lg,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...Platform.select({ web: { transition: 'all 0.2s ease' } as any }),
  },

  // Legal Card
  legalCard: { flexDirection: 'column' },
  alertBox: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  activeReviewsRow: {
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },

  // Blueprint Card
  blueprintCard: {
    position: 'relative',
    minHeight: 300,
  },
  blueprintPreview: {
    width: '100%',
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  generateBtn: {
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...Platform.select({ web: { transition: 'transform 0.2s ease' } as any }),
  },

  // Predictions Card
  predictionsCard: { minHeight: 300 },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    minHeight: 150,
    marginVertical: spacing.lg,
  },
  bullishText: {
    position: 'absolute',
    top: 40,
    left: '20%',
    fontSize: 80,
    fontWeight: '800',
    color: 'rgba(218, 165, 32, 0.05)',
  },
  peakDate: {
    position: 'absolute',
    top: 0,
    right: 20,
    fontSize: 10,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: 'auto',
  },
});
