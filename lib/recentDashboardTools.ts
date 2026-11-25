import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const DASHBOARD_TOOLS = ['legal', 'blueprint', 'predictions'] as const;
export type DashboardTool = typeof DASHBOARD_TOOLS[number];
export type RecentDashboardTool = { id: DashboardTool; openedAt: number };
const STORAGE_KEY = 'boolok_recent_tools';
const memory = new Map<string, RecentDashboardTool[]>();
let pendingWrite: Promise<void> = Promise.resolve();

function validEntries(value: unknown): RecentDashboardTool[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<DashboardTool>();
  return value.filter((item): item is RecentDashboardTool => {
    if (!item || !DASHBOARD_TOOLS.includes(item.id) || !Number.isFinite(item.openedAt) || item.openedAt <= 0 || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  }).sort((a, b) => b.openedAt - a.openedAt).slice(0, DASHBOARD_TOOLS.length);
}

async function load(accountId: string): Promise<RecentDashboardTool[]> {
  if (memory.has(accountId)) return memory.get(accountId)!;
  try {
    const raw = Platform.OS === 'web' ? localStorage.getItem(STORAGE_KEY) : await SecureStore.getItemAsync(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    const entries = saved?.accountId === accountId ? validEntries(saved.tools) : [];
    memory.set(accountId, entries);
    return entries;
  } catch { return []; }
}

export async function readRecentDashboardTools(accountId: string): Promise<RecentDashboardTool[]> {
  await pendingWrite;
  return accountId ? [...await load(accountId)] : [];
}

export function recordDashboardTool(accountId: string, id: DashboardTool, openedAt = Date.now()): Promise<void> {
  if (!accountId || !DASHBOARD_TOOLS.includes(id)) return Promise.resolve();
  pendingWrite = pendingWrite.catch(() => {}).then(async () => {
    const current = await load(accountId);
    const tools = [{ id, openedAt }, ...current.filter(item => item.id !== id)];
    memory.set(accountId, tools);
    try {
      const value = JSON.stringify({ accountId, tools });
      if (Platform.OS === 'web') localStorage.setItem(STORAGE_KEY, value);
      else await SecureStore.setItemAsync(STORAGE_KEY, value);
    } catch { /* Keep navigation and in-session ordering available if storage is disabled. */ }
  });
  return pendingWrite;
}

export function orderedDashboardTools(recent: RecentDashboardTool[]): DashboardTool[] {
  const used = validEntries(recent).map(item => item.id);
  return [...used, ...DASHBOARD_TOOLS.filter(id => !used.includes(id))];
}
