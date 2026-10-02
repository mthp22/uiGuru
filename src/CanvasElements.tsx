import {
  BringToFront,
  Copy,
  Lock,
  RotateCcw,
  SendToBack,
  Trash2,
  Unlock,
} from 'lucide-react';
import type { CSSProperties, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { iconByKind } from './canvasIcons';
import { buildLayerTree, type LayerNode } from './geometry';
import type { CanvasElement, ResizeHandle } from './types';

export type ContextMenuAction = 'remove' | 'duplicate' | 'reset-size' | 'toggle-lock' | 'bring-forward' | 'send-backward';

export function CanvasBlock({
  element,
  selected,
  onContextMenu,
  onPointerDown,
  onResizeStart,
}: {
  element: CanvasElement;
  selected: boolean;
  onContextMenu: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onResizeStart: (handle: ResizeHandle, event: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  const style = element.style;
  return (
    <div
      className="canvas-block-frame"
      data-locked={element.locked}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={onContextMenu}
      onPointerDown={(event) => {
        event.stopPropagation();
        onPointerDown(event);
      }}
      style={{
        left: element.frame.x,
        top: element.frame.y,
        width: element.frame.width,
      } as CSSProperties}
    >
      <div
        className={`canvas-block ${selected ? 'selected' : ''}`}
        data-locked={element.locked}
        style={
          {
            minHeight: element.frame.height,
            background: style.background,
            color: style.color,
            borderColor: style.borderColor,
            borderRadius: style.radius,
            padding: style.padding,
            boxShadow: `0 ${Math.max(0, style.shadow)}px ${style.shadow * 2}px rgba(15, 23, 42, .12)`,
            fontFamily: `${style.fontFamily}, system-ui, sans-serif`,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            textAlign: style.textAlign,
            opacity: style.opacity / 100,
          } as CSSProperties
        }
      >
        {element.locked ? <Lock className="lock-mark" size={14} /> : null}
        <ElementPreview element={element} />
      </div>
      {selected && !element.locked ? <ResizeHandles onResizeStart={onResizeStart} /> : null}
    </div>
  );
}

function ElementPreview({ element }: { element: CanvasElement }) {
  const c = element.content;
  if (element.kind === 'heading') return <h2>{c.title}</h2>;
  if (element.kind === 'text') return <p>{c.body}</p>;
  if (element.kind === 'image') return <img alt={c.altText} className="block-image" src={c.imageUrl} />;
  if (element.kind === 'button') return <button className="rendered-button" type="button">{c.actionLabel}</button>;
  if (element.kind === 'badge-list') {
    return <div className="rendered-badges">{c.items.map((item) => <span key={item}>{item}</span>)}</div>;
  }
  if (element.kind === 'section') {
    return (
      <section className="rendered-section">
        <h2>{c.title}</h2>
        <p>{c.body}</p>
      </section>
    );
  }
  return (
    <article className="rendered-card">
      <img alt={c.altText} src={c.imageUrl} />
      <small>{c.subtitle}</small>
      <h2>{c.title}</h2>
      <p>{c.body}</p>
      <div className="rendered-badges">{c.items.map((item) => <span key={item}>{item}</span>)}</div>
      <button className="rendered-button" type="button">{c.actionLabel}</button>
    </article>
  );
}

const resizeHandles: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

function ResizeHandles({
  onResizeStart,
}: {
  onResizeStart: (handle: ResizeHandle, event: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <>
      {resizeHandles.map((handle) => (
        <button
          aria-label={`Resize ${handle}`}
          className={`resize-handle handle-${handle}`}
          key={handle}
          onPointerDown={(event) => onResizeStart(handle, event)}
          type="button"
        />
      ))}
    </>
  );
}

export function ContextMenu({
  locked,
  onAction,
  position,
}: {
  locked: boolean;
  onAction: (action: ContextMenuAction) => void;
  position: { x: number; y: number };
}) {
  return (
    <div className="context-menu" style={{ left: position.x, top: position.y }}>
      <button onClick={() => onAction('duplicate')} type="button"><Copy size={14} /> Duplicate</button>
      <button onClick={() => onAction('reset-size')} type="button"><RotateCcw size={14} /> Reset size</button>
      <button onClick={() => onAction('toggle-lock')} type="button">{locked ? <Unlock size={14} /> : <Lock size={14} />} {locked ? 'Unlock' : 'Lock'}</button>
      <button onClick={() => onAction('bring-forward')} type="button"><BringToFront size={14} /> Bring forward</button>
      <button onClick={() => onAction('send-backward')} type="button"><SendToBack size={14} /> Send backward</button>
      <button className="danger" onClick={() => onAction('remove')} type="button"><Trash2 size={14} /> Remove</button>
    </div>
  );
}

export function LayerTree({
  elements,
  selectedId,
  onSelect,
}: {
  elements: CanvasElement[];
  selectedId: string | null;
  onSelect: (elementId: string) => void;
}) {
  const renderNodes = (nodes: LayerNode[], depth: number): ReactNode =>
    nodes.map(({ element, children }) => (
      <li key={element.id}>
        <button
          aria-current={selectedId === element.id ? 'true' : undefined}
          className={selectedId === element.id ? 'active' : ''}
          onClick={() => onSelect(element.id)}
          style={{ paddingLeft: `${10 + depth * 14}px` }}
          title={element.locked ? `${element.name} (locked)` : element.name}
          type="button"
        >
          {iconByKind[element.kind]}
          <span>{element.name}</span>
          {element.locked ? <Lock size={12} /> : null}
        </button>
        {children.length > 0 ? <ul>{renderNodes(children, depth + 1)}</ul> : null}
      </li>
    ));

  return <ul className="layer-tree">{renderNodes(buildLayerTree(elements), 0)}</ul>;
}
