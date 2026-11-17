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
      <LastUpdated date="17 November 2026" />

      <Section title="1. About This Policy & Contact">
        <Para>This Privacy Policy explains how Boolok, also called Boolok AI or boolokgpt, handles information when you use our real estate, property document analysis, architectural design, and community features. In this policy, "we", "our", and "us" refer to the team operating Boolok.</Para>
        <Para>For privacy questions, access or correction requests, complaints, or account and data deletion requests, contact boolokai.in@gmail.com. Please identify the account concerned, but do not email your password, OTP, API keys, or complete property documents. We may verify account ownership before acting on a request.</Para>
      </Section>

      <Section title="2. Information We Collect">
        <Bullet>Account and identity information: name, username, email address, optional phone number, authentication provider, verification status, and a hashed password for password-based accounts. Google Sign-In supplies identity information such as your Google account identifier, email address, name, and profile image; it does not give us your Google password.</Bullet>
        <Bullet>Profile information: your photo, cover image, bio, professional role, headline, location, interests, and other details you choose to enter.</Bullet>
        <Bullet>Community activity: posts, property listings, photos, videos, reels, comments, likes, follows, saved content, and other interactions.</Bullet>
        <Bullet>Communications: private messages, attachments, conversation participants, timestamps, and support correspondence. Private messages are stored by our service and are not end-to-end encrypted.</Bullet>
        <Bullet>Property verification information: deeds, Encumbrance Certificates (EC), Patta documents, and other images or PDFs you upload; text extracted from them, including names, signatures, addresses, registration details, survey numbers and ownership information; registry lookup results, downloaded certificates, analysis reports, and audit history. Uploaded documents may contain information about people other than the account holder.</Bullet>
        <Bullet>Design and AI inputs: prompts, property dimensions, room requirements, preferences, reference material, and the generated plans, images, text, and other results associated with the feature you use.</Bullet>
        <Bullet>Safety information: reports, reasons, descriptions, limited snapshots of reported content, block preferences, and moderation decisions.</Bullet>
        <Bullet>Technical and session information: authentication tokens, local preferences, network connection information such as IP addresses, request timestamps, errors, and operational logs processed by our services and hosting providers.</Bullet>
        <Para>We do not request access to your address book or continuous GPS location. Locations entered in profiles, listings, prompts, or documents are still information we process. We do not use personal information for sale to third parties or targeted advertising.</Para>
      </Section>

      <Section title="3. How We Use Information">
        <Bullet>Create and authenticate accounts, verify contact details, recover access, and maintain sessions.</Bullet>
        <Bullet>Display profiles and community content, deliver messages, and provide the features and preferences you request.</Bullet>
        <Bullet>Extract and analyse property information, search relevant registry services, produce preliminary verification reports, and generate requested designs and AI outputs.</Bullet>
        <Bullet>Maintain audit history, media and certificate downloads, and account settings.</Bullet>
        <Bullet>Send requested OTPs, security notices, and support responses; prevent abuse and fraud; investigate reports; and operate, secure, and troubleshoot the service.</Bullet>
        <Bullet>Process privacy requests, delete accounts and associated data, and meet applicable legal obligations.</Bullet>
      </Section>

      <Section title="4. AI Processing & Property Registry Lookups">
        <Para>When you submit a document for verification, its contents, page images or extracted text, and related property details can be sent to external AI services for OCR, analysis, and report generation. The verification service supports OpenRouter and the model providers it routes requests to, including Google Gemini, and direct Google or OpenAI integrations depending on the service configuration. Architectural generation can send your design inputs and reference material to OpenAI.</Para>
        <Para>Property details needed for a lookup can be submitted to Tamil Nadu government registry services, including TNREGINET. These services and AI providers process the information they receive under their applicable terms, privacy policies, and retention settings. Deleting your Boolok account does not automatically erase independent provider logs or backups.</Para>
        <Para>Only submit documents and information you are authorised to use and share for this purpose. Avoid unnecessary personal information and redact unrelated identifiers where possible. AI results can be inaccurate and are preliminary assistance; they are not official government certification or a substitute for professional legal or engineering advice. You can choose not to use these optional features.</Para>
      </Section>

      <Section title="5. Who Receives Information">
        <Bullet>Other users: profile information and content you publish are visible through the relevant community features. Message recipients receive the messages and attachments you send. Other people may copy, download, or share content they can access.</Bullet>
        <Bullet>Hosting and storage providers: Render hosts backend and verification services; MongoDB stores account and application records; Amazon Web Services S3 stores uploaded media where configured. Providers process the data needed to deliver their services.</Bullet>
        <Bullet>Identity and communications providers: Google supports Google Sign-In, and configured email or phone delivery services process contact details and messages needed for verification, account recovery, or support.</Bullet>
        <Bullet>AI and registry services: the providers described above receive information necessary for the analysis, generation, or lookup you request.</Bullet>
        <Bullet>Authorised operators: personnel handling support, security, and moderation may access relevant records for those purposes. Reports are not published to the reported user, although actions taken in response may be visible.</Bullet>
        <Para>We may disclose information when required by applicable law or a valid legal request, or when necessary to investigate abuse and protect users, the service, or legal rights. We do not sell personal information.</Para>
      </Section>

      <Section title="6. Device Permissions & Local Storage">
        <Para>File and photo selection features access the documents or media you choose. Where a feature requests a device permission, your operating system controls that permission; you can refuse it or change it in device settings. A feature may not work without the access needed for it.</Para>
        <Para>We use device storage for sessions, preferences, and cached application data. Mobile authentication uses platform secure storage; the web version uses browser storage. Signing out removes the active local session, but does not itself delete your account or all server records. A storage notice is not permission for unrelated collection or advertising.</Para>
      </Section>

      <Section title="7. Retention & Account Deletion">
        <Para>Account records, community content, messages, verification history, and associated stored media are generally retained while the account exists or the content remains available, unless removed through a supported feature. Verification request work files are cleaned up after processing by the adapter; generated certificates can be retained for downloads. Copies in operational logs or provider systems follow their applicable retention arrangements. Certificate availability can also be affected by hosting storage limits and restarts.</Para>
        <Para>To request deletion in the app, open Settings and choose Delete Account. If you cannot use the app, email boolokai.in@gmail.com with the subject "Account deletion" from your registered email address, identifying your Boolok username. We may request additional verification to prevent someone else deleting your account. You do not need to reinstall the app to email a request.</Para>
        <Para>The deletion process removes your profile, posts, reels, private conversations, verification audit history, community interactions, and associated uploaded media and certificates that can be identified as yours. Your account is disabled while cleanup is pending; failed storage cleanup is retried. Completion can take longer when a storage or verification provider is unavailable.</Para>
        <Para>Shared legacy files that another account still references may remain where ownership cannot be safely separated. Copies other users downloaded, independently retained third-party records, and provider backups may not be removed by account deletion. Backup copies follow the provider's backup lifecycle rather than immediate removal from active storage. Information required for a legal obligation or dispute may need to be retained for that purpose. Contact us for the status of a deletion request or details about a specific retained record.</Para>
      </Section>

      <Section title="8. Security & International Processing">
        <Para>We use safeguards including hashed passwords, authenticated access, ownership checks, and HTTPS service endpoints. No system or transmission method can guarantee absolute security. Do not share credentials or upload information you do not want processed by the services described in this policy.</Para>
        <Para>Our cloud and AI providers may process or store information outside your state or country. The locations depend on the providers and service configuration; data protection rules can differ between jurisdictions.</Para>
      </Section>

      <Section title="9. Your Choices & Privacy Requests">
        <Para>You can edit supported profile fields, control information you publish, decline optional uploads, manage device permissions, block users, report content, and request account deletion. Depending on applicable law, you may also request access, correction, erasure, or withdrawal of consent for processing that relies on consent. Contact boolokai.in@gmail.com to exercise these rights or raise a complaint. We may verify your identity, and legal or technical limitations may affect a request. Withdrawing permission may prevent us providing the related feature.</Para>
      </Section>

      <Section title="10. Adults Only">
        <Para>Boolok is intended for people aged 18 and over. We do not knowingly offer accounts to children. If you believe a child has provided personal information or encounter child exploitation content, report it using the available in-app reporting tools or contact boolokai.in@gmail.com so we can investigate and take appropriate action.</Para>
      </Section>

      <Section title="11. Changes to This Policy">
        <Para>We will update this page and its last-updated date when our practices change. Material changes will be communicated through the app or another appropriate channel, and we will seek consent where required. This policy describes Boolok; external websites and services have their own privacy notices.</Para>
      </Section>
    </>
  );
}

// Terms & Conditions

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
