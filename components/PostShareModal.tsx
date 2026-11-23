import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL, resolveImageUrl } from '../lib/api';
import { createPostShare } from '../lib/postShare';

export default function PostShareModal({ post, onClose }: { post: any; onClose: () => void }) {
  const { token, user } = useAuth();
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const inFlight = useRef(new Set<string>());
  const fg = isDark ? '#fff' : '#0f172a';
  useEffect(() => { setQuery(''); setSent({}); setError(''); }, [post?._id]);
  useEffect(() => {
    if (!post) return;
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = query.trim()
          ? await axios.get(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(query.trim())}`, { headers })
          : await axios.get(`${API_BASE_URL}/api/messages/conversations`, { headers });
        const rows = query.trim() ? (res.data.results || res.data.users || []) : (res.data.conversations || []).map((c: any) => c.otherUser).filter(Boolean);
        const ownId = String(user?.id || (user as any)?._id);
        const unique = new Map(rows.filter((u: any) => String(u._id || u.id) !== ownId).map((u: any) => [String(u._id || u.id), u]));
        if (!cancelled) { setContacts([...unique.values()]); setError(''); }
      } catch { if (!cancelled) setError('Could not load people. Try searching again.'); }
      finally { if (!cancelled) setLoading(false); }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [post?._id, query, token]);
  const send = async (contact: any) => {
    const id = String(contact._id || contact.id);
    if (inFlight.current.has(id) || sent[id]) return;
    inFlight.current.add(id); setSending(prev => ({ ...prev, [id]: true })); setError('');
    try {
      await axios.post(`${API_BASE_URL}/api/messages/send`, { recipientId: id, text: createPostShare(post) }, { headers: { Authorization: `Bearer ${token}` } });
      setSent(prev => ({ ...prev, [id]: true }));
    } catch { setError('Could not share this post. Please try again.'); }
    finally { inFlight.current.delete(id); setSending(prev => ({ ...prev, [id]: false })); }
  };
  const muted = isDark ? '#94a3b8' : '#64748b';
  const surface = isDark ? '#142238' : '#f1f5f9';
  const image = resolveImageUrl(post?.mediaUrl || post?.mediaUrls?.[0]);
  return <Modal visible={Boolean(post)} transparent animationType="slide" onRequestClose={onClose}>
    <View style={[styles.backdrop, { justifyContent: width < 600 ? 'flex-end' : 'center', padding: width < 600 ? 0 : 24 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss sharing" onPress={onClose} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.sheet, { backgroundColor: isDark ? '#0c1626' : '#fff', paddingBottom: Math.max(20, insets.bottom), borderBottomLeftRadius: width < 600 ? 0 : 24, borderBottomRightRadius: width < 600 ? 0 : 24 }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View style={styles.row}><MaterialIcons name="send" size={22} color="#daa520" /><Text style={[styles.title, { color: fg }]}>Share post</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close sharing" onPress={onClose} style={({ pressed }) => [styles.iconButton, { backgroundColor: surface }, pressed && styles.pressed]}><MaterialIcons name="close" size={22} color={fg} /></Pressable>
        </View>
        <View style={[styles.preview, { backgroundColor: surface }]}>
          {image ? <Image source={{ uri: image }} style={styles.previewImage} /> : <View style={[styles.previewImage, styles.fallback]}><MaterialIcons name="article" size={24} color="#daa520" /></View>}
          <View style={{ flex: 1, gap: 4 }}><Text style={{ color: fg, fontWeight: '700' }} numberOfLines={1}>{post?.author?.fullName || 'Member'}’s post</Text><Text style={{ color: muted, fontSize: 12, lineHeight: 18 }} numberOfLines={2}>{post?.content || 'Photo post'}</Text></View>
        </View>
        <View style={[styles.search, { backgroundColor: surface }]}>
          <MaterialIcons name="search" size={22} color={muted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search people" accessibilityLabel="Search people" placeholderTextColor={muted} style={[styles.input, { color: fg }]} />
          {Boolean(query) && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.iconButton}><MaterialIcons name="cancel" size={20} color={muted} /></Pressable>}
        </View>
        {Boolean(error) && <Text accessibilityRole="alert" style={{ color: '#dc6b35' }}>{error}</Text>}
        <Text style={{ color: muted, fontSize: 12, fontWeight: '600' }}>{query ? 'SEARCH RESULTS' : 'RECENT CHATS'}</Text>
        {loading ? <View style={styles.empty}><ActivityIndicator color="#daa520" /></View> : <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
          {contacts.length === 0 && <Text style={[styles.empty, { color: muted }]}>Search for a person to share this post.</Text>}
          {contacts.map(contact => {
            const id = String(contact._id || contact.id);
            const name = contact.fullName || contact.username || 'Member';
            const avatar = resolveImageUrl(contact.profilePicture);
            return <View key={id} style={styles.contact}>
              {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : <View style={[styles.avatar, styles.fallback]}><Text style={{ color: '#aa7b08', fontWeight: '800', fontSize: 18 }}>{name[0].toUpperCase()}</Text></View>}
              <View style={{ flex: 1, gap: 3 }}><Text style={{ color: fg, fontWeight: '600', fontSize: 14 }} numberOfLines={1}>{name}</Text><Text style={{ color: muted, fontSize: 12 }} numberOfLines={1}>{contact.username ? `@${contact.username}` : 'BoolokOne member'}</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel={`${sent[id] ? 'Post sent to' : 'Send post to'} ${name}`} disabled={sending[id] || sent[id]} onPress={() => send(contact)} style={({ pressed }) => [styles.sendButton, { backgroundColor: sent[id] ? '#15803d' : '#daa520', opacity: sending[id] ? 0.65 : 1 }, pressed && styles.pressed]}>
                {sending[id] ? <ActivityIndicator size="small" color="#111827" /> : <><MaterialIcons name={sent[id] ? 'check' : 'send'} size={16} color={sent[id] ? '#fff' : '#111827'} /><Text style={{ color: sent[id] ? '#fff' : '#111827', fontWeight: '700' }}>{sent[id] ? 'Sent' : 'Send'}</Text></>}
              </Pressable>
            </View>;
          })}
        </ScrollView>}
        <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.doneButton, { backgroundColor: surface }, pressed && styles.pressed]}><Text style={{ color: fg, fontWeight: '700' }}>Done</Text></Pressable>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 480, maxHeight: '85%', borderRadius: 24, padding: 20, gap: 16 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#94a3b8', alignSelf: 'center', opacity: 0.5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 20, fontWeight: '800' },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  preview: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 14 },
  previewImage: { width: 56, height: 64, borderRadius: 8 },
  fallback: { backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingLeft: 12 },
  input: { flex: 1, minWidth: 0, padding: 12, height: 48, fontSize: 14 },
  contact: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  sendButton: { minWidth: 88, minHeight: 44, borderRadius: 22, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  doneButton: { minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  empty: { paddingVertical: 28, textAlign: 'center' },
});
