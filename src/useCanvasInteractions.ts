import { useEffect, useRef, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import type { EditorApi, ResizeHandle, SelectionRect } from '@uiguru/core';
import { toCanvasPoint } from './toCanvasPoint';

/**
 * Web adapter over the shared editor engine (`useEditor` from @uiguru/core).
 * Translates DOM pointer/keyboard events into canvas points and engine
 * intents — no editor logic lives here.
 */
interface UseCanvasInteractionsArgs {
  editor: EditorApi;
  canvasRef: RefObject<HTMLDivElement | null>;
  scale: number;
}

export function useCanvasInteractions({ editor, canvasRef, scale }: UseCanvasInteractionsArgs) {
  // Engine handlers are safe to call late (they read refs internally), so the
  // window listeners below can subscribe once and use the latest editor.
  const editorRef = useRef(editor);
  const scaleRef = useRef(scale);
  useEffect(() => {
    editorRef.current = editor;
    scaleRef.current = scale;
  });

  const getPoint = (event: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return toCanvasPoint(event, canvas, scaleRef.current);
  };

  const startMove = (elementId: string, event: ReactPointerEvent) => {
    const point = getPoint(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    editorRef.current.startMove(elementId, point);
  };

  const startResize = (elementId: string, handle: ResizeHandle, event: ReactPointerEvent) => {
    const point = getPoint(event);
    if (!point) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    editorRef.current.startResize(elementId, handle, point);
  };

  const startMarquee = (event: ReactPointerEvent) => {
    if (event.button !== 0 || event.target !== event.currentTarget) return;
    const point = getPoint(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    editorRef.current.startMarquee(point);
  };

  const openContextMenu = (elementId: string, event: ReactMouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    editorRef.current.openContextMenu(elementId, { x: event.clientX, y: event.clientY });
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (editorRef.current.interaction.type === 'idle') return;
      const point = getPoint(event);
      if (!point) return;
      editorRef.current.updateInteraction(point);
    };

    const handlePointerUp = () => {
      if (editorRef.current.interaction.type === 'idle') return;
      editorRef.current.endInteraction();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '');
      if (isTyping) return;
      const current = editorRef.current;

      if (event.key === 'Escape') {
        current.closeContextMenu();
        current.setSelectedId(null);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) current.redo();
        else current.undo();
        return;
      }

      if (!current.selectedId) return;

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        current.runCommand('remove');
      }

      if (event.key.startsWith('Arrow')) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        current.nudge({
          x: event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
          y: event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0,
        });
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        current.runCommand('duplicate');
      }

      if ((event.metaKey || event.ctrlKey) && event.key === '0') {
        event.preventDefault();
        current.runCommand('reset-size');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    closeContextMenu: editor.closeContextMenu,
    contextMenu: editor.contextMenu,
    guides: editor.guides,
    marquee: editor.marquee,
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
