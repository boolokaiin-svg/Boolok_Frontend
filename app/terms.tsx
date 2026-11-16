// app/terms.tsx
// Dedicated Public Legal Policy Hub — Privacy Policy, Terms & Conditions, Cookie Policy, Refund Policy.
// Accessible publicly without authentication.

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, radius } from '../constants/theme';
import BoolokLogo from '../components/BoolokLogo';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabKey = 'terms' | 'privacy' | 'cookie' | 'refund';

interface Tab {
  key: TabKey;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const TABS: Tab[] = [
  { key: 'terms',   label: 'Terms & Conditions',   icon: 'gavel'           },
  { key: 'privacy', label: 'Privacy Policy',       icon: 'shield'          },
  { key: 'cookie',  label: 'Cookie Policy',        icon: 'cookie'          },
  { key: 'refund',  label: 'Refund Policy',        icon: 'receipt-long'    },
];

// ─── Section Helper ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <Text
        style={[typography.headlineSm, { color: theme.onSurface, marginBottom: spacing.xs, fontWeight: '800' }]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <Text style={[typography.bodyMd, { color: theme.onSurfaceVariant, lineHeight: 24, marginBottom: spacing.sm }]}>
      {children}
    </Text>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={styles.bulletRow}>
      <Text style={{ color: theme.primary, marginRight: 8, marginTop: 2, fontSize: 16 }}>•</Text>
      <Text style={[typography.bodyMd, { color: theme.onSurfaceVariant, flex: 1, lineHeight: 22 }]}>
        {children}
      </Text>
    </View>
  );
}

function LastUpdated({ date }: { date: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.lastUpdatedBadge, { backgroundColor: theme.surfaceContainerHigh, borderColor: theme.outlineVariant }]}>
      <MaterialIcons name="schedule" size={14} color={theme.primary} style={{ marginRight: 6 }} />
      <Text style={[typography.labelMd, { color: theme.onSurfaceVariant, fontWeight: '600' }]}>
        Last updated: {date}
      </Text>
    </View>
  );
}

// ─── Privacy Policy ───────────────────────────────────────────────────────────
function PrivacyPolicy() {
  return (
    <>
      <LastUpdated date="16 November 2026" />

      <Section title="1. Who We Are">
        <Para>
          Boolok ("we", "our", "us") is an AI-assisted real-estate intelligence and social networking platform operated by{' '}
          <Text style={{ fontWeight: '700' }}>Boolok Technologies Pvt. Ltd.</Text>, based in{' '}
          <Text style={{ fontWeight: '700' }}>Chennai, Tamil Nadu, India</Text>. If you have any
          questions regarding this policy or data processing, contact us at{' '}
          <Text style={{ fontWeight: '700' }}>support@boolok.com</Text>.
        </Para>
      </Section>

      <Section title="2. Data We Collect">
        <Bullet>Community safety: reports you submit, their reasons and details, limited snapshots of reported content, moderation decisions, and your block preferences. Reports are accessible to authorized moderators and are not shown to the reported user.</Bullet>
        <Para>We collect only the minimum data necessary to provide and safeguard our real estate intelligence platform:</Para>
        <Bullet>
          <Text style={{ fontWeight: '700' }}>Account credentials:</Text> Full name, username, email address, and cryptographically hashed passwords upon registration.
        </Bullet>
        <Bullet>
          <Text style={{ fontWeight: '700' }}>Professional profile:</Text> Professional headline, bio, licensing jurisdiction, broker/architect role, profile avatar, and verified contact info you choose to disclose.
        </Bullet>
        <Bullet>
          <Text style={{ fontWeight: '700' }}>Platform content:</Text> Property listings, video tours, drone footage, commentary, and property insights you author.
        </Bullet>
        <Bullet>
          <Text style={{ fontWeight: '700' }}>Investment goals:</Text> Sector preferences (buying, institutional advisory, commercial syndication) selected during onboarding.
        </Bullet>
        <Bullet>
          <Text style={{ fontWeight: '700' }}>Authentication session:</Text> Secure JSON Web Tokens (JWT) stored in hardware secure enclaves on mobile devices or browser localStorage on web.
        </Bullet>
        <Para>
          We do NOT collect: credit card numbers directly, device advertising trackers, real-time GPS tracking, or private contacts.
        </Para>
      </Section>

      <Section title="3. How We Use Your Data">
        <Bullet>To maintain your professional advisor account and authenticate sessions.</Bullet>
        <Bullet>To deliver personalized AI property insights, market match scores, and radar alerts.</Bullet>
        <Bullet>To send critical transactional notifications, such as one-time passwords (OTP).</Bullet>
        <Bullet>To protect platform integrity against fraudulent real estate listings and unauthorized access.</Bullet>
        <Para>
          We NEVER sell, lease, or monetize your personal information to third-party ad networks.
        </Para>
      </Section>

      <Section title="4. Third-Party Infrastructure">
        <Para>We partner with enterprise cloud infrastructure providers to securely power Boolok:</Para>
        <Bullet>
          <Text style={{ fontWeight: '700' }}>Cloud Database Services:</Text> Encrypted MongoDB cloud clusters with AES-256 at-rest encryption.
        </Bullet>
        <Bullet>
          <Text style={{ fontWeight: '700' }}>Google Identity Services:</Text> OAuth 2.0 authentication when you choose Google Sign-In.
        </Bullet>
        <Bullet>
          <Text style={{ fontWeight: '700' }}>Transactional Email Services:</Text> High-delivery transactional SMTP for OTP validation.
        </Bullet>
      </Section>

      <Section title="5. Data Retention &amp; Erasure">
        <Para>
          You can request account deletion in Settings. Deletion covers your profile, posts, reels, private conversations, audit history, community interactions, and associated media that we can identify as yours. Your account is disabled while storage cleanup is pending, and failed cleanup is retried. Shared legacy files without clear ownership may be retained where another account still references them. Copies downloaded by others, third-party processing records, and provider backups are subject to their respective retention policies. Contact support@boolok.com for deletion questions.
        </Para>
      </Section>

      <Section title="6. Your Rights">
        <Para>Under the DPDP Act 2023 (India) and GDPR regulations, you have the right to:</Para>
        <Bullet>Request a summary of personal data held about you.</Bullet>
        <Bullet>Correct or update inaccurate account information directly in your profile.</Bullet>
        <Bullet>Revoke consent for optional data processing.</Bullet>
        <Bullet>Request permanent data erasure ("Right to be Forgotten").</Bullet>
      </Section>

      <Section title="7. Security Standards">
        <Para>
          Passwords are protected using adaptive bcrypt hashing with individual cryptographic salts. All API communications require TLS/HTTPS transport security. Tokens are secured within platform-native secure storage mechanisms.
        </Para>
      </Section>
    </>
  );
}

// ─── Terms & Conditions ───────────────────────────────────────────────────────
function TermsAndConditions() {
  return (
    <>
      <LastUpdated date="16 November 2026" />

      <Section title="1. Acceptance of Agreement">
        <Para>
          By creating an account, browsing property radar feeds, or accessing Boolok, you acknowledge and agree to be bound by these Terms and Conditions. This agreement is governed by the laws of India, including the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023.
        </Para>
      </Section>

      <Section title="2. Professional Eligibility">
        <Bullet>You must be at least 18 years of age to access Boolok.</Bullet>
        <Bullet>You agree to represent your professional identity, firm, and credentials accurately.</Bullet>
        <Bullet>You are solely responsible for maintaining the confidentiality of your credentials.</Bullet>
        <Bullet>Impersonation of licensed real estate professionals or entities is strictly prohibited.</Bullet>
      </Section>

      <Section title="3. Nature of the Platform">
        <Para>
          Boolok is an intelligence network connecting commercial brokers, architects, investors, and advisors. Features include:
        </Para>
        <Bullet>Video property tours, architectural showcases, and market radar reels.</Bullet>
        <Bullet>AI-generated market match scores, yield benchmarks, and zoning insights.</Bullet>
        <Bullet>Professional advisor networking, messaging, and property sharing.</Bullet>
      </Section>

      <Section title="4. ⚠️ AI Information &amp; Real Estate Advice Disclaimer">
        <Para>
          All AI-assisted indicators on Boolok — including AI Match Percentages, projected appreciation rates, zoning summaries, and market forecasts — are generated for{' '}
          <Text style={{ fontWeight: '700' }}>informational and discovery purposes only</Text>.
        </Para>
        <Para>
          AI-generated insights do NOT constitute legal title certification, structural engineering clearance, certified land survey, formal tax advice, or registered brokerage valuation. Users MUST perform independent legal title searches and consult registered RERA advocates and chartered appraisers prior to entering into binding property agreements.
        </Para>
      </Section>

      <Section title="5. Content Standards &amp; Fair Use">
        <Para>Use the three-dot safety menu on posts, reels, profiles, and conversations to report content or users, or to block a user. Manage blocks in Settings. Reports are private to our moderation team. We review reports and may remove content or suspend accounts.</Para>
        <Bullet>Child sexual abuse and exploitation, sexual exploitation, hate speech, threats, scams, and harassment are prohibited.</Bullet>
        <Para>Users agree not to:</Para>
        <Bullet>Publish fraudulent property listings or unauthorized photos of restricted assets.</Bullet>
        <Bullet>Transmit abusive, defamatory, or unlawful communications.</Bullet>
        <Bullet>Deploy scrapers, crawlers, or automated bots to harvest proprietary intelligence.</Bullet>
        <Bullet>Circumvent platform authentication, security, or rate limiting mechanisms.</Bullet>
      </Section>

      <Section title="6. Intellectual Property">
        <Para>
          You retain full ownership of property videos, imagery, and text that you upload. By publishing content on Boolok, you grant us a worldwide, royalty-free license to render and display that content on the platform. The Boolok trademark, brand assets, UI architecture, and algorithmic models are the exclusive property of Boolok Technologies.
        </Para>
      </Section>

      <Section title="7. Jurisdiction &amp; Dispute Resolution">
        <Para>
          Any disputes arising out of these Terms shall be subject to the exclusive jurisdiction of the competent courts in Chennai, Tamil Nadu, India.
        </Para>
      </Section>
    </>
  );
}

// ─── Cookie Policy ────────────────────────────────────────────────────────────
function CookiePolicy() {
  return (
    <>
      <LastUpdated date="15 September 2025" />

      <Section title="1. Local Storage Usage">
        <Para>
          Boolok does not utilize invasive third-party tracking cookies or advertising pixels. We utilize strictly necessary local device storage to ensure reliable application functionality:
        </Para>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { fontWeight: '700' }]}>Storage Method</Text>
            <Text style={[styles.tableCell, { fontWeight: '700' }]}>Data Stored</Text>
            <Text style={[styles.tableCell, { fontWeight: '700' }]}>Function</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>expo-secure-store</Text>
            <Text style={styles.tableCell}>JWT Token</Text>
            <Text style={styles.tableCell}>Secure session continuity on mobile</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>localStorage (Web)</Text>
            <Text style={styles.tableCell}>JWT &amp; Theme Pref</Text>
            <Text style={styles.tableCell}>Login preservation &amp; dark/light mode</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>localStorage (Web)</Text>
            <Text style={styles.tableCell}>boolok_consent_v1</Text>
            <Text style={styles.tableCell}>Records policy acknowledgment</Text>
          </View>
        </View>
      </Section>

      <Section title="2. Managing Storage">
        <Para>
          On Web, you may clear stored sessions at any time through your browser's Developer Tools or Privacy Settings. On mobile, signing out or uninstalling the app clears stored authentication tokens.
        </Para>
      </Section>
    </>
  );
}

// ─── Refund Policy ────────────────────────────────────────────────────────────
function RefundPolicy() {
  return (
    <>
      <LastUpdated date="15 September 2025" />

      <Section title="1. Free Access Platform">
        <Para>
          Boolok's core discovery, social feed, and property insights are currently provided complimentary to registered real estate professionals and property investors.
        </Para>
      </Section>

      <Section title="2. Future Enterprise &amp; Pro Subscriptions">
        <Para>
          When optional Pro intelligence tiers or automated closing features are introduced:
        </Para>
        <Bullet>
          <Text style={{ fontWeight: '700' }}>7-Day Guarantee:</Text> Full refunds will be honored within 7 calendar days of your initial plan upgrade if you are not satisfied.
        </Bullet>
        <Bullet>
          <Text style={{ fontWeight: '700' }}>Cancellation:</Text> You may cancel subscriptions at any time via Settings to avoid future billing cycles.
        </Bullet>
      </Section>
    </>
  );
}

// ─── Main Screen Component ────────────────────────────────────────────────────
export default function TermsAndLegalScreen() {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ tab?: string }>();

  const initialTab: TabKey =
    (params.tab as TabKey) && TABS.some((t) => t.key === params.tab)
      ? (params.tab as TabKey)
      : 'terms';

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const isWide = width >= 768;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/dashboard');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#060B13' : '#F8FAFC' }]}>
      {/* ── Top Navigation Bar ── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? 'rgba(10, 15, 35, 0.95)' : '#FFFFFF',
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]}
          >
            <MaterialIcons name="arrow-back" size={20} color={theme.onSurface} />
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <BoolokLogo size={22} color={theme.primary} />
            <Text style={{ fontSize: 16, fontWeight: '900', color: theme.primary, letterSpacing: 1, marginLeft: 6 }}>
              BOOLOK
            </Text>
            <View style={[styles.tagBadge, { backgroundColor: 'rgba(218, 165, 32, 0.15)', borderColor: theme.primary }]}>
              <Text style={{ color: theme.primary, fontSize: 10, fontWeight: '800' }}>LEGAL HUB</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(app)/dashboard')}
          style={[styles.appLinkBtn, { borderColor: theme.outlineVariant }]}
        >
          <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>Open App →</Text>
        </Pressable>
      </View>

      {/* ── Tabs Navigation Rail ── */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: isDark ? '#09101d' : '#FFFFFF',
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabBarScroll, isWide && { justifyContent: 'center', width: '100%' }]}
          accessibilityRole="tablist"
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: active }}
                style={[
                  styles.tab,
                  active && { borderBottomColor: theme.primary, borderBottomWidth: 2.5 },
                ]}
              >
                <MaterialIcons
                  name={tab.icon}
                  size={17}
                  color={active ? theme.primary : theme.onSurfaceVariant}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    typography.labelLg,
                    {
                      color: active ? theme.primary : theme.onSurfaceVariant,
                      fontWeight: active ? '800' : '600',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Document Body ── */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          isWide && { maxWidth: 860, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Document Header Card */}
        <View style={[styles.docHeaderCard, { backgroundColor: isDark ? '#0d1726' : '#FFFFFF', borderColor: isDark ? '#1e293b' : '#E2E8F0' }]}>
          <View style={[styles.docIconBox, { backgroundColor: 'rgba(218, 165, 32, 0.15)' }]}>
            <MaterialIcons
              name={TABS.find((t) => t.key === activeTab)?.icon || 'gavel'}
              size={26}
              color={theme.primary}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[typography.headlineMd, { color: theme.onSurface, fontWeight: '800' }]}>
              {TABS.find((t) => t.key === activeTab)?.label}
            </Text>
            <Text style={[typography.bodySm, { color: theme.onSurfaceVariant, marginTop: 3 }]}>
              Official legal policies, terms of service, and regulatory disclosures for Boolok.
            </Text>
          </View>
        </View>

        {activeTab === 'terms'   && <TermsAndConditions />}
        {activeTab === 'privacy' && <PrivacyPolicy />}
        {activeTab === 'cookie'  && <CookiePolicy />}
        {activeTab === 'refund'  && <RefundPolicy />}

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}>
          <Text style={[typography.bodySm, { color: theme.onSurfaceVariant, textAlign: 'center', lineHeight: 20 }]}>
            © {new Date().getFullYear()} Boolok Technologies Pvt. Ltd. All rights reserved.{'\n'}
            Chennai, Tamil Nadu, India · Inquiries: legal@boolok.com
          </Text>
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    zIndex: 10,
    ...Platform.select({
      ios: { paddingTop: 48 },
      android: { paddingTop: 16 },
      web: { paddingTop: 14 },
    }),
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 8,
  },
  appLinkBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },

  tabBar: {
    borderBottomWidth: 1,
  },
  tabBarScroll: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 4,
  },

  content: {
    padding: 20,
    paddingBottom: 60,
  },

  docHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  docIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lastUpdatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },

  section: {
    marginBottom: 24,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 4,
  },

  tableContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(127,127,127,0.15)',
    padding: 10,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(127,127,127,0.2)',
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#94a3b8',
    paddingRight: 6,
  },

  footer: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
  },
});
