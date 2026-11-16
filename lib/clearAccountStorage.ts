import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const accountKeys = [
  'userToken', 'userData', 'user_openai_api_key', 'boolok_following_users_set',
  'boolok_saved_posts', 'boolok_saved_reels',
  'boolok_user_uploaded_reels', 'boolok_post_likes', 'boolok_liked_reels_set',
];

export async function clearAccountStorage() {
  if (Platform.OS === 'web') {
    for (const key of Object.keys(localStorage)) {
      if (accountKeys.includes(key) || key.startsWith('boolok_')) localStorage.removeItem(key);
    }
    return;
  }
  const results = await Promise.allSettled([...new Set(accountKeys)].map(key => SecureStore.deleteItemAsync(key)));
  if (results.some(result => result.status === 'rejected')) console.warn('Some local account cache entries could not be cleared.');
}
