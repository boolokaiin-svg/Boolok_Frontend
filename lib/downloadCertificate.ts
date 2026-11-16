import { Linking, Platform } from 'react-native';
import { API_BASE_URL, getStoredToken } from './api';

export async function downloadCertificate(filename: string): Promise<void> {
  const token = await getStoredToken();
  if (!token) throw new Error('Please sign in again to download this certificate.');
  if (Platform.OS === 'web') {
    const response = await fetch(`${API_BASE_URL}/api/legal/download-ec/${encodeURIComponent(filename)}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Certificate download failed. Please retry.');
    }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.replace(/\\/g, '/').split('/').pop() || 'ec.pdf';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } else {
    const response = await fetch(`${API_BASE_URL}/api/legal/download-ticket`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ filename }),
    });
    const data = await response.json();
    if (!response.ok || typeof data.url !== 'string' || !data.url.startsWith('/api/legal/download-ec/')) throw new Error(data.message || 'Certificate download failed. Please retry.');
    await Linking.openURL(`${API_BASE_URL}${data.url}`);
  }
}
