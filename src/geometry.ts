import type {
  CanvasElement,
  CanvasElementFrame,
  ResizeHandle,
  SelectionRect,
  SnapGuides,
  SnapTargets,
} from './types';

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

export const snapThreshold = 6;
export const gridSize = 8;

export function frameArea(frame: CanvasElementFrame) {
  return frame.width * frame.height;
}

export function frameContains(outer: CanvasElementFrame, inner: CanvasElementFrame) {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

export function alignmentTargets(
  elements: CanvasElement[],
  canvas: { width: number; height: number },
): SnapTargets {
  const x = [0, canvas.width / 2, canvas.width];
  const y = [0, canvas.height / 2, canvas.height];
  for (const element of elements) {
    x.push(element.frame.x, element.frame.x + element.frame.width / 2, element.frame.x + element.frame.width);
    y.push(element.frame.y, element.frame.y + element.frame.height / 2, element.frame.y + element.frame.height);
  }
  return { x, y };
}

function snapAxis(start: number, size: number, targets: number[]) {
  const edges = [start, start + size / 2, start + size];
  let best: { delta: number; at: number; distance: number } | null = null;
  for (const edge of edges) {
    for (const target of targets) {
      const distance = Math.abs(edge - target);
      if (distance <= snapThreshold && (!best || distance < best.distance)) {
        best = { delta: target - edge, at: target, distance };
      }
    }
  }
  return best;
}

export function snapFrame(
  frame: CanvasElementFrame,
  targets: SnapTargets,
): { frame: CanvasElementFrame; guides: SnapGuides } {
  const horizontal = snapAxis(frame.x, frame.width, targets.x);
  const vertical = snapAxis(frame.y, frame.height, targets.y);
  return {
    frame: {
      ...frame,
      x: horizontal ? frame.x + horizontal.delta : Math.round(frame.x / gridSize) * gridSize,
      y: vertical ? frame.y + vertical.delta : Math.round(frame.y / gridSize) * gridSize,
    },
    guides: { x: horizontal ? [horizontal.at] : [], y: vertical ? [vertical.at] : [] },
  };
}

export interface LayerNode {
  element: CanvasElement;
  children: LayerNode[];
}

export function buildLayerTree(elements: CanvasElement[]): LayerNode[] {
  const nodes: LayerNode[] = elements.map((element) => ({ element, children: [] }));
  const roots: LayerNode[] = [];

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    let parent: LayerNode | null = null;
    for (let candidateIndex = 0; candidateIndex < nodes.length; candidateIndex += 1) {
      if (candidateIndex === index) continue;
      const candidate = nodes[candidateIndex].element;
      if (candidate.kind !== 'section' && candidate.kind !== 'card') continue;
      if (!frameContains(candidate.frame, node.element.frame)) continue;
      if (frameArea(candidate.frame) <= frameArea(node.element.frame)) continue;
      if (!parent || frameArea(candidate.frame) < frameArea(parent.element.frame)) {
        parent = nodes[candidateIndex];
      }
    }
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  return roots;
}
