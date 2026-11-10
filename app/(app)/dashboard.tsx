import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Image,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import axios from 'axios';
import { API_BASE_URL, resolveImageUrl } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import LoadingScreen from '../../components/LoadingScreen';
import Avatar from '../../components/Avatar';
import FollowButton from '../../components/FollowButton';

interface PropertyListing {
  _id: string;
  title: string;
  price?: string;
  location?: string;
  specs?: string;
  content?: string;
  mediaUrl?: string;
  image?: string;
  author?: {
    _id: string;
    fullName: string;
    username: string;
    profilePicture?: string | null;
    headline?: string;
    location?: string;
  };
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
}

const FEATURED_STORIES = [
  { id: 'create', type: 'create', label: 'Create Story' },
  { id: 'shreekutti', username: 'shreekutti', name: 'Shreekutti', role: 'Commercial Lead', unread: true },
  { id: 'logeshwarana', username: 'logeshwarana', name: 'Logeshwaran', role: 'Architectural Consultant', unread: true },
  { id: 'subasree', username: 'subasree', name: 'Subasree', role: 'Luxury Estates', unread: true },
  { id: 'ajmal', username: 'ajmal', name: 'Ajmal', role: 'Prime Waterfront', unread: false },
  { id: 'the_akshtr_estate', username: 'the_akshtr_estate', name: 'Akshat', role: 'IT Corridors', unread: false },
];

export default function DashboardScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Buy' | 'Rent' | 'Commercial' | 'Land'>('All');
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});

  const bgCanvas = isDark ? theme.background : '#F8FAFC';
  const cardBg = isDark ? theme.surface : '#FFFFFF';
  const borderCol = isDark ? theme.outlineVariant : '#E2E8F0';
  const textPrimary = theme.onSurface;
  const textSecondary = theme.onSurfaceVariant;
  const textMuted = theme.outline;
  const goldPrimary = theme.primary;

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/feed`);
      if (res.data && Array.isArray(res.data.posts)) {
        // Filter out duplicate or static shadow posts if real DB posts exist
        const seenAuthors = new Set<string>();
        const seenTitles = new Set<string>();
        const deduplicated: any[] = [];

        // DB posts have 24-character hexadecimal IDs; prioritize them
        const sortedPosts = [...res.data.posts].sort((a, b) => {
          const aIsDb = /^[0-9a-fA-F]{24}$/.test(a._id);
          const bIsDb = /^[0-9a-fA-F]{24}$/.test(b._id);
          if (aIsDb && !bIsDb) return -1;
          if (!aIsDb && bIsDb) return 1;
          return 0;
        });

        for (const p of sortedPosts) {
          const authorUser = (p.author?.username || p.author?._id || '').toLowerCase();
          const cleanTitle = (p.title || p.content || '').toLowerCase().trim();
          const isCoventry = cleanTitle.includes('coventry');

          // If this is a static community post (like sai-p-1) and we already have a real Coventry or author post, skip it
          if (isCoventry && seenTitles.has('coventry')) {
            continue;
          }
          if (authorUser && seenAuthors.has(authorUser) && !/^[0-9a-fA-F]{24}$/.test(p._id)) {
            continue;
          }

          if (isCoventry) {
            seenTitles.add('coventry');
          }
          if (authorUser) {
            seenAuthors.add(authorUser);
          }

          deduplicated.push(
            isCoventry
              ? {
                  ...p,
                  mediaUrl: '/coventry_corporate.jpg',
                  image: '/coventry_corporate.jpg',
                }
              : p
          );
        }

        setProperties(deduplicated);
      }
    } catch (err) {
      console.error('Failed to load properties for dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    router.push({
      pathname: '/(app)/search',
      params: { q: searchQuery.trim(), filter: selectedCategory },
    } as any);
  };

  const toggleSave = (id: string) => {
    setSavedPosts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(400)}>
      <ScrollView
        style={[styles.container, { backgroundColor: bgCanvas }]}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingHorizontal: isWide ? spacing.xl : 14, paddingTop: 16, paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TOP HERO SEARCH HUB (Reference Screenshot 3 Layout) ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroSection}>
          <View style={[styles.searchBarContainer, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <MaterialIcons name="search" size={22} color={goldPrimary} style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder="Search apartments, villas, commercial campuses..."
              placeholderTextColor={textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} style={{ padding: 4, marginRight: 6 }}>
                <MaterialIcons name="close" size={18} color={textMuted} />
              </Pressable>
            )}
            <Pressable
              onPress={handleSearchSubmit}
              style={({ pressed }: any) => [styles.searchActionBtn, { backgroundColor: goldPrimary }, pressed && { opacity: 0.85 }]}
            >
              <Text style={[styles.searchActionBtnText, { color: '#0B0F19' }]}>Search</Text>
            </Pressable>
          </View>

          {/* Category Filter Pills (All / Buy / Rent / Commercial / Land) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPillsScroll} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
            {(['All', 'Buy', 'Rent', 'Commercial', 'Land'] as const).map((cat) => {
              const active = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.categoryPill,
                    { backgroundColor: active ? goldPrimary : cardBg, borderColor: active ? goldPrimary : borderCol }
                  ]}
                >
                  <Text style={[styles.categoryPillText, { color: active ? '#0B0F19' : textSecondary }, active && { fontWeight: '800' }]}>{cat}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── STORIES / FEATURED ACCOUNTS ROW (Screenshot 3) ── */}
        <View style={styles.storiesSection}>
          <Text style={[styles.sectionHeaderTitle, { color: textMuted }]}>FEATURED REAL ESTATE NETWORK</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesContainer}>
            {/* Create Story slot */}
            <Pressable
              onPress={() => router.push('/(app)/create-post')}
              style={styles.storyCard}
            >
              <View style={[styles.createStoryRing, { borderColor: borderCol }]}>
                <Avatar user={user} size={50} />
                <View style={[styles.createPlusBadge, { backgroundColor: goldPrimary, borderColor: cardBg }]}>
                  <MaterialIcons name="add" size={14} color="#0B0F19" />
                </View>
              </View>
              <Text style={[styles.storyLabel, { color: textSecondary }]} numberOfLines={1}>Your Post</Text>
            </Pressable>

            {/* Other Advisors Stories (never displays current user as a suggested third-party) */}
            {FEATURED_STORIES.filter((s) => s.type !== 'create' && s.username !== user?.username).map((st) => (
              <Pressable
                key={st.id}
                onPress={() => router.push({ pathname: '/(app)/profile', params: { id: st.username } } as any)}
                style={styles.storyCard}
              >
                <View style={[styles.storyAvatarRing, st.unread && { borderColor: goldPrimary }]}>
                  <Avatar user={{ fullName: st.name, username: st.username }} size={50} />
                </View>
                <Text style={[styles.storyLabel, { color: textSecondary }]} numberOfLines={1}>{st.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── FEATURED REAL ESTATE PROPERTIES FEED (Screenshot 3) ── */}
        <View style={styles.feedHeaderRow}>
          <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
            <Text style={[styles.feedHeading, { color: textPrimary }]}>Top Verified Listings</Text>
            <Text style={[styles.feedSubheading, { color: textMuted }]}>Direct from authenticated institutional brokers and architects</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/search')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}
          >
            <Text style={{ color: goldPrimary, fontSize: 13, fontWeight: '700' }}>Explore All</Text>
            <MaterialIcons name="arrow-forward" size={16} color={goldPrimary} />
          </Pressable>
        </View>

        {/* Property Grid */}
        <View style={[styles.propertyGrid, isWide && styles.propertyGridWide]}>
          {properties.map((prop, idx) => {
            const author = prop.author || {
              _id: 'member',
              fullName: 'Institutional Partner',
              username: 'member',
              headline: 'Prime Assets',
            };
            const isSaved = Boolean(savedPosts[prop._id]);

            return (
              <Animated.View
                key={prop._id}
                entering={FadeInDown.delay(idx * 70).duration(350)}
                style={[
                  styles.propertyCard,
                  { backgroundColor: cardBg, borderColor: borderCol },
                  isWide ? { width: 'calc(50% - 10px)' as any } : { width: '100%' },
                ]}
              >
                {/* Property Image Header with Verified badge & Save Icon */}
                <View style={styles.propertyImageWrap}>
                  <Image
                    source={{
                      uri: resolveImageUrl(prop.mediaUrl || prop.image) || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
                    }}
                    style={styles.propertyImage}
                    resizeMode="cover"
                  />
                  <View style={styles.propertyImageOverlay}>
                    <View style={[styles.verifiedBadge, { backgroundColor: goldPrimary }]}>
                      <MaterialIcons name="verified" size={14} color="#0B0F19" style={{ marginRight: 3 }} />
                      <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
                    </View>
                    <Pressable
                      onPress={() => toggleSave(prop._id)}
                      style={[styles.bookmarkCircle, isSaved && { backgroundColor: goldPrimary }]}
                    >
                      <MaterialIcons
                        name={isSaved ? 'bookmark' : 'bookmark-border'}
                        size={18}
                        color={isSaved ? '#0B0F19' : '#FFFFFF'}
                      />
                    </Pressable>
                  </View>

                  {/* Price Tag Overlay */}
                  {Boolean(prop.price) && (
                    <View style={styles.priceTag}>
                      <Text style={styles.priceTagText}>{prop.price}</Text>
                    </View>
                  )}
                </View>

                {/* Property Details Body */}
                <View style={styles.propertyCardBody}>
                  <Text style={[styles.propertyTitle, { color: textPrimary }]} numberOfLines={1}>
                    {prop.title}
                  </Text>

                  {Boolean(prop.location) && (
                    <View style={styles.propertyMetaRow}>
                      <MaterialIcons name="location-on" size={15} color={goldPrimary} style={{ marginRight: 4 }} />
                      <Text style={[styles.propertyLocationText, { color: textSecondary }]} numberOfLines={1}>
                        {prop.location}
                      </Text>
                    </View>
                  )}

                  {Boolean(prop.specs) && (
                    <View style={styles.specsRow}>
                      <Text style={[styles.specsText, { color: textSecondary }]} numberOfLines={1}>
                        {prop.specs}
                      </Text>
                    </View>
                  )}

                  {Boolean(prop.content) && (
                    <Text style={[styles.propertyDescription, { color: textMuted }]} numberOfLines={2}>
                      {prop.content}
                    </Text>
                  )}

                  {/* Broker Attribution Bar & Follow Button */}
                  <View style={[styles.brokerAttributionBar, { borderTopColor: borderCol }]}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/(app)/profile',
                          params: { id: author._id || author.username },
                        } as any)
                      }
                      style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}
                    >
                      <Avatar user={author} size={36} />
                      <View style={{ marginLeft: 8, flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.brokerName, { color: textPrimary }]} numberOfLines={1}>
                            {author.fullName}
                          </Text>
                          <MaterialIcons name="verified" size={13} color={goldPrimary} style={{ marginLeft: 3 }} />
                        </View>
                        <Text style={[styles.brokerRole, { color: textMuted }]} numberOfLines={1}>
                          @{author.username}
                        </Text>
                      </View>
                    </Pressable>

                    <FollowButton
                      targetUserId={author._id}
                      targetUsername={author.username}
                      targetUser={author}
                      size="sm"
                    />
                  </View>

                  {/* Action Row: Like, Comment, Share, Inquire */}
                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/(app)/messages',
                          params: {
                            userId: author._id,
                            username: author.username,
                            fullName: author.fullName,
                          },
                        } as any)
                      }
                      style={[styles.inquireBtn, { backgroundColor: goldPrimary }]}
                    >
                      <MaterialCommunityIcons name="chat-processing-outline" size={16} color="#0B0F19" style={{ marginRight: 6 }} />
                      <Text style={styles.inquireBtnText}>Message Broker</Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/(app)/search',
                          params: { q: prop.title },
                        } as any)
                      }
                      style={[styles.detailsBtn, { backgroundColor: isDark ? '#1A2133' : '#F1F5F9', borderColor: borderCol }]}
                    >
                      <Text style={[styles.detailsBtnText, { color: textSecondary }]}>View Details</Text>
                      <MaterialIcons name="chevron-right" size={16} color={textMuted} />
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>

        {/* ── AI TOOLS WIDGETS STRIP (Bottom of Dashboard) ── */}
        <View style={styles.toolsStrip}>
          <Text style={[styles.sectionHeaderTitle, { color: textMuted }]}>INTELLIGENT SUITE</Text>
          <View style={styles.toolsGrid}>
            <Pressable
              onPress={() => router.push('/(app)/search')}
              style={[styles.toolCard, { backgroundColor: cardBg, borderColor: borderCol }]}
            >
              <View style={[styles.toolIconBox, { backgroundColor: 'rgba(245, 166, 35, 0.12)' }]}>
                <MaterialIcons name="search" size={22} color={goldPrimary} />
              </View>
              <Text style={[styles.toolTitle, { color: textPrimary }]}>AI Search Hub</Text>
              <Text style={[styles.toolSubtitle, { color: textMuted }]}>Deep queries over 40+ databases</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(app)/insights')}
              style={[styles.toolCard, { backgroundColor: cardBg, borderColor: borderCol }]}
            >
              <View style={[styles.toolIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                <MaterialIcons name="dynamic-feed" size={22} color="#38bdf8" />
              </View>
              <Text style={[styles.toolTitle, { color: textPrimary }]}>Video Reels & Insights</Text>
              <Text style={[styles.toolSubtitle, { color: textMuted }]}>Verified property walk-throughs</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(app)/predictions')}
              style={[styles.toolCard, { backgroundColor: cardBg, borderColor: borderCol }]}
            >
              <View style={[styles.toolIconBox, { backgroundColor: 'rgba(34, 197, 94, 0.12)' }]}>
                <MaterialIcons name="trending-up" size={22} color="#22c55e" />
              </View>
              <Text style={[styles.toolTitle, { color: textPrimary }]}>Price Predictions</Text>
              <Text style={[styles.toolSubtitle, { color: textMuted }]}>Predictive yield models</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(app)/legal')}
              style={[styles.toolCard, { backgroundColor: cardBg, borderColor: borderCol }]}
              accessibilityLabel="Title & Legal Verification"
            >
              <View style={[styles.toolIconBox, { backgroundColor: 'rgba(234, 179, 8, 0.12)' }]}>
                <MaterialIcons name="gavel" size={22} color={goldPrimary} />
              </View>
              <Text style={[styles.toolTitle, { color: textPrimary }]}>Title & Legal Verification</Text>
              <Text style={[styles.toolSubtitle, { color: textMuted }]}>Deed & encumbrance checks</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(app)/blueprint')}
              style={[styles.toolCard, { backgroundColor: cardBg, borderColor: borderCol }]}
            >
              <View style={[styles.toolIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
                <MaterialIcons name="architecture" size={22} color="#a855f7" />
              </View>
              <Text style={[styles.toolTitle, { color: textPrimary }]}>Blueprint Architect</Text>
              <Text style={[styles.toolSubtitle, { color: textMuted }]}>Instant 2D/3D layout plans</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  heroSection: {
    marginBottom: 20,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131824',
    borderWidth: 1,
    borderColor: '#232D42',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    outlineStyle: 'none',
  } as any,
  searchActionBtn: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  searchActionBtnText: {
    color: '#0B0F19',
    fontWeight: '800',
    fontSize: 13,
  },
  categoryPillsScroll: {
    marginTop: 12,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#131824',
    borderWidth: 1,
    borderColor: '#232D42',
  },
  categoryPillActive: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  categoryPillText: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#0B0F19',
    fontWeight: '800',
  },

  // Stories
  storiesSection: {
    marginBottom: 24,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#64748B',
    marginBottom: 12,
  },
  storiesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  storyCard: {
    alignItems: 'center',
    width: 68,
  },
  createStoryRing: {
    position: 'relative',
    padding: 2,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#232D42',
  },
  createPlusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#F5A623',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0B0F19',
  },
  storyAvatarRing: {
    padding: 2,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  storyAvatarRingUnread: {
    borderColor: '#F5A623',
  },
  storyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },

  // Feed
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  feedHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  feedSubheading: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  propertyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  propertyGridWide: {
    justifyContent: 'space-between',
  },
  propertyCard: {
    backgroundColor: '#131824',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#232D42',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  propertyImageWrap: {
    height: 220,
    width: '100%',
    position: 'relative',
    backgroundColor: '#070D18',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  propertyImageOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5A623',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    color: '#0B0F19',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bookmarkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(11, 15, 25, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  priceTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(11, 15, 25, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.3)',
  },
  priceTagText: {
    color: '#F5A623',
    fontSize: 16,
    fontWeight: '900',
  },
  propertyCardBody: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  propertyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  propertyLocationText: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '500',
  },
  specsRow: {
    marginBottom: 10,
  },
  specsText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  propertyDescription: {
    color: '#64748B',
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 14,
  },
  brokerAttributionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    marginBottom: 14,
  },
  brokerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  brokerRole: {
    fontSize: 11,
    color: '#94A3B8',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inquireBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5A623',
    paddingVertical: 9,
    borderRadius: 12,
  },
  inquireBtnText: {
    color: '#0B0F19',
    fontWeight: '800',
    fontSize: 12.5,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#1A2133',
    borderWidth: 1,
    borderColor: '#232D42',
  },
  detailsBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },

  // Tools strip
  toolsStrip: {
    marginTop: 36,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  toolCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#131824',
    borderWidth: 1,
    borderColor: '#232D42',
    borderRadius: 16,
    padding: 14,
  },
  toolIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  toolSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
  },
});


