import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import * as Font from 'expo-font';
import { MaterialIcons, MaterialCommunityIcons, Feather, Ionicons, FontAwesome } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import StorageConsentBanner from '../components/StorageConsentBanner';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootLayoutNav() {
  const { isDark } = useTheme();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.backgroundColor = isDark ? '#060b13' : '#ffffff';
      if (!document.title || document.title === 'boolokgpt') {
        document.title = 'Boolok AI - AI Agent For Real Estate Services';
      }
      if (!document.querySelector('meta[name="google-site-verification"]')) {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'google-site-verification');
        meta.setAttribute('content', '1EGLvEwSBWIt9oM3P3XbSWZ8hgGFrF-Jr4rnAlWv28E');
        document.head.appendChild(meta);
      }
    }
  }, [isDark]);

  return (
    <View style={{ flex: 1, height: '100%', width: '100%' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: isDark ? '#060b13' : '#ffffff', flex: 1, height: '100%' },
        }}
      >
        {/* Public routes: never wrapped by the authenticated app layout */}
        <Stack.Screen name="index" />
        <Stack.Screen name="brand-vision" />

        {/*
          FIX: explicitly registered. This Stack declares its children
          manually, which stops expo-router from auto-registering any
          file not listed here — auth-callback.tsx existed on disk but
          was invisible to the router without this line, producing
          "Unmatched Route" every time Google's OAuth popup redirected
          back to it.
        */}
        <Stack.Screen name="auth-callback" />

        {/* Route groups */}
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>

      {/* First-launch storage/consent notice — shown once, auto-dismissed */}
      <StorageConsentBanner />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        if (Platform.OS === 'web') {
          const linkId = 'google-font-poppins';
          if (typeof document !== 'undefined' && !document.getElementById(linkId)) {
            const link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            link.href =
              'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap';
            document.head.appendChild(link);

            const styleEl = document.createElement('style');
            styleEl.id = 'poppins-global-style';
            styleEl.innerHTML = `
              @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
              
              @font-face {
                font-family: 'Poppins_400Regular';
                src: local('Poppins'), local('Poppins-Regular'), url('https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrJJfecg.woff2') format('woff2');
                font-weight: 400;
                font-style: normal;
              }
              @font-face {
                font-family: 'Poppins_500Medium';
                src: local('Poppins Medium'), local('Poppins-Medium'), url('https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLGT9Z1xlFQ.woff2') format('woff2');
                font-weight: 500;
                font-style: normal;
              }
              @font-face {
                font-family: 'Poppins_600SemiBold';
                src: local('Poppins SemiBold'), local('Poppins-SemiBold'), url('https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2') format('woff2');
                font-weight: 600;
                font-style: normal;
              }
              @font-face {
                font-family: 'Poppins_700Bold';
                src: local('Poppins Bold'), local('Poppins-Bold'), url('https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2') format('woff2');
                font-weight: 700;
                font-style: normal;
              }
              
              html, body {
                font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              }
              input, textarea, button, select {
                font-family: inherit;
              }
            `;
            document.head.appendChild(styleEl);
          }
        }

        await Font.loadAsync({
          Poppins_400Regular,
          Poppins_500Medium,
          Poppins_600SemiBold,
          Poppins_700Bold,
          ...MaterialIcons.font,
          ...MaterialCommunityIcons.font,
          ...Feather.font,
          ...Ionicons.font,
          ...FontAwesome.font,
        });
      } catch (err) {
        console.warn('Font load error:', err);
      } finally {
        setFontsLoaded(true);
        SplashScreen.hideAsync().catch(() => undefined);
      }
    }

    loadFonts();
  }, []);

  if (Platform.OS !== 'web' && !fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}