/**
 * Local-first project persistence, platform-free.
 *
 * The storage logic lives here against a minimal key/value interface whose
 * shape matches both `localStorage` (web) and AsyncStorage (React Native) —
 * platforms only inject the concrete key/value implementation.
 */
import { normalizeProject } from './canvasCommands';
import type { CanvasProject } from './types';

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface ProjectStorage {
  list(): Promise<CanvasProject[]>;
  get(id: string): Promise<CanvasProject | null>;
  save(project: CanvasProject): Promise<void>;
  remove(id: string): Promise<void>;
  getCurrentId(): Promise<string | null>;
  setCurrentId(id: string | null): Promise<void>;
}

const PROJECTS_KEY = 'uiguru:projects';
const CURRENT_ID_KEY = 'uiguru:current-project-id';

export function createProjectStorage(kv: KeyValueStorage): ProjectStorage {
  const list = async (): Promise<CanvasProject[]> => {
    const raw = await kv.getItem(PROJECTS_KEY);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return (parsed as CanvasProject[]).map(normalizeProject);
    } catch {
      return [];
    }
  };

  return {
    list,

    async get(id) {
      const items = await list();
      return items.find((project) => project.id === id) ?? null;
    },

    async save(project) {
      const items = await list();
      const exists = items.some((item) => item.id === project.id);
      const next = exists
        ? items.map((item) => (item.id === project.id ? project : item))
        : [project, ...items];
      next.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
      await kv.setItem(PROJECTS_KEY, JSON.stringify(next));
    },

    async remove(id) {
      const items = await list();
      await kv.setItem(PROJECTS_KEY, JSON.stringify(items.filter((item) => item.id !== id)));
    },

    async getCurrentId() {
      return kv.getItem(CURRENT_ID_KEY);
    },

    async setCurrentId(id) {
      if (id === null) await kv.removeItem(CURRENT_ID_KEY);
      else await kv.setItem(CURRENT_ID_KEY, id);
    },
  };
}
