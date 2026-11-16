import { useEffect, useRef, useState } from 'react';
import { apiFetch } from './api';
import { useAuth } from '../context/AuthContext';

const listeners = new Set<() => void>();
export function notifySafetyChanged() {
  listeners.forEach(listener => listener());
}
export function useSafetyRefresh(refresh: () => void) {
  const callback = useRef(refresh);
  callback.current = refresh;
  useEffect(() => {
    const listener = () => callback.current();
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
}

// Apply account visibility to saved items that can outlive the original feed response.
export function useHiddenUsers() {
  const { token } = useAuth();
  const [hidden, setHidden] = useState<Set<string> | null>(null);
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!token) { setHidden(new Set()); return; }
      try {
        const data = await apiFetch<{ hiddenUserIds: string[] }>('/api/safety/visibility');
        if (active) setHidden(new Set(data.hiddenUserIds));
      } catch (_) { /* Preserve known restrictions during a transient network failure. */ }
    };
    load();
    listeners.add(load);
    return () => { active = false; listeners.delete(load); };
  }, [token]);
  return hidden;
}

export function isVisibleSavedItem(item: any, hidden: Set<string> | null) {
  if (!hidden) return false;
  const author = item?.author;
  const id = typeof author === 'string' ? author : (author?._id || author?.id || item?.authorId);
  return !id || !hidden.has(String(id));
}
