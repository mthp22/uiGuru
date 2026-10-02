import type {
  CanvasElement,
  CanvasElementContent,
  CanvasElementStyle,
  CanvasProject,
  ComponentId,
  ElementKind,
  Framework,
} from './types';

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

export const componentPalette: { id: ComponentId; label: string; description: string }[] = [
  { id: 'navbar', label: 'Navbar', description: 'Brand, links, and a call to action.' },
  { id: 'hero', label: 'Hero', description: 'Headline, copy, actions, and media.' },
  { id: 'feature-grid', label: 'Feature Grid', description: 'Intro plus a row of feature cards.' },
  { id: 'pricing-card', label: 'Pricing Card', description: 'Three plan cards with actions.' },
  { id: 'login-form', label: 'Login Form', description: 'Fields, helper link, and submit.' },
  { id: 'contact-form', label: 'Contact Form', description: 'Name, email, message, and send.' },
  { id: 'testimonial', label: 'Testimonial', description: 'Quote, attribution, and badge.' },
  { id: 'footer', label: 'Footer', description: 'Brand, link columns, and legal line.' },
];

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

const fieldStyle: Partial<CanvasElementStyle> = {
  background: '#f8fafc',
  borderColor: '#cbd5e1',
  color: '#64748b',
  radius: 8,
  padding: 12,
  shadow: 0,
};

const darkSurface: Partial<CanvasElementStyle> = {
  background: '#0f172a',
  borderColor: '#0f172a',
  color: '#cbd5e1',
  shadow: 0,
  padding: 0,
};

const linkStyle: Partial<CanvasElementStyle> = { color: '#e2e8f0', fontWeight: 700, fontSize: 14, padding: 0 };

export function createComponentElements(id: ComponentId, origin: { x: number; y: number }): CanvasElement[] {
  const place = (
    kind: ElementKind,
    x: number,
    y: number,
    width: number,
    height: number,
    content: Partial<CanvasElementContent> = {},
    style: Partial<CanvasElementStyle> = {},
  ): CanvasElement => {
    const element = createElement(kind);
    const frame = { x: origin.x + x, y: origin.y + y, width, height };
    return {
      ...element,
      frame,
      defaultFrame: frame,
      content: { ...element.content, ...content },
      style: { ...element.style, ...style },
    };
  };

  switch (id) {
    case 'navbar':
      return [
        place('section', 0, 0, 940, 72, { title: '', body: '' }, { background: '#ffffff', borderColor: '#dbe3ee', shadow: 4, padding: 0 }),
        place('text', 26, 20, 220, 34, { body: 'uiGuru' }, { color: '#0f172a', fontSize: 22, fontWeight: 800, padding: 0 }),
        place('text', 372, 24, 340, 26, { body: 'Features   Pricing   Docs' }, { color: '#475569', padding: 0 }),
        place('button', 812, 14, 104, 44, { actionLabel: 'Sign up' }, { padding: 10 }),
      ];
    case 'hero':
      return [
        place('heading', 0, 16, 560, 130, { title: 'Build UI visually. Ship real code.' }, { fontSize: 46, padding: 0 }),
        place('text', 0, 160, 540, 96, { body: 'Drag, drop, customize, and export production-ready interfaces to React, Vue, Angular, and more.' }, { fontSize: 18, padding: 0 }),
        place('button', 0, 276, 176, 52, { actionLabel: 'Start building' }),
        place('button', 192, 276, 176, 52, { actionLabel: 'See how it works' }, { background: '#ffffff', color: '#1d4ed8', borderColor: '#bfdbfe', shadow: 4 }),
        place('image', 600, 16, 340, 312, {}, { radius: 14 }),
      ];
    case 'feature-grid':
      return [
        place('heading', 0, 0, 660, 70, { title: 'Everything you need to ship UI faster' }, { fontSize: 34, padding: 0 }),
        place('text', 0, 78, 600, 44, { body: 'Blocks, a visual inspector, responsive preview, and clean export in one focused builder.' }, { color: '#64748b', padding: 0 }),
        place('card', 0, 148, 296, 252, { subtitle: 'Blocks', title: 'Drag and drop', body: 'Compose layouts from ready-made blocks.', actionLabel: 'Explore' }),
        place('card', 322, 148, 296, 252, { subtitle: 'Inspector', title: 'Edit visually', body: 'Change content, type, color, and spacing without touching code.', actionLabel: 'Edit' }),
        place('card', 644, 148, 296, 252, { subtitle: 'Export', title: 'Own the code', body: 'Take clean React, Vue, Angular, or HTML out of the builder.', actionLabel: 'Export' }),
      ];
    case 'pricing-card':
      return [
        place('heading', 0, 0, 660, 60, { title: 'Simple, transparent pricing' }, { fontSize: 32, padding: 0 }),
        place('card', 0, 84, 296, 336, { subtitle: 'Free', title: 'Starter', body: 'For side projects and quick prototypes.', items: ['3 projects', 'HTML/CSS export'], actionLabel: 'Choose Starter' }),
        place('card', 322, 84, 296, 336, { subtitle: '$19 / mo', title: 'Pro', body: 'For builders shipping client work every week.', items: ['Unlimited projects', 'All frameworks'], actionLabel: 'Choose Pro' }),
        place('card', 644, 84, 296, 336, { subtitle: '$49 / mo', title: 'Team', body: 'Shared blocks and exports for small teams.', items: ['Everything in Pro', 'Shared presets'], actionLabel: 'Choose Team' }),
      ];
    case 'login-form':
      return [
        place('section', 0, 0, 420, 424, { title: '', body: '' }, { background: '#ffffff', borderColor: '#e2e8f0', shadow: 12, padding: 0 }),
        place('heading', 32, 32, 340, 46, { title: 'Welcome back' }, { fontSize: 28, padding: 0 }),
        place('text', 32, 86, 340, 34, { body: 'Sign in to continue building.' }, { color: '#64748b', padding: 0 }),
        place('text', 32, 140, 356, 46, { body: 'you@example.com' }, fieldStyle),
        place('text', 32, 202, 356, 46, { body: '••••••••' }, fieldStyle),
        place('text', 32, 262, 356, 28, { body: 'Forgot password?' }, { color: '#2563eb', fontSize: 13, fontWeight: 700, padding: 0 }),
        place('button', 32, 306, 356, 48, { actionLabel: 'Sign in' }),
        place('text', 32, 370, 356, 30, { body: 'No account yet? Create one' }, { color: '#64748b', fontSize: 13, padding: 0 }),
      ];
    case 'contact-form':
      return [
        place('section', 0, 0, 560, 470, { title: '', body: '' }, { background: '#ffffff', borderColor: '#e2e8f0', shadow: 12, padding: 0 }),
        place('heading', 36, 36, 420, 46, { title: 'Contact us' }, { fontSize: 30, padding: 0 }),
        place('text', 36, 92, 480, 34, { body: 'We usually reply within one business day.' }, { color: '#64748b', padding: 0 }),
        place('text', 36, 146, 488, 46, { body: 'Name' }, fieldStyle),
        place('text', 36, 206, 488, 46, { body: 'Email' }, fieldStyle),
        place('text', 36, 266, 488, 104, { body: 'How can we help?' }, fieldStyle),
        place('button', 36, 390, 176, 48, { actionLabel: 'Send message' }),
      ];
    case 'testimonial':
      return [
        place('section', 0, 0, 760, 236, { title: '', body: '' }, { background: '#eff6ff', borderColor: '#dbeafe', shadow: 6, padding: 0 }),
        place('text', 40, 40, 680, 104, { body: '“uiGuru cut our UI handoff time in half. We lay out the screen, export real code, and ship.”' }, { color: '#1e293b', fontSize: 22, fontWeight: 600, padding: 0 }),
        place('text', 40, 156, 680, 30, { body: 'Dana K. — Product Lead, Northwind' }, { color: '#2563eb', fontWeight: 700, padding: 0 }),
        place('badge-list', 40, 194, 320, 34, { items: ['Verified customer'] }, { padding: 0 }),
      ];
    case 'footer':
      return [
        place('section', 0, 0, 940, 224, { title: '', body: '' }, darkSurface),
        place('heading', 40, 34, 300, 42, { title: 'uiGuru' }, { color: '#ffffff', fontSize: 26, background: 'transparent', borderColor: 'transparent', padding: 0 }),
        place('text', 40, 86, 400, 56, { body: 'Build visually. Own the code.' }, { color: '#94a3b8', padding: 0 }),
        place('text', 560, 40, 150, 28, { body: 'Features' }, linkStyle),
        place('text', 560, 78, 150, 28, { body: 'Templates' }, linkStyle),
        place('text', 560, 116, 150, 28, { body: 'Export targets' }, linkStyle),
        place('text', 760, 40, 150, 28, { body: 'Docs' }, linkStyle),
        place('text', 760, 78, 150, 28, { body: 'Changelog' }, linkStyle),
        place('text', 760, 116, 150, 28, { body: 'Support' }, linkStyle),
        place('text', 40, 176, 500, 28, { body: '© 2026 uiGuru' }, { color: '#64748b', fontSize: 13, padding: 0 }),
      ];
  }
}
