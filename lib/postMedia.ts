import { resolveImageUrl } from './api';

export function getOriginalPostImageUri(post: any): string | null {
  const candidates = [post?.mediaUrl, ...(Array.isArray(post?.mediaUrls) ? post.mediaUrls : []), post?.image];
  for (const value of candidates) {
    if (typeof value !== 'string' || !value.trim()) continue;
    const url = value.trim();
    if (/^(https?:\/\/|data:image\/|\/uploads\/)/i.test(url)) return resolveImageUrl(url);
  }
  return null;
}

export function getPostImageCandidates(post: any): string[] {
  const delivery = typeof post?.imageUrl === 'string' && /^\/api\/feed\/[a-f\d]{24}\/image$/i.test(post.imageUrl) ? resolveImageUrl(post.imageUrl) : null;
  const original = getOriginalPostImageUri(post);
  return [delivery, original].filter((value): value is string => Boolean(value)).filter((value, index, values) => values.indexOf(value) === index);
}

export function getPostImageUri(post: any): string | null {
  return getPostImageCandidates(post)[0] || null;
}
