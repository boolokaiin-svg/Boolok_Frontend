// app/(auth)/auth-callback.tsx
//
// This page's only job: run when the Google OAuth popup redirects here
// after sign-in. Calling WebBrowser.maybeCompleteAuthSession() tells
// expo-auth-session "the flow is done" — it closes the popup and hands
// the result back to whatever called promptAsync() in the main window
// (see useWebGoogleAuth in lib/api.ts). This page is never seen for more
// than a split second; it should never be reached on native (Android/iOS),
// only inside the web OAuth popup.

import { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthCallbackScreen() {
    useEffect(() => {
        if (Platform.OS === 'web') {
            const WebBrowser = require('expo-web-browser');
            WebBrowser.maybeCompleteAuthSession();
        }
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.center}>
                <Text style={styles.text}>Signing you in…</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050505' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    text: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});