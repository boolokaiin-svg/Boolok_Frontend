import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../lib/api';
import { followStore } from '../lib/followStore';

const TOKEN_KEY = 'userToken';
const USER_KEY = 'userData';

export type AuthUser = {
  id: string;
  _id?: string;
  fullName: string;
  username?: string | null;
  email: string;
  profilePicture?: string | null;
  coverImage?: string | null;
  headline?: string | null;
  location?: string | null;
  bio?: string | null;
  closedDeals?: string | null;
  goal?: string | null;
  role?: string | null;
  authProvider?: string | null;
  followers?: any[];
  following?: any[];
  followerCount?: number;
  followingCount?: number;
  isPro?: boolean;
  subscription?: {
    plan?: string;
    status?: string;
  };
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  connectionError: boolean;
  retryRestoreSession: () => void;
  signIn: (token: string, user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updatedFields: Partial<AuthUser>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function saveValue(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function readValue(key: string) {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function removeValue(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const restoreSession = useCallback(async () => {
    setLoading(true);
    setConnectionError(false);
    try {
      const storedToken = await readValue(TOKEN_KEY);
      const storedUser = await readValue(USER_KEY);

      if (storedToken && storedUser) {
        let parsed: AuthUser | null = null;
        try {
          parsed = JSON.parse(storedUser);
        } catch {
          parsed = null;
        }

        if (parsed) {
          if (
            (parsed.username === 'saivimenthanvl' || parsed.email === 'saivimenthanvl@gmail.com') &&
            parsed.fullName !== 'Sai Vimenthan V L'
          ) {
            parsed.fullName = 'Sai Vimenthan V L';
          }
          if (isMountedRef.current) {
            setToken(storedToken);
            setUser(parsed);
          }
        }

        // Bounded backend check: 10s deadline to prevent infinite spinner if backend sleeps
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          const apiRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (apiRes.status === 401 || apiRes.status === 403) {
            console.warn('[auth] Stored session token is expired or invalid. Clearing credentials.');
            await removeValue(TOKEN_KEY);
            await removeValue(USER_KEY);
            if (isMountedRef.current) {
              setToken(null);
              setUser(null);
            }
          } else if (apiRes.ok) {
            const resData = await apiRes.json();
            if (resData?.user && isMountedRef.current) {
              const freshUser = { ...(parsed || {}), ...resData.user };
              if (
                freshUser.username === 'saivimenthanvl' ||
                freshUser.email === 'saivimenthanvl@gmail.com'
              ) {
                freshUser.fullName = 'Sai Vimenthan V L';
              }
              setUser(freshUser);
              await saveValue(USER_KEY, JSON.stringify(freshUser));
            }
          }
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          console.warn('[auth] Could not refresh user profile from backend:', fetchErr?.message || fetchErr);
          // Do NOT wipe credentials on timeout or network error; retain stored session
          if (isMountedRef.current && (!parsed || !storedToken)) {
            setConnectionError(true);
          }
        }
      }
    } catch (error) {
      console.error('Failed to restore authentication session:', error);
      await removeValue(TOKEN_KEY);
      await removeValue(USER_KEY);
      if (isMountedRef.current) {
        setToken(null);
        setUser(null);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const FOLLOWING_SET_KEY = 'boolok_following_users_set';

  const signIn = async (newToken: string, newUser: AuthUser) => {
    followStore.clear();
    await removeValue(FOLLOWING_SET_KEY);
    const resolvedUser = { ...newUser };
    if (resolvedUser && (resolvedUser.username === 'saivimenthanvl' || resolvedUser.email === 'saivimenthanvl@gmail.com')) {
      resolvedUser.fullName = 'Sai Vimenthan V L';
    }
    await saveValue(TOKEN_KEY, newToken);
    await saveValue(USER_KEY, JSON.stringify(resolvedUser));
    setToken(newToken);
    setUser(resolvedUser);
  };

  const signOut = async () => {
    followStore.clear();
    await removeValue(FOLLOWING_SET_KEY);
    await removeValue(TOKEN_KEY);
    await removeValue(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const updateUser = async (updatedFields: Partial<AuthUser>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updatedFields };
    await saveValue(USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const isAuthenticated = useMemo(() => Boolean(token && user), [token, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        connectionError,
        retryRestoreSession: restoreSession,
        signIn,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
