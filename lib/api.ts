import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const TOKEN_KEY = 'userToken';

const PRODUCTION_FALLBACK_API_URL = 'https://boolok-backend-zcpn.onrender.com';

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function getMetroHost(): string | null {
  const hostUri =
    (Constants as any).expoConfig?.hostUri ??
    (Constants as any).expoGoConfig?.hostUri ??
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ??
    (Constants as any).manifest?.debuggerHost ??
    (Constants as any).manifest?.hostUri ??
    null;

  if (!hostUri || typeof hostUri !== 'string') return null;

  const withoutProtocol = hostUri.replace(/^https?:\/\//, '');
  const host = withoutProtocol.split(':')[0];
  return host || null;
}

function isRunningUnderMetro(): boolean {
  return getMetroHost() !== null;
}

function resolveApiBaseUrl(): string {
  // Standalone Android / Native release build:
  // MUST resolve to production Render backend directly without relying on Metro
  if (Platform.OS !== 'web') {
    const explicitNative = process.env.EXPO_PUBLIC_API_URL_NATIVE || process.env.EXPO_PUBLIC_API_URL;
    if (explicitNative && !explicitNative.includes('localhost') && !explicitNative.includes('127.0.0.1')) {
      return stripTrailingSlash(explicitNative);
    }
    return PRODUCTION_FALLBACK_API_URL;
  }

  const webUrl = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_BASE_URL;

  const isNonLocalWeb =
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  if (isNonLocalWeb) {
    if (webUrl && !webUrl.includes('localhost') && !webUrl.includes('127.0.0.1')) {
      return stripTrailingSlash(webUrl);
    }
    return PRODUCTION_FALLBACK_API_URL;
  }

  return stripTrailingSlash(webUrl || 'http://localhost:5000');
}

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Safely resolves an image path or URL into a fully-qualified URL for <Image source={{ uri }} />.
 * Automatically prepends API_BASE_URL for relative paths like /uploads/posts/...
 */
export function resolveImageUrl(path: string | null | undefined): string | null {
  if (!path || typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  if (trimmed.startsWith('blob:') || trimmed.startsWith('file:')) {
    return trimmed;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (cleanPath === '/coventry_corporate.jpg') {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}/coventry_corporate.jpg`;
    }
    return 'https://boolokgpt.vercel.app/coventry_corporate.jpg';
  }
  return `${API_BASE_URL}${cleanPath}`;
}

const CONFIRMED_STATIC_REEL_VIDEOS: Record<string, string> = {
  'margaret_river_vineyard.mp4': 'https://boolokgpt.vercel.app/videos/margaret_river_vineyard.mp4',
  'Margaret River Vineyard.mp4': 'https://boolokgpt.vercel.app/videos/margaret_river_vineyard.mp4',
  'house_routing_silent.mp4': 'https://boolokgpt.vercel.app/videos/house_routing_silent.mp4',
  'house_routing_original.mp4': 'https://boolokgpt.vercel.app/videos/house_routing_silent.mp4',
  'kyoto.mp4': 'https://boolokgpt.vercel.app/videos/kyoto.mp4',
  'uluwatu_cliffside.mp4': 'https://boolokgpt.vercel.app/videos/uluwatu_cliffside.mp4',
  'Uluwatu Cliffside.mp4': 'https://boolokgpt.vercel.app/videos/uluwatu_cliffside.mp4',
  'house_plan_loading.mp4': 'https://boolokgpt.vercel.app/videos/house_plan_loading.mp4',
  'dubai_downtown.mp4': 'https://boolokgpt.vercel.app/videos/dubai_downtown.mp4',
  'sheikh_zayed.mp4': 'https://boolokgpt.vercel.app/videos/sheikh_zayed.mp4',
  'imtiaz_luxury.mp4': 'https://boolokgpt.vercel.app/videos/imtiaz_luxury.mp4',
  'sobha_hartland.mp4': 'https://boolokgpt.vercel.app/videos/sobha_hartland.mp4',
  'dubai_townhouse.mp4': 'https://boolokgpt.vercel.app/videos/dubai_townhouse.mp4',
  'sai_property_1.mp4': 'https://boolokgpt.vercel.app/videos/dubai_downtown.mp4',
  'sai_property_2.mp4': 'https://boolokgpt.vercel.app/videos/sheikh_zayed.mp4',
  'dinesh_property.mp4': 'https://boolokgpt.vercel.app/videos/dinesh_property.mp4',
  'loki.mp4': 'https://boolokgpt.vercel.app/videos/loki.mp4',
  'alwarpet.mp4': 'https://boolokgpt.vercel.app/videos/alwarpet.mp4',
  'anna_nagar.mp4': 'https://boolokgpt.vercel.app/videos/anna_nagar.mp4',
  'mambakkam.mp4': 'https://boolokgpt.vercel.app/videos/mambakkam.mp4',
  'nanganallur.mp4': 'https://boolokgpt.vercel.app/videos/nanganallur.mp4',
  'pudupakkam.mp4': 'https://boolokgpt.vercel.app/videos/pudupakkam.mp4',
  'royapettah.mp4': 'https://boolokgpt.vercel.app/videos/royapettah.mp4',
  'saidapet.mp4': 'https://boolokgpt.vercel.app/videos/saidapet.mp4',
  'thirumanviyur.mp4': 'https://boolokgpt.vercel.app/videos/thirumanviyur.mp4',
  'thirumanviyur2.mp4': 'https://boolokgpt.vercel.app/videos/thirumanviyur2.mp4',
  'mithulan_property_1.mp4': 'https://boolokgpt.vercel.app/videos/mithulan_property_1.mp4',
  'mithulan_property_2.mp4': 'https://boolokgpt.vercel.app/videos/mithulan_property_2.mp4',
  'mithulan_property_3.mp4': 'https://boolokgpt.vercel.app/videos/mithulan_property_3.mp4',
  'mithulan_property_4.mp4': 'https://boolokgpt.vercel.app/videos/mithulan_property_4.mp4',
  'mithulan_property_5.mp4': 'https://boolokgpt.vercel.app/videos/mithulan_property_5.mp4',
  'mithulan_property_6.mp4': 'https://boolokgpt.vercel.app/videos/mithulan_property_6.mp4',
  'mithulan_property_7.mp4': 'https://boolokgpt.vercel.app/videos/mithulan_property_7.mp4',
  'mithulan_property_8.mp4': 'https://boolokgpt.vercel.app/videos/mithulan_property_8.mp4',
  'mithulan_property_9.mp4': 'https://boolokgpt.vercel.app/videos/mithulan_property_9.mp4',
  'mithulan_property_10.mp4': 'https://boolokgpt.vercel.app/videos/mithulan_property_10.mp4',
  'mithulan_property_11.mp4': 'https://boolokgpt.vercel.app/videos/mithulan_property_11.mp4',
};

const DUMMY_REEL_IDS = new Set([
  '1',
  '2',
  '3',
  '4',
  'sai-reel-coventry',
  '6ae3464eff2e1932b0ec9674',
  'logesh-reel-1',
  'logesh-reel-2',
  'logesh-reel-3',
  'shree-reel-1',
  'ajmal-reel-1',
  'bava-reel-1',
  'akshat-reel-1',
  'prasanth-reel-1',
]);

/**
 * Centralized reel video URL resolver used across Market Insights, My Profile, and Public Profiles.
 * Maps only confirmed static video filenames or authoritative HTTP(S)/stream URLs; never substitutes unrelated property videos.
 */
export function resolveReelVideoUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const clean = rawUrl.trim();
  if (!clean || clean === 'null' || clean === 'undefined') return '';
  if (clean.startsWith('blob:') || clean.startsWith('data:') || clean.startsWith('file:')) return clean;

  const m = clean.match(/\/uploads\/reels\/([^/?#]+)/);
  if (m) {
    const filename = m[1];
    if (CONFIRMED_STATIC_REEL_VIDEOS[filename]) {
      return CONFIRMED_STATIC_REEL_VIDEOS[filename];
    }
    return `${API_BASE_URL}/api/reels/stream/${filename}`;
  }

  if (/^https?:\/\//i.test(clean)) return clean;
  return `${API_BASE_URL}${clean.startsWith('/') ? clean : `/${clean}`}`;
}

/**
 * Centralized reel eligibility filter used across Market Insights and Profiles so list rendering and counts match 1:1.
 */
export function isEligibleReelRecord(r: any): boolean {
  if (!r || typeof r !== 'object') return false;
  if (r.isDeleted === true || r.isArchived === true) return false;
  const rid = String(r._id || r.id || '').trim();
  if (!rid || DUMMY_REEL_IDS.has(rid)) return false;
  const resolvedVideo = resolveReelVideoUrl(r.videoUrl);
  return Boolean(resolvedVideo);
}

async function getStoredToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('[api] Failed to persist auth token:', error);
  }
}

export async function clearStoredToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('[api] Failed to clear auth token:', error);
  }
}

/**
 * Central API fetch helper that automatically attaches the Authorization JWT token header.
 * Use this for EVERY authenticated request (feed posts, reels, uploads, etc.)
 * so no screen accidentally forgets to attach the token.
 */
export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getStoredToken();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${path}`;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn(`[apiFetch] No auth token found for request to ${path} — this will likely 401.`);
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return data as T;
}

const WEB_AUTH_CALLBACK_PATH = '/auth-callback';

type GoogleAuthOptions = {
  onSuccess: (idToken: string) => Promise<void>;
  onError?: (message: string) => void;
};

// ── Native (Android / iOS) ──────────────────────────────────────────────
function useNativeGoogleAuth({ onSuccess, onError }: GoogleAuthOptions) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [configurationError, setConfigurationError] = useState<string | null>(null);

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '166853460121-jdlugm3ncga9qu4vk3b45lda5onusup2.apps.googleusercontent.com';
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS;

  useEffect(() => {
    try {
      if (!webClientId) {
        setConfigurationError('Google Sign-In configuration is missing. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
        return;
      }

      const { GoogleSignin } = require('@react-native-google-signin/google-signin');

      GoogleSignin.configure({
        webClientId,
        iosClientId: Platform.OS === 'ios' ? iosClientId : undefined,
        offlineAccess: false,
      });
      setConfigurationError(null);
    } catch (error: any) {
      const message = error?.message || 'Google Sign-In configuration failed.';
      console.warn('[GoogleSignin Config Notice]:', message);
      setConfigurationError(message);
    }
  }, [webClientId, iosClientId]);

  const promptGoogleSignIn = useCallback(async () => {
    if (configurationError) {
      onError?.(configurationError);
      return;
    }

    setIsGoogleLoading(true);

    const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Clear the remembered Google choice on Android before an explicit login.
      if (Platform.OS === 'android' && GoogleSignin.hasPreviousSignIn()) {
        await GoogleSignin.signOut();
      }

      const result = await GoogleSignin.signIn();
      const idToken = result?.data?.idToken ?? result?.idToken;

      if (!idToken) {
        throw new Error('Google did not return an ID token.');
      }

      await onSuccess(idToken);
    } catch (error: any) {
      if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled — not an error
      } else if (error?.code === statusCodes.IN_PROGRESS) {
        // Already in progress
      } else if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        onError?.('Play services not available or outdated.');
      } else if (error?.code === statusCodes.DEVELOPER_ERROR) {
        onError?.(
          'Google Sign-In is misconfigured for this build (DEVELOPER_ERROR). ' +
          'The SHA-1 fingerprint of this build does not match the one registered in Google Cloud Console for this package name.'
        );
      } else {
        const errDetails = [
          error?.code ? `code: ${error.code}` : '',
          error?.message ? `msg: ${error.message}` : '',
          error?.userInfo ? JSON.stringify(error.userInfo) : '',
        ].filter(Boolean).join(' | ');
        console.error('[GoogleSignin Native Error Details]:', errDetails || error);
        onError?.(errDetails ? `Google sign-in error: ${errDetails}` : (error?.message || 'Google sign-in failed.'));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }, [configurationError, onError, onSuccess]);

  return { promptGoogleSignIn, isGoogleLoading };
}

// ── Web (browser-based OAuth via expo-auth-session) ─────────────────────
function useWebGoogleAuth({ onSuccess, onError }: GoogleAuthOptions) {
  const WebBrowser = require('expo-web-browser');
  const AuthSession = require('expo-auth-session');
  const Google = require('expo-auth-session/providers/google');

  WebBrowser.maybeCompleteAuthSession();

  const redirectUri = useMemo(() => {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}${WEB_AUTH_CALLBACK_PATH}`;
    }
    return AuthSession.makeRedirectUri({
      preferLocalhost: true,
      path: WEB_AUTH_CALLBACK_PATH,
    });
  }, []);

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '166853460121-jdlugm3ncga9qu4vk3b45lda5onusup2.apps.googleusercontent.com';

  const [isExchanging, setIsExchanging] = useState(false);
  const [nonce] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2)}`);

  // Guard against throwing during initial render if webClientId is somehow empty
  const isConfigured = Boolean(webClientId);

  const [request, response, promptAsync] = Google.useAuthRequest(
    isConfigured
      ? {
          webClientId,
          clientId: webClientId,
          redirectUri,
          responseType: AuthSession.ResponseType.IdToken,
          scopes: ['openid', 'profile', 'email'],
          selectAccount: true,
          extraParams: {
            nonce,
            prompt: 'select_account',
          },
        }
      : {
          webClientId: 'unconfigured.apps.googleusercontent.com',
          clientId: 'unconfigured.apps.googleusercontent.com',
          redirectUri,
        }
  );

  useEffect(() => {
    async function processResponse() {
      if (!response) return;

      if (response.type === 'error') {
        onError?.(response.error?.message || 'Google authentication returned an error.');
        return;
      }

      if (response.type === 'dismiss' || response.type === 'cancel') {
        return;
      }

      if (response.type !== 'success') return;

      const idToken = response.authentication?.idToken || response.params?.id_token;

      if (!idToken) {
        onError?.('Google did not return an ID token.');
        return;
      }

      setIsExchanging(true);

      try {
        await onSuccess(idToken);
      } catch (error: any) {
        onError?.(error?.message || 'Google sign-in failed.');
      } finally {
        setIsExchanging(false);
      }
    }

    processResponse();
  }, [onError, onSuccess, response]);

  const promptGoogleSignIn = useCallback(async () => {
    if (!isConfigured) {
      onError?.('Google Sign-In is not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
      return;
    }

    if (!request) {
      onError?.('Google Sign-In is still loading. Try again.');
      return;
    }

    try {
      await promptAsync({
        useProxy: false,
        windowFeatures: { width: 500, height: 650 },
      });
    } catch (err: any) {
      onError?.(err?.message || 'Failed to open Google authentication.');
    }
  }, [isConfigured, onError, promptAsync, request]);

  return {
    promptGoogleSignIn,
    isGoogleLoading: !request || isExchanging,
  };
}

export function useGoogleAuth(options: GoogleAuthOptions) {
  return Platform.OS === 'web' ? useWebGoogleAuth(options) : useNativeGoogleAuth(options);
}

/**
 * Safe, READ-ONLY GET for hosts that sleep (Render free tier can take ~50s+ to wake).
 * Bounded: 60s per attempt, at most 3 attempts, backoff 3s then 8s. Retries only on
 * network failure/timeout or 502/503/504 (typical wake-up responses). Never use for
 * POST/PUT/DELETE or uploads.
 */
export const COLD_START_TIMEOUT_MS = 60000;
const COLD_START_BACKOFF_MS = [3000, 8000];

export async function getWithColdStartRetry<T = any>(url: string, config: any = {}) {
  let lastError: any;
  for (let attempt = 0; attempt <= COLD_START_BACKOFF_MS.length; attempt++) {
    try {
      return await axios.get<T>(url, { ...config, timeout: COLD_START_TIMEOUT_MS });
    } catch (err: any) {
      lastError = err;
      const status = err?.response?.status;
      const retryable = !status || status === 502 || status === 503 || status === 504;
      if (!retryable || attempt === COLD_START_BACKOFF_MS.length) break;
      await new Promise((resolve) => setTimeout(resolve, COLD_START_BACKOFF_MS[attempt]));
    }
  }
  throw lastError;
}

