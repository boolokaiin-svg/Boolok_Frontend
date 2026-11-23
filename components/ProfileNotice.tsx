import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export type ProfileNoticeData = { message: string; tone: 'success' | 'error' | 'info' };

export default function ProfileNotice({ notice, onDismiss }: { notice: ProfileNoticeData | null; onDismiss: () => void }) {
  const { isDark } = useTheme();
  const animation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!notice) return;
    animation.setValue(0);
    const transition = Animated.timing(animation, { toValue: 1, duration: 250, useNativeDriver: Platform.OS !== 'web' });
    transition.start();
    return () => transition.stop();
  }, [notice, animation]);
  if (!notice) return null;
  const color = notice.tone === 'success' ? (isDark ? '#4ade80' : '#15803d') : notice.tone === 'error' ? (isDark ? '#fca5a5' : '#b91c1c') : (isDark ? '#93c5fd' : '#1d4ed8');
  return <Animated.View style={{ position: 'absolute', top: 16, left: 16, right: 16, alignSelf: 'center', maxWidth: 560, zIndex: 1000, elevation: 12, opacity: animation, transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, paddingLeft: 16, paddingVertical: 8, paddingRight: 6, backgroundColor: isDark ? '#142238' : '#fff', borderWidth: 1, borderColor: color }}>
      <MaterialIcons name={notice.tone === 'success' ? 'check-circle' : notice.tone === 'error' ? 'error-outline' : 'info-outline'} color={color} size={23} />
      <Text accessibilityRole={notice.tone === 'error' ? 'alert' : undefined} accessibilityLiveRegion="polite" style={{ flex: 1, color: isDark ? '#fff' : '#0f172a', fontSize: 14, lineHeight: 21, fontWeight: '500' }}>{notice.message}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={onDismiss} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? (isDark ? '#24354d' : '#f1f5f9') : 'transparent' })}><MaterialIcons name="close" size={20} color={isDark ? '#94a3b8' : '#64748b'} /></Pressable>
    </View>
  </Animated.View>;
}
