export type Mode = 'card' | 'page';
export type PagePreset = 'dashboard' | 'product-grid' | 'article' | 'profile' | 'pricing' | 'features' | 'admin-list';
export type Framework = 'react' | 'vue' | 'angular' | 'javafx' | 'bootstrap' | 'tailwind' | 'html-css';
export type PreviewSize = 'desktop' | 'tablet' | 'mobile';

export type CardLayout = 'vertical' | 'horizontal' | 'compact';
export type PageLayout = 'grid' | 'sidebar' | 'stacked';

export interface DesignContent {
  title: string;
  subtitle: string;
  body: string;
  image: string;
  meta: string;
  badges: string[];
  primaryAction: string;
  secondaryAction: string;
  items: string[];
}

export interface DesignStyle {
  accent: string;
  surface: string;
  text: string;
  muted: string;
  spacing: number;
  radius: number;
  shadow: number;
  fontScale: number;
  showImage: boolean;
  showBadges: boolean;
  showActions: boolean;
  cardLayout: CardLayout;
  pageLayout: PageLayout;
}

export interface Design {
  id: string;
  name: string;
  mode: Mode;
  preset: PagePreset;
  framework: Framework;
  content: DesignContent;
  style: DesignStyle;
  updatedAt: string;
}
