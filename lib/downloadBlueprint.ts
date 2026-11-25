import { Platform } from 'react-native';

export async function downloadBlueprint(url: string, filename: string) {
  if (Platform.OS === 'web') {
    // Browsers ignore download= for cross-origin URLs. A local blob URL saves a file.
    const response = await fetch(url);
    if (!response.ok) throw new Error('The plan image could not be downloaded. Please retry.');
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) throw new Error('The server did not return a plan image.');
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    try {
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
    } finally {
      link.remove();
      // Give the browser time to start its download before releasing the image bytes.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    }
    return;
  }

  const FileSystem = await import('expo-file-system/legacy');
  const Sharing = await import('expo-sharing');
  if (!await Sharing.isAvailableAsync()) throw new Error('File saving is not available on this device.');
  if (!FileSystem.cacheDirectory) throw new Error('The device download folder is unavailable.');
  const destination = `${FileSystem.cacheDirectory}${Date.now()}_${filename}`;
  try {
    if (url.startsWith('data:')) {
      const response = await fetch(url);
      const blob = await response.blob();
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = () => reject(new Error('Could not read the plan image.'));
        reader.readAsDataURL(blob);
      });
      await FileSystem.writeAsStringAsync(destination, data, { encoding: FileSystem.EncodingType.Base64 });
    } else {
      const downloaded = await FileSystem.downloadAsync(url, destination);
      if (downloaded.status !== 200) throw new Error('The plan image could not be downloaded. Please retry.');
    }
    await Sharing.shareAsync(destination, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Save floor plan image' });
  } finally {
    await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => {});
  }
}
