/**
 * Remote API layer — the "API later" half of local-first.
 *
 * `UiguruApi` is the minimal project CRUD contract. Implementations:
 *  - `createHttpUiguruApi` — plain REST (GET/PUT/DELETE /projects[/:id]),
 *    ready to point at any backend via `EXPO_PUBLIC_API_URL` or config.
 *  - `createMemoryUiguruApi` — in-memory, for tests and demos.
 *
 * `useProjectSync` is the sync seam: it subscribes to the editor engine's
 * project stream (every `commit` and `stage` flows through the history
 * present) and pushes debounced snapshots to the API. Local storage stays
 * the source of truth; the remote is a replica.
 */
import { useEffect, useRef, useState } from 'react';
import type { EditorApi } from './editor';
import { normalizeProject } from './canvasCommands';
import type { CanvasProject } from './types';

export interface UiguruApi {
  listProjects(): Promise<CanvasProject[]>;
  getProject(id: string): Promise<CanvasProject | null>;
  saveProject(project: CanvasProject): Promise<void>;
  deleteProject(id: string): Promise<void>;
}

export interface HttpUiguruApiOptions {
  baseUrl: string;
  /** Injectable for platforms/tests; defaults to the global fetch. */
  fetch?: typeof globalThis.fetch;
}

export function createHttpUiguruApi(options: HttpUiguruApiOptions): UiguruApi {
  const fetchFn = options.fetch ?? globalThis.fetch;
  const base = options.baseUrl.replace(/\/+$/, '');
  const url = (path: string) => `${base}${path}`;

  const expectJson = async (response: Response) => {
    if (!response.ok) throw new Error(`uiGuru API ${response.status}`);
    return response.json();
  };

  return {
    async listProjects() {
      const data = await expectJson(await fetchFn(url('/projects')));
      return Array.isArray(data) ? (data as CanvasProject[]).map(normalizeProject) : [];
    },

    async getProject(id) {
      const response = await fetchFn(url(`/projects/${encodeURIComponent(id)}`));
      if (response.status === 404) return null;
      return normalizeProject((await expectJson(response)) as CanvasProject);
    },

    async saveProject(project) {
      await expectJson(
        await fetchFn(url(`/projects/${encodeURIComponent(project.id)}`), {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(project),
        }),
      );
    },

    async deleteProject(id) {
      const response = await fetchFn(url(`/projects/${encodeURIComponent(id)}`), {
        method: 'DELETE',
      });
      if (!response.ok && response.status !== 404) throw new Error(`uiGuru API ${response.status}`);
    },
  };
}

export function createMemoryUiguruApi(seed: CanvasProject[] = []): UiguruApi {
  const projects = new Map(seed.map((project) => [project.id, project]));
  return {
    async listProjects() {
      return [...projects.values()];
    },
    async getProject(id) {
      return projects.get(id) ?? null;
    },
    async saveProject(project) {
      projects.set(project.id, project);
    },
    async deleteProject(id) {
      projects.delete(id);
    },
  };
}

export interface ProjectSyncStatus {
  state: 'off' | 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt: string | null;
  error: string | null;
}

export function useProjectSync(
  editor: EditorApi,
  api: UiguruApi | null,
  options: { debounceMs?: number } = {},
): ProjectSyncStatus {
  const { debounceMs = 1200 } = options;
  const [status, setStatus] = useState<ProjectSyncStatus>({
    state: api ? 'idle' : 'off',
    lastSyncedAt: null,
    error: null,
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const project = editor.project;
  useEffect(() => {
    if (!api) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setStatus((current) => ({ ...current, state: 'syncing' }));
      void api.saveProject(project).then(
        () => setStatus({ state: 'synced', lastSyncedAt: new Date().toISOString(), error: null }),
        (error: unknown) =>
          setStatus({
            state: 'error',
            lastSyncedAt: null,
            error: error instanceof Error ? error.message : String(error),
          }),
      );
    }, debounceMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [api, debounceMs, project]);

  return status;
}
