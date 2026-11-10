import React, { useEffect, useState, useRef, useCallback, useSyncExternalStore } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
  AppState,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { typography } from '../../constants/theme';
import Animated, {
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useFocusEffect } from 'expo-router';
import { API_BASE_URL, resolveImageUrl, resolveReelVideoUrl, isEligibleReelRecord, getWithColdStartRetry } from '../../lib/api';
import { formatSmartDateTime } from '../../lib/dateTime';
import Avatar from '../../components/Avatar';
import Skeleton from '../../components/Skeleton';
import FollowButton, { broadcastFollowChange } from '../../components/FollowButton';

// No hardcoded seeded videos: reels are loaded live from the user and backend
const DUMMY_VIDEOS: any[] = [];

const SHARE_CONTACTS = [
  { id: '1', name: 'Shreekutti', role: 'Residential Architect · Chennai', avatar: null },
  { id: '2', name: 'Mohammed Ajmal', role: 'CRE Advisory & Multi-Family', avatar: null },
  { id: '3', name: 'Yashwanth', role: 'Commercial Realty · Tech Hubs', avatar: null },
  { id: '4', name: 'Logeshwaran A', role: 'Architectural Consultant · Tech Parks', avatar: null },
  { id: '5', name: 'Sai Vimenthan V L', role: 'Principal Broker · Commercial Assets', avatar: null },
];

const DEFAULT_POSTERS: Record<string, string> = {
  'Uluwatu Cliffside Resort': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
  'Kyoto Corporate Retreat': 'https://boolokgpt.vercel.app/videos/kyoto_poster.jpg',
  'Kyoto Forest Retreat': 'https://boolokgpt.vercel.app/videos/kyoto_poster.jpg',
  'Coventry Tech Campus': '/coventry_corporate.jpg',
  'Coventry Corporate Headquarters': '/coventry_corporate.jpg',
  'Coventry Office': '/coventry_corporate.jpg',
  'Margaret River Commercial Vineyard Estate': 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200',
  'Margaret River Vineyard': 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200',
  'Outer Ring Road Tech Park Campus': 'https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Whitefield Commercial IT SEZ': 'https://images.pexels.com/photos/269077/pexels-photo-269077.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Poes Garden Ultra-Luxury Villa': 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200',
  'house routing': 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Marina Coastal Skyscraper & Penthouse': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
};

const PROPERTY_COVER_PRESETS = [
  { id: 'villa', label: 'Luxury Villa', url: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1200' },
  { id: 'estate', label: 'Glass Estate', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200' },
  { id: 'penthouse', label: 'Sky Penthouse', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200' },
  { id: 'waterfront', label: 'Coastal Haven', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200' },
  { id: 'commercial', label: 'Commercial HQ', url: 'https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg?auto=compress&cs=tinysrgb&w=1200' },
  { id: 'whitefield', label: 'Commercial IT Campus', url: 'https://images.pexels.com/photos/269077/pexels-photo-269077.jpeg?auto=compress&cs=tinysrgb&w=1200' },
  { id: 'alpine', label: 'Corporate Tower', url: '/coventry_corporate.jpg' },
];

function resolveCoverUrl(item: any): string {
  const isCoventry = (item?.title || '').toLowerCase().includes('coventry') || (item?.location || '').toLowerCase().includes('coventry') || item?._id === '6ae3464eff2e1932b0ec9674';
  if (isCoventry) {
    return resolveImageUrl('/coventry_corporate.jpg') || '/coventry_corporate.jpg';
  }
  if (item?.poster && typeof item.poster === 'string' && item.poster.trim()) {
    const p = item.poster.trim();
    return resolveImageUrl(p) || p;
  }
  if (item?.thumbnail && typeof item.thumbnail === 'string' && item.thumbnail.trim()) {
    const t = item.thumbnail.trim();
    return resolveImageUrl(t) || t;
  }
  if (item?.title && DEFAULT_POSTERS[item.title]) {
    return resolveImageUrl(DEFAULT_POSTERS[item.title]) || DEFAULT_POSTERS[item.title];
  }
  const seed = String(item?._id || item?.title || item?.videoUrl || 'boolok_property');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % PROPERTY_COVER_PRESETS.length;
  return PROPERTY_COVER_PRESETS[idx].url;
}

function resolveVideoUrl(item: any): string {
  return resolveReelVideoUrl(item?.videoUrl);
}

function withCacheBust(url: string): string {
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}r=${Date.now()}`;
}

// ── Global mute state: one switch for the whole feed (not one per reel) ─────
// Web browsers block autoplay with sound, so web starts muted; native starts with sound.
let globalMuted = Platform.OS === 'web';
const muteListeners = new Set<() => void>();
function setGlobalMuted(next: boolean) {
  if (globalMuted === next) return;
  globalMuted = next;
  muteListeners.forEach((l) => l());
}
function useGlobalMuted(): [boolean, (v: boolean) => void] {
  const muted = useSyncExternalStore(
    (cb) => {
      muteListeners.add(cb);
      return () => {
        muteListeners.delete(cb);
      };
    },
    () => globalMuted,
    () => true
  );
  return [muted, setGlobalMuted];
}

function getLocalUploadedReels(): any[] {
  try {
    if (Platform.OS === 'web') {
      const raw = localStorage.getItem('boolok_user_uploaded_reels');
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list)
        ? list.filter((r: any) => !['1', '2', '3', '4'].includes(String(r._id || r.id)))
        : [];
    }
  } catch (_) {}
  return [];
}

function saveLocalUploadedReel(reel: any) {
  try {
    if (Platform.OS === 'web') {
      const list = getLocalUploadedReels();
      const updated = [reel, ...list.filter((r: any) => r._id !== reel._id)];
      localStorage.setItem('boolok_user_uploaded_reels', JSON.stringify(updated));
    }
  } catch (_) {}
}

const MarketIntelligenceSidebar = ({ theme, isDark, videos = [] }: { theme: any; isDark: boolean; videos?: any[] }) => {
  const cardBg = isDark ? theme.surfaceContainerHigh : theme.surface;
  const [isExpanded, setIsExpanded] = useState(false);

  const uniqueLocations = Array.from(
    new Set(videos.map((v: any) => (v.location || '').trim()).filter(Boolean))
  ).slice(0, 4);

  if (!isExpanded) {
    return (
      <Animated.View entering={FadeIn} style={[styles.sidebarCollapsed, { backgroundColor: theme.surfaceContainerLow, borderColor: theme.outlineVariant }]}>
        <Pressable
          onPress={() => setIsExpanded(true)}
          style={[styles.miBotIcon, { backgroundColor: theme.primary }]}
        >
          <MaterialCommunityIcons name="chart-box-outline" size={24} color={theme.onPrimary} />
        </Pressable>
        <View style={{ marginTop: 24, height: 150, width: 24, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme.onSurfaceVariant, fontSize: 12, fontWeight: 'bold', transform: [{ rotate: '90deg' }], width: 150, textAlign: 'center', letterSpacing: 2 }}>
            MARKET INSIGHTS
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn} style={[styles.sidebar, { backgroundColor: theme.surfaceContainerLow, borderColor: theme.outlineVariant }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: theme.onSurface, fontSize: 16, fontWeight: 'bold' }}>Market Summary</Text>
        <Pressable onPress={() => setIsExpanded(false)} style={{ padding: 4 }}>
          <MaterialIcons name="close" size={20} color={theme.onSurfaceVariant} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={{ color: theme.onSurfaceVariant, fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 12 }}>
          ACTIVE FEED MARKETS ({uniqueLocations.length})
        </Text>

        {uniqueLocations.map((loc: string) => (
          <View key={loc} style={[styles.miLocationRow, { backgroundColor: cardBg, borderColor: theme.outlineVariant }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.miLocationIcon, { backgroundColor: isDark ? theme.surfaceContainerHighest : theme.surfaceContainerLow }]}>
                <MaterialIcons name="location-on" size={18} color={theme.primary} />
              </View>
              <View>
                <Text style={{ color: theme.onSurface, fontSize: 14, fontWeight: '600' }}>{loc}</Text>
                <Text style={{ color: theme.onSurfaceVariant, fontSize: 12 }}>Owner-supplied listing showcase</Text>
              </View>
            </View>
          </View>
        ))}

        <Text style={{ color: theme.onSurfaceVariant, fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, marginTop: 16, marginBottom: 12 }}>
          FEED METRICS & DISCLOSURE
        </Text>

        <View style={[styles.miCard, { backgroundColor: cardBg, borderColor: theme.outlineVariant }]}>
          <Text style={{ color: theme.onSurface, fontSize: 24, fontWeight: 'bold' }}>{videos.length}</Text>
          <Text style={{ color: theme.onSurfaceVariant, fontSize: 12, marginBottom: 12 }}>Active Property Reels in Feed</Text>
          <Text style={{ color: theme.onSurfaceVariant, fontSize: 11.5, lineHeight: 16 }}>
            Listing specifications, yields, and property notes are supplied by listing authors and are not independently verified AI valuations.
          </Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

// ── Heart burst component for double-tap ─────────────────────────────────────
const HeartBurst = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(120)}
      style={styles.heartBurstContainer}
      pointerEvents="none"
    >
      <View style={styles.heartBurstGlow}>
        <MaterialIcons name="favorite" size={90} color="#ff2d55" />
      </View>
    </Animated.View>
  );
};

// ── Single Video Item ────────────────────────────────────────────────────────
const VideoItem = ({
  item,
  isActive,
  cardHeight,
  cardWidth,
  isMobile,
  onDelete,
  onOpenUpload,
}: any) => {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [deleting, setDeleting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useGlobalMuted();
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoHasError, setVideoHasError] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState(false);

  const [videoSrc, setVideoSrc] = useState<string>(() => resolveVideoUrl(item));
  const [coverHasError, setCoverHasError] = useState(false);
  const retryCountRef = useRef(0);
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;
  const singleTapTimer = useRef<any>(null);
  const likeInFlightRef = useRef(false);

  useEffect(() => {
    const resolved = resolveVideoUrl(item);
    retryCountRef.current = 0;
    setVideoSrc(resolved);
    setVideoHasError(!resolved);
    setIsVideoLoaded(false);
    setCoverHasError(false);
  }, [item._id, item.videoUrl]);

  useEffect(() => {
    return () => {
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
    };
  }, []);

  const hasVideo = Boolean(videoSrc && videoSrc.trim());
  const isKyoto =
    String(item._id || item.id || '').includes('kyoto') ||
    String(item._id || item.id || '') === 'logesh-reel-2' ||
    String(item.title || item.propertyTitle || '').toLowerCase().includes('kyoto') ||
    String(videoSrc || '').includes('kyoto');

  // One automatic retry (cache-busted), then show a real error state instead of
  // silently swapping in a different demo video.
  const handleVideoError = () => {
    console.warn('[reels] Video failed to load:', videoSrc);
    if (retryCountRef.current < 1 && videoSrc) {
      retryCountRef.current += 1;
      setVideoSrc(withCacheBust(resolveVideoUrl(item)));
    } else {
      setVideoHasError(true);
    }
  };

  const handleRetry = (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    retryCountRef.current = 0;
    setVideoHasError(false);
    setIsVideoLoaded(false);
    setVideoSrc(withCacheBust(resolveVideoUrl(item)));
  };

  // Follow author state
  const authorId = item.author?._id || item.author?.id || item.author?.username || 'sai';
  const authorName = item.authorName || item.author?.fullName || item.author?.name || 'Verified Advisor';
  const authorHandle = item.author?.username ? `@${item.author.username}` : '@boolok_pro';
  const authorAvatar = item.author?.profilePicture || item.author?.avatar;

  const [isFollowing, setIsFollowing] = useState<boolean>(() => {
    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem('boolok_following_users_set');
        if (raw) {
          const set = JSON.parse(raw);
          const authorKeys = [
            authorId,
            item.author?._id,
            item.author?.id,
            item.author?.username,
            typeof item.author?.username === 'string' ? item.author.username.toLowerCase() : null,
          ].filter(Boolean) as string[];
          return authorKeys.some((k) => Boolean(set[k]));
        }
      } catch (_) {}
    }
    return false;
  });

  // Likes state - server data is authoritative, with cache as secondary fallback
  const initialLikes = (() => {
    if (typeof item.likesCount === 'number') {
      return item.likesCount;
    }
    if (Array.isArray(item.likes)) {
      return item.likes.length;
    }
    if (typeof item.likes === 'number') {
      return item.likes;
    }
    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem('boolok_post_likes');
        if (raw) {
          const cache = JSON.parse(raw);
          if (cache[item._id] && typeof cache[item._id].count === 'number') {
            return cache[item._id].count;
          }
        }
      } catch (_) {}
    }
    return 0;
  })();
  const [likesCount, setLikesCount] = useState<number>(initialLikes);
  const [hasLiked, setHasLiked] = useState<boolean>(() => {
    if (typeof item.isLiked === 'boolean') return item.isLiked;
    if (Platform.OS === 'web') {
      try {
        // Check shared post-likes cache
        const raw = localStorage.getItem('boolok_post_likes');
        if (raw) {
          const cache = JSON.parse(raw);
          if (cache[item._id]) return Boolean(cache[item._id].likedByMe);
        }
        // Fallback to legacy liked-reels set
        const raw2 = localStorage.getItem('boolok_liked_reels_set');
        if (raw2) {
          const set = JSON.parse(raw2);
          return Boolean(set[item._id]);
        }
      } catch (_) {}
    }
    return false;
  });

  // Keep likes accurately synchronized when reel data updates from server
  useEffect(() => {
    const realCount = typeof item.likesCount === 'number'
      ? item.likesCount
      : (Array.isArray(item.likes) ? item.likes.length : (typeof item.likes === 'number' ? item.likes : 0));
    setLikesCount(realCount);
    if (typeof item.isLiked === 'boolean') {
      setHasLiked(item.isLiked);
    }
  }, [item._id, item.likesCount, item.likes, item.isLiked]);

  // Saved state
  const [isSaved, setIsSaved] = useState<boolean>(() => {
    if (Platform.OS === 'web') {
      try {
        const savedRaw = localStorage.getItem('boolok_saved_reels');
        if (savedRaw) {
          const parsed = JSON.parse(savedRaw);
          return Array.isArray(parsed) && parsed.some((r: any) => r._id === item._id || r.id === item._id);
        }
      } catch (_) {}
    }
    return false;
  });

  // Comments state
  const [comments, setComments] = useState<any[]>(() => {
    let base = Array.isArray(item.comments) ? item.comments : [];
    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem(`boolok_comments_${item._id}`);
        if (raw) {
          const cached = JSON.parse(raw);
          if (Array.isArray(cached)) {
            return cached;
          }
        }
      } catch (_) {}
    }
    return base;
  });

  // Keep comments accurately synchronized with active item to avoid stale or recycled counts
  useEffect(() => {
    let base = Array.isArray(item.comments) ? item.comments : [];
    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem(`boolok_comments_${item._id}`);
        if (raw) {
          const cached = JSON.parse(raw);
          if (Array.isArray(cached)) {
            setComments(cached);
            return;
          }
        }
      } catch (_) {}
    }
    setComments(base);
  }, [item._id, item.comments]);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Share state
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharedContacts, setSharedContacts] = useState<Record<string, boolean>>({});

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Video playback references
  const webVideoRef = useRef<any>(null);
  const lastTapRef = useRef<number>(0);
  const commentsScrollRef = useRef<ScrollView>(null);

  // On web we render a plain <video>, so don't spin up a hidden native player per reel.
  const player = useVideoPlayer(Platform.OS === 'web' ? null : (videoSrc || null), (p) => {
    p.loop = true;
    p.muted = isMuted;
    p.volume = 1.0;
  });

  // Native: keep UI in sync with the real player + surface load errors
  useEffect(() => {
    if (Platform.OS === 'web' || !player) return;
    const playingSub = player.addListener('playingChange', ({ isPlaying: playing }: any) => {
      setIsPlaying(Boolean(playing));
    });
    const statusSub = player.addListener('statusChange', ({ status }: any) => {
      if (status === 'readyToPlay') {
        setIsVideoLoaded(true);
        setVideoHasError(false);
        if (isActiveRef.current) player.play();
      } else if (status === 'error') {
        handleVideoError();
      }
    });
    return () => {
      playingSub.remove();
      statusSub.remove();
    };
  }, [player]);

  // Load mobile persistent storage on mount
  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      try {
        // Liked state
        const likedRaw = await SecureStore.getItemAsync('boolok_liked_reels_set');
        if (likedRaw) {
          const set = JSON.parse(likedRaw);
          if (set[item._id]) setHasLiked(true);
        }
        // Saved state
        const savedRaw = await SecureStore.getItemAsync('boolok_saved_reels');
        if (savedRaw) {
          const parsed = JSON.parse(savedRaw);
          if (Array.isArray(parsed) && parsed.some((r: any) => r._id === item._id || r.id === item._id)) {
            setIsSaved(true);
          }
        }
        // Following state
        const followRaw = await SecureStore.getItemAsync('boolok_following_users_set');
        if (followRaw) {
          const set = JSON.parse(followRaw);
          if (set[authorId]) setIsFollowing(true);
        }
        // Comments cache
        const commentsRaw = await SecureStore.getItemAsync(`boolok_comments_${item._id}`);
        if (commentsRaw) {
          const parsed = JSON.parse(commentsRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setComments(parsed);
          }
        }
      } catch (_) {}
    })();
  }, [item._id, authorId]);

  // Web: play with sound if allowed, otherwise fall back to muted AND update the shared mute
  // state so the speaker icon never lies about what you are hearing.
  const playWeb = () => {
    const vid = webVideoRef.current;
    if (!vid) return;
    vid.muted = isMuted;
    vid.volume = 1.0;
    const p = vid.play();
    if (p !== undefined) {
      p.then(() => setIsPlaying(true)).catch((err: any) => {
        if (err?.name === 'AbortError') return; // interrupted by a newer load/pause - harmless
        if (!vid.muted) {
          vid.muted = true;
          setIsMuted(true);
          vid.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      });
    }
  };

  // Autoplay / Pause based on visibility. Inactive reels are ALWAYS paused (no overlapping audio).
  useEffect(() => {
    if (Platform.OS === 'web') {
      const vid = webVideoRef.current;
      if (!vid) return;
      if (isActive) {
        playWeb();
      } else {
        vid.pause();
        setIsPlaying(false);
      }
      return;
    }
    if (!player) return;
    player.muted = isMuted;
    player.volume = 1.0;
    if (isActive) {
      player.play();
    } else {
      player.pause();
      setIsPlaying(false);
    }
  }, [isActive, isMuted, videoSrc, player]);

  // Handle Play / Pause toggle
  const togglePlay = (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();

    if (Platform.OS === 'web' && webVideoRef.current) {
      const vid = webVideoRef.current;
      if (vid.paused) {
        vid.play().then(() => setIsPlaying(true)).catch(() => {
          vid.muted = true;
          vid.play().then(() => setIsPlaying(true)).catch(() => {});
        });
      } else {
        vid.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (player) {
      if (player.playing) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
    }
  };

  // Toggle Mute
  const toggleMute = (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (Platform.OS === 'web' && webVideoRef.current) {
      const vid = webVideoRef.current;
      vid.muted = nextMuted;
      vid.volume = 1.0;
      if (isActive && vid.paused) {
        vid.play().catch(() => {});
      }
    } else if (player) {
      player.muted = nextMuted;
      player.volume = 1.0;
    }
  };

  // Trigger Heart Burst
  const triggerHeartBurst = () => {
    setShowHeartBurst(true);
    setTimeout(() => {
      setShowHeartBurst(false);
    }, 700);
  };

  // Tap handler: single tap play/pause (delayed so a double tap never pauses first),
  // double tap like. While muted, the first tap turns sound on instead of pausing.
  const handleVideoPress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }
      lastTapRef.current = 0;
      if (!hasLiked) {
        handleLike();
      } else {
        triggerHeartBurst();
      }
      return;
    }
    lastTapRef.current = now;
    singleTapTimer.current = setTimeout(() => {
      singleTapTimer.current = null;
      if (isMuted) {
        toggleMute();
      } else {
        togglePlay();
      }
    }, 280);
  };

  // Like Toggle
  const handleLike = async (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (likeInFlightRef.current) return;
    likeInFlightRef.current = true;

    const nextState = !hasLiked;
    const prevState = hasLiked;
    const prevCount = likesCount;
    const nextCount = nextState ? likesCount + 1 : Math.max(0, likesCount - 1);
    setHasLiked(nextState);
    setLikesCount(nextCount);

    if (nextState) {
      triggerHeartBurst();
    }

    // ── Write to shared boolok_post_likes cache (same key as feed.tsx) ────────────
    try {
      if (Platform.OS === 'web') {
        const pRaw = localStorage.getItem('boolok_post_likes');
        const pCache = pRaw ? JSON.parse(pRaw) : {};
        pCache[item._id] = { count: nextCount, likedByMe: nextState };
        localStorage.setItem('boolok_post_likes', JSON.stringify(pCache));
        // Also keep legacy liked-reels set in sync
        const lRaw = localStorage.getItem('boolok_liked_reels_set');
        const lSet = lRaw ? JSON.parse(lRaw) : {};
        if (nextState) lSet[item._id] = true; else delete lSet[item._id];
        localStorage.setItem('boolok_liked_reels_set', JSON.stringify(lSet));

        // Also update boolok_user_uploaded_reels so profile stays in sync
        const rawList = localStorage.getItem('boolok_user_uploaded_reels');
        if (rawList) {
          const list = JSON.parse(rawList);
          const idx = list.findIndex((r: any) => r._id === item._id || r.id === item._id);
          if (idx !== -1) {
            list[idx].likes = nextCount;
            list[idx].likesCount = nextCount;
            list[idx].isLiked = nextState;
            localStorage.setItem('boolok_user_uploaded_reels', JSON.stringify(list));
          }
        }
      } else {
        const pRaw = await SecureStore.getItemAsync('boolok_post_likes');
        const pCache = pRaw ? JSON.parse(pRaw) : {};
        pCache[item._id] = { count: nextCount, likedByMe: nextState };
        await SecureStore.setItemAsync('boolok_post_likes', JSON.stringify(pCache));
        const lRaw = await SecureStore.getItemAsync('boolok_liked_reels_set');
        const lSet = lRaw ? JSON.parse(lRaw) : {};
        if (nextState) lSet[item._id] = true; else delete lSet[item._id];
        await SecureStore.setItemAsync('boolok_liked_reels_set', JSON.stringify(lSet));
      }
    } catch (_) {}

    // ── Send to backend, then update cache with server-confirmed count ──────────
    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');

      if (item._id && token) {
        const res = await axios.put(
          `${API_BASE_URL}/api/reels/${item._id}/like`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data) {
          const serverCount = typeof res.data.likesCount === 'number' ? res.data.likesCount : nextCount;
          const serverLiked = typeof res.data.isLiked === 'boolean' ? res.data.isLiked : nextState;
          setLikesCount(serverCount);
          setHasLiked(serverLiked);
          // Update cache with accurate server value
          try {
            if (Platform.OS === 'web') {
              const pRaw2 = localStorage.getItem('boolok_post_likes');
              const pCache2 = pRaw2 ? JSON.parse(pRaw2) : {};
              pCache2[item._id] = { count: serverCount, likedByMe: serverLiked };
              localStorage.setItem('boolok_post_likes', JSON.stringify(pCache2));
            } else {
              const pRaw2 = await SecureStore.getItemAsync('boolok_post_likes');
              const pCache2 = pRaw2 ? JSON.parse(pRaw2) : {};
              pCache2[item._id] = { count: serverCount, likedByMe: serverLiked };
              await SecureStore.setItemAsync('boolok_post_likes', JSON.stringify(pCache2));
            }
          } catch (_) {}
        }
      }
    } catch (err: any) {
      if (err?.response) {
        // Server answered with an error: roll the optimistic update back
        setHasLiked(prevState);
        setLikesCount(prevCount);
      } else {
        console.warn('Liked in local session only');
      }
    } finally {
      likeInFlightRef.current = false;
    }
  };

  // Follow Toggle
  const handleToggleFollow = async (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const nextFollow = !isFollowing;
    setIsFollowing(nextFollow);

    // Store by every identifier (authorId, username, _id) so the profile Follow
    // button reads the same state regardless of which key it checks.
    const ids = [
      authorId,
      item.author?._id,
      item.author?.id,
      item.author?.username,
      typeof item.author?.username === 'string' ? item.author.username.toLowerCase() : null,
    ].filter(Boolean) as string[];

    try {
      if (Platform.OS === 'web') {
        const raw = localStorage.getItem('boolok_following_users_set');
        const set = raw ? JSON.parse(raw) : {};
        ids.forEach((key) => {
          if (nextFollow) set[key] = true;
          else delete set[key];
        });
        localStorage.setItem('boolok_following_users_set', JSON.stringify(set));
      } else {
        const raw = await SecureStore.getItemAsync('boolok_following_users_set');
        const set = raw ? JSON.parse(raw) : {};
        ids.forEach((key) => {
          if (nextFollow) set[key] = true;
          else delete set[key];
        });
        await SecureStore.setItemAsync('boolok_following_users_set', JSON.stringify(set));
      }
    } catch (_) {}

    // Persist to MongoDB database via API
    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');

      if (token && authorId) {
        const endpoint = nextFollow
          ? `${API_BASE_URL}/api/users/${authorId}/follow`
          : `${API_BASE_URL}/api/users/${authorId}/unfollow`;
        const res = await axios.post(
          endpoint,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data) {
          const serverFollowing = typeof res.data.isFollowing === 'boolean' ? res.data.isFollowing : nextFollow;
          setIsFollowing(serverFollowing);
          const targetUser = res.data.targetUser;
          broadcastFollowChange(authorId, targetUser?.username || item.author?.username, serverFollowing, res.data?.followerCount);
          const confirmedKeys = [
            authorId,
            targetUser?.id,
            targetUser?._id,
            targetUser?.username,
            typeof targetUser?.username === 'string' ? targetUser.username.toLowerCase() : null,
            ...ids,
          ].filter(Boolean) as string[];

          try {
            if (Platform.OS === 'web') {
              const raw = localStorage.getItem('boolok_following_users_set');
              const set = raw ? JSON.parse(raw) : {};
              confirmedKeys.forEach((key) => {
                if (serverFollowing) set[key] = true;
                else delete set[key];
              });
              localStorage.setItem('boolok_following_users_set', JSON.stringify(set));
            } else {
              const raw = await SecureStore.getItemAsync('boolok_following_users_set');
              const set = raw ? JSON.parse(raw) : {};
              confirmedKeys.forEach((key) => {
                if (serverFollowing) set[key] = true;
                else delete set[key];
              });
              await SecureStore.setItemAsync('boolok_following_users_set', JSON.stringify(set));
            }
          } catch (_) {}
        }
      }
    } catch (err) {
      console.warn('Failed to update follow in database, reverting:', err);
      setIsFollowing(!nextFollow);
    }
  };

  // Save / Bookmark Toggle
  const handleToggleSave = async (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    const reelPayload = {
      _id: item._id,
      id: item._id,
      title: item.title,
      location: item.location,
      insight: item.insight,
      aiMatch: item.aiMatch,
      likes: likesCount,
      videoUrl: item.videoUrl,
      thumbnail: item.thumbnail || item.poster,
      poster: item.poster || item.thumbnail,
      author: item.author,
      savedAt: new Date().toISOString(),
    };

    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem('boolok_saved_reels');
        let list: any[] = raw ? JSON.parse(raw) : [];
        if (nextSaved) {
          if (!list.some((r) => r._id === item._id || r.id === item._id)) {
            list.unshift(reelPayload);
          }
        } else {
          list = list.filter((r) => r._id !== item._id && r.id !== item._id);
        }
        localStorage.setItem('boolok_saved_reels', JSON.stringify(list));
      } catch (_) {}
    } else {
      try {
        const raw = await SecureStore.getItemAsync('boolok_saved_reels');
        let list: any[] = raw ? JSON.parse(raw) : [];
        if (nextSaved) {
          if (!list.some((r) => r._id === item._id || r.id === item._id)) {
            list.unshift(reelPayload);
          }
        } else {
          list = list.filter((r) => r._id !== item._id && r.id !== item._id);
        }
        await SecureStore.setItemAsync('boolok_saved_reels', JSON.stringify(list));
      } catch (_) {}
    }
  };

  // Share to contact
  const handleShareToContact = (contactId: string) => {
    setSharedContacts((prev) => ({ ...prev, [contactId]: true }));
    setTimeout(() => {
      setSharedContacts((prev) => ({ ...prev, [contactId]: false }));
    }, 2000);
  };

  // Add Comment
  const handleAddComment = async () => {
    if (!commentInput.trim() || isSubmittingComment) return;
    const text = commentInput.trim();
    setCommentInput('');
    setIsSubmittingComment(true);

    const currentUserObj = {
      _id: user?.id || user?._id || 'me',
      fullName: user?.fullName || 'You',
      username: user?.username || 'member',
      profilePicture: user?.profilePicture || null,
    };

    const newComment = {
      _id: `comment_${Date.now()}`,
      user: currentUserObj,
      author: currentUserObj,
      text,
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [...comments, newComment];
    setComments(updatedComments);

    // Save to local cache
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(`boolok_comments_${item._id}`, JSON.stringify(updatedComments));
        const rawList = localStorage.getItem('boolok_user_uploaded_reels');
        if (rawList) {
          const list = JSON.parse(rawList);
          const idx = list.findIndex((r: any) => r._id === item._id || r.id === item._id);
          if (idx !== -1) {
            list[idx].comments = updatedComments;
            list[idx].commentsCount = updatedComments.length;
            localStorage.setItem('boolok_user_uploaded_reels', JSON.stringify(list));
          }
        }
      } else {
        await SecureStore.setItemAsync(`boolok_comments_${item._id}`, JSON.stringify(updatedComments));
      }
    } catch (_) {}

    // Send to backend if server reel
    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');

      if (token && item._id && !['1', '2', '3', '4'].includes(item._id)) {
        const res = await axios.post(
          `${API_BASE_URL}/api/reels/${item._id}/comments`,
          { text },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data && Array.isArray(res.data.comments)) {
          setComments(res.data.comments);
          if (Platform.OS === 'web') {
            localStorage.setItem(`boolok_comments_${item._id}`, JSON.stringify(res.data.comments));
          }
        }
      }
    } catch (err) {
      console.warn('Comment added in local session');
    } finally {
      setIsSubmittingComment(false);
      setTimeout(() => {
        commentsScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Open comments and fetch server comments if available
  const handleOpenComments = async () => {
    setShowComments(true);
    if (!['1', '2', '3', '4'].includes(item._id)) {
      try {
        const token = Platform.OS === 'web'
          ? localStorage.getItem('userToken')
          : await SecureStore.getItemAsync('userToken');

        const res = await axios.get(`${API_BASE_URL}/api/reels/${item._id}/comments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.data && Array.isArray(res.data)) {
          const formatted = res.data.map((c: any) => ({
            _id: c._id,
            user: c.author || { fullName: 'Advisor' },
            text: c.text,
            createdAt: c.createdAt,
          }));
          setComments(formatted);
        }
      } catch (_) {}
    }
  };

  // Navigate to profile
  const handleGoToProfile = (id?: string) => {
    setShowComments(false);
    const target = id || authorId || 'sai';
    router.push({ pathname: '/(app)/profile', params: { id: target } });
  };

  const currentUserId = String(user?.id || user?._id || '');
  const currentUsername = String(user?.username || '').toLowerCase();
  const currentFullName = String(user?.fullName || '').trim().toLowerCase();
  const authorUserId = String(item.author?._id || item.author?.id || '');
  const authorUserHandle = String(item.author?.username || '').toLowerCase();
  const authorDisplayName = String(authorName || item.authorName || item.author?.fullName || '').trim().toLowerCase();

  const isUploadedByMe = Boolean(
    currentUserId && authorUserId && currentUserId === authorUserId
  );

  const isDeletable = Boolean(onDelete && isUploadedByMe);
  const isCoventry = (item.title || '').toLowerCase().includes('coventry') || (item.location || '').toLowerCase().includes('coventry');

  return (
    <View
      style={[
        styles.videoContainer,
        {
          height: cardHeight,
          width: cardWidth,
          borderRadius: isMobile ? 0 : 20,
          marginBottom: isMobile ? 0 : 20,
          borderWidth: isMobile ? 0 : 1,
          borderColor: '#1e293b',
        },
      ]}
    >
      {/* ── Video Background / Tap Layer ── */}
      <TouchableOpacity
        activeOpacity={0.98}
        onPress={handleVideoPress}
        style={StyleSheet.absoluteFill}
      >
        {/* Background Cover Image fallback with ambient blur fill for Coventry */}
        {isCoventry && (
          <Image
            source={{
              uri: resolveCoverUrl(item),
            }}
            style={[StyleSheet.absoluteFill, { opacity: 0.35 }]}
            resizeMode="cover"
            blurRadius={Platform.OS === 'web' ? 24 : 16}
          />
        )}
        <Image
          source={{
            uri: coverHasError
              ? (isCoventry ? resolveCoverUrl(item) : PROPERTY_COVER_PRESETS[0].url)
              : resolveCoverUrl(item),
          }}
          onError={() => {
            if (!isCoventry) setCoverHasError(true);
          }}
          style={[
            StyleSheet.absoluteFill,
            isCoventry && {
              transform: [{ scale: 1.15 }],
            },
          ]}
          resizeMode={isCoventry ? "cover" : "cover"}
        />

        {/* Video Player or 3D Tour Unavailable State */}
        {Boolean(videoSrc) ? (
          Platform.OS === 'web' ? (
            <video
              ref={webVideoRef}
              src={videoSrc || undefined}
              poster={coverHasError ? PROPERTY_COVER_PRESETS[0].url : resolveCoverUrl(item)}
              loop
              muted
              playsInline
              preload={isActive ? 'auto' : 'metadata'}
              onLoadedData={() => {
                setIsVideoLoaded(true);
                setVideoHasError(false);
                if (isActiveRef.current) playWeb();
              }}
              onError={handleVideoError}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: isVideoLoaded ? 1 : 0.85,
                pointerEvents: 'none',
                transition: 'opacity 0.25s ease',
              }}
            />
          ) : (
            <VideoView
              player={player}
              style={{ width: cardWidth, height: cardHeight }}
              contentFit="cover"
              nativeControls={false}
            />
          )
        ) : null}

        {/* Real error state (no silent swap to a different demo video) */}
        {videoHasError && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(6, 11, 19, 0.7)',
              zIndex: 20,
            }}
          >
            <MaterialIcons name={videoSrc ? "error-outline" : "videocam-off"} size={40} color={theme.primary} />
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700', marginTop: 10 }}>
              {videoSrc ? "This video couldn't be loaded" : "Property video unavailable"}
            </Text>
            {Boolean(videoSrc) && (
              <TouchableOpacity
                onPress={handleRetry}
                style={{
                  marginTop: 14,
                  paddingHorizontal: 20,
                  paddingVertical: 9,
                  borderRadius: 20,
                  backgroundColor: theme.primary,
                }}
              >
                <Text style={{ color: '#000000', fontSize: 13, fontWeight: '800' }}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Center Heart Burst on double tap */}
        <HeartBurst visible={showHeartBurst} />

        {/* Play / Pause Indicator */}
        {!isPlaying && Boolean(videoSrc) && (
          <View style={styles.playOverlay} pointerEvents="none">
            <View style={styles.playIconContainer}>
              <MaterialIcons name="play-arrow" size={50} color={theme.primary} />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* ── Top Bar Overlay: Insights Branding + AI Match Badge + Sound & Upload Controls ── */}
      <View
        style={[
          styles.topOverlay,
          { top: isMobile ? 14 : 16 },
        ]}
        pointerEvents="box-none"
      >
        {/* Left: Brand Title (Mobile) + AI Match Badge + Illustrative Footage Badge */}
        <View style={styles.topLeftContainer}>
          {isMobile && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 2 }}>
              <Text style={styles.mobileTopTitle}>Insights</Text>
              <View style={[styles.liveDot, { backgroundColor: theme.primary }]} />
            </View>
          )}
          {isKyoto && (
            <View style={[styles.aiMatchBadge, { backgroundColor: 'rgba(0, 0, 0, 0.75)', borderColor: '#F5A623' }]}>
              <MaterialIcons name="info-outline" size={12} color="#F5A623" style={{ marginRight: 4 }} />
              <Text style={[styles.aiMatchText, { color: '#F5A623' }]}>
                Illustrative footage
              </Text>
            </View>
          )}
          {!isCoventry && !isKyoto && typeof item.aiMatch === 'number' && Boolean(item.aiMatchBasis) && (
            <View style={styles.aiMatchBadge}>
              <View style={[styles.pulseDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.aiMatchText, { color: theme.primary }]}>
                {item.aiMatch}% AI MATCH
              </Text>
            </View>
          )}
        </View>

        {/* Right: Sound / Mute Toggle (when video exists) + Upload Button */}
        <View style={styles.topRightContainer}>
          {hasVideo && (
            <TouchableOpacity
              onPress={toggleMute}
              style={[
                styles.soundBtn,
                !isMuted && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={isMuted ? 'volume-off' : 'volume-up'}
                size={18}
                color={isMuted ? '#ffffff' : '#000000'}
              />
            </TouchableOpacity>
          )}

          {isMobile && onOpenUpload && (
            <TouchableOpacity
              onPress={onOpenUpload}
              style={[styles.topUploadBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={15} color="#000000" />
              <Text style={styles.topUploadBtnText}>Upload</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Right Social Actions Rail ── */}
      <View style={[styles.rightOverlay, { bottom: isMobile ? 20 : 16 }]} pointerEvents="box-none">
        {/* Creator Avatar with follow badge */}
        <View style={styles.creatorRailItem}>
          <TouchableOpacity
            onPress={() => handleGoToProfile(authorId)}
            activeOpacity={0.8}
            style={styles.creatorAvatarRing}
          >
            <Avatar user={item.author || { fullName: authorName, profilePicture: authorAvatar }} size={40} showBorder borderColor="#F5A623" />
          </TouchableOpacity>

          {!isFollowing && !isUploadedByMe && (
            <TouchableOpacity
              onPress={handleToggleFollow}
              style={[styles.miniFollowPlus, { backgroundColor: theme.primary }]}
              activeOpacity={0.7}
            >
              <MaterialIcons name="add" size={13} color="#000" />
            </TouchableOpacity>
          )}
        </View>

        {/* Like Button */}
        <TouchableOpacity
          onPress={handleLike}
          activeOpacity={0.7}
          style={styles.actionBtn}
        >
          <View style={[styles.actionIconContainer, hasLiked && styles.actionIconContainerLiked]}>
            <MaterialIcons
              name={hasLiked ? 'favorite' : 'favorite-border'}
              size={24}
              color={hasLiked ? '#ff2d55' : '#ffffff'}
            />
          </View>
          <Text style={[styles.actionText, hasLiked && { color: '#ff2d55', fontWeight: '700' }]}>
            {likesCount}
          </Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity
          onPress={handleOpenComments}
          activeOpacity={0.7}
          style={styles.actionBtn}
        >
          <View style={styles.actionIconContainer}>
            <MaterialCommunityIcons name="comment-text-outline" size={23} color="#ffffff" />
          </View>
          <Text style={styles.actionText}>{comments.length}</Text>
        </TouchableOpacity>

        {/* Bookmark / Save Button */}
        <TouchableOpacity
          onPress={handleToggleSave}
          activeOpacity={0.7}
          style={styles.actionBtn}
        >
          <View style={[styles.actionIconContainer, isSaved && styles.actionIconContainerSaved]}>
            <MaterialIcons
              name={isSaved ? 'bookmark' : 'bookmark-border'}
              size={24}
              color={isSaved ? theme.primary : '#ffffff'}
            />
          </View>
          <Text style={[styles.actionText, isSaved && { color: theme.primary, fontWeight: '700' }]}>
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          onPress={() => setShowShareModal(true)}
          activeOpacity={0.7}
          style={styles.actionBtn}
        >
          <View style={styles.actionIconContainer}>
            <MaterialCommunityIcons name="share" size={23} color="#ffffff" />
          </View>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        {/* Delete button for user's uploaded reels */}
        {isDeletable && (
          <TouchableOpacity
            onPress={() => setShowDeleteModal(true)}
            disabled={deleting}
            activeOpacity={0.7}
            style={styles.actionBtn}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.25)', borderColor: 'rgba(239, 68, 68, 0.5)' }]}>
              {deleting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <MaterialIcons name="delete-outline" size={22} color="#ef4444" />
              )}
            </View>
            <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Bottom Overlay: Author Bar, Title, Location, AI Insight, Music ── */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.88)']}
        style={[
          styles.bottomOverlay,
          {
            paddingBottom: isMobile ? 18 : 14,
            paddingRight: isMobile ? 74 : 70,
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Author row */}
        <View style={styles.authorRow}>
          <TouchableOpacity
            onPress={() => handleGoToProfile(authorId)}
            style={styles.authorProfileLink}
            activeOpacity={0.8}
          >
            <Text style={styles.authorNameText} numberOfLines={1}>{authorName}</Text>
            <MaterialIcons name="verified" size={14} color="#38bdf8" style={{ marginLeft: 3 }} />
            <Text style={styles.authorHandleText} numberOfLines={1}>{authorHandle}</Text>
          </TouchableOpacity>

          <FollowButton
            targetUserId={authorId}
            targetUsername={authorHandle?.replace('@', '')}
            initialIsFollowing={isFollowing}
            size="sm"
            onFollowChange={(newIsF) => setIsFollowing(newIsF)}
          />
        </View>

        {/* Property Title */}
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Location & Price Row */}
        {(Boolean(item.location) || (item.price !== undefined && item.price !== null && String(item.price).trim() !== '' && String(item.price).trim() !== 'undefined' && String(item.price).trim() !== 'null') || isCoventry) && (
          <View style={[styles.locationContainer, { flexWrap: 'wrap', gap: 6 }]}>
            {Boolean(item.location) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                <MaterialIcons name="location-on" size={14} color={theme.primary} />
                <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
              </View>
            )}
            {((item.price !== undefined && item.price !== null && String(item.price).trim() !== '' && String(item.price).trim() !== 'undefined' && String(item.price).trim() !== 'null') || isCoventry) && (
              <View style={{ backgroundColor: 'rgba(249, 192, 61, 0.18)', borderColor: 'rgba(249, 192, 61, 0.5)', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '800' }}>
                  {item.price !== undefined && item.price !== null && String(item.price).trim() !== '' && String(item.price).trim() !== 'undefined' && String(item.price).trim() !== 'null' ? String(item.price) : '£12,242,788'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Expandable Property Overview (Owner Supplied) */}
        {Boolean(item.insight) && (
          <View style={styles.insightContainer}>
            <View style={styles.insightHeader}>
              <MaterialIcons name="info-outline" size={13} color={theme.primary} />
              <Text style={[styles.insightTitle, { color: theme.primary }]}>PROPERTY OVERVIEW · OWNER SUPPLIED</Text>
            </View>
            {expandedInsight ? (
              <ScrollView style={{ maxHeight: 84 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                <Text style={styles.insightText}>{item.insight}</Text>
              </ScrollView>
            ) : (
              <Text style={styles.insightText} numberOfLines={2}>
                {item.insight}
              </Text>
            )}
            {item.insight.length > 70 && (
              <TouchableOpacity
                onPress={() => setExpandedInsight(!expandedInsight)}
                style={{ marginTop: 3 }}
              >
                <Text style={{ color: theme.primary, fontSize: 11.5, fontWeight: '700' }}>
                  {expandedInsight ? 'Show less' : '...more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Only show Mute / Sound status pill if video media exists */}
        {hasVideo && (
          <TouchableOpacity
            onPress={isKyoto ? undefined : toggleMute}
            activeOpacity={isKyoto ? 1 : 0.8}
            style={[styles.musicPill, (isMuted || isKyoto) && { borderColor: 'rgba(249, 192, 61, 0.6)' }]}
          >
            <MaterialCommunityIcons
              name={isKyoto ? 'volume-mute' : (isMuted ? 'volume-off' : 'volume-high')}
              size={13}
              color={(isMuted || isKyoto) ? theme.primary : '#ffffff'}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.musicText, (isMuted || isKyoto) && { color: theme.primary, fontWeight: '700' }]} numberOfLines={1}>
              {isKyoto ? '🔇 Silent video' : (isMuted ? '🔇 Muted · Tap for sound' : '🔊 Original Property Audio')}
            </Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* ── Custom Delete Confirmation Modal ── */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDeleteModal(false)}>
          <Pressable style={styles.deleteDialogCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.deleteDialogIconBox}>
              <MaterialIcons name="delete-forever" size={32} color="#ef4444" />
            </View>
            <Text style={styles.deleteDialogTitle}>Delete Property Reel</Text>
            <Text style={styles.deleteDialogDesc}>
              Are you sure you want to delete &ldquo;{item.title}&rdquo;? This listing video and all its analytics will be permanently removed.
            </Text>
            <View style={styles.deleteDialogBtnRow}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={styles.deleteDialogCancelBtn}
              >
                <Text style={styles.deleteDialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  setShowDeleteModal(false);
                  setDeleting(true);
                  try {
                    await onDelete(item._id);
                  } finally {
                    setDeleting(false);
                  }
                }}
                style={styles.deleteDialogConfirmBtn}
              >
                <Text style={styles.deleteDialogConfirmText}>Delete Reel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Share Modal ── */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShareModal(false)}
      >
        <Pressable
          onPress={() => setShowShareModal(false)}
          style={styles.modalBackdrop}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.shareCard}
          >
            <View style={styles.shareCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="send" size={20} color={theme.primary} />
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>
                  Share Property Reel
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowShareModal(false)} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={22} color="#8b9bb4" />
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#8b9bb4', fontSize: 12.5, marginBottom: 14 }}>
              Select a certified broker or advisor to send this video insight:
            </Text>

            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {SHARE_CONTACTS.map((contact) => {
                const isSent = sharedContacts[contact.id];
                return (
                  <View key={contact.id} style={styles.shareContactRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <Avatar
                        user={{ fullName: contact.name, profilePicture: contact.avatar || null }}
                        size={38}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
                          {contact.name}
                        </Text>
                        <Text style={{ color: '#8b9bb4', fontSize: 11.5 }} numberOfLines={1}>
                          {contact.role}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleShareToContact(contact.id)}
                      style={[
                        styles.shareSendBtn,
                        { backgroundColor: isSent ? '#10b981' : theme.primary },
                      ]}
                    >
                      <Text style={{ color: '#000000', fontWeight: '700', fontSize: 12 }}>
                        {isSent ? '✓ Sent' : 'Send'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Real-Time Comments Bottom Sheet / Modal ── */}
      <Modal
        visible={showComments}
        transparent
        animationType="slide"
        onRequestClose={() => setShowComments(false)}
      >
        <Pressable
          onPress={() => setShowComments(false)}
          style={styles.commentsBackdrop}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.commentsSheet,
              {
                maxHeight: isMobile ? '75%' : '65%',
                height: isMobile ? '75%' : 540,
              },
            ]}
          >
            {/* Sheet Top Handle */}
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.commentsHeader}>
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>
                Comments ({comments.length})
              </Text>
              <TouchableOpacity onPress={() => setShowComments(false)} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Comments Scrollable List */}
            <ScrollView
              ref={commentsScrollRef}
              style={{ flex: 1, marginVertical: 10 }}
              showsVerticalScrollIndicator={false}
            >
              {comments.length === 0 ? (
                <View style={styles.emptyCommentsContainer}>
                  <MaterialCommunityIcons name="chat-processing-outline" size={44} color="#475569" />
                  <Text style={{ color: '#94a3b8', fontSize: 14, fontWeight: '600', marginTop: 10 }}>
                    No comments yet
                  </Text>
                  <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                    Be the first to share an analysis or feedback!
                  </Text>
                </View>
              ) : (
                comments.map((c, idx) => {
                  const cUser = c.user || c.author || {};
                  const cName = cUser.fullName || cUser.username || (typeof c.user === 'string' ? c.user : 'Advisor');
                  const targetId = cUser._id || cUser.id || cUser.username || 'sai';
                  let photoUri = cUser.profilePicture || cUser.avatar;

                  return (
                    <View key={c._id || idx} style={styles.commentItem}>
                      <TouchableOpacity
                        onPress={() => handleGoToProfile(targetId)}
                        style={styles.commentAvatarBtn}
                      >
                        <Avatar user={cUser || { fullName: cName, profilePicture: photoUri }} size={36} />
                      </TouchableOpacity>

                      <View style={styles.commentContentBox}>
                        <View style={styles.commentUserRow}>
                          <TouchableOpacity onPress={() => handleGoToProfile(targetId)}>
                            <Text style={[styles.commentUserName, { color: theme.primary }]}>
                              {cName}
                            </Text>
                          </TouchableOpacity>
                          <Text style={styles.commentTime}>
                            {formatSmartDateTime(c.createdAt || c.time)}
                          </Text>
                        </View>
                        <Text style={styles.commentText}>{c.text}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Comment Input Row with Real-Time Enter & Submit */}
            <View style={styles.commentInputContainer}>
              <Avatar user={user} size={34} style={{ marginRight: 8 }} />

              <TextInput
                value={commentInput}
                onChangeText={setCommentInput}
                placeholder="Add a property insight or feedback..."
                placeholderTextColor="#64748b"
                returnKeyType="send"
                onSubmitEditing={handleAddComment}
                {...(Platform.OS === 'web' && {
                  onKeyDown: (e: any) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  },
                })}
                style={styles.commentInputField}
              />

              <TouchableOpacity
                onPress={handleAddComment}
                disabled={!commentInput.trim() || isSubmittingComment}
                style={[
                  styles.commentSendBtn,
                  { backgroundColor: theme.primary },
                  (!commentInput.trim() || isSubmittingComment) && { opacity: 0.4 },
                ]}
              >
                {isSubmittingComment ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <MaterialIcons name="send" size={18} color="#000000" />
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

// ── Upload Modal ─────────────────────────────────────────────────────────────
// ── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ visible, onClose, onUploaded, theme, isDark, user }: any) {
  const [video, setVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [coverAsset, setCoverAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [selectedPresetUrl, setSelectedPresetUrl] = useState<string>(PROPERTY_COVER_PRESETS[0].url);
  const [authorName, setAuthorName] = useState<string>(user?.fullName || '');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStageText, setUploadStageText] = useState('Uploading video...');

  useEffect(() => {
    let interval: any;
    if (uploading) {
      interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev < 40) {
            setUploadStageText('Uploading high-definition property video...');
            return prev + 6;
          }
          if (prev < 75) {
            setUploadStageText('Optimizing bitrate & cover streams...');
            return prev + 4;
          }
          if (prev < 92) {
            setUploadStageText('Generating AI Property Intelligence match...');
            return prev + 2;
          }
          return prev;
        });
      }, 300);
    } else {
      setUploadProgress(0);
    }
    return () => clearInterval(interval);
  }, [uploading]);

  useEffect(() => {
    if (visible && !authorName) {
      setAuthorName(user?.fullName || '');
    }
  }, [visible, user?.fullName]);

  const reset = () => {
    setVideo(null);
    setCoverAsset(null);
    setSelectedPresetUrl(PROPERTY_COVER_PRESETS[0].url);
    setTitle('');
    setLocation('');
    setCaption('');
    setAuthorName(user?.fullName || '');
  };

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow access to your media library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      setVideo(result.assets[0]);
    }
  };

  const pickCoverImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow access to your media library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: true,
      aspect: [9, 16],
    });
    if (!result.canceled && result.assets.length > 0) {
      setCoverAsset(result.assets[0]);
    }
  };

  const currentCoverUri = coverAsset ? coverAsset.uri : selectedPresetUrl;

  const handleUpload = async () => {
    if (!video) {
      Alert.alert('No video selected', 'Please choose a video to upload.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a property or reel title.');
      return;
    }

    setUploading(true);
    setUploadProgress(15);
    setUploadStageText('Preparing video & property media...');
    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');

      if (!token) {
        setUploading(false);
        Alert.alert('Sign in required', 'Please sign in again to upload a reel.');
        return;
      }

      const formData = new FormData();

      if (Platform.OS === 'web') {
        const blobRes = await fetch(video.uri);
        const blob = await blobRes.blob();
        const mimeType = blob.type || video.mimeType || 'video/mp4';
        const ext = mimeType.includes('webm')
          ? 'webm'
          : mimeType.includes('quicktime')
          ? 'mov'
          : 'mp4';
        const videoFile = new File([blob], `reel_${Date.now()}.${ext}`, { type: mimeType });
        formData.append('video', videoFile);
      } else {
        const cleanName = video.fileName || `upload_${Date.now()}.mp4`;
        (formData as any).append('video', {
          uri: video.uri,
          name: cleanName,
          type: video.mimeType || 'video/mp4',
        });
      }

      if (coverAsset) {
        if (Platform.OS === 'web') {
          const thumbBlobRes = await fetch(coverAsset.uri);
          const thumbBlob = await thumbBlobRes.blob();
          const thumbMime = thumbBlob.type || coverAsset.mimeType || 'image/jpeg';
          const thumbFile = new File([thumbBlob], `cover_${Date.now()}.jpg`, { type: thumbMime });
          formData.append('thumbnail', thumbFile);
          formData.append('poster', thumbFile);
        } else {
          (formData as any).append('thumbnail', {
            uri: coverAsset.uri,
            name: 'cover.jpg',
            type: coverAsset.mimeType || 'image/jpeg',
          });
          (formData as any).append('poster', {
            uri: coverAsset.uri,
            name: 'cover.jpg',
            type: coverAsset.mimeType || 'image/jpeg',
          });
        }
      } else if (selectedPresetUrl) {
        formData.append('thumbnail', selectedPresetUrl);
        formData.append('poster', selectedPresetUrl);
      }

      const effectiveAuthor = authorName.trim() || user?.fullName || 'Boolok Creator';
      formData.append('title', title.trim());
      formData.append('authorName', effectiveAuthor);
      formData.append('location', location.trim());
      formData.append('caption', caption.trim());

      // Do NOT set Content-Type manually: Axios and browser automatically supply the multipart boundary
      const response = await axios.post(`${API_BASE_URL}/api/reels`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 0,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        onUploadProgress: (evt: any) => {
          if (evt?.total) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            setUploadProgress(Math.min(95, 15 + Math.round(pct * 0.8)));
            setUploadStageText(pct < 100 ? `Uploading video… ${pct}%` : 'Processing on server…');
          }
        },
      });

      const finalPoster = response.data?.poster || response.data?.thumbnail || currentCoverUri;
      setUploadProgress(100);
      setUploadStageText('✓ Published Successfully!');

      setTimeout(() => {
        onUploaded({
          ...response.data,
          title: title.trim(),
          location: location.trim(),
          authorName: effectiveAuthor,
          caption: caption.trim(),
          author: {
            _id: user?.id || user?._id || 'you',
            fullName: effectiveAuthor,
            username: user?.username || 'you',
            profilePicture: user?.profilePicture || null,
            isVerified: true,
          },
          poster: finalPoster,
          thumbnail: finalPoster,
        });
        reset();
        onClose();
        setUploading(false);
      }, 450);
    } catch (err: any) {
      console.error(err);
      setUploading(false);
      Alert.alert('Upload failed', err?.response?.data?.message || err.message);
    }
  };

  const cardBg = isDark ? theme.surfaceContainerHigh : theme.surface;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={uploadStyles.modalOverlay}>
        <Pressable
          style={uploadStyles.backdropFill}
          onPress={!uploading ? onClose : undefined}
        />
        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          style={[uploadStyles.sheet, { backgroundColor: cardBg, maxHeight: '92%' }]}
        >
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={[uploadStyles.handle, { backgroundColor: theme.outlineVariant }]} />

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={[uploadStyles.headerIcon, { backgroundColor: theme.primaryContainer }]}>
                <MaterialIcons name="video-call" size={18} color={theme.primary} />
              </View>
              <Text style={{ color: theme.onSurface, fontSize: 16, fontWeight: '700', marginLeft: 10 }}>
                Upload Property Reel
              </Text>
            </View>

            {/* Video Picker */}
            <Pressable
              onPress={pickVideo}
              style={[
                uploadStyles.pickerRow,
                {
                  borderColor: video ? theme.primary : theme.outlineVariant,
                  backgroundColor: isDark ? theme.surfaceContainerLow : theme.surfaceContainerLowest,
                },
              ]}
            >
              <View
                style={[
                  uploadStyles.pickerIconBox,
                  {
                    backgroundColor: video
                      ? theme.primaryContainer
                      : (isDark ? theme.surfaceContainerHigh : theme.surfaceContainerLow),
                  },
                ]}
              >
                <MaterialIcons
                  name={video ? 'check-circle' : 'upload-file'}
                  size={20}
                  color={video ? theme.primary : theme.onSurfaceVariant}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text
                  style={{ color: video ? theme.primary : theme.onSurface, fontSize: 13, fontWeight: '600' }}
                  numberOfLines={1}
                >
                  {video ? (video.fileName ?? video.uri.split('/').pop()) : 'Choose video file *'}
                </Text>
                <Text style={{ color: theme.onSurfaceVariant, fontSize: 11, marginTop: 2 }}>
                  {video ? 'Tap to replace file' : 'MP4, MOV · up to 200 MB'}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={theme.onSurfaceVariant} />
            </Pressable>

            {/* Live Reel Cover Picture Preview & Selection */}
            <View style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={[uploadStyles.label, { color: theme.onSurfaceVariant, marginBottom: 0 }]}>
                  Reel Cover Picture *
                </Text>
                <TouchableOpacity onPress={pickCoverImage} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialIcons name="photo-library" size={14} color={theme.primary} />
                  <Text style={{ color: theme.primary, fontSize: 11.5, fontWeight: '700' }}>
                    {coverAsset ? 'Change Custom' : 'Upload Custom Photo'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Cover Preview Card */}
              <View style={[uploadStyles.coverPreviewCard, { borderColor: theme.outlineVariant }]}>
                <Image
                  source={{ uri: currentCoverUri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.8)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={uploadStyles.coverPreviewBadge}>
                  <MaterialIcons name="person" size={12} color="#000" />
                  <Text style={{ color: '#000', fontSize: 10, fontWeight: '800' }}>
                    {authorName.trim() || user?.fullName || 'CREATOR'}
                  </Text>
                </View>

                <View style={uploadStyles.coverPreviewBottom}>
                  <Text style={uploadStyles.coverPreviewTitle} numberOfLines={1}>
                    {title.trim() || 'Property Reel Preview'}
                  </Text>
                  <Text style={uploadStyles.coverPreviewSubtitle} numberOfLines={1}>
                    {location.trim() || 'Location'} · {authorName.trim() || user?.fullName || 'Boolok Member'}
                  </Text>
                </View>
              </View>

              {/* Architectural Presets */}
              <Text style={{ color: theme.onSurfaceVariant, fontSize: 11, marginTop: 8, marginBottom: 6 }}>
                Or tap a distinct architectural cover:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {PROPERTY_COVER_PRESETS.map((preset) => {
                  const isSelected = !coverAsset && selectedPresetUrl === preset.url;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      onPress={() => {
                        setCoverAsset(null);
                        setSelectedPresetUrl(preset.url);
                      }}
                      activeOpacity={0.8}
                      style={[
                        uploadStyles.presetChip,
                        {
                          borderColor: isSelected ? theme.primary : theme.outlineVariant,
                          backgroundColor: isSelected ? 'rgba(249, 192, 61, 0.15)' : 'transparent',
                        },
                      ]}
                    >
                      <Image source={{ uri: preset.url }} style={uploadStyles.presetMiniImg} />
                      <Text
                        style={{
                          color: isSelected ? theme.primary : theme.onSurface,
                          fontSize: 11.5,
                          fontWeight: isSelected ? '700' : '500',
                          marginLeft: 6,
                        }}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Creator / Broker Name Input */}
            <View style={{ marginTop: 14 }}>
              <Text style={[uploadStyles.label, { color: theme.onSurfaceVariant }]}>
                Creator / Broker Name *
              </Text>
              <TextInput
                value={authorName}
                onChangeText={setAuthorName}
                placeholder="Your full name or brokerage name"
                placeholderTextColor={theme.onSurfaceVariant}
                style={[
                  uploadStyles.input,
                  {
                    color: theme.onSurface,
                    borderColor: theme.outlineVariant,
                    backgroundColor: isDark ? theme.surfaceContainerLow : theme.surfaceContainerLowest,
                  },
                ]}
              />
            </View>

            {/* Title & Location Inputs */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <View style={{ flex: 3 }}>
                <Text style={[uploadStyles.label, { color: theme.onSurfaceVariant }]}>Property Name / Title *</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Modern Sunset Penthouse"
                  placeholderTextColor={theme.onSurfaceVariant}
                  style={[
                    uploadStyles.input,
                    {
                      color: theme.onSurface,
                      borderColor: theme.outlineVariant,
                      backgroundColor: isDark ? theme.surfaceContainerLow : theme.surfaceContainerLowest,
                    },
                  ]}
                />
              </View>
              <View style={{ flex: 2 }}>
                <Text style={[uploadStyles.label, { color: theme.onSurfaceVariant }]}>Location</Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="City, Country"
                  placeholderTextColor={theme.onSurfaceVariant}
                  style={[
                    uploadStyles.input,
                    {
                      color: theme.onSurface,
                      borderColor: theme.outlineVariant,
                      backgroundColor: isDark ? theme.surfaceContainerLow : theme.surfaceContainerLowest,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Caption & Insights */}
            <View style={{ marginTop: 12, marginBottom: 16 }}>
              <Text style={[uploadStyles.label, { color: theme.onSurfaceVariant }]}>Caption / Property Insights</Text>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Market metrics, zoning, expected ROI, key architectural details…"
                placeholderTextColor={theme.onSurfaceVariant}
                multiline
                numberOfLines={3}
                style={[
                  uploadStyles.input,
                  {
                    minHeight: 64,
                    textAlignVertical: 'top',
                    color: theme.onSurface,
                    borderColor: theme.outlineVariant,
                    backgroundColor: isDark ? theme.surfaceContainerLow : theme.surfaceContainerLowest,
                  },
                ]}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <Pressable
                onPress={onClose}
                disabled={uploading}
                style={[uploadStyles.btn, { flex: 1, borderWidth: 1, borderColor: theme.outlineVariant }]}
              >
                <Text style={{ color: theme.onSurfaceVariant, fontSize: 13, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleUpload}
                disabled={uploading}
                style={[uploadStyles.btn, { flex: 2, backgroundColor: theme.primary }]}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={theme.onPrimary} />
                ) : (
                  <Text style={{ color: theme.onPrimary, fontSize: 13, fontWeight: '700' }}>Upload Reel</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>

          {/* ── Luxury Animated Uploading Overlay ── */}
          {uploading && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: isDark ? 'rgba(6, 11, 19, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                  borderRadius: 20,
                  zIndex: 9999,
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 24,
                },
              ]}
            >
              {/* Glowing Outer Ring */}
              <View
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: 43,
                  borderWidth: 3,
                  borderColor: 'rgba(218, 165, 32, 0.25)',
                  borderTopColor: theme.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 18,
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                }}
              >
                <ActivityIndicator size="large" color={theme.primary} />
              </View>

              {/* Status Heading */}
              <Text
                style={{
                  color: theme.onSurface,
                  fontSize: 16,
                  fontWeight: '800',
                  letterSpacing: 0.5,
                  marginBottom: 6,
                  textAlign: 'center',
                }}
              >
                {uploadStageText}
              </Text>

              <Text
                style={{
                  color: theme.onSurfaceVariant,
                  fontSize: 12,
                  marginBottom: 20,
                  textAlign: 'center',
                }}
              >
                Encoding reel and synchronizing property data...
              </Text>

              {/* Animated Progress Bar */}
              <View
                style={{
                  width: '82%',
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  overflow: 'hidden',
                  marginBottom: 10,
                }}
              >
                <View
                  style={{
                    height: '100%',
                    width: `${uploadProgress}%`,
                    backgroundColor: theme.primary,
                    borderRadius: 3,
                  }}
                />
              </View>

              <Text
                style={{
                  color: theme.primary,
                  fontSize: 13,
                  fontWeight: '800',
                  letterSpacing: 1,
                }}
              >
                {Math.round(uploadProgress)}%
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function InsightsScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768; // Standard responsive breakpoint
  const initialMobileHeight = Math.max(320, height - (120 + insets.top + insets.bottom));
  const [listHeight, setListHeight] = useState(initialMobileHeight);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  // Initialize strictly with real uploaded reels
  const [videos, setVideos] = useState<any[]>(() => {
    return getLocalUploadedReels().filter((r: any) => isEligibleReelRecord(r));
  });

  const [showUpload, setShowUpload] = useState(false);
  const [reelsLoading, setReelsLoading] = useState(true);
  const [reelsError, setReelsError] = useState<string | null>(null);
  const reelsReqRef = useRef(0);
  const flatListRef = useRef<FlatList>(null);

  // Pause everything (and silence audio) when leaving the tab, backgrounding the app,
  // or opening the upload sheet.
  const [screenFocused, setScreenFocused] = useState(true);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      return () => setScreenFocused(false);
    }, [])
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => setAppActive(st === 'active'));
    return () => sub.remove();
  }, []);
  const canPlay = screenFocused && appActive && !showUpload;

  // Layout sizing
  const cardHeight = isMobile
    ? (listHeight > 200 ? listHeight : initialMobileHeight)
    : Math.max(420, Math.min(height - 170, 620));
  const cardWidth = isMobile ? width : Math.min(370, Math.round(cardHeight * 0.58));

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0 && typeof viewableItems[0].index === 'number') {
      setActiveVideoIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    waitForInteraction: false,
  }).current;

  // Load backend reels on mount
  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    const reqId = ++reelsReqRef.current;
    setReelsLoading(true);
    setReelsError(null);
    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');

      const response = await getWithColdStartRetry(`${API_BASE_URL}/api/reels?limit=100`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      // A newer fetch started while this one was pending: discard this stale result.
      if (reqId !== reelsReqRef.current) return;

      const localReels = getLocalUploadedReels();

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const seenReelIds = new Set<string>();
        const eligibleRawReels = response.data.filter((r: any) => {
          if (!isEligibleReelRecord(r)) return false;
          const rid = String(r._id || r.id || '').trim();
          if (!rid || seenReelIds.has(rid)) return false;
          seenReelIds.add(rid);
          return true;
        });

        const dbReels = eligibleRawReels.map((r: any) => {
          const cleanPrice =
            r.price !== undefined &&
            r.price !== null &&
            String(r.price).trim() !== '' &&
            String(r.price).trim().toLowerCase() !== 'undefined' &&
            String(r.price).trim().toLowerCase() !== 'null'
              ? String(r.price).trim()
              : (r.title || '').toLowerCase().includes('coventry')
              ? '£12,242,788'
              : '';
          return {
            _id: r._id,
            title: r.title || r.caption || 'Untitled',
            location: r.location || '',
            authorName: r.authorName || r.author?.fullName || '',
            caption: r.caption || '',
            price: cleanPrice,
            aiMatch: typeof r.aiMatch === 'number' ? r.aiMatch : null,
            insight: (r.insight || r.caption || '').replace(/(?:\$16)?,500,000\./g, '£12,242,788.'),
            likes: r.likesCount ?? (Array.isArray(r.likes) ? r.likes.length : 0),
            likesCount: r.likesCount ?? (Array.isArray(r.likes) ? r.likes.length : 0),
            isLiked: Boolean(r.isLiked),
            comments: Array.isArray(r.comments) ? r.comments : [],
            commentsCount: Array.isArray(r.comments) ? r.comments.length : 0,
            author: {
              _id: r.author?._id || r.author?.id || null,
              fullName: r.authorName || r.author?.fullName || 'Boolok Member',
              username: r.author?.username || 'member',
              profilePicture: r.author?.profilePicture || null,
              isVerified: true,
            },
            poster: r.poster || r.thumbnail || resolveCoverUrl(r),
            thumbnail: r.thumbnail || r.poster || resolveCoverUrl(r),
            videoUrl: r.videoUrl,
            music: 'Boolok AI · Market Verification Audio',
            createdAt: r.createdAt,
          };
        });

        // Server is the source of truth. Old behaviour merged stale localStorage copies on
        // top, which resurrected deleted reels and kept dead video URLs / old like counts.
        setVideos(dbReels);
        if (Platform.OS === 'web') {
          try {
            const ids = new Set(dbReels.map((r: any) => r._id));
            localStorage.setItem(
              'boolok_user_uploaded_reels',
              JSON.stringify(localReels.filter((r: any) => ids.has(r._id)))
            );
          } catch (_) {}
        }
      } else {
        setVideos([]);
        if (Platform.OS === 'web') {
          try {
            localStorage.setItem('boolok_user_uploaded_reels', JSON.stringify([]));
          } catch (_) {}
        }
      }

      // Sync following set directly from MongoDB database
      if (token) {
        try {
          const followRes = await axios.get(`${API_BASE_URL}/api/users/self/following`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (followRes.data && Array.isArray(followRes.data.following)) {
            const dbFollowMap: Record<string, boolean> = {};
            followRes.data.following.forEach((f: any) => {
              if (!f) return;
              if (f.id) dbFollowMap[f.id] = true;
              if (f._id) dbFollowMap[f._id] = true;
              if (f.username) {
                dbFollowMap[f.username] = true;
                dbFollowMap[f.username.toLowerCase()] = true;
              }
            });
            if (Platform.OS === 'web') {
              localStorage.setItem('boolok_following_users_set', JSON.stringify(dbFollowMap));
            } else {
              await SecureStore.setItemAsync('boolok_following_users_set', JSON.stringify(dbFollowMap));
            }
          }
        } catch (_) {}
      }
    } catch (err: any) {
      if (reqId !== reelsReqRef.current) return;
      // A failed request is NOT "no reels": keep loaded reels and show an error + retry.
      console.warn('Could not load reels from server.', err?.message);
      const status = err?.response?.status;
      setReelsError(
        status
          ? `The server responded with an error (HTTP ${status}).`
          : 'Could not reach the server. Please check your connection.'
      );
    } finally {
      if (reqId === reelsReqRef.current) setReelsLoading(false);
    }
  };

  const handleUploaded = (newReel: any) => {
    const chosenPoster = newReel.poster || newReel.thumbnail || resolveCoverUrl(newReel);
    const authorDisplayName = newReel.authorName || newReel.author?.fullName || user?.fullName || 'You';
    const mapped = {
      _id: newReel._id || `reel-${Date.now()}`,
      title: newReel.title || 'Untitled Property Reel',
      location: newReel.location || 'Verified Property',
      authorName: authorDisplayName,
      caption: newReel.caption || '',
      price: newReel.price !== undefined && newReel.price !== null ? String(newReel.price).trim() : '',
      aiMatch: typeof newReel.aiMatch === 'number' ? newReel.aiMatch : null,
      insight: newReel.insight || newReel.caption || '',
      likes: newReel.likesCount ?? 0,
      likesCount: newReel.likesCount ?? 0,
      isLiked: false,
      comments: Array.isArray(newReel.comments) ? newReel.comments : [],
      commentsCount: Array.isArray(newReel.comments) ? newReel.comments.length : 0,
      author: {
        _id: user?.id || user?._id || 'you',
        fullName: authorDisplayName,
        username: user?.username || 'you',
        profilePicture: user?.profilePicture || null,
        isVerified: true,
      },
      poster: chosenPoster,
      thumbnail: chosenPoster,
      videoUrl: newReel.videoUrl,
      music: 'Boolok AI · User Uploaded Property Radar',
      createdAt: newReel.createdAt || new Date().toISOString(),
    };

    saveLocalUploadedReel(mapped);

    // Immediately put the uploaded reel at index 0 on the main page
    setVideos((prev) => [mapped, ...prev.filter((v) => v._id !== mapped._id)]);
    setActiveVideoIndex(0);

    // Scroll to the uploaded reel instantly so the user sees it on the main page
    setTimeout(() => {
      try {
        flatListRef.current?.scrollToIndex({ index: 0, animated: true });
      } catch (_) {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    }, 120);
  };

  const handleDelete = async (reelId: string) => {
    // 1. Immediately remove from local state so UI updates with zero delay
    setVideos((prev) => prev.filter((v) => v._id !== reelId && v.id !== reelId));

    try {
      if (Platform.OS === 'web') {
        const local = getLocalUploadedReels().filter((r: any) => r._id !== reelId && r.id !== reelId);
        localStorage.setItem('boolok_user_uploaded_reels', JSON.stringify(local));
      }
    } catch (_) {}

    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');

      if (token && reelId && !['1', '2', '3', '4'].includes(reelId)) {
        await axios.delete(`${API_BASE_URL}/api/reels/${reelId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err: any) {
      console.warn('Backend delete info:', err?.response?.data?.message || err.message);
    }
  };

  // Scroll to Next / Previous Reel (for desktop click & keyboard)
  const scrollToNext = useCallback(() => {
    if (activeVideoIndex < videos.length - 1) {
      const nextIdx = activeVideoIndex + 1;
      setActiveVideoIndex(nextIdx);
      try {
        flatListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
      } catch (_) {
        const itemH = cardHeight + 20;
        flatListRef.current?.scrollToOffset({ offset: nextIdx * itemH, animated: true });
      }
    }
  }, [activeVideoIndex, videos.length, cardHeight]);

  const scrollToPrev = useCallback(() => {
    if (activeVideoIndex > 0) {
      const prevIdx = activeVideoIndex - 1;
      setActiveVideoIndex(prevIdx);
      try {
        flatListRef.current?.scrollToIndex({ index: prevIdx, animated: true });
      } catch (_) {
        const itemH = cardHeight + 20;
        flatListRef.current?.scrollToOffset({ offset: prevIdx * itemH, animated: true });
      }
    }
  }, [activeVideoIndex, cardHeight]);

  // Desktop keyboard & mouse wheel navigation on Web
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let isWheelThrottled = false;
    const handleWheel = (e: WheelEvent) => {
      // Never intercept wheel events if the user is on any other screen
      if (typeof window !== 'undefined' && !window.location.pathname.includes('insights')) {
        return;
      }

      // Don't intercept if inside comments, search, or inputs
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('input, textarea, [data-scrollable="true"]')) return;
      if (Math.abs(e.deltaY) < 30) return; // Ignore slight trackpad jitter

      e.preventDefault();
      if (isWheelThrottled) return;
      isWheelThrottled = true;

      if (e.deltaY > 0) {
        scrollToNext();
      } else {
        scrollToPrev();
      }

      setTimeout(() => {
        isWheelThrottled = false;
      }, 400);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('insights')) {
        return;
      }

      // Ignore when user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as any)?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        scrollToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        scrollToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [scrollToNext, scrollToPrev]);

  const renderEmptyReels = () => reelsLoading ? (
    <View style={{ flex: 1, minHeight: Math.max(340, cardHeight * 0.7), justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  ) : reelsError ? (
    <View style={{ flex: 1, minHeight: Math.max(340, cardHeight * 0.7), justifyContent: 'center', alignItems: 'center', padding: 28 }}>
      <Text style={{ color: theme.onSurface, fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center' }}>
        Couldn't load property reels
      </Text>
      <Text style={{ color: theme.onSurfaceVariant, fontSize: 13, textAlign: 'center', maxWidth: 320, lineHeight: 18, marginBottom: 22 }}>
        {reelsError}
      </Text>
      <TouchableOpacity
        onPress={fetchReels}
        style={{ backgroundColor: theme.primary, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 24 }}
      >
        <Text style={{ color: '#000000', fontSize: 13, fontWeight: '800' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View
      style={{
        flex: 1,
        minHeight: Math.max(340, cardHeight * 0.7),
        justifyContent: 'center',
        alignItems: 'center',
        padding: 28,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: 'rgba(249, 192, 61, 0.12)',
          borderWidth: 1.5,
          borderColor: 'rgba(249, 192, 61, 0.3)',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <MaterialIcons name="video-library" size={36} color={theme.primary} />
      </View>
      <Text style={{ color: theme.onSurface, fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center' }}>
        No Property Reels Yet
      </Text>
      <Text style={{ color: theme.onSurfaceVariant, fontSize: 13, textAlign: 'center', maxWidth: 320, lineHeight: 18, marginBottom: 22 }}>
        Upload property tours, commercial walkthroughs, or architectural reels to start streaming.
      </Text>
      <TouchableOpacity
        onPress={() => setShowUpload(true)}
        style={{
          backgroundColor: theme.primary,
          paddingHorizontal: 22,
          paddingVertical: 11,
          borderRadius: 24,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <MaterialIcons name="video-call" size={20} color="#000000" />
        <Text style={{ color: '#000000', fontSize: 13, fontWeight: '800' }}>Upload First Reel</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: isMobile ? '#000000' : (isDark ? '#0b0f17' : theme.background) },
      ]}
      entering={FadeIn.duration(300)}
    >
      {isMobile ? (
        // ── MOBILE VIEW: Full bleed reels feed with unified non-colliding overlays ──
        <View
          style={{ flex: 1, width: '100%' }}
          onLayout={(e) => {
            const h = Math.round(e.nativeEvent.layout.height);
            if (h > 200 && Math.abs(h - listHeight) > 6) {
              setListHeight(h);
            }
          }}
        >
          <FlatList
            ref={flatListRef}
            data={videos}
            style={{ flex: 1, width: '100%' }}
            contentContainerStyle={{ flexGrow: 1 }}
            renderItem={({ item, index }) => (
              <VideoItem
                item={item}
                isActive={canPlay && activeVideoIndex === index}
                cardHeight={cardHeight}
                cardWidth={cardWidth}
                isMobile={true}
                onDelete={handleDelete}
                onOpenUpload={() => setShowUpload(true)}
              />
            )}
            keyExtractor={(item) => item._id}
            extraData={`${activeVideoIndex}-${canPlay}`}
            onScrollToIndexFailed={(info) => {
              flatListRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: true,
              });
            }}
            ListEmptyComponent={renderEmptyReels}
            pagingEnabled={Platform.OS === 'ios'}
            snapToInterval={cardHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum={true}
            bounces={false}
            overScrollMode="never"
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            windowSize={3}
            maxToRenderPerBatch={2}
            initialNumToRender={2}
            removeClippedSubviews={false}
            getItemLayout={cardHeight > 100 ? (_, index) => ({
              length: cardHeight,
              offset: cardHeight * index,
              index,
            }) : undefined}
          />
        </View>
      ) : (
        // ── COMPUTER / DESKTOP VIEW: Luxury centered player with sidebar & controls ──
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            {/* Desktop Top Header */}
            <View style={styles.desktopHeader}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[typography.headlineLg, { color: theme.onSurface, fontWeight: '800' }]}>
                    Market Insights
                  </Text>
                  <View style={[styles.liveBadge, { backgroundColor: 'rgba(249, 192, 61, 0.15)', borderColor: theme.primary }]}>
                    <View style={[styles.liveDot, { backgroundColor: theme.primary }]} />
                    <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '800' }}>LIVE RADAR</Text>
                  </View>
                </View>
                <Text style={[typography.bodyMd, { color: theme.onSurfaceVariant, marginTop: 4 }]}>
                  High-yield commercial drone tours and AI-verified land acquisitions.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowUpload(true)}
                style={[styles.desktopUploadBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.8}
              >
                <MaterialIcons name="video-call" size={20} color="#000000" />
                <Text style={{ color: '#000000', fontSize: 13, fontWeight: '800', marginLeft: 6 }}>
                  Upload Property Reel
                </Text>
              </TouchableOpacity>
            </View>

            {/* Desktop Reel Frame & Side Navigation Controls */}
            <View style={styles.desktopPlayerArea}>
              <FlatList
                ref={flatListRef}
                data={videos}
                renderItem={({ item, index }) => (
                  <VideoItem
                    item={item}
                    isActive={canPlay && activeVideoIndex === index}
                    cardHeight={cardHeight}
                    cardWidth={cardWidth}
                    isMobile={false}
                    onDelete={handleDelete}
                    onOpenUpload={() => setShowUpload(true)}
                  />
                )}
                keyExtractor={(item) => item._id}
                extraData={`${activeVideoIndex}-${canPlay}`}
                onScrollToIndexFailed={(info) => {
                  flatListRef.current?.scrollToOffset({
                    offset: info.averageItemLength * info.index,
                    animated: true,
                  });
                }}
                ListEmptyComponent={renderEmptyReels}
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                contentContainerStyle={{ alignItems: 'center', paddingVertical: 8 }}
                snapToInterval={cardHeight + 20}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum={true}
                bounces={false}
                overScrollMode="never"
                windowSize={3}
                maxToRenderPerBatch={2}
                initialNumToRender={2}
                getItemLayout={(_, index) => ({
                  length: cardHeight + 20,
                  offset: (cardHeight + 20) * index,
                  index,
                })}
              />

              {/* Desktop Up / Down Float Navigation Rail */}
              <View style={styles.desktopNavRail}>
                <TouchableOpacity
                  onPress={scrollToPrev}
                  disabled={activeVideoIndex === 0}
                  style={[
                    styles.desktopNavBtn,
                    activeVideoIndex === 0 && { opacity: 0.3 },
                  ]}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="keyboard-arrow-up" size={26} color="#ffffff" />
                </TouchableOpacity>

                <View style={styles.desktopCounterBadge}>
                  <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '800' }}>
                    {activeVideoIndex + 1}
                  </Text>
                  <Text style={{ color: '#64748b', fontSize: 10 }}>/</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 11 }}>
                    {videos.length}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={scrollToNext}
                  disabled={activeVideoIndex === videos.length - 1}
                  style={[
                    styles.desktopNavBtn,
                    activeVideoIndex === videos.length - 1 && { opacity: 0.3 },
                  ]}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="keyboard-arrow-down" size={26} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Market Intelligence Sidebar on wide desktop */}
          <MarketIntelligenceSidebar theme={theme} isDark={isDark} videos={videos} />
        </View>
      )}

      {/* Upload Reel Modal */}
      <UploadModal
        visible={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={handleUploaded}
        theme={theme}
        isDark={isDark}
        user={user}
      />
    </Animated.View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Mobile Top Bar
  mobileTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  mobileTopTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: 6,
  },
  mobileUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  // Desktop Header
  desktopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 14,
    paddingBottom: 8,
    width: '100%',
    maxWidth: 900,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  desktopUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  desktopPlayerArea: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  desktopNavRail: {
    position: 'absolute',
    right: 28,
    top: '40%',
    transform: [{ translateY: -60 }],
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 6,
    alignItems: 'center',
    gap: 8,
    zIndex: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  desktopNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopCounterBadge: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  // Video Card Container
  videoContainer: {
    backgroundColor: '#0a0e17',
    overflow: 'hidden',
    alignSelf: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 10,
  },
  playIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(249, 192, 61, 0.6)',
  },
  heartBurstContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25,
  },
  heartBurstGlow: {
    shadowColor: '#ff2d55',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
  },
  // Top Overlay
  topOverlay: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(249, 192, 61, 0.4)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  aiMatchText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  soundBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
  topUploadBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 2,
  },
  // Right Social Rail
  rightOverlay: {
    position: 'absolute',
    right: 8,
    zIndex: 30,
    alignItems: 'center',
    width: 58,
  },
  creatorRailItem: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 12,
  },
  creatorAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorAvatarImg: {
    width: '100%',
    height: '100%',
  },
  creatorAvatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniFollowPlus: {
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  actionBtn: {
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 2,
  },
  actionIconContainerLiked: {
    backgroundColor: 'rgba(255, 45, 85, 0.25)',
    borderColor: '#ff2d55',
  },
  actionIconContainerSaved: {
    backgroundColor: 'rgba(249, 192, 61, 0.25)',
    borderColor: '#f9c03d',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Bottom Overlay
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingLeft: 14,
    paddingRight: 74,
    paddingTop: 24,
    zIndex: 15,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  authorProfileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    flexWrap: 'wrap',
    marginRight: 4,
  },
  authorNameText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 0,
  },
  authorHandleText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 4,
    flexShrink: 1,
  },
  authorFollowBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    flexShrink: 0,
  },
  authorFollowBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  insightContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(249, 192, 61, 0.35)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    maxWidth: '100%',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  insightTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 5,
    letterSpacing: 0.5,
  },
  insightText: {
    color: '#e2e8f0',
    fontSize: 12.5,
    lineHeight: 17,
  },
  musicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  musicText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '500',
    maxWidth: 240,
  },
  // Modal Backdrops
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Custom Delete Dialog
  deleteDialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 24,
    alignItems: 'center',
  },
  deleteDialogIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  deleteDialogTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  deleteDialogDesc: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  deleteDialogBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  deleteDialogCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteDialogCancelText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteDialogConfirmBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteDialogConfirmText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  // Share Card
  shareCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 22,
  },
  shareCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 12,
  },
  shareContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#162033',
    borderRadius: 14,
    marginBottom: 8,
  },
  shareAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  shareAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareSendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  // Comments Sheet
  commentsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  commentsSheet: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#0c1322',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    alignSelf: 'center',
    marginBottom: 12,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  emptyCommentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  commentAvatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  commentAvatarImg: {
    width: 36,
    height: 36,
  },
  commentAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentContentBox: {
    flex: 1,
    backgroundColor: '#162033',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  commentUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  commentUserName: {
    fontSize: 13,
    fontWeight: '700',
  },
  commentTime: {
    color: '#64748b',
    fontSize: 11,
  },
  commentText: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 18,
  },
  commentInputContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  myCommentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  myCommentAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInputField: {
    flex: 1,
    backgroundColor: '#162033',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13.5,
  },
  commentSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Market Intelligence Sidebar
  sidebar: {
    width: 300,
    borderLeftWidth: 1,
    padding: 16,
  },
  sidebarCollapsed: {
    width: 72,
    borderLeftWidth: 1,
    paddingTop: 28,
    alignItems: 'center',
  },
  miCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  miBotIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miLocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  miLocationIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miProgressBarBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  miProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});

// ── Upload modal styles ───────────────────────────────────────────────────────
const uploadStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
  },
  handle: {
    width: 34,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  btn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPreviewCard: {
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    justifyContent: 'space-between',
    padding: 10,
    marginTop: 4,
  },
  coverPreviewBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f9c03d',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  coverPreviewBottom: {
    width: '100%',
  },
  coverPreviewTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  coverPreviewSubtitle: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetMiniImg: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
});