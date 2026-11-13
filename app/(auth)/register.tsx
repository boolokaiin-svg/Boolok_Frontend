// app/(auth)/register.tsx
// Responsive port of create_account_boolok_gpt.html for Expo (incl. web).
// Breakpoint mirrors Tailwind's `md` (768px):
//   width >= 768  -> two-panel "web" layout (brand panel + form panel)
//   width < 768   -> mobile layout (form panel only, with small logo header)

import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, useGoogleAuth } from '../../lib/api';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { router, Link } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import BoolokLogo from '../../components/BoolokLogo';
import GoogleIcon from '../../components/GoogleIcon';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth as firebaseAuth } from '../../lib/firebase';

const MD_BREAKPOINT = 768;

type SubmitState = 'idle' | 'loading' | 'success';
type NotificationType = 'success' | 'error' | 'info';

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

const FEATURES = [
  { icon: 'search', title: 'Smart Search', desc: 'Find exactly what you need with semantic property discovery.' },
  { icon: 'auto-awesome', title: 'AI Advisor', desc: 'Get AI-assisted insights on valuations and property data. Not professional legal or financial advice.' },
  { icon: 'trending-up', title: 'Market Insights', desc: 'Real-time data visualization of global market trends.' },
  { icon: 'public', title: 'Global Reach', desc: 'Connect with opportunities across borders instantly.' },
] as const;

export default function RegisterScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= MD_BREAKPOINT;

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  // ── Mobile OTP Verification State ──────────────────────────────
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [isPhoneOtpSent, setIsPhoneOtpSent] = useState(false);
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const getCountryFlag = (code: string) => {
    const c = code.trim();
    if (c === '+91') return '🇮🇳';
    if (c === '+1') return '🇺🇸';
    if (c === '+44') return '🇬🇧';
    if (c === '+971') return '🇦🇪';
    if (c === '+65') return '🇸🇬';
    if (c === '+61') return '🇦🇺';
    if (c === '+49') return '🇩🇪';
    if (c === '+33') return '🇫🇷';
    return '🌐';
  };

  const getFullPhoneNumber = () => {
    const cleanDigits = phoneNumber.trim().replace(/[^0-9]/g, '');
    const cleanCode = countryCode.trim().startsWith('+') ? countryCode.trim() : `+${countryCode.trim()}`;
    return `${cleanCode}${cleanDigits}`;
  };

  // ── Email OTP Verification State ───────────────────────────────
  const [emailOtp, setEmailOtp] = useState('');
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);

  // ── Toast Notification State ──────────────────────────────────
  const [notification, setNotification] = useState<{
    visible: boolean;
    message: string;
    type: NotificationType;
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const notify = (message: string, type: NotificationType = 'info') => {
    setNotification({ visible: true, message, type });
  };

  React.useEffect(() => {
    if (notification.visible) {
      const t = setTimeout(() => {
        setNotification((prev) => ({ ...prev, visible: false }));
      }, 4500);
      return () => clearTimeout(t);
    }
  }, [notification.visible]);

  // Countdown timers
  React.useEffect(() => {
    let t: any;
    if (phoneCountdown > 0) {
      t = setInterval(() => setPhoneCountdown((p) => p - 1), 1000);
    }
    return () => clearInterval(t);
  }, [phoneCountdown]);

  React.useEffect(() => {
    let t: any;
    if (emailCountdown > 0) {
      t = setInterval(() => setEmailCountdown((p) => p - 1), 1000);
    }
    return () => clearInterval(t);
  }, [emailCountdown]);

  // Send Mobile OTP (Firebase Phone Auth with 10k free SMS/month)
  const handleSendPhoneOtp = async () => {
    const rawDigits = phoneNumber.trim().replace(/[^0-9]/g, '');
    if (!rawDigits || rawDigits.length < 8) {
      notify('Please enter a valid mobile number (min. 8 digits).', 'error');
      return;
    }
    const fullPhone = getFullPhoneNumber();
    setIsSendingPhoneOtp(true);

    try {
      if (Platform.OS === 'web') {
        // Ensure reCAPTCHA container div exists in DOM
        if (typeof document !== 'undefined' && !document.getElementById('recaptcha-container')) {
          const container = document.createElement('div');
          container.id = 'recaptcha-container';
          document.body.appendChild(container);
        }

        // Initialize invisible reCAPTCHA verifier
        if (!(window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {
              // reCAPTCHA solved
            },
            'expired-callback': () => {
              notify('reCAPTCHA expired. Please tap Send OTP again.', 'error');
            },
          });
        }

        const appVerifier = (window as any).recaptchaVerifier;
        const confirmation = await signInWithPhoneNumber(firebaseAuth, fullPhone, appVerifier);
        setConfirmationResult(confirmation);
        setIsPhoneOtpSent(true);
        setPhoneCountdown(60);
        notify(`Verification code sent to ${fullPhone}!`, 'success');
      } else {
        // Mobile fallback via backend
        const res = await axios.post(`${API_BASE_URL}/api/auth/send-phone-otp`, {
          phoneNumber: fullPhone,
        });
        setIsPhoneOtpSent(true);
        setPhoneCountdown(60);
        notify(res.data.message || 'OTP sent to your mobile number.', 'success');
      }
    } catch (err: any) {
      console.error('Firebase Phone Auth error:', err);
      if (Platform.OS === 'web' && (window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (_) {}
        (window as any).recaptchaVerifier = null;
      }
      notify(err.message || 'Failed to send mobile OTP. Please try again.', 'error');
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  // Verify Mobile OTP via Firebase
  const handleVerifyPhoneOtp = async () => {
    const code = phoneOtp.trim();
    if (code.length < 6) {
      notify('Please enter the 6-digit OTP code sent to your mobile.', 'error');
      return;
    }
    setIsVerifyingPhoneOtp(true);
    try {
      if (confirmationResult) {
        const userCredential = await confirmationResult.confirm(code);
        console.log('Firebase Phone Auth verified user:', userCredential.user.phoneNumber);
        setIsPhoneVerified(true);
        notify('Mobile number verified successfully!', 'success');
      } else {
        // Backend fallback
        const fullPhone = getFullPhoneNumber();
        await axios.post(`${API_BASE_URL}/api/auth/verify-phone-otp`, {
          phoneNumber: fullPhone,
          otp: code,
        });
        setIsPhoneVerified(true);
        notify('Mobile number verified successfully!', 'success');
      }
    } catch (err: any) {
      console.error('Verify phone OTP error:', err);
      notify(err.message || 'Invalid or expired mobile OTP code.', 'error');
    } finally {
      setIsVerifyingPhoneOtp(false);
    }
  };

  // Send Email OTP
  const handleSendEmailOtp = async () => {
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      notify('Please enter a valid email address.', 'error');
      return;
    }
    setIsSendingEmailOtp(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/send-otp`,
        { email: clean },
        { timeout: 35000 }
      );
      setIsEmailOtpSent(true);
      setEmailCountdown(45);
      notify(res.data.message || `Verification code sent to ${clean}`, 'success');
    } catch (err: any) {
      const msg = err.code === 'ECONNABORTED'
        ? 'Request timed out. Please check your connection or try again.'
        : (err.response?.data?.message || 'Failed to send email verification code.');
      notify(msg, 'error');
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  // Verify Email OTP
  const handleVerifyEmailOtp = async () => {
    const clean = email.trim().toLowerCase();
    const code = emailOtp.trim();
    if (!clean || code.length < 6) {
      notify('Please enter the 6-digit OTP sent to your email.', 'error');
      return;
    }
    setIsVerifyingEmailOtp(true);
    try {
      await axios.post(
        `${API_BASE_URL}/api/auth/verify-email-otp`,
        { email: clean, otp: code },
        { timeout: 20000 }
      );
      setIsEmailVerified(true);
      notify('Email verified successfully!', 'success');
    } catch (err: any) {
      const msg = err.code === 'ECONNABORTED'
        ? 'Request timed out. Please try again.'
        : (err.response?.data?.message || 'Invalid or expired email OTP.');
      notify(msg, 'error');
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  const { signIn } = useAuth();

  // ── Google Sign-In ──────────────────────────────────────────────
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  const handleGoogleSuccess = useCallback(
    async (idToken: string) => {
      setIsGoogleSigningIn(true);
      try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/google`, {
          idToken,
          mode: 'register',
        });
        if (response.data.token) {
          await signIn(response.data.token, response.data.user);
          // New Google users go to personalize, returning users go to feed
          router.push('/(auth)/personalize');
        }
      } catch (error: any) {
        notify(error.response?.data?.message || 'Google sign-up failed. Please try again.', 'error');
      } finally {
        setIsGoogleSigningIn(false);
      }
    },
    [signIn]
  );

  const { promptGoogleSignIn, isGoogleLoading } = useGoogleAuth({
    onSuccess: handleGoogleSuccess,
    onError: (msg: string) => notify(msg, 'error'),
  });
  // ────────────────────────────────────────────────────────────────

  const canSubmit =
    fullName.trim().length > 0 &&
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    agreed &&
    submitState === 'idle';

  const handleSubmit = async () => {
    if (!canSubmit) return;

    /* ── Mobile OTP check commented out until SMS API key is purchased ──
    if (!isPhoneVerified && !phoneOtp.trim()) {
      notify('Please request and verify the OTP for your mobile number.', 'error');
      return;
    }
    */

    if (!isEmailVerified && !emailOtp.trim()) {
      notify('Please request and verify the OTP for your email address.', 'error');
      return;
    }

    setSubmitState('loading');

    try {
      const phoneToSend = phoneNumber.trim().length >= 8 ? getFullPhoneNumber() : null;
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneToSend,
        password,
        phoneOtp: phoneOtp.trim(),
        emailOtp: isEmailVerified ? '' : emailOtp.trim(),
        isPhoneVerified: false,
        isEmailVerified,
      });

      if (response.data.token) {
        await signIn(response.data.token, response.data.user);
        setSubmitState('success');
        notify('Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
          router.push('/(auth)/personalize');
        }, 1000);
      }
    } catch (error: any) {
      console.error('Registration failed:', error.response?.data?.message || error.message);
      setSubmitState('idle');
      notify(error.response?.data?.message || 'Registration failed. Please try again.', 'error');
    }
  };

  const buttonLabel =
    submitState === 'loading'
      ? 'Creating Account...'
      : submitState === 'success'
        ? 'Account Created!'
        : 'Create Account';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Floating Modern In-App Notification Banner */}
      {notification.visible && (
        <Animated.View
          entering={FadeInDown.duration(250)}
          style={[
            styles.notificationToast,
            notification.type === 'success'
              ? styles.notificationSuccess
              : notification.type === 'error'
              ? styles.notificationError
              : styles.notificationInfo,
          ]}
        >
          <MaterialIcons
            name={
              notification.type === 'success'
                ? 'check-circle'
                : notification.type === 'error'
                ? 'error-outline'
                : 'info-outline'
            }
            size={20}
            color={
              notification.type === 'success'
                ? '#10b981'
                : notification.type === 'error'
                ? '#ef4444'
                : colors.primary
            }
          />
          <Text style={styles.notificationText}>{notification.message}</Text>
          <Pressable
            onPress={() => setNotification((prev) => ({ ...prev, visible: false }))}
            hitSlop={8}
          >
            <MaterialIcons name="close" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </Animated.View>
      )}

      <ScrollView
        style={styles.rootScroll}
        contentContainerStyle={styles.rootScrollContent}
        keyboardShouldPersistTaps="handled"
      >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.mainLayout, isWide && styles.mainLayoutRow]}>
          {/* ---------- LEFT BRAND PANEL (web/wide screens only) ---------- */}
          {isWide && (
            <Animated.View style={styles.brandPanel} entering={FadeIn.duration(800)}>
              {/* decorative glow, mirrors the absolute blurred circle in the HTML */}
              <View style={styles.glow} />

              <Pressable
                style={styles.brandLogoRow}
                onPress={() => router.push('/brand-vision')}
              >
                <BoolokLogo size={48} color="#fff" />
                <Text style={[typography.headlineMd, { color: '#fff', marginLeft: spacing.base }]}>
                  BOOLOK <Text style={{ color: colors.primary }}>AI</Text>
                </Text>
              </Pressable>

              <Text style={[typography.headlineXl, styles.brandHeadline]}>
                AI AGENT FOR{'\n'}
                <Text style={{ color: colors.primary }}>REAL ESTATE</Text>{'\n'}
                SERVICES
              </Text>
              <Text style={[typography.bodyLg, styles.brandSubtext]}>
                Empowering your property journey with precision data and intelligent automation.
              </Text>

              <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
                {FEATURES.map((f) => (
                  <View key={f.title} style={styles.featureCard}>
                    <View style={styles.featureIconWrap}>
                      <MaterialIcons name={f.icon as any} size={22} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.headlineSm, { color: '#fff', marginBottom: 2 }]}>
                        {f.title}
                      </Text>
                      <Text style={[typography.bodySm, styles.brandSubtext]}>{f.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <Text style={[typography.labelMd, styles.copyright]}>
                © {new Date().getFullYear()} BOOLOK AI. INTELLIGENT PRECISION.
              </Text>
            </Animated.View>
          )}

          {/* ---------- RIGHT / FORM PANEL (always shown) ---------- */}
          <Animated.View
            style={[styles.formPanel, isWide && styles.formPanelWide]}
            entering={FadeInDown.duration(600).delay(100).springify()}
          >
            <View style={[styles.formContent, isWide && styles.formContentWide]}>
              {/* Small logo header — only on mobile, matches md:hidden block */}
              {!isWide && (
                <Pressable
                  style={styles.mobileLogoBlock}
                  onPress={() => router.push('/brand-vision')}
                >
                  <BoolokLogo size={56} />
                  <Text style={[typography.headlineMd, { color: colors.onBackground, marginTop: spacing.base }]}>
                    BOOLOK AI
                  </Text>
                </Pressable>
              )}

              <View style={{ marginBottom: spacing.lg }}>
                <Text style={[typography.headlineLg, { color: colors.onBackground, marginBottom: spacing.xs }]}>
                  Create Your Account
                </Text>
                <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
                  Join the next generation of real estate intelligence.
                </Text>
              </View>

              <Field label="Full Name">
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.outline}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  accessibilityLabel="Full name"
                />
              </Field>

              <Field label="Username">
                <TextInput
                  style={styles.input}
                  placeholder="Choose a username"
                  placeholderTextColor={colors.outline}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  accessibilityLabel="Username"
                />
              </Field>

              <Field label="Mobile Phone Number (Optional)">
                <View style={styles.inputWithActionRow}>
                  {/* Separate Country Code Box on the Left */}
                  <View style={styles.countryCodeBox}>
                    <TextInput
                      style={styles.countryCodeInput}
                      value={countryCode}
                      onChangeText={(text) => {
                        let formatted = text.trim();
                        if (formatted.length > 0 && !formatted.startsWith('+')) {
                          formatted = '+' + formatted.replace(/[^0-9]/g, '');
                        }
                        setCountryCode(formatted);
                      }}
                      keyboardType="phone-pad"
                      maxLength={5}
                      placeholder="+91"
                      placeholderTextColor={colors.outline}
                      accessibilityLabel="Country code"
                    />
                  </View>

                  {/* Main Mobile Phone Number Input */}
                  <TextInput
                    style={[styles.input, styles.inputFlex]}
                    placeholder="98765 43210"
                    placeholderTextColor={colors.outline}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    accessibilityLabel="Mobile phone number"
                  />

                  {/* ── MOBILE OTP SEND BUTTON (Commented out until SMS API key is configured) ──
                  <Pressable
                    style={[
                      styles.actionBtn,
                      isPhoneVerified
                        ? styles.actionBtnVerified
                        : isSendingPhoneOtp || phoneCountdown > 0
                        ? styles.actionBtnDisabled
                        : null,
                    ]}
                    onPress={handleSendPhoneOtp}
                    disabled={isPhoneVerified || isSendingPhoneOtp || phoneCountdown > 0}
                  >
                    {isSendingPhoneOtp ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : isPhoneVerified ? (
                      <View style={styles.verifiedInline}>
                        <MaterialIcons name="check-circle" size={16} color="#10b981" />
                        <Text style={styles.verifiedBtnText}>Verified</Text>
                      </View>
                    ) : (
                      <Text style={styles.actionBtnText}>
                        {phoneCountdown > 0 ? `${phoneCountdown}s` : isPhoneOtpSent ? 'Resend' : 'Send OTP'}
                      </Text>
                    )}
                  </Pressable>
                  */}
                </View>

                {/* ── MOBILE OTP CODE INPUT (Commented out until SMS API key is configured) ──
                {isPhoneOtpSent && !isPhoneVerified && (
                  <View style={styles.otpVerifyContainer}>
                    <TextInput
                      style={[styles.input, styles.otpInput]}
                      placeholder="6-digit Mobile OTP"
                      placeholderTextColor={colors.outline}
                      value={phoneOtp}
                      onChangeText={setPhoneOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      accessibilityLabel="Mobile OTP"
                    />
                    <Pressable
                      style={[
                        styles.verifyBtn,
                        (isVerifyingPhoneOtp || phoneOtp.trim().length < 6) && styles.actionBtnDisabled,
                      ]}
                      onPress={handleVerifyPhoneOtp}
                      disabled={isVerifyingPhoneOtp || phoneOtp.trim().length < 6}
                    >
                      {isVerifyingPhoneOtp ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <Text style={styles.verifyBtnText}>Verify</Text>
                      )}
                    </Pressable>
                  </View>
                )}
                */}
              </Field>

              <Field label="Email Address">
                <View style={styles.inputWithActionRow}>
                  <TextInput
                    style={[styles.input, styles.inputFlex, isEmailVerified && styles.inputVerified]}
                    placeholder="name@company.com"
                    placeholderTextColor={colors.outline}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (isEmailVerified) setIsEmailVerified(false);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isEmailVerified}
                    accessibilityLabel="Email address"
                  />
                  <Pressable
                    style={[
                      styles.actionBtn,
                      isEmailVerified
                        ? styles.actionBtnVerified
                        : isSendingEmailOtp || emailCountdown > 0
                        ? styles.actionBtnDisabled
                        : null,
                    ]}
                    onPress={handleSendEmailOtp}
                    disabled={isEmailVerified || isSendingEmailOtp || emailCountdown > 0}
                  >
                    {isSendingEmailOtp ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : isEmailVerified ? (
                      <View style={styles.verifiedInline}>
                        <MaterialIcons name="check-circle" size={16} color="#10b981" />
                        <Text style={styles.verifiedBtnText}>Verified</Text>
                      </View>
                    ) : (
                      <Text style={styles.actionBtnText}>
                        {emailCountdown > 0 ? `${emailCountdown}s` : isEmailOtpSent ? 'Resend' : 'Send OTP'}
                      </Text>
                    )}
                  </Pressable>
                </View>

                {isEmailOtpSent && !isEmailVerified && (
                  <View style={styles.otpVerifyContainer}>
                    <TextInput
                      style={[styles.input, styles.otpInput]}
                      placeholder="6-digit Email OTP"
                      placeholderTextColor={colors.outline}
                      value={emailOtp}
                      onChangeText={setEmailOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      accessibilityLabel="Email OTP"
                    />
                    <Pressable
                      style={[
                        styles.verifyBtn,
                        (isVerifyingEmailOtp || emailOtp.trim().length < 6) && styles.actionBtnDisabled,
                      ]}
                      onPress={handleVerifyEmailOtp}
                      disabled={isVerifyingEmailOtp || emailOtp.trim().length < 6}
                    >
                      {isVerifyingEmailOtp ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <Text style={styles.verifyBtnText}>Verify</Text>
                      )}
                    </Pressable>
                  </View>
                )}
              </Field>

              <Field label="Password">
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Min. 8 characters"
                    placeholderTextColor={colors.outline}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    accessibilityLabel="Password, minimum 8 characters"
                  />
                  <Pressable
                    style={styles.eyeButton}
                    onPress={() => setShowPassword((v) => !v)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <MaterialIcons
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={22}
                      color={colors.outline}
                    />
                  </Pressable>
                </View>
              </Field>

              <Pressable
                style={styles.termsRow}
                onPress={() => setAgreed((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
                accessibilityState={{ checked: agreed }}
              >
                <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                  {agreed && <MaterialIcons name="check" size={14} color={colors.onPrimary} />}
                </View>
                <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, flex: 1 }]}>
                  {'I agree to the '}
                  <Text
                    style={styles.link}
                    onPress={() => router.push({ pathname: '/terms', params: { tab: 'terms' } } as any)}
                    accessibilityRole="link"
                    accessibilityLabel="View Terms of Service"
                  >
                    Terms of Service
                  </Text>
                  {' and '}
                  <Text
                    style={styles.link}
                    onPress={() => router.push({ pathname: '/terms', params: { tab: 'privacy' } } as any)}
                    accessibilityRole="link"
                    accessibilityLabel="View Privacy Policy"
                  >
                    Privacy Policy
                  </Text>
                  {'.'}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.submitButton,
                  submitState === 'success' && { backgroundColor: colors.success },
                  (!canSubmit && submitState === 'idle') && { opacity: 0.5 },
                  submitState === 'loading' && { opacity: 0.9 },
                ]}
                onPress={handleSubmit}
                disabled={submitState !== 'idle' || !canSubmit}
                accessibilityRole="button"
                accessibilityLabel={buttonLabel}
                accessibilityState={{ disabled: submitState !== 'idle' || !canSubmit }}
              >
                {submitState === 'loading' ? (
                  <View style={styles.loadingButtonContent}>
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                    <Text style={[typography.headlineSm, { color: colors.onPrimary }]}>{buttonLabel}</Text>
                  </View>
                ) : (
                  <Text style={[typography.headlineSm, { color: colors.onPrimary }]}>{buttonLabel}</Text>
                )}
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={[typography.labelMd, { color: colors.outline }]}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                style={[styles.googleButton, (isGoogleLoading || isGoogleSigningIn) && { opacity: 0.6 }]}
                onPress={promptGoogleSignIn}
                disabled={isGoogleLoading || isGoogleSigningIn}
              >
                <GoogleIcon />
                <Text style={[typography.bodyMd, { color: colors.onSurface, marginLeft: spacing.base }]}>
                  {isGoogleSigningIn ? 'Signing up...' : 'Sign up with Google'}
                </Text>
              </Pressable>

              <View style={styles.footer}>
                <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
                  Already have an account?{' '}
                </Text>
                <Link href="/(auth)/login" style={[typography.bodyMd, styles.link, { fontFamily: 'Poppins_700Bold' }]}>
                  Sign In
                </Link>
              </View>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
    </View>
  );
}

function Field({ label, children }: FieldProps) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[typography.labelMd, { color: colors.onSurface, marginBottom: spacing.xs }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  notificationToast: {
    position: 'absolute',
    top: 24,
    left: 16,
    right: 16,
    zIndex: 999999,
    maxWidth: 480,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(12, 18, 30, 0.98)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  notificationSuccess: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
    backgroundColor: '#0a1d17',
  },
  notificationError: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: '#230e12',
  },
  notificationInfo: {
    borderColor: 'rgba(218, 165, 32, 0.5)',
    backgroundColor: '#1b1706',
  },
  notificationText: {
    flex: 1,
    color: '#ffffff',
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    lineHeight: 18,
  },

  rootScroll: { flex: 1, backgroundColor: colors.background },
  rootScrollContent: { flexGrow: 1 },
  keyboardAvoid: { flex: 1 },
  mainLayout: { flex: 1 },
  mainLayoutRow: { flexDirection: 'row' },

  // ---- Brand panel (web only) ----
  brandPanel: {
    width: '38%',
    maxWidth: 480,
    backgroundColor: colors.onBackground, // #0A0F23
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  glow: {
    position: 'absolute',
    top: -150,
    right: -150,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandHeadline: {
    color: '#fff',
    marginBottom: spacing.md,
  },
  brandSubtext: {
    color: 'rgba(255,255,255,0.6)',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(218,165,32,0.1)', // primary @ 10%
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyright: {
    color: 'rgba(255,255,255,0.4)',
    marginTop: spacing.xl,
  },

  // ---- Form panel (always) ----
  formPanel: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  formPanelWide: {
    paddingHorizontal: spacing.xl,
  },
  formContent: {
    width: '100%',
    paddingHorizontal: spacing.gutter,
  },
  formContentWide: {
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 0,
  },
  mobileLogoBlock: { width: '100%', alignItems: 'center', marginBottom: spacing.xl },

  input: {
    height: 52,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    color: colors.onSurface,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  inputWithActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countryCodeBox: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    paddingHorizontal: 4,
    width: 50,
  },
  countryCodeInput: {
    color: colors.onSurface,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlign: 'center',
    width: '100%',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  inputFlex: {
    flex: 1,
  },
  inputVerified: {
    borderColor: '#10b981',
  },
  actionBtn: {
    height: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(218,165,32,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(218,165,32,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 85,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnVerified: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  actionBtnText: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  verifiedInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedBtnText: {
    color: '#10b981',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  otpVerifyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  otpInput: {
    letterSpacing: 3,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  verifyBtn: {
    height: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 85,
  },
  verifyBtnText: {
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  eyeButton: { position: 'absolute', right: spacing.md, height: 52, justifyContent: 'center' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.lg },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  link: { color: colors.primary, fontFamily: 'Poppins_600SemiBold' },
  submitButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.outlineVariant },
  googleButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
});