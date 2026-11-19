// app/(auth)/forgot-password.tsx
// Comprehensive multi-step Password Reset flow:
// 1. Enter Email -> Receive 6-digit OTP via Email
// 2. Enter 6-digit OTP + Set New Password + Confirm Password
// 3. Success confirmation with direct navigation to Sign In

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import BoolokLogo from '../../components/BoolokLogo';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, typography } from '../../constants/theme';
import { API_BASE_URL } from '../../lib/api';
import axios from 'axios';

type Step = 'request' | 'reset' | 'success';

export default function ForgotPasswordScreen() {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  // Step state
  const [step, setStep] = useState<Step>('request');

  // Form fields
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Resend OTP countdown
  const [resendCooldown, setResendCooldown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (resendCooldown > 0) {
      timerRef.current = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resendCooldown]);

  // Step 1: Request OTP
  const handleRequestOtp = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setErrorMsg('');
    setSuccessNotice('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
        email: trimmedEmail,
      });

      setIsLoading(false);
      setStep('reset');
      setResendCooldown(60);
      setSuccessNotice(
        response.data?.message || `A 6-digit reset code has been sent to ${trimmedEmail}.`
      );

      // Dev convenience: autofill if debugOtp is returned
      if (response.data?.debugOtp) {
        setOtp(response.data.debugOtp);
      }
    } catch (err: any) {
      setIsLoading(false);
      const msg =
        err.response?.data?.message ||
        'Unable to send reset code. Please check your internet connection or try again.';
      setErrorMsg(msg);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setErrorMsg('');
    setSuccessNotice('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
        email: email.trim().toLowerCase(),
      });
      setIsLoading(false);
      setResendCooldown(60);
      setSuccessNotice('A fresh 6-digit code has been sent to your email.');

      if (response.data?.debugOtp) {
        setOtp(response.data.debugOtp);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.response?.data?.message || 'Failed to resend code. Please try again.');
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length < 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    if (!newPassword) {
      setErrorMsg('Please enter a new password.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Your new password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify and try again.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        email: email.trim().toLowerCase(),
        otp: trimmedOtp,
        newPassword,
      });

      setIsLoading(false);
      setStep('success');
    } catch (err: any) {
      setIsLoading(false);
      const msg =
        err.response?.data?.message ||
        'Failed to reset password. Please verify the code and try again.';
      setErrorMsg(msg);
    }
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: isDark ? '#060B13' : '#F4F4F6' }]}
      contentContainerStyle={styles.rootContent}
      keyboardShouldPersistTaps="handled"
    >
      <KeyboardAvoidingView
        style={{ flex: 1, width: '100%', alignItems: 'center' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#0B1320' : '#FFFFFF',
              borderColor: isDark ? '#1A273C' : 'rgba(230,230,230,0.8)',
            },
            isWide && styles.cardWide,
          ]}
          entering={FadeInDown.duration(500).springify()}
        >
          {/* Top navigation row */}
          {step !== 'success' && (
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
              onPress={() => {
                if (step === 'reset') {
                  setStep('request');
                  setErrorMsg('');
                } else {
                  router.back();
                }
              }}
            >
              <MaterialIcons name="arrow-back" size={18} color={theme.onSurfaceVariant} />
              <Text style={[typography.labelMd, { color: theme.onSurfaceVariant, marginLeft: 6 }]}>
                {step === 'reset' ? 'Change Email' : 'Back to Sign In'}
              </Text>
            </Pressable>
          )}

          {/* Logo */}
          <Animated.View style={styles.logoWrap} entering={FadeIn.duration(600).delay(100)}>
            <BoolokLogo size={48} />
          </Animated.View>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* STEP 1: REQUEST OTP                                              */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {step === 'request' && (
            <View>
              <Text style={[typography.headlineMd, styles.title, { color: theme.onSurface }]}>
                Forgot Password?
              </Text>
              <Text style={[typography.bodyMd, styles.subtitle, { color: theme.onSurfaceVariant }]}>
                Enter the email associated with your account, and we'll send you a 6-digit code to securely reset your password.
              </Text>

              {/* Feedback messages */}
              {errorMsg.length > 0 && (
                <View style={[styles.alertBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                  <MaterialIcons name="error-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                  <Text style={[styles.alertText, { color: '#EF4444' }]}>{errorMsg}</Text>
                </View>
              )}

              {/* Email Input */}
              <View style={styles.fieldWrap}>
                <Text style={[typography.labelMd, styles.label, { color: theme.onSurface }]}>
                  Email Address
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? '#060B13' : '#F8FAFC',
                      borderColor: isDark ? '#1E2D45' : '#CBD5E1',
                    },
                  ]}
                >
                  <MaterialIcons
                    name="email"
                    size={20}
                    color={theme.onSurfaceVariant}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.onSurface }]}
                    placeholder="name@example.com"
                    placeholderTextColor={theme.onSurfaceVariant}
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      setErrorMsg('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onSubmitEditing={handleRequestOtp}
                  />
                </View>
              </View>

              {/* Send Button */}
              <Pressable
                style={[
                  styles.submitBtn,
                  { backgroundColor: theme.primary },
                  (!email.trim() || isLoading) && { opacity: 0.6 },
                ]}
                onPress={handleRequestOtp}
                disabled={!email.trim() || isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContent}>
                    <ActivityIndicator size="small" color="#000000" />
                    <Text style={[typography.labelMd, { color: '#000000', fontWeight: '800' }]}>
                      Sending Code…
                    </Text>
                  </View>
                ) : (
                  <Text style={[typography.labelMd, { color: '#000000', fontWeight: '800' }]}>
                    Send Reset Code
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* STEP 2: ENTER OTP & NEW PASSWORD                                 */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {step === 'reset' && (
            <View>
              <Text style={[typography.headlineMd, styles.title, { color: theme.onSurface }]}>
                Set New Password
              </Text>
              <Text style={[typography.bodyMd, styles.subtitle, { color: theme.onSurfaceVariant }]}>
                Enter the 6-digit code sent to{' '}
                <Text style={{ color: theme.primary, fontWeight: '700' }}>{email}</Text>{' '}
                and choose your new password.
              </Text>

              {/* Success / Info notice */}
              {successNotice.length > 0 && (
                <View style={[styles.alertBox, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' }]}>
                  <MaterialIcons name="check-circle-outline" size={18} color="#22C55E" style={{ marginRight: 8 }} />
                  <Text style={[styles.alertText, { color: '#22C55E' }]}>{successNotice}</Text>
                </View>
              )}

              {/* Error notice */}
              {errorMsg.length > 0 && (
                <View style={[styles.alertBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                  <MaterialIcons name="error-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                  <Text style={[styles.alertText, { color: '#EF4444' }]}>{errorMsg}</Text>
                </View>
              )}

              {/* 6-Digit Code Field */}
              <View style={styles.fieldWrap}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                  <Text style={[typography.labelMd, { color: theme.onSurface }]}>
                    6-Digit Verification Code
                  </Text>
                  <Pressable
                    onPress={handleResendOtp}
                    disabled={resendCooldown > 0 || isLoading}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: resendCooldown > 0 ? theme.onSurfaceVariant : theme.primary,
                      }}
                    >
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                    </Text>
                  </Pressable>
                </View>

                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? '#060B13' : '#F8FAFC',
                      borderColor: isDark ? '#1E2D45' : '#CBD5E1',
                    },
                  ]}
                >
                  <MaterialIcons
                    name="pin"
                    size={20}
                    color={theme.primary}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.onSurface,
                        letterSpacing: 4,
                        fontWeight: '800',
                        fontSize: 18,
                      },
                    ]}
                    placeholder="123456"
                    placeholderTextColor={theme.onSurfaceVariant}
                    value={otp}
                    onChangeText={(t) => {
                      setOtp(t.replace(/[^0-9]/g, '').slice(0, 6));
                      setErrorMsg('');
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              {/* New Password Field */}
              <View style={styles.fieldWrap}>
                <Text style={[typography.labelMd, styles.label, { color: theme.onSurface }]}>
                  New Password (min 8 chars)
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? '#060B13' : '#F8FAFC',
                      borderColor: isDark ? '#1E2D45' : '#CBD5E1',
                    },
                  ]}
                >
                  <MaterialIcons
                    name="lock-outline"
                    size={20}
                    color={theme.onSurfaceVariant}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.onSurface }]}
                    placeholder="Enter new password"
                    placeholderTextColor={theme.onSurfaceVariant}
                    value={newPassword}
                    onChangeText={(t) => {
                      setNewPassword(t);
                      setErrorMsg('');
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    <MaterialIcons
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={20}
                      color={theme.onSurfaceVariant}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Confirm Password Field */}
              <View style={styles.fieldWrap}>
                <Text style={[typography.labelMd, styles.label, { color: theme.onSurface }]}>
                  Confirm New Password
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? '#060B13' : '#F8FAFC',
                      borderColor: isDark ? '#1E2D45' : '#CBD5E1',
                    },
                  ]}
                >
                  <MaterialIcons
                    name="lock-outline"
                    size={20}
                    color={theme.onSurfaceVariant}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.onSurface }]}
                    placeholder="Confirm new password"
                    placeholderTextColor={theme.onSurfaceVariant}
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      setErrorMsg('');
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    onSubmitEditing={handleResetPassword}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ padding: 4 }}
                  >
                    <MaterialIcons
                      name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                      size={20}
                      color={theme.onSurfaceVariant}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Reset Submit Button */}
              <Pressable
                style={[
                  styles.submitBtn,
                  { backgroundColor: theme.primary },
                  (otp.length < 6 || !newPassword || !confirmPassword || isLoading) && {
                    opacity: 0.6,
                  },
                ]}
                onPress={handleResetPassword}
                disabled={otp.length < 6 || !newPassword || !confirmPassword || isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContent}>
                    <ActivityIndicator size="small" color="#000000" />
                    <Text style={[typography.labelMd, { color: '#000000', fontWeight: '800' }]}>
                      Updating Password…
                    </Text>
                  </View>
                ) : (
                  <Text style={[typography.labelMd, { color: '#000000', fontWeight: '800' }]}>
                    Reset Password
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* STEP 3: SUCCESS STATE                                            */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {step === 'success' && (
            <Animated.View style={styles.successWrap} entering={FadeIn.duration(500)}>
              <View
                style={[
                  styles.successIconWrap,
                  {
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    borderColor: 'rgba(34, 197, 94, 0.3)',
                  },
                ]}
              >
                <MaterialIcons name="check-circle" size={56} color="#22C55E" />
              </View>

              <Text style={[typography.headlineMd, styles.title, { color: theme.onSurface }]}>
                Password Reset Complete!
              </Text>
              <Text
                style={[
                  typography.bodyMd,
                  styles.subtitle,
                  { color: theme.onSurfaceVariant, marginBottom: spacing.xl },
                ]}
              >
                Your account password has been updated securely. You can now sign in with your new credentials.
              </Text>

              <Pressable
                style={[styles.submitBtn, { backgroundColor: theme.primary, width: '100%' }]}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={[typography.labelMd, { color: '#000000', fontWeight: '800' }]}>
                  Sign In to BoolokOne
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rootContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.gutter,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    shadowColor: '#0A0F23',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardWide: {
    padding: spacing.xl,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontWeight: '800',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
    fontSize: 13.5,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  alertText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18,
  },
  fieldWrap: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
    fontWeight: '600',
    fontSize: 13,
  },
  inputContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  submitBtn: {
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    cursor: 'pointer' as any,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  successWrap: {
    alignItems: 'center',
  },
  successIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    alignSelf: 'center',
  },
});
