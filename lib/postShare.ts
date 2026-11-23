function compactImage(value: unknown): string | null {
  return typeof value === 'string' && value.length <= 1500 && /^(https?:\/\/|\/uploads\/)/i.test(value) ? value : null;
}

export function parsePostShare(text?: string): { postId: string; authorName: string; content: string; image: string | null } | null {
  if (!text?.startsWith('[POST_SHARE]:')) return null;
  try {
    const data = JSON.parse(text.slice(13));
    if (typeof data.postId !== 'string' || !/^[a-f0-9]{24}$/i.test(data.postId)) return null;
    return { postId: data.postId, authorName: typeof data.authorName === 'string' ? data.authorName : 'Member', content: typeof data.content === 'string' ? data.content : '', image: compactImage(data.image) };
  } catch {
    // Older shares were truncated at 5000 characters when an embedded image was included.
    // Recover only complete JSON string fields; fetch the image from the original post.
    const field = (name: string): string | null => {
      const match = text.match(new RegExp(`"${name}"\\s*:\\s*("(?:[^"\\\\]|\\\\.)*")`));
      try { return match ? JSON.parse(match[1]) : null; } catch { return null; }
    };
    const postId = field('postId');
    if (!postId || !/^[a-f0-9]{24}$/i.test(postId)) return null;
    return { postId, authorName: field('authorName') || 'Member', content: field('content') || '', image: compactImage(field('image')) };
  }
}

export function createPostShare(post: any) {
  const data = { postId: String(post._id), authorName: (post.author?.fullName || 'Member').slice(0, 100), content: (post.content || '').slice(0, 500), image: compactImage(post.mediaUrl || post.mediaUrls?.[0]) };
  let encoded = `[POST_SHARE]:${JSON.stringify(data)}`;
  if (encoded.length > 5000) {
    data.image = null;
    data.content = data.content.slice(0, 200);
    encoded = `[POST_SHARE]:${JSON.stringify(data)}`;
  }
  return encoded;
}
