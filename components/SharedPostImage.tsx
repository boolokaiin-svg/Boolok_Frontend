import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, resolveImageUrl } from '../lib/api';

export default function SharedPostImage({ postId, image, isDark }: { postId: string; image: string | null; isDark: boolean }) {
  const { token } = useAuth();
  const [uri, setUri] = useState(image);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setUri(image); setFailed(false);
    if (!image && token) {
      axios.get(`${API_BASE_URL}/api/feed/${postId}/details`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => { if (!cancelled) setUri(res.data.post?.mediaUrl || res.data.post?.mediaUrls?.[0] || null); })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [postId, image, token]);
  if (!uri || failed) return <View style={{ height: 90, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#142238' : '#f1f5f9' }}><MaterialIcons name="article" size={32} color="#daa520" /></View>;
  return <Image source={{ uri: resolveImageUrl(uri)! }} onError={() => setFailed(true)} resizeMode="contain" style={{ width: '100%', height: 210, backgroundColor: isDark ? '#050a14' : '#f1f5f9' }} />;
}
