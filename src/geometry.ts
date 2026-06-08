import type { CanvasElement, CanvasElementFrame, ResizeHandle, SelectionRect } from './types';

export const minFrameSize = 24;

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function toCanvasPoint(event: { clientX: number; clientY: number }, canvas: HTMLElement, scale: number) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.round((event.clientX - rect.left) / scale),
    y: Math.round((event.clientY - rect.top) / scale),
  };
}

export function clampFrameToCanvas(frame: CanvasElementFrame, canvas: { width: number; height: number }): CanvasElementFrame {
  const width = clamp(frame.width, minFrameSize, canvas.width);
  const height = clamp(frame.height, minFrameSize, canvas.height);
  return {
    x: clamp(frame.x, 0, Math.max(0, canvas.width - width)),
    y: clamp(frame.y, 0, Math.max(0, canvas.height - height)),
    width,
    height,
  };
}

export function moveFrame(
  frame: CanvasElementFrame,
  delta: { x: number; y: number },
  canvas: { width: number; height: number },
): CanvasElementFrame {
  return clampFrameToCanvas({ ...frame, x: frame.x + delta.x, y: frame.y + delta.y }, canvas);
}

export function resizeFrame(
  frame: CanvasElementFrame,
  handle: ResizeHandle,
  delta: { x: number; y: number },
  canvas: { width: number; height: number },
): CanvasElementFrame {
  const next = { ...frame };

  if (handle.includes('e')) next.width = frame.width + delta.x;
  if (handle.includes('s')) next.height = frame.height + delta.y;
  if (handle.includes('w')) {
    next.x = frame.x + delta.x;
    next.width = frame.width - delta.x;
  }
  if (handle.includes('n')) {
    next.y = frame.y + delta.y;
    next.height = frame.height - delta.y;
  }

  if (next.width < minFrameSize) {
    if (handle.includes('w')) next.x = frame.x + frame.width - minFrameSize;
    next.width = minFrameSize;
  }

  if (next.height < minFrameSize) {
    if (handle.includes('n')) next.y = frame.y + frame.height - minFrameSize;
    next.height = minFrameSize;
  }

  return clampFrameToCanvas(next, canvas);
}

export function normalizeSelectionRect(start: { x: number; y: number }, end: { x: number; y: number }): SelectionRect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function frameIntersectsRect(frame: CanvasElementFrame, rect: SelectionRect) {
  return (
    frame.x < rect.x + rect.width &&
    frame.x + frame.width > rect.x &&
    frame.y < rect.y + rect.height &&
    frame.y + frame.height > rect.y
  );
}

export function topmostIntersecting(elements: CanvasElement[], rect: SelectionRect) {
  return [...elements].reverse().find((element) => frameIntersectsRect(element.frame, rect)) ?? null;
}
