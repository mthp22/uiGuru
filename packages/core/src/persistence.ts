/**
 * Binds an editor engine to a `ProjectStorage`: restores the last project on
 * mount, autosaves engine project changes (debounced, so gesture `stage`
 * updates collapse into one write), and exposes the saved-project lifecycle.
 *
 * Pristine empty projects that were never saved are not persisted — walking
 * into the builder and back out shouldn't litter the projects list.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EditorApi } from './editor';
import type { CanvasProject } from './types';
import type { ProjectStorage } from './storage';

export interface ProjectPersistence {
  status: 'loading' | 'ready' | 'saving' | 'saved' | 'error';
  /** Projects in storage, newest first. */
  projects: CanvasProject[];
  lastSavedAt: string | null;
  refresh: () => Promise<void>;
  saveNow: () => Promise<void>;
  open: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export interface UseProjectPersistenceOptions {
  /** Open this project on mount instead of the stored "current" one. */
  projectId?: string | null;
  debounceMs?: number;
}

export function useProjectPersistence(
  editor: EditorApi,
  storage: ProjectStorage,
  options: UseProjectPersistenceOptions = {},
): ProjectPersistence {
  const { projectId, debounceMs = 800 } = options;
  const [status, setStatus] = useState<ProjectPersistence['status']>('loading');
  const [projects, setProjects] = useState<CanvasProject[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const loaded = useRef(false);

  const { loadProject } = editor;

  const refresh = useCallback(async () => {
    const items = await storage.list();
    knownIds.current = new Set(items.map((project) => project.id));
    setProjects(items);
  }, [storage]);

  const persist = useCallback(
    async (project: CanvasProject) => {
      setStatus('saving');
      try {
        await storage.save(project);
        await storage.setCurrentId(project.id);
        knownIds.current.add(project.id);
        setLastSavedAt(new Date().toISOString());
        setStatus('saved');
        setProjects(await storage.list());
      } catch {
        setStatus('error');
      }
    },
    [storage],
  );

  // Restore the requested (or last-opened) project once on mount.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const items = await storage.list();
        if (cancelled) return;
        knownIds.current = new Set(items.map((project) => project.id));
        setProjects(items);
        const targetId = projectId ?? (await storage.getCurrentId());
        if (cancelled) return;
        const target = targetId ? (items.find((project) => project.id === targetId) ?? null) : null;
        if (target) loadProject(target, { selectFirst: false });
        loaded.current = true;
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProject, projectId, storage]);

  // Debounced autosave of engine project changes (commit and stage both flow
  // through the history present, so one seam covers every mutation).
  const project = editor.project;
  useEffect(() => {
    if (!loaded.current) return;
    if (project.elements.length === 0 && !knownIds.current.has(project.id)) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void persist(project);
    }, debounceMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [debounceMs, persist, project]);

  const saveNow = useCallback(() => persist(editor.project), [editor.project, persist]);

  const open = useCallback(
    async (id: string) => {
      const target = await storage.get(id);
      if (!target) return;
      loadProject(target, { selectFirst: false });
      await storage.setCurrentId(id);
      await refresh();
    },
    [loadProject, refresh, storage],
  );

  const remove = useCallback(
    async (id: string) => {
      await storage.remove(id);
      if ((await storage.getCurrentId()) === id) await storage.setCurrentId(null);
      await refresh();
    },
    [refresh, storage],
  );

  return { status, projects, lastSavedAt, refresh, saveNow, open, remove };
}
