import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type SetStateAction,
} from 'react';
import {
  duplicateElement,
  moveElement,
  removeElement,
  resetElementSize,
  resizeElement,
} from './canvasCommands';
import { normalizeSelectionRect, toCanvasPoint, topmostIntersecting } from './geometry';
import type { CanvasProject, ResizeHandle, SelectionRect } from './types';

type InteractionMode =
  | { type: 'idle' }
  | { type: 'move'; elementId: string; start: { x: number; y: number } }
  | { type: 'resize'; elementId: string; handle: ResizeHandle; start: { x: number; y: number } }
  | { type: 'marquee'; start: { x: number; y: number }; current: { x: number; y: number } };

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
  setProject: Dispatch<SetStateAction<CanvasProject>>;
  setSelectedId: (elementId: string | null) => void;
}

export function useCanvasInteractions({
  canvasRef,
  project,
  scale,
  selectedId,
  setProject,
  setSelectedId,
}: UseCanvasInteractionsArgs) {
  const [mode, setMode] = useState<InteractionMode>({ type: 'idle' });
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

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
        setProject((current) => moveElement(current, mode.elementId, delta));
        setMode({ ...mode, start: point });
      }

      if (mode.type === 'resize') {
        setProject((current) => resizeElement(current, mode.elementId, mode.handle, delta));
        setMode({ ...mode, start: point });
      }

      if (mode.type === 'marquee') {
        setMode({ ...mode, current: point });
      }
    };

    const handlePointerUp = () => {
      if (mode.type === 'marquee') {
        const rect = normalizeSelectionRect(mode.start, mode.current);
        const hit = topmostIntersecting(project.elements, rect);
        setSelectedId(hit?.id ?? null);
      }
      setMode({ type: 'idle' });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [getPoint, mode, project.elements, setProject, setSelectedId]);

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

      if (!selectedId) return;

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        setProject((current) => removeElement(current, selectedId));
        setSelectedId(null);
      }

      if (event.key.startsWith('Arrow')) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        const delta = {
          x: event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
          y: event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0,
        };
        setProject((current) => moveElement(current, selectedId, delta));
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        setProject((current) => {
          const result = duplicateElement(current, selectedId);
          if (result.duplicatedId) setSelectedId(result.duplicatedId);
          return result.project;
        });
      }

      if ((event.ctrlKey || event.metaKey) && event.key === '0') {
        event.preventDefault();
        setProject((current) => resetElementSize(current, selectedId));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, setProject, setSelectedId]);

  return {
    closeContextMenu,
    contextMenu,
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
