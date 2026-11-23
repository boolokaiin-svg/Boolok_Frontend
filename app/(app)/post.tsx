import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

// Preserve earlier shared URLs while opening posts in the Insights feed.
export default function SharedPostScreen() {
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  return <Redirect href={postId ? { pathname: '/(app)/insights', params: { postId } } : '/(app)/feed'} />;
}
