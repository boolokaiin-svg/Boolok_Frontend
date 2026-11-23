import React from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { resolveImageUrl } from '../lib/api';

type Props = {
  visible: boolean;
  author: any;
  content: string;
  image: string | null;
  publishing: boolean;
  error: string;
  onChange: (text: string) => void;
  onChoosePhoto: () => void;
  onRemovePhoto: () => void;
  onPublish: () => void;
  onClose: () => void;
};

export default function ProfilePostComposer(props: Props) {
  const { isDark } = useTheme();
  const fg = isDark ? '#f8fafc' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const surface = isDark ? '#142238' : '#f1f5f9';
  const border = isDark ? '#26354a' : '#e2e8f0';
  const disabled = props.publishing || (!props.content.trim() && !props.image);
  const avatar = resolveImageUrl(props.author?.profilePicture);
  const name = props.author?.fullName || 'Member';
  return <Modal visible={props.visible} transparent animationType="fade" onRequestClose={() => { if (!props.publishing) props.onClose(); }}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
      <View style={[styles.sheet, { backgroundColor: isDark ? '#0c1626' : '#fff', borderColor: border }]}>
        <View style={[styles.header, { borderBottomColor: border }]}>
          <View style={{ flex: 1, gap: 4 }}><Text style={[styles.title, { color: fg }]}>Create a post</Text><Text style={{ color: muted, fontSize: 13 }}>Share a property, an update, or an idea.</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close post composer" disabled={props.publishing} onPress={props.onClose} style={({ pressed }) => [styles.close, { backgroundColor: surface, opacity: props.publishing ? 0.5 : 1 }, pressed && styles.pressed]}><MaterialIcons name="close" size={22} color={fg} /></Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} style={{ flexShrink: 1 }}>
          <View style={styles.author}>
            {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : <View style={[styles.avatar, { backgroundColor: isDark ? '#3a3017' : '#fef3c7', alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontSize: 20, color: '#b8860b', fontWeight: '800' }}>{name[0]?.toUpperCase()}</Text></View>}
            <View style={{ flex: 1, gap: 5 }}><Text numberOfLines={1} style={{ color: fg, fontWeight: '700', fontSize: 15 }}>{name}</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><MaterialIcons name="public" size={14} color={muted} /><Text style={{ color: muted, fontSize: 12 }}>BoolokOne community</Text></View></View>
          </View>
          <View style={[styles.inputWrap, { backgroundColor: isDark ? '#0a1322' : '#fafbfc', borderColor: border }]}>
            <TextInput accessibilityLabel="Post caption or property details" value={props.content} onChangeText={props.onChange} editable={!props.publishing} multiline textAlignVertical="top" placeholder="What would you like to share?" placeholderTextColor={muted} selectionColor="#daa520" style={[styles.input, { color: fg }]} />
          </View>
          {props.image && <View style={[styles.preview, { borderColor: border, backgroundColor: surface }]}>
            <Image source={{ uri: props.image }} style={styles.previewImage} resizeMode="contain" />
            <Pressable accessibilityRole="button" accessibilityLabel="Remove attached photo" disabled={props.publishing} onPress={props.onRemovePhoto} style={({ pressed }) => [styles.remove, { backgroundColor: isDark ? '#142238' : '#fff', borderColor: border }, pressed && styles.pressed]}><MaterialIcons name="delete-outline" size={18} color={isDark ? '#fca5a5' : '#b91c1c'} /><Text style={{ color: isDark ? '#fca5a5' : '#b91c1c', fontWeight: '700', fontSize: 12 }}>Remove</Text></Pressable>
          </View>}
          <Pressable accessibilityRole="button" disabled={props.publishing} onPress={props.onChoosePhoto} style={({ pressed }) => [styles.photoButton, { borderColor: isDark ? '#665222' : '#e9cd7e', backgroundColor: isDark ? '#2a2416' : '#fffbeb', opacity: props.publishing ? 0.5 : 1 }, pressed && styles.pressed]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}><MaterialIcons name="add-photo-alternate" size={23} color={isDark ? '#f2c654' : '#946200'} /><Text style={{ color: fg, fontWeight: '700', fontSize: 14 }}>{props.image ? 'Change photo' : 'Add photo'}</Text></View><MaterialIcons name="add" size={22} color={fg} />
          </Pressable>
          {Boolean(props.error) && <View style={[styles.error, { backgroundColor: isDark ? '#351b24' : '#fef2f2' }]}><MaterialIcons name="error-outline" size={20} color={isDark ? '#fca5a5' : '#b91c1c'} /><Text accessibilityRole="alert" style={{ flex: 1, color: isDark ? '#fca5a5' : '#b91c1c', lineHeight: 20 }}>{props.error}</Text></View>}
        </ScrollView>
        <View style={[styles.footer, { borderTopColor: border }]}>
          <Pressable accessibilityRole="button" disabled={props.publishing} onPress={props.onClose} style={({ pressed }) => [styles.button, { flex: 1, backgroundColor: surface, borderColor: border, borderWidth: 1, opacity: props.publishing ? 0.5 : 1 }, pressed && styles.pressed]}><Text style={{ color: fg, fontWeight: '700' }}>Cancel</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={disabled} onPress={props.onPublish} style={({ pressed }) => [styles.button, { flex: 1.5, backgroundColor: '#daa520', opacity: disabled ? 0.5 : 1 }, pressed && styles.pressed]}>{props.publishing ? <ActivityIndicator size="small" color="#111827" /> : <MaterialIcons name="send" size={18} color="#111827" />}<Text style={{ color: '#111827', fontWeight: '800' }}>{props.publishing ? 'Publishing...' : 'Publish post'}</Text></Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, padding: 16, backgroundColor: 'rgba(5,12,24,0.6)', alignItems: 'center', justifyContent: 'center' },
  sheet: { width: '100%', maxWidth: 580, maxHeight: '90%', borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 22, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20, gap: 18 },
  author: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  inputWrap: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  input: { minHeight: 160, maxHeight: 280, padding: 16, fontSize: 16, lineHeight: 25, ...Platform.select({ web: { outlineStyle: 'none' } as any }) },
  photoButton: { minHeight: 54, paddingHorizontal: 16, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  preview: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  previewImage: { width: '100%', height: 220 },
  remove: { position: 'absolute', top: 10, right: 10, minHeight: 40, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  footer: { padding: 20, borderTopWidth: 1, flexDirection: 'row', gap: 12 },
  button: { minHeight: 48, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  error: { borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
