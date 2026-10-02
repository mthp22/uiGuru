import { clampFrameToCanvas, moveFrame, resizeFrame } from './geometry';
import type { CanvasElement, CanvasElementFrame, CanvasProject, ResizeHandle } from './types';

const cloneOffset = 28;

function touch(project: CanvasProject): CanvasProject {
  return { ...project, updatedAt: new Date().toISOString() };
}

function mapElement(project: CanvasProject, elementId: string, recipe: (element: CanvasElement) => CanvasElement): CanvasProject {
  let changed = false;
  const elements = project.elements.map((element) => {
    if (element.id !== elementId) return element;
    const next = recipe(element);
    if (next !== element) changed = true;
    return next;
  });
  return changed ? touch({ ...project, elements }) : project;
}

export function updateElement(project: CanvasProject, elementId: string, recipe: (element: CanvasElement) => CanvasElement) {
  return mapElement(project, elementId, recipe);
}

export function removeElement(project: CanvasProject, elementId: string) {
  return touch({ ...project, elements: project.elements.filter((element) => element.id !== elementId) });
}

export function duplicateElement(project: CanvasProject, elementId: string, cloneId: string) {
  const element = project.elements.find((item) => item.id === elementId);
  if (!element) return project;
  const clone: CanvasElement = {
    ...element,
    id: cloneId,
    name: `${element.name} copy`,
    frame: clampFrameToCanvas(
      { ...element.frame, x: element.frame.x + cloneOffset, y: element.frame.y + cloneOffset },
      project.canvas,
    ),
    defaultFrame: {
      ...element.defaultFrame,
      x: element.defaultFrame.x + cloneOffset,
      y: element.defaultFrame.y + cloneOffset,
    },
    locked: false,
  };
  return touch({ ...project, elements: [...project.elements, clone] });
}

export function resetElementSize(project: CanvasProject, elementId: string) {
  return mapElement(project, elementId, (element) =>
    element.locked
      ? element
      : {
          ...element,
          frame: clampFrameToCanvas(
            {
              ...element.frame,
              width: element.defaultFrame.width,
              height: element.defaultFrame.height,
            },
            project.canvas,
          ),
        },
  );
}

export function toggleElementLock(project: CanvasProject, elementId: string) {
  return mapElement(project, elementId, (element) => ({ ...element, locked: !element.locked }));
}

export function bringElementForward(project: CanvasProject, elementId: string) {
  const index = project.elements.findIndex((element) => element.id === elementId);
  if (index < 0 || index === project.elements.length - 1) return project;
  const elements = [...project.elements];
  [elements[index], elements[index + 1]] = [elements[index + 1], elements[index]];
  return touch({ ...project, elements });
}

export function sendElementBackward(project: CanvasProject, elementId: string) {
  const index = project.elements.findIndex((element) => element.id === elementId);
  if (index <= 0) return project;
  const elements = [...project.elements];
  [elements[index - 1], elements[index]] = [elements[index], elements[index - 1]];
  return touch({ ...project, elements });
}

export function moveElement(project: CanvasProject, elementId: string, delta: { x: number; y: number }) {
  return mapElement(project, elementId, (element) =>
    element.locked ? element : { ...element, frame: moveFrame(element.frame, delta, project.canvas) },
  );
}

export function setElementFrame(project: CanvasProject, elementId: string, frame: CanvasElementFrame) {
  return mapElement(project, elementId, (element) => (element.locked ? element : { ...element, frame }));
}

export function resizeElement(
  project: CanvasProject,
  elementId: string,
  handle: ResizeHandle,
  delta: { x: number; y: number },
) {
  return mapElement(project, elementId, (element) =>
    element.locked ? element : { ...element, frame: resizeFrame(element.frame, handle, delta, project.canvas) },
  );
}

export function normalizeProject(project: CanvasProject): CanvasProject {
  return {
    ...project,
    elements: project.elements.map((element) => ({
      ...element,
      defaultFrame: element.defaultFrame ?? { ...element.frame },
      locked: Boolean(element.locked),
    })),
  };
}
