import type { ImagePickerAsset } from 'expo-image-picker';

function imageMime(image: string, asset: ImagePickerAsset | null, blobType?: string) {
  const supported = ['image/png', 'image/jpeg', 'image/webp'];
  for (const value of [blobType, asset?.mimeType, image.match(/^data:(image\/[^;,]+)/i)?.[1]]) {
    const mime = value?.toLowerCase().replace('image/jpg', 'image/jpeg');
    if (mime && supported.includes(mime)) return mime;
  }
  const name = (asset?.fileName || image.split(/[?#]/)[0]).toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function imageFilename(asset: ImagePickerAsset | null, mime: string) {
  const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const original = asset?.fileName;
  return original ? `${original.replace(/\.[^.]+$/, '')}.${extension}` : `post.${extension}`;
}

export async function buildPostForm(content: string, image: string | null, asset: ImagePickerAsset | null, platform: string) {
  const form = new FormData();
  form.append('content', content);
  if (image) {
    if (platform === 'web') {
      const blob = asset?.file || await (await fetch(image)).blob();
      const mime = imageMime(image, asset, blob.type);
      const typedBlob = blob.type === mime ? blob : blob.slice(0, blob.size, mime);
      form.append('image', typedBlob, imageFilename(asset, mime));
    } else {
      const mime = imageMime(image, asset);
      form.append('image', { uri: image, name: imageFilename(asset, mime), type: mime } as any);
    }
  }
  return form;
}
