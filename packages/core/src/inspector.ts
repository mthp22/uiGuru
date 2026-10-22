/**
 * Inspector field schema shared by the web Inspector and the mobile
 * inspector sheet. Each platform renders these definitions with its own
 * native controls; the field *data* (which keys exist per element kind,
 * their labels, options) lives here so the two stay in lockstep.
 */
import type {
  CanvasElementContent,
  ElementKind,
  FontFamily,
  TextAlign,
} from './types';

export interface ContentField {
  key: keyof CanvasElementContent;
  label: string;
  multiline?: boolean;
}

export const contentByKind: Record<ElementKind, ContentField[]> = {
  heading: [{ key: 'title', label: 'Content' }],
  text: [{ key: 'body', label: 'Content', multiline: true }],
  image: [
    { key: 'imageUrl', label: 'Image URL' },
    { key: 'altText', label: 'Alt text' },
  ],
  button: [{ key: 'actionLabel', label: 'Label' }],
  input: [{ key: 'body', label: 'Placeholder' }],
  textarea: [{ key: 'body', label: 'Placeholder' }],
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

/** Kinds whose style carries an `accent` color. */
export const accentKinds: ElementKind[] = ['button', 'card', 'badge-list', 'section'];

/** Kinds with typography controls (text-bearing). */
export const typographyKinds: ElementKind[] = ['section', 'card', 'heading', 'text', 'button', 'badge-list', 'input', 'textarea'];

export const fontFamilies: FontFamily[] = ['Inter', 'Georgia', 'Arial', 'Courier New', 'Trebuchet MS'];

export const textAlignOptions: { value: TextAlign; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

export const numericRanges = {
  fontSize: { min: 10, max: 72 },
  fontWeight: { min: 300, max: 900, step: 100 },
  padding: { min: 0, max: 42 },
  radius: { min: 0, max: 32 },
  shadow: { min: 0, max: 28 },
  opacity: { min: 10, max: 100 },
} as const;

/** Swatch palette offered by color pickers on every platform. */
export const colorSwatches: string[] = [
  'transparent',
  '#ffffff',
  '#f8fafc',
  '#f1f5f9',
  '#e2e8f0',
  '#cbd5e1',
  '#94a3b8',
  '#64748b',
  '#475569',
  '#334155',
  '#172033',
  '#0f172a',
  '#dbeafe',
  '#bfdbfe',
  '#3b82f6',
  '#2563eb',
  '#1d4ed8',
  '#dcfce7',
  '#16a34a',
  '#fef3c7',
  '#f59e0b',
  '#fee2e2',
  '#ef4444',
  '#ede9fe',
  '#7c3aed',
];
