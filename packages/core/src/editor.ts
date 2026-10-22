/**
 * Editor engine — the shared editing state machine behind both the web Builder
 * and the native mobile builder.
 *
 * Platform-free by design: platforms translate their native input (pointer
 * events, touch gestures) into canvas points and call the intent methods
 * below. Every mutation funnels through `commit` (discrete commands) or
 * `stage`/`endInteraction` (gestures), so undo/redo and — later — API sync
 * have a single seam to attach to.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  bringElementForward,
  duplicateElement,
  moveElement,
  removeElement,
  resetElementSize,
  resizeElement,
  sendElementBackward,
  setElementFrame,
  toggleElementLock,
  updateElement,
} from './canvasCommands';
import { createComponentElements, createElement, createEmptyProject } from './data';
import {
  alignmentTargets,
  clamp,
  clampFrameToCanvas,
  moveFrame,
  normalizeSelectionRect,
  snapFrame,
  topmostIntersecting,
} from './geometry';
import { createId } from './id';
import { useHistory } from './useHistory';
import type {
  CanvasElement,
  CanvasProject,
  ComponentId,
  ElementKind,
  PreviewSize,
  ResizeHandle,
  SelectionRect,
  SnapGuides,
} from './types';

export interface EditorPoint {
  x: number;
  y: number;
}

export type EditorInteraction =
  | { type: 'idle' }
  | { type: 'move'; elementId: string; start: EditorPoint }
  | { type: 'resize'; elementId: string; handle: ResizeHandle; start: EditorPoint }
  | { type: 'marquee'; start: EditorPoint; current: EditorPoint };

export interface EditorContextMenu {
  x: number;
  y: number;
  elementId: string;
}

export type EditorCommand =
  | 'remove'
  | 'duplicate'
  | 'reset-size'
  | 'toggle-lock'
  | 'bring-forward'
  | 'send-backward';

export const previewWidths: Record<PreviewSize, number> = {
  desktop: 1200,
  tablet: 768,
  mobile: 390,
};

export interface EditorApi {
  /** Current project (history present). */
  project: CanvasProject;
  selectedId: string | null;
  selected: CanvasElement | null;
  setSelectedId: (elementId: string | null) => void;

  /** Viewport state. */
  previewSize: PreviewSize;
  setPreviewSize: (size: PreviewSize) => void;
  zoom: number;
  setZoom: (value: number) => void;
  changeZoom: (delta: number) => void;

  /** Live gesture state (snap guides, marquee rect, interaction mode). */
  interaction: EditorInteraction;
  guides: SnapGuides;
  marquee: SelectionRect | null;

  /** Context menu target + position (platform decides the coordinate space). */
  contextMenu: EditorContextMenu | null;
  openContextMenu: (elementId: string, position: EditorPoint) => void;
  closeContextMenu: () => void;

  /** History. */
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  /** Discrete mutation with undo grouping (`groupKey` collapses repeats). */
  commit: (recipe: (current: CanvasProject) => CanvasProject, groupKey?: string) => void;

  /** Gesture intents — `point` is in canvas coordinates (already scaled). */
  startMove: (elementId: string, point: EditorPoint) => void;
  startResize: (elementId: string, handle: ResizeHandle, point: EditorPoint) => void;
  startMarquee: (point: EditorPoint) => void;
  updateInteraction: (point: EditorPoint) => void;
  endInteraction: () => void;

  /** Commands (context menus, toolbars, keyboard). Defaults to the selection. */
  runCommand: (command: EditorCommand, elementId?: string) => void;
  nudge: (delta: EditorPoint) => void;

  /** Insertion. */
  insertKind: (kind: ElementKind, position?: EditorPoint) => string | null;
  insertComponent: (component: ComponentId) => string[];

  /** Field edits (inspector). */
  updateElementField: (
    elementId: string,
    recipe: (element: CanvasElement) => CanvasElement,
    groupKey?: string,
  ) => void;
  updateProject: (patch: Partial<CanvasProject>, groupKey?: string) => void;

  /** Project-level transitions (presets, saved list, empty playground). */
  loadProject: (project: CanvasProject, options?: { selectFirst?: boolean }) => void;
  loadEmpty: () => void;
}

export interface UseEditorOptions {
  /** Runs once on mount; return null to fall back to `createProject`. */
  initialProject?: () => CanvasProject | null;
  createProject?: () => CanvasProject;
  initialPreviewSize?: PreviewSize;
}

const noGuides: SnapGuides = { x: [], y: [] };

export function useEditor(options: UseEditorOptions = {}): EditorApi {
  const history = useHistory<CanvasProject>(
    () => options.initialProject?.() ?? (options.createProject ?? createEmptyProject)(),
  );
  const {
    present: project,
    commit: historyCommit,
    stage,
    endStage,
    undo,
    redo,
    canUndo,
    canRedo,
  } = history;

  // Ref mirrors keep gesture handlers correct even when a platform captures
  // the callback at gesture start (Reanimated/RNGH worklets do this).
  // They are refreshed in an effect so lint/compiler rules hold.
  const projectRef = useRef(project);
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  const [selectedId, setSelectedIdState] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const setSelectedId = useCallback((elementId: string | null) => {
    selectedIdRef.current = elementId;
    setSelectedIdState(elementId);
  }, []);

  const [previewSize, setPreviewSize] = useState<PreviewSize>(options.initialPreviewSize ?? 'desktop');
  const [zoom, setZoomState] = useState(1);

  const [contextMenu, setContextMenuState] = useState<EditorContextMenu | null>(null);
  const setContextMenu = useCallback((menu: EditorContextMenu | null) => {
    setContextMenuState(menu);
  }, []);
  const closeContextMenu = useCallback(() => setContextMenu(null), [setContextMenu]);

  const [guides, setGuides] = useState<SnapGuides>(noGuides);
  const [interaction, setInteractionState] = useState<EditorInteraction>({ type: 'idle' });
  const interactionRef = useRef<EditorInteraction>({ type: 'idle' });
  const setInteraction = useCallback((next: EditorInteraction) => {
    interactionRef.current = next;
    setInteractionState(next);
  }, []);

  const commit = useCallback(
    (recipe: (current: CanvasProject) => CanvasProject, groupKey?: string) => {
      historyCommit((current) => {
        const next = recipe(current);
        return next === current ? current : { ...next, updatedAt: new Date().toISOString() };
      }, groupKey);
    },
    [historyCommit],
  );

  const openContextMenu = useCallback(
    (elementId: string, position: EditorPoint) => {
      setSelectedId(elementId);
      setContextMenu({ ...position, elementId });
    },
    [setContextMenu, setSelectedId],
  );

  const startMove = useCallback(
    (elementId: string, point: EditorPoint) => {
      const element = projectRef.current.elements.find((item) => item.id === elementId);
      if (!element || element.locked) return;
      setSelectedId(elementId);
      setContextMenu(null);
      setInteraction({ type: 'move', elementId, start: point });
    },
    [setContextMenu, setInteraction, setSelectedId],
  );

  const startResize = useCallback(
    (elementId: string, handle: ResizeHandle, point: EditorPoint) => {
      const element = projectRef.current.elements.find((item) => item.id === elementId);
      if (!element || element.locked) return;
      setSelectedId(elementId);
      setContextMenu(null);
      setInteraction({ type: 'resize', elementId, handle, start: point });
    },
    [setContextMenu, setInteraction, setSelectedId],
  );

  const startMarquee = useCallback(
    (point: EditorPoint) => {
      setSelectedId(null);
      setContextMenu(null);
      setInteraction({ type: 'marquee', start: point, current: point });
    },
    [setContextMenu, setInteraction, setSelectedId],
  );

  const updateInteraction = useCallback(
    (point: EditorPoint) => {
      const mode = interactionRef.current;
      if (mode.type === 'idle') return;
      const delta = { x: point.x - mode.start.x, y: point.y - mode.start.y };

      if (mode.type === 'move') {
        const current = projectRef.current;
        const element = current.elements.find((item) => item.id === mode.elementId);
        if (element) {
          // Best-effort guides for rendering; the authoritative update happens
          // inside the `stage` recipe against the live staged project so rapid
          // same-frame events can never operate on stale state.
          const previewTargets = alignmentTargets(
            current.elements.filter((item) => item.id !== mode.elementId),
            current.canvas,
          );
          setGuides(snapFrame(moveFrame(element.frame, delta, current.canvas), previewTargets).guides);
          stage((live) => {
            const liveElement = live.elements.find((item) => item.id === mode.elementId);
            if (!liveElement) return live;
            const targets = alignmentTargets(
              live.elements.filter((item) => item.id !== mode.elementId),
              live.canvas,
            );
            const snapped = snapFrame(moveFrame(liveElement.frame, delta, live.canvas), targets);
            return setElementFrame(live, mode.elementId, clampFrameToCanvas(snapped.frame, live.canvas));
          });
        }
        setInteraction({ ...mode, start: point });
        return;
      }

      if (mode.type === 'resize') {
        stage((live) => resizeElement(live, mode.elementId, mode.handle, delta));
        setInteraction({ ...mode, start: point });
        return;
      }

      setInteraction({ ...mode, current: point });
    },
    [setInteraction, stage],
  );

  const endInteraction = useCallback(() => {
    const mode = interactionRef.current;
    if (mode.type === 'marquee') {
      const rect = normalizeSelectionRect(mode.start, mode.current);
      const hit = topmostIntersecting(projectRef.current.elements, rect);
      setSelectedId(hit?.id ?? null);
    }
    setGuides(noGuides);
    endStage();
    setInteraction({ type: 'idle' });
  }, [endStage, setInteraction, setSelectedId]);

  const runCommand = useCallback(
    (command: EditorCommand, elementIdArg?: string) => {
      const elementId = elementIdArg ?? selectedIdRef.current;
      if (!elementId) return;
      if (command === 'remove') {
        commit((current) => removeElement(current, elementId));
        setSelectedId(null);
      } else if (command === 'duplicate') {
        const cloneId = createId();
        commit((current) => duplicateElement(current, elementId, cloneId));
        setSelectedId(cloneId);
      } else if (command === 'reset-size') {
        commit((current) => resetElementSize(current, elementId), `size:${elementId}`);
      } else if (command === 'toggle-lock') {
        commit((current) => toggleElementLock(current, elementId));
      } else if (command === 'bring-forward') {
        commit((current) => bringElementForward(current, elementId));
      } else if (command === 'send-backward') {
        commit((current) => sendElementBackward(current, elementId));
      }
      setContextMenu(null);
    },
    [commit, setContextMenu, setSelectedId],
  );

  const nudge = useCallback(
    (delta: EditorPoint) => {
      const elementId = selectedIdRef.current;
      if (!elementId) return;
      commit((current) => moveElement(current, elementId, delta), `nudge:${elementId}`);
    },
    [commit],
  );

  const insertKind = useCallback(
    (kind: ElementKind, position?: EditorPoint) => {
      const element = createElement(kind, position);
      commit((current) => ({ ...current, elements: [...current.elements, element] }));
      setSelectedId(element.id);
      return element.id;
    },
    [commit, setSelectedId],
  );

  const insertComponent = useCallback(
    (component: ComponentId) => {
      const lowest = projectRef.current.elements.reduce(
        (max, element) => Math.max(max, element.frame.y + element.frame.height),
        0,
      );
      const origin = { x: 48, y: lowest > 0 ? lowest + 40 : 48 };
      const elements = createComponentElements(component, origin);
      const bottom = elements.reduce(
        (max, element) => Math.max(max, element.frame.y + element.frame.height),
        0,
      );
      commit((current) => ({
        ...current,
        elements: [...current.elements, ...elements],
        canvas: { ...current.canvas, height: Math.max(current.canvas.height, bottom + 48) },
      }));
      setSelectedId(elements[0]?.id ?? null);
      return elements.map((element) => element.id);
    },
    [commit, setSelectedId],
  );

  const updateElementField = useCallback(
    (elementId: string, recipe: (element: CanvasElement) => CanvasElement, groupKey?: string) => {
      commit((current) => updateElement(current, elementId, recipe), groupKey && `${elementId}:${groupKey}`);
    },
    [commit],
  );

  const updateProject = useCallback(
    (patch: Partial<CanvasProject>, groupKey?: string) => {
      commit((current) => ({ ...current, ...patch }), groupKey);
    },
    [commit],
  );

  const loadProject = useCallback(
    (next: CanvasProject, loadOptions?: { selectFirst?: boolean }) => {
      commit(() => next);
      setSelectedId(loadOptions?.selectFirst === false ? null : (next.elements[0]?.id ?? null));
      setContextMenu(null);
    },
    [commit, setContextMenu, setSelectedId],
  );

  const loadEmpty = useCallback(() => {
    commit(() => createEmptyProject());
    setSelectedId(null);
    setContextMenu(null);
  }, [commit, setContextMenu, setSelectedId]);

  const setZoom = useCallback((value: number) => {
    setZoomState(clamp(Math.round(value * 10) / 10, 0.4, 2));
  }, []);

  const changeZoom = useCallback((delta: number) => {
    setZoomState((current) => clamp(Math.round((current + delta) * 10) / 10, 0.4, 2));
  }, []);

  const marquee =
    interaction.type === 'marquee' ? normalizeSelectionRect(interaction.start, interaction.current) : null;
  const selected = project.elements.find((element) => element.id === selectedId) ?? null;

  return {
    project,
    selectedId,
    selected,
    setSelectedId,
    previewSize,
    setPreviewSize,
    zoom,
    setZoom,
    changeZoom,
    interaction,
    guides,
    marquee,
    contextMenu,
    openContextMenu,
    closeContextMenu,
    canUndo,
    canRedo,
    undo,
    redo,
    commit,
    startMove,
    startResize,
    startMarquee,
    updateInteraction,
    endInteraction,
    runCommand,
    nudge,
    insertKind,
    insertComponent,
    updateElementField,
    updateProject,
    loadProject,
    loadEmpty,
  };
}
