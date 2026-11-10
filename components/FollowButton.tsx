import React, { useState, useEffect } from 'react';
import { Alert, TouchableOpacity, Text, StyleSheet, Platform, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../lib/api';
import { eventBus } from '../lib/eventBus';
import { followStore } from '../lib/followStore';

interface FollowButtonProps {
  targetUserId: string;
  targetUsername?: string;
  targetUser?: any;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean, followerCount?: number) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'pill';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const FOLLOW_CHANGE_EVENT = 'boolok_follow_changed';

// Broadcast follow changes across components (Native + Web)
export function broadcastFollowChange(userId: string, username: string | undefined, isFollowing: boolean, followerCount?: number) {
  const detail = { userId, username, isFollowing, followerCount };
  
  // 1. Emit to in-memory eventBus for React Native & Web cross-component sync
  eventBus.emit(FOLLOW_CHANGE_EVENT, detail);

  // 2. Web DOM event for browser windows
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(FOLLOW_CHANGE_EVENT, { detail }));
    try {
      const raw = localStorage.getItem('boolok_following_users_set');
      const set = raw ? JSON.parse(raw) : {};
      if (userId) set[userId] = isFollowing;
      if (username) {
        set[username] = isFollowing;
        set[username.toLowerCase()] = isFollowing;
      }
      localStorage.setItem('boolok_following_users_set', JSON.stringify(set));
    } catch (_) {}
  }
}

export default function FollowButton({
  targetUserId,
  targetUsername,
  targetUser,
  initialIsFollowing,
  onFollowChange,
  size = 'md',
  variant = 'primary',
  style,
  textStyle,
}: FollowButtonProps) {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const currentUserId = (user?.id || (user as any)?._id || '').toString();
  const currentUsername = (user?.username || '').toLowerCase();

  const targetIdStr = (targetUserId || targetUser?.id || targetUser?._id || '').toString();
  const targetUnameStr = (targetUsername || targetUser?.username || '').toLowerCase();

  // RULE 3 & 4: Never render follow button on the logged-in user's own content or profile
  const isSelf =
    (currentUserId && targetIdStr && currentUserId === targetIdStr) ||
    (currentUsername && targetUnameStr && currentUsername === targetUnameStr);

  const [isHovered, setIsHovered] = useState(false);
  const [, forceRender] = useState(0);
  const inFlightRef = React.useRef(false);
  const { token } = useAuth() as any;

  // Subscribe to the shared relationship store (single source of truth across screens)
  useEffect(() => followStore.subscribe(() => forceRender((n) => n + 1)), []);

  // Seed from server-provided hint (does not override confirmed state or in-flight mutations)
  useEffect(() => {
    if (targetIdStr && typeof initialIsFollowing === 'boolean') {
      followStore.seed(targetIdStr, initialIsFollowing);
    }
  }, [targetIdStr, initialIsFollowing]);

  // Load the viewer's confirmed following list once per account
  useEffect(() => {
    if (!currentUserId || isSelf) return;
    (async () => {
      let t: string | null = token || null;
      if (!t) {
        try {
          t = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
        } catch (_) {}
      }
      followStore.hydrate(currentUserId, t);
    })();
  }, [currentUserId, isSelf, token]);

  const known = followStore.get(targetIdStr);
  const hydrated = followStore.isHydrated(currentUserId);
  // undefined = relationship unknown; after hydration a missing id is a confirmed "not following"
  const resolved: boolean | undefined = known !== undefined ? known : hydrated ? false : undefined;
  const isFollowing = resolved === true;
  const unknown = resolved === undefined;
  const loading = followStore.isPending(targetIdStr);

  if (isSelf || !targetIdStr) {
    return null;
  }

  const handlePress = async (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (inFlightRef.current || followStore.isPending(targetIdStr) || unknown) return;
    inFlightRef.current = true;

    const nextFollowingState = !isFollowing;
    followStore.setPending(targetIdStr, true);
    try {
      let tk: string | null = null;
      if (Platform.OS === 'web') {
        tk = localStorage.getItem('userToken');
      } else {
        tk = await SecureStore.getItemAsync('userToken');
      }

      // Contract: POST /:id/follow to follow, DELETE /:id/follow to unfollow.
      // (POST /:id/unfollow is not routed on the deployed API.)
      const url = `${API_BASE_URL}/api/users/${targetIdStr}/follow`;
      const reqHeaders = tk ? { Authorization: `Bearer ${tk}` } : {};
            let res;
      if (nextFollowingState) {
        try {
          // Explicit idempotent follow: PUT /api/users/:id/follow
          res = await axios.put(url, {}, { headers: reqHeaders, timeout: 15000 });
        } catch (putErr: any) {
          if (putErr.response?.status === 404 || putErr.response?.status === 405) {
            // Fallback for legacy servers supporting POST /api/users/:id/follow
            res = await axios.post(url, {}, { headers: reqHeaders, timeout: 15000 });
          } else {
            throw putErr;
          }
        }
      } else {
        try {
          // Explicit idempotent unfollow: DELETE /api/users/:id/follow
          res = await axios.delete(url, { headers: reqHeaders, timeout: 15000 });
        } catch (delErr: any) {
          if (delErr.response?.status === 404 || delErr.response?.status === 405) {
            // Fallback for servers routing unfollow via POST /api/users/:id/unfollow
            const unfollowUrl = `${API_BASE_URL}/api/users/${targetIdStr}/unfollow`;
            res = await axios.post(unfollowUrl, {}, { headers: reqHeaders, timeout: 15000 });
          } else {
            throw delErr;
          }
        }
      }
      // Server response is authoritative; no optimistic state to roll back
      const serverFollowing = typeof res.data?.isFollowing === 'boolean'
        ? res.data.isFollowing
        : nextFollowingState;
      followStore.confirm(targetIdStr, serverFollowing);
      if (onFollowChange) onFollowChange(serverFollowing, res.data?.followerCount);
      broadcastFollowChange(targetIdStr, targetUnameStr, serverFollowing, res.data?.followerCount);
    } catch (err: any) {
      console.error('FollowButton action failed:', err?.message);
      // Relationship unchanged (state was never flipped); tell the user visibly
      Alert.alert(
        nextFollowingState ? 'Could not follow' : 'Could not unfollow',
        err?.response?.data?.message || 'Please check your connection and try again.'
      );
    } finally {
      inFlightRef.current = false;
      followStore.setPending(targetIdStr, false);
    }
  };

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  // Determine button text and styling based on state, hover and theme
  let label = isFollowing ? (isHovered ? 'Unfollow' : 'Following') : '+ Follow';
  if (isFollowing && !isHovered) label = 'Following';

  const brandPrimary = theme?.primary || '#F5A623';
  const borderOutline = isDark ? 'rgba(255, 255, 255, 0.18)' : '#E2E8F0';
  const followingBg = isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF';

  const buttonBg = isFollowing
    ? isHovered
      ? 'rgba(239, 68, 68, 0.15)' // subtle red on unfollow hover
      : followingBg
    : brandPrimary;

  const buttonBorder = isFollowing
    ? isHovered
      ? 'rgba(239, 68, 68, 0.4)'
      : borderOutline
    : brandPrimary;

  const labelColor = isFollowing
    ? isHovered
      ? '#ef4444'
      : (isDark ? '#F8FAFC' : '#111827')
    : (isDark ? '#080D17' : '#FFFFFF');

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      disabled={loading || unknown}
      accessibilityRole="button"
      accessibilityState={{ disabled: loading || unknown, busy: loading }}
      // @ts-ignore
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={[
        styles.base,
        isSmall && styles.smButton,
        isLarge && styles.lgButton,
        {
          backgroundColor: buttonBg,
          borderColor: buttonBorder,
        },
        style,
      ]}
    >
      {(loading || unknown) ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : (
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            isSmall && styles.smLabel,
            isLarge && styles.lgLabel,
            { color: labelColor },
            Platform.OS === 'web' ? ({ whiteSpace: 'nowrap' } as any) : null,
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as any,
  smButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  lgButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  smLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  lgLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
});






