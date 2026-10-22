export function toCanvasPoint(
  event: { clientX: number; clientY: number },
  canvas: HTMLElement,
  scale: number,
) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.round((event.clientX - rect.left) / scale),
    y: Math.round((event.clientY - rect.top) / scale),
  };
}
