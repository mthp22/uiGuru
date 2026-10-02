import {
  useCallback,
  useEffect,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import {
  duplicateElement,
  moveElement,
  removeElement,
  resetElementSize,
  resizeElement,
  setElementFrame,
} from './canvasCommands';
import {
  alignmentTargets,
  clampFrameToCanvas,
  moveFrame,
  normalizeSelectionRect,
  snapFrame,
  toCanvasPoint,
  topmostIntersecting,
} from './geometry';
import type { CanvasProject, ResizeHandle, SelectionRect, SnapGuides } from './types';

type InteractionMode =
  | { type: 'idle' }
  | { type: 'move'; elementId: string; start: { x: number; y: number } }
  | { type: 'resize'; elementId: string; handle: ResizeHandle; start: { x: number; y: number } }
  | { type: 'marquee'; start: { x: number; y: number }; current: { x: number; y: number } };

export type ProjectUpdater = (recipe: (current: CanvasProject) => CanvasProject) => void;
export type ProjectCommitter = (recipe: (current: CanvasProject) => CanvasProject, groupKey?: string) => void;

export interface ContextMenuState {
  x: number;
  y: number;
  elementId: string;
}

interface UseCanvasInteractionsArgs {
  canvasRef: RefObject<HTMLDivElement | null>;
  project: CanvasProject;
  scale: number;
  selectedId: string | null;
  setProject: ProjectUpdater;
  commitProject: ProjectCommitter;
  endStage: () => void;
  undo: () => void;
  redo: () => void;
  setSelectedId: (elementId: string | null) => void;
}

const noGuides: SnapGuides = { x: [], y: [] };

export function useCanvasInteractions({
  canvasRef,
  project,
  scale,
  selectedId,
  setProject,
  commitProject,
  endStage,
  undo,
  redo,
  setSelectedId,
}: UseCanvasInteractionsArgs) {
  const [mode, setMode] = useState<InteractionMode>({ type: 'idle' });
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [guides, setGuides] = useState<SnapGuides>(noGuides);

  const marquee =
    mode.type === 'marquee' ? normalizeSelectionRect(mode.start, mode.current) : null;

  const getPoint = useCallback((event: { clientX: number; clientY: number }) => {
    if (!canvasRef.current) return null;
    return toCanvasPoint(event, canvasRef.current, scale);
  }, [canvasRef, scale]);

  const startMove = (elementId: string, event: ReactPointerEvent) => {
    const element = project.elements.find((item) => item.id === elementId);
    const point = getPoint(event);
    if (!element || !point || element.locked) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(elementId);
    setContextMenu(null);
    setMode({ type: 'move', elementId, start: point });
  };

  const startResize = (elementId: string, handle: ResizeHandle, event: ReactPointerEvent) => {
    const element = project.elements.find((item) => item.id === elementId);
    const point = getPoint(event);
    if (!element || !point || element.locked) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(elementId);
    setContextMenu(null);
    setMode({ type: 'resize', elementId, handle, start: point });
  };

  const startMarquee = (event: ReactPointerEvent) => {
    if (event.button !== 0 || event.target !== event.currentTarget) return;
    const point = getPoint(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(null);
    setContextMenu(null);
    setMode({ type: 'marquee', start: point, current: point });
  };

  const openContextMenu = (elementId: string, event: ReactMouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(elementId);
    setContextMenu({ x: event.clientX, y: event.clientY, elementId });
  };

  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (mode.type === 'idle') return;
      const point = getPoint(event);
      if (!point) return;
      const delta = { x: point.x - mode.start.x, y: point.y - mode.start.y };

      if (mode.type === 'move') {
        const element = project.elements.find((item) => item.id === mode.elementId);
        if (element) {
          const moved = moveFrame(element.frame, delta, project.canvas);
          const targets = alignmentTargets(
            project.elements.filter((item) => item.id !== mode.elementId),
            project.canvas,
          );
          const snapped = snapFrame(moved, targets);
          setGuides(snapped.guides);
          setProject((current) =>
            setElementFrame(current, mode.elementId, clampFrameToCanvas(snapped.frame, current.canvas)),
          );
        }
        setMode({ ...mode, start: point });
        return;
      }

      if (mode.type === 'resize') {
        setProject((current) => resizeElement(current, mode.elementId, mode.handle, delta));
        setMode({ ...mode, start: point });
        return;
      }

      setMode({ ...mode, current: point });
    };

    const handlePointerUp = () => {
      if (mode.type === 'marquee') {
        const rect = normalizeSelectionRect(mode.start, mode.current);
        const hit = topmostIntersecting(project.elements, rect);
        setSelectedId(hit?.id ?? null);
      }
      setGuides(noGuides);
      endStage();
      setMode({ type: 'idle' });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [endStage, getPoint, mode, project, setProject, setSelectedId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '');
      if (isTyping) return;

      if (event.key === 'Escape') {
        setContextMenu(null);
        setSelectedId(null);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }

      if (!selectedId) return;

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        commitProject((current) => removeElement(current, selectedId));
        setSelectedId(null);
        setContextMenu(null);
      }

      if (event.key.startsWith('Arrow')) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        const delta = {
          x: event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
          y: event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0,
        };
        commitProject((current) => moveElement(current, selectedId, delta), `nudge:${selectedId}`);
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        const cloneId = crypto.randomUUID();
        commitProject((current) => duplicateElement(current, selectedId, cloneId));
        setSelectedId(cloneId);
      }

      if ((event.metaKey || event.ctrlKey) && event.key === '0') {
        event.preventDefault();
        commitProject((current) => resetElementSize(current, selectedId), `size:${selectedId}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commitProject, redo, selectedId, setSelectedId, undo]);

  return {
    closeContextMenu,
    contextMenu,
    guides,
    marquee,
    openContextMenu,
    startMarquee,
    startMove,
    startResize,
  };
}

export function marqueeStyle(rect: SelectionRect) {
  return {
    left: rect.x,
    top: rect.y,
    width: rect.width,
    height: rect.height,
  };
}
