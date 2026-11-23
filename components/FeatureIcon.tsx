// components/FeatureIcon.tsx
// Single source of truth for the gold "feature" icons + copy used on
// welcome / register / login (brand panels) and the brand-vision page,
// so every screen renders pixel-identical icons.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export const GOLD = '#E7AD17';

export type FeatureIconName = 'search' | 'sparkles' | 'chart' | 'globe';

export interface FeatureData {
  icon: FeatureIconName;
  title: string;
  description: string;
}

// Canonical copy — used everywhere the 4 feature cards appear.
export const FEATURES: FeatureData[] = [
  { icon: 'sparkles', title: 'AI Advisor', description: 'Get AI-assisted insights on valuations and property data. Not professional legal or financial advice.' },
  { icon: 'chart', title: 'Market Insights', description: 'Real-time data visualization of global market trends.' },
  { icon: 'globe', title: 'Global Reach', description: 'Connect with opportunities across borders instantly.' },
];

/**
 * Renders one of the 4 gold SVG glyphs used in the feature cards.
 */
export function FeatureIcon({ name, size = 27 }: { name: FeatureIconName; size?: number }) {
  if (name === 'search') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="10.5" cy="10.5" r="5.6" fill="none" stroke={GOLD} strokeWidth="2.2" />
        <Path d="M14.7 14.7 20 20" fill="none" stroke={GOLD} strokeLinecap="round" strokeWidth="2.2" />
      </Svg>
    );
  }
  if (name === 'sparkles') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M9 2.5c.55 3.8 2.25 5.5 6 6-3.75.5-5.45 2.2-6 6-.55-3.8-2.25-5.5-6-6 3.75-.5 5.45-2.2 6-6Z" fill={GOLD} />
        <Path d="M17.5 12.2c.35 2.45 1.55 3.65 4 4-2.45.35-3.65 1.55-4 4-.35-2.45-1.55-3.65-4-4 2.45-.35 3.65-1.55 4-4ZM17.5 2.3c.2 1.35.85 2 2.2 2.2-1.35.2-2 .85-2.2 2.2-.2-1.35-.85-2-2.2-2.2 1.35-.2 2-.85 2.2-2.2Z" fill={GOLD} />
      </Svg>
    );
  }
  if (name === 'chart') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="m3.5 17 5-5 3.4 3.4L20 7.3" fill="none" stroke={GOLD} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" />
        <Path d="M14.5 7.3H20v5.4" fill="none" stroke={GOLD} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" />
      </Svg>
    );
  }
  // globe
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="8.3" fill="none" stroke={GOLD} strokeWidth="2" />
      <Path
        d="M3.9 10h4l1.6-2.5 2.2.6.8 2.1 2.5.8.2 2.5-2.1 1.1-.5 2.8-2.2 1.4-1.8-2.5-2.8-.4M13 3.9c1.1 1.2 1.9 2.8 2.1 4.5M17.4 16.6c-.8 1.4-2 2.6-3.4 3.3"
        fill="none"
        stroke={GOLD}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
    </Svg>
  );
}

/**
 * Standard rounded gold-tinted square that wraps a FeatureIcon.
 */
export function FeatureIconBox({
  name,
  boxSize = 52,
  iconSize = 27,
}: {
  name: FeatureIconName;
  boxSize?: number;
  iconSize?: number;
}) {
  return (
    <View style={[styles.iconBox, { width: boxSize, height: boxSize, borderRadius: boxSize * 0.27 }]}>
      <FeatureIcon name={name} size={iconSize} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    backgroundColor: '#211B08',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
