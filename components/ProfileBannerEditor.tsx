import React, { useState } from 'react';
import { Modal, View, Text, Image, Pressable, ActivityIndicator, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL, resolveImageUrl } from '../lib/api';

export default function ProfileBannerEditor({ cover, onClose, onSaved }: { cover?: string; onClose: () => void; onSaved: (url: string) => Promise<void> }) {
  const { token } = useAuth();
  const { isDark } = useTheme();
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fg = isDark ? '#fff' : '#0f172a';
  const choose = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [3, 1], quality: 0.9 });
      if (result.canceled) return;
      const picked = result.assets[0];
      if (picked.fileSize && picked.fileSize > 10 * 1024 * 1024) { setError('Choose an image smaller than 10 MB.'); return; }
      if (picked.mimeType && !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(picked.mimeType)) { setError('Choose a JPG, PNG, or WEBP image.'); return; }
      setAsset(picked); setError('');
    } catch { setError('Could not open your photos. Please try again.'); }
  };
  const save = async () => {
    if (!asset || saving) return;
    setSaving(true); setError('');
    try {
      if (!token) throw new Error('Please sign in again to update your banner.');
      const form = new FormData();
      const mime = asset.mimeType || 'image/jpeg';
      const name = asset.fileName || `banner.${mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'}`;
      if (Platform.OS === 'web') form.append('cover', asset.file || await (await fetch(asset.uri)).blob(), name);
      else form.append('cover', { uri: asset.uri, name, type: mime } as any);
      const response = await fetch(`${API_BASE_URL}/api/users/cover`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.coverImage) throw new Error(data.message || 'Could not upload banner. Please try again.');
      await onSaved(data.coverImage);
      onClose();
    } catch (err: any) { setError(err.message || 'Could not save banner. Please try again.'); }
    finally { setSaving(false); }
  };
  const button = (pressed: boolean, primary = false) => ({ minHeight: 48, borderRadius: 12, paddingHorizontal: 18, alignItems: 'center' as const, justifyContent: 'center' as const, flexDirection: 'row' as const, gap: 8, backgroundColor: primary ? '#daa520' : isDark ? '#1a273c' : '#e2e8f0', opacity: saving ? 0.65 : pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] });
  return <Modal visible transparent animationType="fade" onRequestClose={() => { if (!saving) onClose(); }}>
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <View style={{ width: '100%', maxWidth: 540, backgroundColor: isDark ? '#0c1626' : '#fff', padding: 20, borderRadius: 20, gap: 18 }}>
        <Text style={{ color: fg, fontSize: 20, fontWeight: '800' }}>Edit profile banner</Text>
        <Image source={{ uri: asset?.uri || resolveImageUrl(cover) || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200' }} resizeMode="cover" style={{ width: '100%', aspectRatio: 3, borderRadius: 12 }} />
        <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 13 }}>Choose a wide JPG, PNG, or WEBP image, up to 10 MB. Your saved banner is visible to everyone who views your profile.</Text>
        {Boolean(error) && <Text accessibilityRole="alert" style={{ color: '#ef4444' }}>{error}</Text>}
        <Pressable accessibilityRole="button" disabled={saving} onPress={choose} style={({ pressed }) => button(pressed)}><MaterialIcons name="add-photo-alternate" size={20} color={fg} /><Text style={{ color: fg, fontWeight: '700' }}>{asset ? 'Choose another image' : 'Choose image'}</Text></Pressable>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable accessibilityRole="button" disabled={saving} onPress={onClose} style={({ pressed }) => [button(pressed), { flex: 1 }]}><Text style={{ color: fg, fontWeight: '700' }}>Cancel</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={!asset || saving} onPress={save} style={({ pressed }) => [button(pressed, true), { flex: 1, opacity: !asset ? 0.45 : saving ? 0.7 : 1 }]}>{saving && <ActivityIndicator size="small" color="#111827" />}<Text style={{ color: '#111827', fontWeight: '700' }}>{saving ? 'Saving...' : 'Save banner'}</Text></Pressable>
        </View>
      </View>
    </View>
  </Modal>;
}
