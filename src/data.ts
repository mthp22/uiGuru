import type { CanvasElement, CanvasElementContent, CanvasElementStyle, CanvasProject, ElementKind, Framework } from './types';

export const frameworks: { id: Framework; label: string }[] = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'angular', label: 'Angular' },
  { id: 'javafx', label: 'JavaFX' },
  { id: 'bootstrap', label: 'Bootstrap' },
  { id: 'tailwind', label: 'Tailwind' },
  { id: 'html-css', label: 'HTML/CSS' },
];

export const elementPalette: { kind: ElementKind; label: string; description: string }[] = [
  { kind: 'section', label: 'Section', description: 'A surface for grouping content.' },
  { kind: 'card', label: 'Card', description: 'Image, heading, copy, tags, and actions.' },
  { kind: 'heading', label: 'Heading', description: 'Configurable title text.' },
  { kind: 'text', label: 'Text', description: 'Paragraph or supporting copy.' },
  { kind: 'image', label: 'Image', description: 'Remote image block with object fit.' },
  { kind: 'button', label: 'Button', description: 'Primary or secondary action.' },
  { kind: 'badge-list', label: 'Badges', description: 'Inline labels and status chips.' },
];

export const presetProjects = [
  { id: 'dashboard', label: 'Dashboard Cards' },
  { id: 'product', label: 'Product Showcase' },
  { id: 'profile', label: 'Profile Header' },
] as const;

const baseStyle: CanvasElementStyle = {
  background: '#ffffff',
  color: '#172033',
  borderColor: '#d7dee8',
  accent: '#2563eb',
  fontFamily: 'Inter',
  fontSize: 16,
  fontWeight: 500,
  textAlign: 'left',
  radius: 8,
  padding: 18,
  shadow: 10,
  opacity: 100,
};

const baseContent: CanvasElementContent = {
  title: 'Untitled block',
  subtitle: 'Supporting label',
  body: 'Add your content here. Select this block to edit copy, images, type, color, spacing, and layout.',
  imageUrl: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80',
  altText: '',
  actionLabel: 'Action',
  items: ['Fast', 'Configurable', 'Exportable'],
};

const defaultsByKind: Record<ElementKind, Partial<CanvasElement>> = {
  section: {
    name: 'Section',
    frame: { x: 96, y: 80, width: 720, height: 280 },
    style: { ...baseStyle, background: '#f8fafc', padding: 24, shadow: 0 },
    content: { ...baseContent, title: 'New Section', body: 'Use sections to compose landing pages, dashboards, and app screens.' },
  },
  card: {
    name: 'Card',
    frame: { x: 120, y: 100, width: 340, height: 420 },
    content: { ...baseContent, title: 'Framework-ready card', subtitle: 'Card block', actionLabel: 'Export UI' },
  },
  heading: {
    name: 'Heading',
    frame: { x: 120, y: 80, width: 520, height: 90 },
    style: { ...baseStyle, background: 'transparent', borderColor: 'transparent', fontSize: 42, fontWeight: 800, shadow: 0, padding: 4 },
    content: { ...baseContent, title: 'Design your layout', body: '' },
  },
  text: {
    name: 'Text',
    frame: { x: 120, y: 190, width: 460, height: 120 },
    style: { ...baseStyle, background: 'transparent', borderColor: 'transparent', color: '#526174', shadow: 0, padding: 4 },
    content: { ...baseContent, title: '', body: 'Write body copy, descriptions, notes, or product messaging directly in the inspector.' },
  },
  image: {
    name: 'Image',
    frame: { x: 120, y: 120, width: 360, height: 230 },
    style: { ...baseStyle, padding: 0, shadow: 8 },
    content: { ...baseContent, title: '', body: '', altText: 'Layout image' },
  },
  button: {
    name: 'Button',
    frame: { x: 120, y: 340, width: 160, height: 52 },
    style: { ...baseStyle, background: '#2563eb', color: '#ffffff', borderColor: '#2563eb', fontWeight: 800, shadow: 6, padding: 12 },
    content: { ...baseContent, actionLabel: 'Get started', title: '', body: '' },
  },
  'badge-list': {
    name: 'Badges',
    frame: { x: 120, y: 300, width: 320, height: 70 },
    style: { ...baseStyle, background: 'transparent', borderColor: 'transparent', shadow: 0, padding: 4 },
    content: { ...baseContent, title: '', body: '', items: ['Beta', 'Responsive', 'Live export'] },
  },
};

export function createElement(kind: ElementKind, position?: { x: number; y: number }): CanvasElement {
  const defaults = defaultsByKind[kind];
  const frame = defaults.frame ?? { x: 120, y: 120, width: 260, height: 160 };
  const nextFrame = { ...frame, ...position };
  return {
    id: crypto.randomUUID(),
    kind,
    name: defaults.name ?? kind,
    frame: nextFrame,
    defaultFrame: { ...nextFrame },
    style: { ...baseStyle, ...defaults.style },
    content: { ...baseContent, ...defaults.content },
    locked: false,
  };
}

export function createEmptyProject(): CanvasProject {
  return {
    id: crypto.randomUUID(),
    name: 'Untitled playground',
    framework: 'react',
    layoutMode: 'free',
    canvas: {
      width: 1180,
      height: 760,
      background: '#f8fafc',
    },
    elements: [],
    updatedAt: new Date().toISOString(),
  };
}

export function createPresetProject(preset: (typeof presetProjects)[number]['id']): CanvasProject {
  const project = createEmptyProject();
  if (preset === 'dashboard') {
    project.name = 'Dashboard card grid';
    project.elements = [
      createElement('heading', { x: 80, y: 64 }),
      createElement('text', { x: 84, y: 150 }),
      createElement('card', { x: 84, y: 270 }),
      createElement('card', { x: 460, y: 270 }),
      createElement('card', { x: 836, y: 270 }),
    ].map((element, index) => ({
      ...element,
      content: { ...element.content, title: index > 1 ? ['Conversion', 'Pipeline', 'Retention'][index - 2] ?? element.content.title : element.content.title },
    }));
  }
  if (preset === 'product') {
    project.name = 'Product showcase';
    project.elements = [
      createElement('image', { x: 92, y: 90 }),
      createElement('heading', { x: 520, y: 100 }),
      createElement('text', { x: 524, y: 210 }),
      createElement('badge-list', { x: 524, y: 330 }),
      createElement('button', { x: 524, y: 420 }),
    ];
  }
  if (preset === 'profile') {
    project.name = 'Profile header';
    project.elements = [
      createElement('section', { x: 92, y: 88 }),
      createElement('image', { x: 132, y: 130 }),
      createElement('heading', { x: 540, y: 130 }),
      createElement('text', { x: 544, y: 232 }),
      createElement('button', { x: 544, y: 360 }),
    ];
  }
  project.updatedAt = new Date().toISOString();
  return project;
}
