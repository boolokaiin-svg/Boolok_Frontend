import React, { useState, useEffect } from 'react';
import { View, Text, Image, ViewStyle } from 'react-native';
import { resolveImageUrl } from '../lib/api';

interface AvatarProps {
  user?: {
    id?: string | null;
    _id?: string | null;
    fullName?: string | null;
    username?: string | null;
    name?: string | null;
    profilePicture?: string | null;
    avatar?: string | null;
    avatarInitial?: string | null;
    avatarBgColor?: string | null;
  } | null | string;
  size?: number;
  style?: ViewStyle | any;
  showBorder?: boolean;
  borderColor?: string;
}

// Canonical clean avatar URLs for users with custom uploaded photos/illustrations
// (Used when an incomplete user reference object omits `profilePicture`)
const CANONICAL_USER_AVATAR_URLS: Record<string, string> = {
  // Logeshwaran A (@logeshwarana) -> Clean Doomsday artwork illustration
  'logeshwarana': 'https://boolokgpt.vercel.app/avatars/logeshwaran_doomsday.png',
  '6ace0e6586b4ca082d9f1432': 'https://boolokgpt.vercel.app/avatars/logeshwaran_doomsday.png',
  '6ab67b7da948cf929a483958': 'https://boolokgpt.vercel.app/avatars/logeshwaran_doomsday.png',
  '6a8af34812ef34aed25ae8d2': 'https://boolokgpt.vercel.app/avatars/logeshwaran_doomsday.png',

  // Sai Vimenthan V L -> Clean circular Orange S badge (transparent outside circle)
  'saivimenthanvl': 'https://boolokgpt.vercel.app/avatars/sai_orange_s.png',
  'saivimenthan': 'https://boolokgpt.vercel.app/avatars/sai_orange_s.png',
  '6a7a0dbb51a42123f22c4edf': 'https://boolokgpt.vercel.app/avatars/sai_orange_s.png',
  '6ab67b7fa948cf929a483963': 'https://boolokgpt.vercel.app/avatars/sai_orange_s.png',

  // Mithulan R (@mithulan_r / @mithulanr2003 / @mithulanmass) -> Clean portrait photograph
  'mithulan_r': 'https://lh3.googleusercontent.com/a/ACg8ocJNc1F5yHFweMK8qtYRFt_2AJJQqzi4y0P2t7z2a4IHwoWCQYKJ=s400-c',
  'mithulanr2003': 'https://lh3.googleusercontent.com/a/ACg8ocJNc1F5yHFweMK8qtYRFt_2AJJQqzi4y0P2t7z2a4IHwoWCQYKJ=s400-c',
  'mithulanmass': 'https://lh3.googleusercontent.com/a/ACg8ocJNc1F5yHFweMK8qtYRFt_2AJJQqzi4y0P2t7z2a4IHwoWCQYKJ=s400-c',
  '6addf49b5f3925f54f8491f6': 'https://lh3.googleusercontent.com/a/ACg8ocJNc1F5yHFweMK8qtYRFt_2AJJQqzi4y0P2t7z2a4IHwoWCQYKJ=s400-c',
  '6ae9bd78b549b88abf72eac0': 'https://lh3.googleusercontent.com/a/ACg8ocJNc1F5yHFweMK8qtYRFt_2AJJQqzi4y0P2t7z2a4IHwoWCQYKJ=s400-c',
  '6ae23992af47b316552beca6': 'https://lh3.googleusercontent.com/a/ACg8ocJNc1F5yHFweMK8qtYRFt_2AJJQqzi4y0P2t7z2a4IHwoWCQYKJ=s400-c',

  // Sampath (@sam) -> Clean flaming baseball avatar
  'sam': 'https://lh3.googleusercontent.com/a/ACg8ocJCq4Z0Xny5-SuXU9lLRLmePrOu5168q94JBNcAJwBT8GahA4Zi=s400-c',
  'sampath': 'https://lh3.googleusercontent.com/a/ACg8ocJCq4Z0Xny5-SuXU9lLRLmePrOu5168q94JBNcAJwBT8GahA4Zi=s400-c',
  '6ae9bd78b549b88abf72eac1': 'https://lh3.googleusercontent.com/a/ACg8ocJCq4Z0Xny5-SuXU9lLRLmePrOu5168q94JBNcAJwBT8GahA4Zi=s400-c',
  '6ab7a94933549967d740cd92': 'https://lh3.googleusercontent.com/a/ACg8ocJCq4Z0Xny5-SuXU9lLRLmePrOu5168q94JBNcAJwBT8GahA4Zi=s400-c',
};

const CANONICAL_USER_COLORS: Record<string, string> = {
  // Sai Vimenthan V L -> Solid Orange (#E65100)
  '6a7a0dbb51a42123f22c4edf': '#E65100',
  '6ab67b7fa948cf929a483963': '#E65100',
  'saivimenthanvl': '#E65100',
  'saivimenthan': '#E65100',

  // Shreekutti -> Distinct Blue (#2563EB)
  '6ace0e6486b4ca082d9f1431': '#2563EB',
  'shreekutti': '#2563EB',

  // Subasree -> Distinct Green (#059669)
  '6ae2f7c95f0594915c812aa3': '#059669',
  '6ac07e1b85d58606a6559535': '#059669',
  'subasree': '#059669',
  'suba': '#059669',

  // Logeshwaran A -> Distinct Green (#059669)
  '6ace0e6586b4ca082d9f1432': '#059669',
  'logeshwarana': '#059669',
  'logesh': '#059669',

  // Mohammed Ajmal -> Distinct Violet (#7C3AED)
  '6ace0e6586b4ca082d9f1433': '#7C3AED',
  'ajmal': '#7C3AED',
  'aswin': '#0284C7',
  '6ace0e6586b4ca082d9f1437': '#0284C7',
  'vignesh': '#7C3AED',
  '6ace0e6586b4ca082d9f1438': '#7C3AED',
  'david_sterling': '#0D9488',
  '6ace0e6686b4ca082d9f143b': '#0D9488',
  'marcus_vance': '#EA580C',
  '6ace0e6686b4ca082d9f143c': '#EA580C',
};

const AVATAR_BG_COLORS = [
  '#E67E22', // Amber Orange
  '#D35400', // Rust Orange
  '#E74C3C', // Warm Coral
  '#C0392B', // Deep Amber Red
  '#F39C12', // Gold Amber
  '#7C3AED', // Royal Purple
  '#059669', // Emerald Green
  '#4F46E5', // Indigo
];

function resolveUserInitialAndColor(user: any, displayName: string): { initial: string; bgColor: string } {
  if (user && typeof user === 'object') {
    if (user.avatarInitial && user.avatarBgColor) {
      return { initial: String(user.avatarInitial).toUpperCase(), bgColor: String(user.avatarBgColor) };
    }
  }

  const clean = (displayName || '').replace(/^@+/, '').trim();
  const firstGrapheme = Array.from(clean)[0] || 'U';

  const rawId = String(user?._id || user?.id || '').toLowerCase().trim();
  const rawUsername = String(user?.username || '').toLowerCase().trim();
  const cleanName = clean.toLowerCase();

  if (cleanName.includes('ajmal') || rawId === '6ace0e6586b4ca082d9f1433' || rawUsername === 'ajmal') {
    return { initial: 'M', bgColor: '#7C3AED' };
  }
  if (cleanName.includes('subasree') || rawId === '6ae2f7c95f0594915c812aa3' || rawUsername === 'subasree' || rawUsername === 'suba') {
    return { initial: 'S', bgColor: '#059669' };
  }
  if (cleanName.includes('logesh') || rawId === '6ace0e6586b4ca082d9f1432' || rawUsername === 'logeshwarana') {
    return { initial: 'L', bgColor: '#059669' };
  }
  if (cleanName.includes('shreekutti') || rawId === '6ace0e6486b4ca082d9f1431' || rawUsername === 'shreekutti') {
    return { initial: 'S', bgColor: '#2563EB' };
  }
  if (
    cleanName === 'sai' ||
    (cleanName.includes('sai') && cleanName.includes('vimenthan')) ||
    rawId === '6a7a0dbb51a42123f22c4edf' ||
    rawId === '6ab67b7fa948cf929a483963' ||
    rawUsername.includes('saivimenthan')
  ) {
    return { initial: 'S', bgColor: '#E65100' };
  }

  const initial = firstGrapheme.toUpperCase();

  if (CANONICAL_USER_COLORS[rawId]) {
    return { initial, bgColor: CANONICAL_USER_COLORS[rawId] };
  }
  if (CANONICAL_USER_COLORS[rawUsername]) {
    return { initial, bgColor: CANONICAL_USER_COLORS[rawUsername] };
  }

  const key = rawId || rawUsername || cleanName || 'u';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const colorIndex = Math.abs(hash) % AVATAR_BG_COLORS.length;
  return { initial, bgColor: AVATAR_BG_COLORS[colorIndex] };
}

export default function Avatar({
  user,
  size = 40,
  style,
  showBorder = false,
  borderColor = '#E65100',
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  let rawPhoto: string | null = null;
  let displayName = 'User';
  let identityKey = 'user';

  if (typeof user === 'string') {
    displayName = user.trim() || 'User';
    identityKey = displayName;
  } else if (user && typeof user === 'object') {
    displayName = (user.fullName || (user as any).name || user.username || 'User').trim() || 'User';
    rawPhoto = user.profilePicture || (user as any).avatar || null;
    identityKey = String(user._id || user.id || user.username || displayName);
  }

  const userObj = typeof user === 'object' && user !== null ? user : null;
  const rawId = String(userObj?._id || userObj?.id || '').toLowerCase().trim();
  const rawUsername = String(userObj?.username || '').toLowerCase().trim();
  const cleanName = displayName.toLowerCase().trim();

  // Sai Vimenthan V L always uses the clean orange 'S' avatar icon
  const isSaiUser =
    rawId === '6a7a0dbb51a42123f22c4edf' ||
    rawId === '6ab67b7fa948cf929a483963' ||
    rawUsername === 'saivimenthanvl' ||
    rawUsername === 'saivimenthan' ||
    cleanName.includes('sai vimenthan') ||
    cleanName === 'sai';

  // Filter out stock/AI placeholders and known solid Google default letter URLs
  if (
    rawPhoto &&
    typeof rawPhoto === 'string' &&
    (rawPhoto.includes('unsplash.com') ||
      rawPhoto.includes('placeholder') ||
      rawPhoto.includes('ACg8ocJ_TV7-lpSTfRAQI0wc76yPHoIWaWg_5lgW-i9RxbiPx4tlFk0r') ||
      rawPhoto.includes('ACg8ocK0o5SZUMa-JTOuTUTxS6t1Bl20HPwVkbFAz98dCG6e1rbpGA'))
  ) {
    rawPhoto = null;
  }

  // If rawPhoto was omitted in a partial user object, check canonical avatar URL map by ID/username/name
  if (!rawPhoto) {
    if (rawId && CANONICAL_USER_AVATAR_URLS[rawId]) {
      rawPhoto = CANONICAL_USER_AVATAR_URLS[rawId];
    } else if (rawUsername && CANONICAL_USER_AVATAR_URLS[rawUsername]) {
      rawPhoto = CANONICAL_USER_AVATAR_URLS[rawUsername];
    } else if (isSaiUser) {
      rawPhoto = CANONICAL_USER_AVATAR_URLS['saivimenthanvl'];
    } else if (cleanName === 'logeshwaran a' || cleanName === 'logeshwaran') {
      rawPhoto = CANONICAL_USER_AVATAR_URLS['logeshwarana'];
    } else if (cleanName === 'mithulan r' || cleanName === 'mithulan') {
      rawPhoto = CANONICAL_USER_AVATAR_URLS['mithulan_r'];
    } else if (cleanName === 'sampath') {
      rawPhoto = CANONICAL_USER_AVATAR_URLS['sam'];
    }
  }

  const resolvedPhotoUrl = resolveImageUrl(rawPhoto);

  useEffect(() => {
    setImgError(false);
  }, [resolvedPhotoUrl, identityKey]);

  const borderRadius = size / 2;
  const { initial, bgColor } = resolveUserInitialAndColor(user, displayName);

  // Sai Vimenthan V L: flat orange circle (#F4511E) with clean centered white regular-weight S, zero dark rim/wrapper
  if (isSaiUser) {
    const cleanStyle = Array.isArray(style) ? style.flat(10).filter(Boolean) : [style].filter(Boolean);
    const strippedStyle = cleanStyle.map((s: any) => {
      if (!s || typeof s !== 'object') return s;
      const { borderWidth, borderColor, backgroundColor, ...rest } = s;
      return rest;
    });
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel="avatar"
        style={[
          {
            width: size,
            height: size,
            borderRadius,
            backgroundColor: '#F4511E',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            borderWidth: 0,
            borderColor: 'transparent',
          },
          ...strippedStyle,
        ]}
      >
        <Text
          allowFontScaling={false}
          style={{
            color: '#FFFFFF',
            fontWeight: '500',
            fontSize: Math.round(size * 0.52),
            lineHeight: Math.round(size * 0.58),
            textAlign: 'center',
            includeFontPadding: false,
            userSelect: 'none',
          }}
        >
          S
        </Text>
      </View>
    );
  }

  if (resolvedPhotoUrl && !imgError) {
    return (
      <Image
        source={{ uri: resolvedPhotoUrl }}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${displayName} avatar`}
        style={[
          {
            width: size,
            height: size,
            borderRadius,
            backgroundColor: 'transparent',
          },
          showBorder && {
            borderWidth: Math.max(1.5, Math.round(size * 0.05)),
            borderColor,
          },
          style,
        ]}
        resizeMode="cover"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${displayName} avatar`}
      style={[
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: bgColor,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        },
        showBorder && {
          borderWidth: Math.max(1.5, Math.round(size * 0.05)),
          borderColor,
        },
        style,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={{
          color: '#FFFFFF',
          fontWeight: '700',
          fontSize: Math.round(size * 0.44),
          lineHeight: Math.round(size * 0.52),
          textAlign: 'center',
          includeFontPadding: false,
          userSelect: 'none',
        }}
      >
        {initial}
      </Text>
    </View>
  );
}
