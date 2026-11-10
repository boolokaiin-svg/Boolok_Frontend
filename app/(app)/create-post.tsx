// app/(app)/create-post.tsx

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    Image,
    StyleSheet,
    Platform,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

import { API_BASE_URL } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import Avatar from '../../components/Avatar';

async function getStoredToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
        return localStorage.getItem('userToken');
    }
    const SecureStore = require('expo-secure-store');
    return SecureStore.getItemAsync('userToken');
}

type PickedImage = {
    uri: string;
    name: string;
    mimeType: string;
};

export default function CreatePostScreen() {
    const { user } = useAuth();
    const { theme, isDark } = useTheme();

    const [content, setContent] = useState('');
    const [image, setImage] = useState<PickedImage | null>(null);
    const [posting, setPosting] = useState(false);

    const showMessage = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const pickImage = async () => {
        if (Platform.OS !== 'web') {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                showMessage('Permission needed', 'Allow photo access to attach an image.');
                return;
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
        });

        if (result.canceled || !result.assets?.length) return;

        const asset = result.assets[0];
        const fileName = asset.fileName || asset.uri.split('/').pop() || `photo-${Date.now()}.jpg`;
        const mimeType = asset.mimeType || 'image/jpeg';

        setImage({ uri: asset.uri, name: fileName, mimeType });
    };

    const removeImage = () => setImage(null);

    const canPost = (content.trim().length > 0 || image !== null) && !posting;

    const handlePost = async () => {
        if (!canPost) return;
        setPosting(true);

        try {
            const token = await getStoredToken();

            if (!token) {
                showMessage('Not signed in', 'Please sign in again before posting.');
                setPosting(false);
                router.replace('/(auth)/login');
                return;
            }

            const formData = new FormData();
            formData.append('content', content.trim());

            if (image) {
                if (Platform.OS === 'web') {
                    // On web, fetch the blob from the local URI before appending
                    const response = await fetch(image.uri);
                    const blob = await response.blob();
                    formData.append('image', blob, image.name);
                } else {
                    formData.append('image', {
                        uri: image.uri,
                        name: image.name,
                        type: image.mimeType,
                    } as any);
                }
            }

            const uploadResponse = await fetch(`${API_BASE_URL}/api/feed`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    // Do NOT set Content-Type manually — the browser/native runtime
                    // sets the correct multipart boundary automatically for FormData.
                },
                body: formData,
            });

            const data = await uploadResponse.json().catch(() => ({}));

            if (!uploadResponse.ok) {
                throw new Error(data.message || `Failed to post (status ${uploadResponse.status})`);
            }

            setContent('');
            setImage(null);
            router.replace('/(app)/feed');
        } catch (error: any) {
            console.error('CREATE POST ERROR:', error);
            showMessage('Post failed', error?.message || 'Something went wrong while posting.');
        } finally {
            setPosting(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={[styles.container, { backgroundColor: theme.surfaceContainerLowest }]}
                contentContainerStyle={styles.content}
            >
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} hitSlop={10} disabled={posting}>
                        <MaterialIcons name="close" size={26} color={theme.onSurface} />
                    </Pressable>
                    <Text style={[typography.headlineSm, { color: theme.onSurface }]}>New Post</Text>
                    <Pressable
                        onPress={handlePost}
                        disabled={!canPost}
                        style={[
                            styles.postButton,
                            { backgroundColor: theme.primary },
                            !canPost && { opacity: 0.5 },
                        ]}
                    >
                        {posting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.postButtonText}>Post</Text>
                        )}
                    </Pressable>
                </View>

                <View style={styles.userRow}>
                    <Avatar user={user} size={36} style={{ marginRight: spacing.sm }} />
                    <Text style={[typography.labelMd, { color: theme.onSurface }]}>
                        {user?.fullName || 'You'}
                    </Text>
                </View>

                <TextInput
                    style={[styles.textInput, { color: theme.onSurface }]}
                    placeholder="What's on your mind?"
                    placeholderTextColor={theme.outline}
                    value={content}
                    onChangeText={setContent}
                    multiline
                    editable={!posting}
                />

                {image && (
                    <View style={styles.imagePreviewWrap}>
                        <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                        <Pressable style={styles.removeImageBtn} onPress={removeImage} disabled={posting}>
                            <MaterialIcons name="close" size={18} color="#fff" />
                        </Pressable>
                    </View>
                )}

                <Pressable
                    style={[styles.attachButton, { borderColor: theme.outlineVariant }]}
                    onPress={pickImage}
                    disabled={posting}
                >
                    <MaterialIcons name="image" size={22} color={theme.primary} />
                    <Text style={[typography.labelMd, { color: theme.primary, marginLeft: spacing.sm }]}>
                        {image ? 'Change photo' : 'Add photo'}
                    </Text>
                </Pressable>
            </ScrollView>

            {/* ── Uploading Animation Overlay ── */}
            {posting && (
                <View
                    style={[
                        StyleSheet.absoluteFillObject,
                        {
                            backgroundColor: isDark ? 'rgba(6, 11, 19, 0.94)' : 'rgba(255, 255, 255, 0.94)',
                            zIndex: 9999,
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 24,
                        },
                    ]}
                >
                    <View
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            borderWidth: 3,
                            borderColor: 'rgba(218, 165, 32, 0.25)',
                            borderTopColor: theme.primary,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 18,
                            shadowColor: theme.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35,
                            shadowRadius: 12,
                        }}
                    >
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>

                    <Text style={{ color: theme.onSurface, fontSize: 16, fontWeight: '800', marginBottom: 6 }}>
                        {image ? 'Uploading image & publishing post...' : 'Publishing your post...'}
                    </Text>
                    <Text style={{ color: theme.onSurfaceVariant, fontSize: 12, textAlign: 'center' }}>
                        Synchronizing with Boolok Real Estate Network
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: spacing.xl },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    postButton: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: radius.lg,
        minWidth: 72,
        alignItems: 'center',
    },
    postButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatar: { width: 36, height: 36, borderRadius: 18, marginRight: spacing.sm },
    avatarFallback: { justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { color: '#fff', fontWeight: '700' },
    textInput: {
        fontSize: 17,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: spacing.md,
    },
    imagePreviewWrap: {
        position: 'relative',
        marginBottom: spacing.md,
        borderRadius: radius.lg,
        overflow: 'hidden',
    },
    imagePreview: { width: '100%', aspectRatio: 4 / 3 },
    removeImageBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 14,
        padding: 4,
    },
    attachButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: radius.lg,
        paddingVertical: 14,
    },
});