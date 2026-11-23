import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import BoolokLogo from '../../components/BoolokLogo';
import { useAuth } from '../../context/AuthContext';

// ─── Theme Configurations ───────────────────────────────────────────────────────
const lightTheme = {
  primary: '#DAA520',
  primaryContainer: '#DAA520',
  onPrimary: '#0A0F23',
  onPrimaryContainer: '#0A0F23',
  secondary: '#1C2238',
  surface: '#ffffff',
  background: '#FAFAFA',
  onSurface: '#0A0F23',
  onSurfaceVariant: '#1C2238',
  surfaceContainerLow: '#E6E6E6',
  surfaceContainerLowest: '#ffffff',
  outline: '#E6E6E6',
  onBackground: '#0A0F23',
  surfaceVariant: '#E6E6E6',
  glassCard: '#ffffff',
  glassCardBorder: 'rgba(218,165,32,0.3)',
  glassCardGrey: '#EAEAEA',
  pillarIconBg: '#FFF8E7',
  footerBg: '#F0F0F0',
  footerBorder: '#E0E0E0',
  footerText: '#333333',
  footerCopy: '#666666',
};

const darkTheme = {
  primary: '#DAA520',
  primaryContainer: '#DAA520',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#ffffff',
  secondary: '#E6E6E6',
  surface: '#121212',
  background: '#050714', // Deep premium dark background
  onSurface: '#ffffff',
  onSurfaceVariant: '#CCCCCC',
  surfaceContainerLow: '#1C2238',
  surfaceContainerLowest: '#0A0F23',
  outline: '#333333',
  onBackground: '#ffffff',
  surfaceVariant: '#1C2238',
  glassCard: '#161B33',
  glassCardBorder: 'rgba(218,165,32,0.2)',
  glassCardGrey: '#1C2238',
  pillarIconBg: '#231B0A',
  footerBg: '#030510',
  footerBorder: '#161B33',
  footerText: '#CCCCCC',
  footerCopy: '#888888',
};

// ─── Fade-in animated wrapper ─────────────────────────────────────────────────
const FadeIn = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 700,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

// ─── Interactive Hover Wrapper ────────────────────────────────────────────────
const HoverButton = ({
  children,
  style,
  onPress,
  scaleTo = 1.03,
  activeOpacity = 0.7,
}: {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  scaleTo?: number;
  activeOpacity?: number;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true }).start()}
      onHoverOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      onPressIn={() => {
        Animated.timing(opacity, { toValue: activeOpacity, duration: 100, useNativeDriver: true }).start();
        Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
      }}
      onPressOut={() => {
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }], opacity }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// ─── Theme Toggle Button ──────────────────────────────────────────────────────
const ThemeToggle = ({ isDark, onToggle, theme }: { isDark: boolean; onToggle: () => void; theme: typeof lightTheme }) => {
  const rotation = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(rotation, {
      toValue: isDark ? 1 : 0,
      useNativeDriver: true,
      friction: 5,
      tension: 40,
    }).start();
  }, [isDark]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const scale = rotation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.7, 1],
  });

  return (
    <Pressable onPress={onToggle} style={{ marginHorizontal: 8 }}>
      <Animated.View style={{ transform: [{ rotate: spin }, { scale }], padding: 8 }}>
        <Feather name={isDark ? "moon" : "sun"} size={22} color={theme.primary} />
      </Animated.View>
    </Pressable>
  );
};

// ─── Pillar card ──────────────────────────────────────────────────────────────
interface PillarCardProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  greyBg?: boolean;
  theme: typeof lightTheme;
  styles: any;
}

const PillarCard = ({ icon, title, description, greyBg, theme, styles }: PillarCardProps) => (
  <HoverButton scaleTo={1.02} style={[styles.glassCard, greyBg && styles.glassCardGrey]}>
    <View style={styles.pillarIcon}>
      <Feather name={icon} size={24} color={theme.primary} />
    </View>
    <Text style={styles.pillarTitle}>{title}</Text>
    <Text style={styles.pillarDesc}>{description}</Text>
  </HoverButton>
);

// ─── Mission value item ───────────────────────────────────────────────────────
const MissionValue = ({ title, body, styles }: { title: string; body: string; styles: any }) => (
  <View style={styles.missionValue}>
    <Text style={styles.missionValueTitle}>{title}</Text>
    <Text style={styles.missionValueBody}>{body}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BrandVisionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_W } = useWindowDimensions();
  const { user } = useAuth();

  const [isDarkMode, setIsDarkMode] = useState(true);
  const theme = isDarkMode ? darkTheme : lightTheme;
  const styles = useMemo(() => getStyles(theme, insets, SCREEN_W), [theme, insets, SCREEN_W]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Top Navigation Bar ── */}
      <View style={styles.navbar}>
        <View style={styles.navBrand}>
          <BoolokLogo size={32} color={theme.onSurface} />
          <Text style={styles.navBrandText}>
            Boolok<Text style={styles.navBrandGold}>One</Text>
          </Text>
        </View>

        <View style={styles.navLinks}>
          <HoverButton><Text style={[styles.navLink, styles.navLinkActive]}>Vision</Text></HoverButton>
          <HoverButton><Text style={styles.navLink}>Listings</Text></HoverButton>
          <HoverButton><Text style={styles.navLink}>Market Data</Text></HoverButton>
          <HoverButton><Text style={styles.navLink}>Agents</Text></HoverButton>
        </View>

        <View style={styles.navActions}>
          <ThemeToggle isDark={isDarkMode} onToggle={toggleTheme} theme={theme} />
          {user ? (
            <HoverButton
              style={styles.navJoin}
              onPress={() => router.push('/(app)/dashboard')}
            >
              <Text style={styles.navJoinText}>Dashboard</Text>
            </HoverButton>
          ) : (
            <>
              <HoverButton
                style={styles.navSignIn}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={styles.navSignInText}>Sign In</Text>
              </HoverButton>
              <HoverButton
                style={styles.navJoin}
                onPress={() => router.push('/(auth)/register')}
              >
                <Text style={styles.navJoinText}>Join Now</Text>
              </HoverButton>
            </>
          )}
        </View>
      </View>

      {/* ── Hero Section ── */}
      <View style={styles.hero}>
        <FadeIn delay={0}>
          <View style={styles.heroLogo}>
            <BoolokLogo size={120} color={theme.onSurface} />
          </View>
        </FadeIn>

        <FadeIn delay={200}>
          <Text style={styles.heroHeadline}>The Geometry of Precision</Text>
        </FadeIn>

        <FadeIn delay={400}>
          <Text style={styles.heroSubtitle}>
            At the heart of BoolokOne lies the{' '}
            <Text style={styles.heroHighlight}>Neural Node</Text>—a 9-dot
            architecture representing the convergence of local data, global trends,
            and human intent, unified by the central spark of Artificial Intelligence.
          </Text>
        </FadeIn>

        <FadeIn delay={600}>
          <HoverButton style={styles.heroCta} scaleTo={1.05}>
            <Text style={styles.heroCtaText}>Explore Pillars  ↓</Text>
          </HoverButton>
        </FadeIn>
      </View>

      {/* ── Architectural Core ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>The Architectural Core</Text>
          <View style={styles.sectionDivider} />
        </View>

        <View style={styles.pillarRow}>

          <View style={{ flex: 1 }}>
            <PillarCard
              icon="zap"
              title="AI Advisor"
              description="A persistent digital concierge that analyzes legal documents, zoning laws, and financing options in real-time."
              greyBg
              theme={theme}
              styles={styles}
            />
          </View>
        </View>

        <View style={styles.pillarRow}>
          <View style={{ flex: 1 }}>
            <PillarCard
              icon="trending-up"
              title="Market Insights"
              description="Predictive analytics that forecast neighborhood appreciation with 94% accuracy, leveraging 15 years of historical data."
              theme={theme}
              styles={styles}
            />
          </View>
          <View style={{ flex: 1.5 }}>
            <PillarCard
              icon="globe"
              title="Global Reach"
              description="Our network bridges the gap between international capital and local opportunities. From the streets of Tokyo to the skylines of New York, BoolokOne standardizes property data across 45 countries."
              theme={theme}
              styles={styles}
            />
          </View>
        </View>
      </View>

      {/* ── Mission Statement ── */}
      <View style={styles.missionSection}>
        <Text style={styles.missionLabel}>OUR MISSION</Text>
        <Text style={styles.missionHeadline}>
          Evolving real estate from{' '}
          <Text style={styles.missionItalic}>intuition-based</Text> to{' '}
          <Text style={styles.missionGold}>data-driven</Text> intelligence.
        </Text>

        <View style={styles.missionGrid}>
          <MissionValue
            title="Transparency"
            body="Eliminating information asymmetry by providing every user with professional-grade analytical tools previously reserved for institutional investors."
            styles={styles}
          />
          <MissionValue
            title="Efficiency"
            body="Reducing the time-to-transaction from months to days through automated due diligence and AI-optimized match-making."
            styles={styles}
          />
          <MissionValue
            title="Sustainability"
            body="Prioritizing climate-risk assessments and energy efficiency data to ensure long-term value for a changing world."
            styles={styles}
          />
        </View>
      </View>

      {/* ── Call to Action ── */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaHeadline}>Ready to navigate the future?</Text>
        <HoverButton style={styles.ctaButton} onPress={() => router.push(user ? '/(app)/dashboard' : '/(auth)/login')}>
          <Text style={styles.ctaButtonText}>{user ? 'Go to Dashboard →' : 'Sign In to Start →'}</Text>
        </HoverButton>
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.footerBrand}>
            <BoolokLogo size={20} color={theme.onSurface} />
            <Text style={styles.footerBrandText}>
              Boolok<Text style={styles.navBrandGold}>One</Text>
            </Text>
          </View>
          <Text style={styles.footerCopy}>© 2024 BoolokOne. All rights reserved.</Text>
        </View>
        <View style={styles.footerLinks}>
          {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Contact Support'].map(
            (link) => (
              <HoverButton key={link} onPress={() => { }}>
                <Text style={styles.footerLink}>{link}</Text>
              </HoverButton>
            )
          )}
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Dynamic Styles ───────────────────────────────────────────────────────────
const getStyles = (theme: typeof lightTheme, insets: any, SCREEN_W: number) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    paddingBottom: 0,
  },

  // Navbar
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.surfaceContainerLowest,
    paddingHorizontal: 24,
    paddingTop: Math.max(insets.top, Platform.OS === 'web' ? 16 : 16),
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.outline,
  },
  navBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBrandText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: theme.onSurface,
    marginLeft: 8,
  },
  navBrandGold: {
    color: theme.primary,
  },
  navLinks: {
    flexDirection: 'row',
    gap: 32,
    display: SCREEN_W > 768 ? 'flex' : 'none',
  },
  navLink: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: theme.onSurfaceVariant,
  },
  navLinkActive: {
    color: theme.primary,
    fontFamily: 'Poppins_600SemiBold',
    borderBottomWidth: 2,
    borderBottomColor: theme.primary,
    paddingBottom: 4,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navSignIn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navSignInText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: theme.onSurfaceVariant,
  },
  navJoin: {
    backgroundColor: theme.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navJoinText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#0A0F23', // Always dark for contrast on gold
  },

  // Hero
  hero: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: theme.surface,
  },
  heroLogo: {
    marginBottom: 40,
  },
  heroHeadline: {
    fontFamily: 'Poppins_700Bold',
    fontSize: SCREEN_W > 768 ? 42 : 32,
    lineHeight: SCREEN_W > 768 ? 52 : 42,
    color: theme.onSurface,
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 18,
    lineHeight: 28,
    color: theme.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 40,
    maxWidth: 700,
  },
  heroHighlight: {
    color: theme.primaryContainer,
    fontFamily: 'Poppins_600SemiBold',
  },
  heroCta: {
    backgroundColor: theme.primaryContainer,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  heroCtaText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.5,
    color: '#0A0F23', // Always dark for contrast on gold
  },

  // Pillar section
  section: {
    paddingVertical: 64,
    paddingHorizontal: 24,
    backgroundColor: theme.background,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    lineHeight: 40,
    color: theme.onSurface,
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionDivider: {
    width: 80,
    height: 4,
    backgroundColor: theme.primaryContainer,
    borderRadius: 2,
  },

  glassCard: {
    backgroundColor: theme.glassCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.glassCardBorder,
    padding: 32,
    marginBottom: 16,
    flex: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  glassCardGrey: {
    backgroundColor: theme.glassCardGrey,
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  pillarRow: {
    flexDirection: SCREEN_W > 768 ? 'row' : 'column',
    gap: 16,
    marginBottom: 16,
  },
  pillarIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.pillarIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pillarTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    lineHeight: 28,
    color: theme.onSurface,
    marginBottom: 12,
  },
  pillarDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 24,
    color: theme.onSurfaceVariant,
  },

  // Mission section
  missionSection: {
    backgroundColor: '#0A0F23', // Deep blue/black for both themes
    paddingVertical: 80,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  missionLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    letterSpacing: 2,
    color: theme.primaryContainer,
    marginBottom: 24,
    textAlign: 'center',
  },
  missionHeadline: {
    fontFamily: 'Poppins_700Bold',
    fontSize: SCREEN_W > 768 ? 36 : 28,
    lineHeight: SCREEN_W > 768 ? 48 : 38,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 64,
    maxWidth: 800,
  },
  missionItalic: {
    fontStyle: 'italic',
    color: '#CCCCCC',
    fontWeight: '400',
  },
  missionGold: {
    color: theme.primaryContainer,
  },
  missionGrid: {
    flexDirection: SCREEN_W > 768 ? 'row' : 'column',
    gap: 32,
    maxWidth: 1000,
    width: '100%',
    justifyContent: 'space-between',
  },
  missionValue: {
    flex: 1,
    borderLeftWidth: 2,
    borderLeftColor: theme.primaryContainer,
    paddingLeft: 20,
  },
  missionValueTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 12,
  },
  missionValueBody: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: '#CCCCCC',
  },

  // CTA section
  ctaSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: theme.footerBg,
    alignItems: 'center',
  },
  ctaHeadline: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    lineHeight: 40,
    color: theme.onSurface,
    textAlign: 'center',
    marginBottom: 32,
  },
  ctaButton: {
    backgroundColor: theme.primaryContainer,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.5,
    color: '#0A0F23', // Always dark for contrast
  },

  // Footer
  footer: {
    backgroundColor: theme.footerBg,
    borderTopWidth: 1,
    borderTopColor: theme.footerBorder,
    paddingVertical: 32,
    paddingHorizontal: 40,
    flexDirection: SCREEN_W > 768 ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: SCREEN_W > 768 ? 'center' : 'flex-start',
    gap: 24,
  },
  footerLeft: {
    flexDirection: SCREEN_W > 768 ? 'row' : 'column',
    alignItems: SCREEN_W > 768 ? 'center' : 'flex-start',
    gap: 24,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerBrandText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: theme.onSurface,
    marginLeft: 6,
  },
  footerCopy: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: theme.footerCopy,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  footerLink: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: theme.footerText,
    textDecorationLine: 'underline',
  },
});
