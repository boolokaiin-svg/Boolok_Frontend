// Single source of truth for the viewer's confirmed follow relationships.
// Absent key = unknown (not yet confirmed by the server); never treated as "not following".
import axios from 'axios';
import { API_BASE_URL } from './api';

type Listener = () => void;

const state = new Map<string, boolean>();
const pending = new Set<string>();
const listeners = new Set<Listener>();
let hydratedFor: string | null = null;
let hydrating: Promise<void> | null = null;
let version = 0;

const emit = () => {
  version++;
  listeners.forEach((l) => l());
};

export const followStore = {
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  getVersion: () => version,
  /** true/false when server-confirmed, undefined when unknown */
  get: (id: string): boolean | undefined => state.get(id),
  isPending: (id: string) => pending.has(id),
  setPending(id: string, v: boolean) {
    if (v) pending.add(id);
    else pending.delete(id);
    emit();
  },
  /** Record a server-confirmed result (mutation response). */
  confirm(id: string, isFollowing: boolean) {
    if (!id) return;
    state.set(id, isFollowing);
    emit();
  },
  /** Seed from a server field without overriding a mutation in flight. */
  seed(id: string, isFollowing: boolean) {
    if (!id || pending.has(id) || state.has(id)) return;
    state.set(id, isFollowing);
    emit();
  },
  /** Load the viewer's following list from the server (once per account). */
  async hydrate(viewerId: string, token: string | null) {
    if (!viewerId || !token) return;
    if (hydratedFor === viewerId) return;
    if (hydrating) return hydrating;
    hydrating = (async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/users/self`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list: any[] = res.data?.user?.following || [];
        const ids = new Set<string>();
        list.forEach((f) => {
          const id = (typeof f === 'object' ? f.id || f._id : f)?.toString();
          if (id) ids.add(id);
        });
        // Replace everything not currently being mutated.
        Array.from(state.keys()).forEach((k) => {
          if (!pending.has(k)) state.delete(k);
        });
        ids.forEach((id) => {
          if (!pending.has(id)) state.set(id, true);
        });
        hydratedFor = viewerId;
        emit();
      } catch (_) {
        // leave unknown; callers fall back to server-provided hints
      } finally {
        hydrating = null;
      }
    })();
    return hydrating;
  },
  /** Hydrated means ids not in the set are confirmed "not following". */
  isHydrated: (viewerId: string) => hydratedFor === viewerId,
  clear() {
    state.clear();
    pending.clear();
    hydratedFor = null;
    hydrating = null;
    emit();
  },
};

