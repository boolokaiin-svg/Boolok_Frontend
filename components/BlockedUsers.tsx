import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../lib/api';
import { notifySafetyChanged } from '../lib/safetyEvents';

export default function BlockedUsers() {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const load = async () => {
    setVisible(true); setLoading(true); setError('');
    try { const data = await apiFetch<{ users: any[] }>('/api/safety/blocks'); setUsers(data.users); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };
  const unblock = async (id: string) => {
    if (pending) return;
    setPending(id); setError('');
    try {
      await apiFetch(`/api/safety/blocks/${id}`, { method: 'DELETE' });
      setUsers(current => current.filter(u => u._id !== id));
      notifySafetyChanged();
    } catch (e: any) { setError(e.message); }
    finally { setPending(null); }
  };
  return <>
    <Pressable accessibilityRole="button" onPress={load} style={{ padding: 18 }}>
      <Text style={{ color: theme.onSurface, fontWeight: '600' }}>Blocked users</Text>
      <Text style={{ color: theme.onSurfaceVariant, marginTop: 4 }}>Manage who can interact with you</Text>
    </Pressable>
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View accessibilityViewIsModal style={{ maxHeight: '80%', maxWidth: 500, width: '100%', alignSelf: 'center', padding: 20, borderRadius: 16, backgroundColor: theme.surfaceContainer }}>
          <Text accessibilityRole="header" style={{ color: theme.onSurface, fontSize: 21, fontWeight: '700', marginBottom: 16 }}>Blocked users</Text>
          {loading ? <ActivityIndicator color={theme.primary} /> : <ScrollView>
            {!users.length && !error && <Text style={{ color: theme.onSurfaceVariant }}>You haven't blocked anyone.</Text>}
            {users.map(u => <View key={u._id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 }}>
              <View style={{ flex: 1 }}><Text style={{ color: theme.onSurface, fontWeight: '600' }}>{u.fullName || u.username}</Text>
                {!!u.username && <Text style={{ color: theme.onSurfaceVariant }}>@{u.username}</Text>}</View>
              <Pressable accessibilityRole="button" accessibilityLabel={`Unblock ${u.fullName || u.username}`} disabled={!!pending} onPress={() => unblock(u._id)} style={{ padding: 10 }}>
                <Text style={{ color: theme.primary }}>{pending === u._id ? 'Unblocking…' : 'Unblock'}</Text>
              </Pressable>
            </View>)}
          </ScrollView>}
          {!!error && <Text accessibilityRole="alert" style={{ color: '#dc2626', marginTop: 12 }}>{error}</Text>}
          <Pressable accessibilityRole="button" onPress={() => setVisible(false)} style={{ padding: 14, alignSelf: 'flex-end' }}><Text style={{ color: theme.onSurface }}>Close</Text></Pressable>
        </View>
      </View>
    </Modal>
  </>;
}
