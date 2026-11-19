import { API_BASE_URL } from './api';

export type BlueprintHistoryMode = 'both' | '2d' | '3d';
export type BlueprintSnapshot = {
  generationId: string;
  mode: BlueprintHistoryMode;
  form: object;
  plan2dUrl: string | null;
  plan3dUrl: string | null;
  plan2dSvg: string | null;
  plan3dSvg: string | null;
  technicalCadSvg: string | null;
  summary: string | null;
};
export type SavedBlueprint = BlueprintSnapshot & { _id: string; createdAt: string };
export type BlueprintHistoryItem = {
  _id: string;
  createdAt: string;
  mode: BlueprintHistoryMode;
  form: { plotWidth: number; plotDepth: number; plotUnit: string; bedrooms: number; stories: number };
};

export async function blueprintHistoryRequest(token: string, path = '', snapshot?: BlueprintSnapshot) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/blueprint-history${path}`, {
      method: snapshot ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token}`, ...(snapshot ? { 'Content-Type': 'application/json' } : {}) },
      ...(snapshot ? { body: JSON.stringify(snapshot) } : {}),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) throw new Error('Please sign in again to access your saved plans.');
      if (response.status === 404 && !path) throw new Error('Plan history is not available on the server yet. Your current plan is still available.');
      throw new Error(typeof data.message === 'string' ? data.message : 'Plan history is temporarily unavailable. Please retry.');
    }
    if ((snapshot && typeof data.id !== 'string') || (!snapshot && !path && !Array.isArray(data.plans))) {
      throw new Error('The history service returned an unexpected response. Please retry.');
    }
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') throw new Error('History took too long to respond. Please retry.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
