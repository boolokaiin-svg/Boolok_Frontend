import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getPostImageCandidates } from '../lib/postMedia';

export default function PostImage({ post, style, resizeMode = 'cover' }: { post: any; style: StyleProp<ImageStyle>; resizeMode?: 'cover' | 'contain' }) {
  const { isDark } = useTheme();
  const candidates = getPostImageCandidates(post);
  const [sourceIndex, setSourceIndex] = useState(0);
  const uri = candidates[sourceIndex] || candidates[0] || null;
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = () => { setAttempt(value => value + 1); setSourceIndex(0); setFailed(false); };
  useEffect(() => { setSourceIndex(0); setFailed(false); }, [post?.imageUrl, post?.mediaUrl, post?.image, post?.mediaUrls?.[0]]);
  const source = uri && attempt > 0 && /\/api\/feed\/[a-f\d]{24}\/image$/.test(uri) ? `${uri}?retry=${attempt}` : uri;
  if (source && !failed) return <Image key={`${sourceIndex}-${attempt}`} source={{ uri: source }} style={style} resizeMode={resizeMode} onError={() => {
    if (sourceIndex + 1 < candidates.length) {
      setSourceIndex(sourceIndex + 1);
      return;
    }
    console.warn('Post photo failed to load', { postId: post?._id, source: uri?.startsWith('data:') ? 'embedded image' : uri?.split('?')[0] });
    setFailed(true);
  }} />;
  return <View style={[style as StyleProp<ViewStyle>, { backgroundColor: isDark ? '#142238' : '#f1f5f9', alignItems: 'center', justifyContent: 'center', padding: 18, gap: 10 }]}>
    <MaterialIcons name={uri ? 'broken-image' : 'article'} size={30} color={isDark ? '#94a3b8' : '#64748b'} />
    <Text numberOfLines={3} style={{ color: isDark ? '#cbd5e1' : '#475569', textAlign: 'center', lineHeight: 21 }}>{uri ? 'Image unavailable' : post?.content || post?.title || 'Post'}</Text>
    {uri && <Pressable accessibilityRole="button" accessibilityLabel="Retry loading original photo" onPress={event => { event.stopPropagation(); retry(); }} style={({ pressed }) => ({ backgroundColor: '#daa520', borderRadius: 12, minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}><MaterialIcons name="refresh" size={18} color="#111827" /><Text style={{ color: '#111827', fontWeight: '700' }}>Retry photo</Text></Pressable>}
  </View>;
}
