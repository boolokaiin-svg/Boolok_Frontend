import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Svg, { Rect, Circle, Line, Path, G } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';

interface AISearchLoadingAnimationProps {
  isDark?: boolean;
  query?: string;
}

export default function AISearchLoadingAnimation({
  isDark = true,
  query = '',
}: AISearchLoadingAnimationProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Master scanning loop (0 -> 1)
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous scanner line movement
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    );

    // Glowing pulse for analyzed document nodes
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 900,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
      ])
    );

    // Radar/indexing wave
    const waveLoop = Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );

    scanLoop.start();
    pulseLoop.start();
    waveLoop.start();

    return () => {
      scanLoop.stop();
      pulseLoop.stop();
      waveLoop.stop();
    };
  }, []);

  // Theme palettes based on reference video1 (Dark navy intelligence surface)
  const bgSurface = isDark ? '#0A101D' : '#F1F5F9';
  const cardBg = isDark ? '#0F172A' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(30, 58, 138, 0.45)' : 'rgba(203, 213, 225, 0.8)';
  const scannerColor = isDark ? '#38BDF8' : '#0284C7';
  const goldAccent = '#F5A623';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';

  // Scanner top offset (moves from 10 to 180)
  const scannerTop = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 160],
  });

  return (
    <View style={[styles.container, { backgroundColor: bgSurface, borderColor }]}>
      {/* Top Header: Genuine AI processing status */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <View style={[styles.pulseDot, { backgroundColor: scannerColor }]} />
          <Text style={[styles.badgeText, { color: scannerColor }]}>AI DOCUMENT INTELLIGENCE</Text>
        </View>
        <Text style={[styles.queryText, { color: textMuted }]} numberOfLines={1}>
          Scanning knowledge base for "{query || 'real estate records'}"
        </Text>
      </View>

      {/* Main Document Analysis Window (Reference video1 simulation) */}
      <View style={[styles.analysisCard, { backgroundColor: cardBg, borderColor }]}>
        {/* Animated Scanner Beam */}
        <Animated.View
          style={[
            styles.scannerLine,
            {
              top: scannerTop,
              backgroundColor: scannerColor,
              shadowColor: scannerColor,
            },
          ]}
        />

        {/* Document Wireframe Simulation */}
        <View style={styles.docLayout}>
          {/* Document Header Skeleton */}
          <View style={styles.docHeader}>
            <View style={[styles.docAvatar, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]} />
            <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
              <View style={[styles.line, { width: '60%', height: 10, backgroundColor: isDark ? '#334155' : '#CBD5E1' }]} />
              <View style={[styles.line, { width: '35%', height: 8, backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]} />
            </View>
            <Animated.View style={{ opacity: pulseAnim }}>
              <MaterialIcons name="auto-awesome" size={20} color={goldAccent} />
            </Animated.View>
          </View>

          {/* Document Content Skeleton Lines */}
          <View style={styles.linesBlock}>
            <View style={[styles.line, { width: '92%', backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]} />
            <View style={[styles.line, { width: '85%', backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]} />
            <View style={[styles.line, { width: '78%', backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]} />
            <View style={[styles.line, { width: '60%', backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]} />
          </View>

          {/* Key Metric Tags Row */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricChip, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.1)' }]}>
              <MaterialIcons name="verified-user" size={13} color={scannerColor} />
              <Text style={[styles.metricText, { color: scannerColor }]}>Verified Titles</Text>
            </View>
            <View style={[styles.metricChip, { backgroundColor: isDark ? 'rgba(245, 166, 35, 0.12)' : 'rgba(217, 119, 6, 0.1)' }]}>
              <MaterialIcons name="trending-up" size={13} color={goldAccent} />
              <Text style={[styles.metricText, { color: goldAccent }]}>Market Value</Text>
            </View>
            <View style={[styles.metricChip, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.1)' }]}>
              <MaterialIcons name="gavel" size={13} color="#10B981" />
              <Text style={[styles.metricText, { color: '#10B981' }]}>Regulatory Check</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer Status Message */}
      <View style={styles.footerRow}>
        <Animated.View style={{ opacity: pulseAnim }}>
          <MaterialIcons name="sync" size={15} color={goldAccent} />
        </Animated.View>
        <Text style={[styles.footerText, { color: textMuted }]}>
          Synthesizing property listings, legal frameworks, and verified advisors...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  headerRow: {
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  queryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  analysisCard: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    padding: 16,
  },
  scannerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2.5,
    zIndex: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  docLayout: {
    flex: 1,
    justifyContent: 'space-between',
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  linesBlock: {
    gap: 8,
    marginVertical: 10,
  },
  line: {
    height: 7,
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metricText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
});

