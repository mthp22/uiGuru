import type { Design, DesignContent, DesignStyle, Framework, PagePreset } from './types';

export const frameworks: { id: Framework; label: string }[] = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'angular', label: 'Angular' },
  { id: 'javafx', label: 'JavaFX' },
  { id: 'bootstrap', label: 'Bootstrap' },
  { id: 'tailwind', label: 'Tailwind' },
  { id: 'html-css', label: 'HTML/CSS' },
];

export const pagePresets: { id: PagePreset; label: string; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Metrics, status cards, and activity blocks.' },
  { id: 'product-grid', label: 'Product Grid', description: 'Commerce cards with actions and badges.' },
  { id: 'article', label: 'Article Page', description: 'Editorial layout with supporting sections.' },
  { id: 'profile', label: 'Profile Page', description: 'Avatar-led identity and account highlights.' },
  { id: 'pricing', label: 'Pricing', description: 'Plans, benefits, and conversion actions.' },
  { id: 'features', label: 'Feature Grid', description: 'Product capabilities in scannable blocks.' },
  { id: 'admin-list', label: 'Admin List', description: 'Operational rows and compact summaries.' },
];

export const defaultStyle: DesignStyle = {
  accent: '#2563eb',
  surface: '#ffffff',
  text: '#172033',
  muted: '#64748b',
  spacing: 18,
  radius: 8,
  shadow: 12,
  fontScale: 1,
  showImage: true,
  showBadges: true,
  showActions: true,
  cardLayout: 'vertical',
  pageLayout: 'grid',
};

export const presetContent: Record<PagePreset, DesignContent> = {
  dashboard: {
    title: 'Revenue Command Center',
    subtitle: 'Operations dashboard',
    body: 'Track high-value accounts, weekly movement, and active workflow health from one focused surface.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80',
    meta: 'Updated 4 min ago',
    badges: ['Live', '+18%', 'Ops'],
    primaryAction: 'Open dashboard',
    secondaryAction: 'Export report',
    items: ['Pipeline velocity', 'Active accounts', 'Risk alerts', 'Team throughput'],
  },
  'product-grid': {
    title: 'Studio Monitor Arm',
    subtitle: 'Workspace essentials',
    body: 'A clean product card for comparing items, price points, and compact purchase actions.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    meta: '$129.00',
    badges: ['New', 'In stock', 'Ships today'],
    primaryAction: 'Add to cart',
    secondaryAction: 'Details',
    items: ['Aluminum frame', 'VESA ready', 'Cable channel', 'Matte finish'],
  },
  article: {
    title: 'Design Systems That Stay Useful',
    subtitle: 'Editorial layout',
    body: 'A measured article module with space for authorship, summary, and onward reading.',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
    meta: '8 min read',
    badges: ['Design', 'Systems', 'Guide'],
    primaryAction: 'Read article',
    secondaryAction: 'Save',
    items: ['Token hygiene', 'Component contracts', 'Release rhythm', 'Documentation habits'],
  },
  profile: {
    title: 'Maya Patel',
    subtitle: 'Senior product designer',
    body: 'Profile blocks that surface role, strengths, recent work, and next actions without clutter.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
    meta: 'Available for review',
    badges: ['Lead', 'Research', 'UI'],
    primaryAction: 'Message',
    secondaryAction: 'View work',
    items: ['Checkout redesign', 'Mobile IA', 'Design QA', 'Mentorship'],
  },
  pricing: {
    title: 'Pro Workspace',
    subtitle: 'For growing teams',
    body: 'A pricing card with plan value, supporting proof points, and clear upgrade actions.',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80',
    meta: '$24 / seat',
    badges: ['Popular', 'SSO', 'Priority'],
    primaryAction: 'Start trial',
    secondaryAction: 'Compare',
    items: ['Unlimited projects', 'Shared presets', 'Export history', 'Team libraries'],
  },
  features: {
    title: 'Launch Faster With Reusable Blocks',
    subtitle: 'Feature grid',
    body: 'A product feature block for communicating practical capabilities and benefits.',
    image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80',
    meta: 'v1 toolkit',
    badges: ['Fast', 'Composable', 'Exportable'],
    primaryAction: 'Use preset',
    secondaryAction: 'Preview',
    items: ['Live preview', 'Framework export', 'Saved designs', 'Page templates'],
  },
  'admin-list': {
    title: 'Review Queue',
    subtitle: 'Admin workflow',
    body: 'Compact operational cards for queues, approvals, owner state, and progress.',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
    meta: '23 open',
    badges: ['Admin', 'Queue', 'SLA'],
    primaryAction: 'Review',
    secondaryAction: 'Assign',
    items: ['Pending approvals', 'Assigned owners', 'Escalations', 'Completed today'],
  },
};

export function createDesign(overrides: Partial<Design> = {}): Design {
  const preset = overrides.preset ?? 'dashboard';
  return {
    id: crypto.randomUUID(),
    name: overrides.name ?? 'Untitled design',
    mode: overrides.mode ?? 'card',
    preset,
    framework: overrides.framework ?? 'react',
    content: { ...presetContent[preset], ...overrides.content },
    style: { ...defaultStyle, ...overrides.style },
    updatedAt: new Date().toISOString(),
  };
}
