import { Copy, Lock, Trash2, Unlock } from 'lucide-react';
import type { ReactNode } from 'react';
import type { CanvasElement, CanvasElementContent, ElementKind } from './types';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="inspector-group" open>
      <summary>{title}</summary>
      <div className="inspector-group-body">{children}</div>
    </details>
  );
}

const contentByKind: Record<ElementKind, { key: keyof CanvasElementContent; label: string; multiline?: boolean }[]> = {
  heading: [{ key: 'title', label: 'Content' }],
  text: [{ key: 'body', label: 'Content', multiline: true }],
  image: [
    { key: 'imageUrl', label: 'Image URL' },
    { key: 'altText', label: 'Alt text' },
  ],
  button: [{ key: 'actionLabel', label: 'Label' }],
  'badge-list': [{ key: 'items', label: 'Items', multiline: true }],
  section: [
    { key: 'title', label: 'Title' },
    { key: 'body', label: 'Body', multiline: true },
  ],
  card: [
    { key: 'subtitle', label: 'Eyebrow' },
    { key: 'title', label: 'Title' },
    { key: 'body', label: 'Body', multiline: true },
    { key: 'imageUrl', label: 'Image URL' },
    { key: 'altText', label: 'Alt text' },
    { key: 'items', label: 'Items', multiline: true },
    { key: 'actionLabel', label: 'Button label' },
  ],
};

const accentKinds: ElementKind[] = ['button', 'card', 'badge-list', 'section'];

export function Inspector({
  element,
  update,
  onDuplicate,
  onDelete,
}: {
  element: CanvasElement;
  update: (recipe: (element: CanvasElement) => CanvasElement, groupKey?: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const updateFrame = (key: keyof CanvasElement['frame'], value: number) => {
    update((current) => ({ ...current, frame: { ...current.frame, [key]: value } }), `frame.${key}`);
  };
  const updateStyle = (key: keyof CanvasElement['style'], value: string | number) => {
    update((current) => ({ ...current, style: { ...current.style, [key]: value } }), `style.${key}`);
  };
  const updateContent = (key: keyof CanvasElement['content'], value: string | string[]) => {
    update((current) => ({ ...current, content: { ...current.content, [key]: value } }), `content.${key}`);
  };

  return (
    <section className="inspector">
      <div className="inspector-title">
        <div>
          <h2>{element.name}</h2>
          <span>{element.kind}</span>
        </div>
        <div className="inspector-actions">
          <button aria-label="Duplicate block" onClick={onDuplicate} title="Duplicate (Cmd/Ctrl + D)" type="button">
            <Copy size={15} />
          </button>
          <button aria-label="Delete block" onClick={onDelete} title="Delete (Delete / Backspace)" type="button">
            <Trash2 size={15} />
          </button>
          <button
            aria-label={element.locked ? 'Unlock block' : 'Lock block'}
            aria-pressed={element.locked}
            onClick={() => update((current) => ({ ...current, locked: !current.locked }), 'lock')}
            title={element.locked ? 'Unlock' : 'Lock'}
            type="button"
          >
            {element.locked ? <Lock size={15} /> : <Unlock size={15} />}
          </button>
        </div>
      </div>

      <Field label="Layer name">
        <input
          value={element.name}
          onChange={(event) => update((current) => ({ ...current, name: event.target.value }), 'name')}
        />
      </Field>

      <Group title="Content">
        {contentByKind[element.kind].map((field) => {
          const value = element.content[field.key];
          const text = Array.isArray(value) ? value.join('\n') : value;
          const write = (next: string) =>
            updateContent(field.key, Array.isArray(value) ? next.split('\n').filter(Boolean) : next);
          return (
            <Field key={field.key} label={field.label}>
              {field.multiline ? (
                <textarea rows={3} value={text} onChange={(event) => write(event.target.value)} />
              ) : (
                <input value={text} onChange={(event) => write(event.target.value)} />
              )}
            </Field>
          );
        })}
      </Group>

      {element.kind === 'image' ? null : (
        <Group title="Typography">
          <Field label="Font">
            <select
              value={element.style.fontFamily}
              onChange={(event) => updateStyle('fontFamily', event.target.value)}
            >
              <option value="Inter">Inter</option>
              <option value="Georgia">Georgia</option>
              <option value="Arial">Arial</option>
              <option value="Courier New">Courier New</option>
              <option value="Trebuchet MS">Trebuchet MS</option>
            </select>
          </Field>
          <Field label={`Size ${element.style.fontSize}px`}>
            <input
              aria-label="Font size"
              max="72"
              min="10"
              type="range"
              value={element.style.fontSize}
              onChange={(event) => updateStyle('fontSize', Number(event.target.value))}
            />
          </Field>
          <Field label={`Weight ${element.style.fontWeight}`}>
            <input
              aria-label="Font weight"
              max="900"
              min="300"
              step="100"
              type="range"
              value={element.style.fontWeight}
              onChange={(event) => updateStyle('fontWeight', Number(event.target.value))}
            />
          </Field>
          <div className="split-fields">
            <Field label="Text">
              <input
                aria-label="Text color"
                type="color"
                value={element.style.color}
                onChange={(event) => updateStyle('color', event.target.value)}
              />
            </Field>
            <Field label="Align">
              <select
                aria-label="Text align"
                value={element.style.textAlign}
                onChange={(event) => updateStyle('textAlign', event.target.value)}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </Field>
          </div>
        </Group>
      )}

      <Group title="Spacing">
        <Field label={`Padding ${element.style.padding}px`}>
          <input
            aria-label="Padding"
            max="42"
            min="0"
            type="range"
            value={element.style.padding}
            onChange={(event) => updateStyle('padding', Number(event.target.value))}
          />
        </Field>
      </Group>

      <Group title="Position">
        <div className="split-fields">
          <Field label="X">
            <input
              aria-label="Position X"
              type="number"
              value={element.frame.x}
              onChange={(event) => updateFrame('x', Number(event.target.value))}
            />
          </Field>
          <Field label="Y">
            <input
              aria-label="Position Y"
              type="number"
              value={element.frame.y}
              onChange={(event) => updateFrame('y', Number(event.target.value))}
            />
          </Field>
          <Field label="W">
            <input
              aria-label="Width"
              min="24"
              type="number"
              value={element.frame.width}
              onChange={(event) => updateFrame('width', Number(event.target.value))}
            />
          </Field>
          <Field label="H">
            <input
              aria-label="Height"
              min="24"
              type="number"
              value={element.frame.height}
              onChange={(event) => updateFrame('height', Number(event.target.value))}
            />
          </Field>
        </div>
      </Group>

      <Group title="Appearance">
        <div className="split-fields">
          <Field label="Fill">
            <input
              aria-label="Fill color"
              type="color"
              value={element.style.background === 'transparent' ? '#ffffff' : element.style.background}
              onChange={(event) => updateStyle('background', event.target.value)}
            />
          </Field>
          <Field label="Border">
            <input
              aria-label="Border color"
              type="color"
              value={element.style.borderColor === 'transparent' ? '#ffffff' : element.style.borderColor}
              onChange={(event) => updateStyle('borderColor', event.target.value)}
            />
          </Field>
          {accentKinds.includes(element.kind) ? (
            <Field label="Accent">
              <input
                aria-label="Accent color"
                type="color"
                value={element.style.accent}
                onChange={(event) => updateStyle('accent', event.target.value)}
              />
            </Field>
          ) : null}
          <Field label="Radius">
            <input
              aria-label="Corner radius"
              aria-valuetext={`${element.style.radius} pixels`}
              max="32"
              min="0"
              type="range"
              value={element.style.radius}
              onChange={(event) => updateStyle('radius', Number(event.target.value))}
            />
          </Field>
        </div>
        <Field label={`Shadow ${element.style.shadow}`}>
          <input
            aria-label="Shadow"
            max="28"
            min="0"
            type="range"
            value={element.style.shadow}
            onChange={(event) => updateStyle('shadow', Number(event.target.value))}
          />
        </Field>
        <Field label={`Opacity ${element.style.opacity}%`}>
          <input
            aria-label="Opacity"
            max="100"
            min="10"
            type="range"
            value={element.style.opacity}
            onChange={(event) => updateStyle('opacity', Number(event.target.value))}
          />
        </Field>
      </Group>
    </section>
  );
}
