export type Framework = 'react' | 'vue' | 'angular' | 'javafx' | 'bootstrap' | 'tailwind' | 'html-css';
export type PreviewSize = 'desktop' | 'tablet' | 'mobile';
export type ElementKind = 'section' | 'card' | 'heading' | 'text' | 'image' | 'button' | 'badge-list';
export type ComponentId =
  | 'navbar'
  | 'hero'
  | 'feature-grid'
  | 'pricing-card'
  | 'login-form'
  | 'contact-form'
  | 'testimonial'
  | 'footer';
export type FontFamily = 'Inter' | 'Georgia' | 'Arial' | 'Courier New' | 'Trebuchet MS';
export type TextAlign = 'left' | 'center' | 'right';
export type LayoutMode = 'free' | 'stack' | 'grid';
export type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
export type CanvasCommand =
  | 'remove'
  | 'duplicate'
  | 'reset-size'
  | 'toggle-lock'
  | 'bring-forward'
  | 'send-backward'
  | 'nudge';

export interface CanvasElementStyle {
  background: string;
  color: string;
  borderColor: string;
  accent: string;
  fontFamily: FontFamily;
  fontSize: number;
  fontWeight: number;
  textAlign: TextAlign;
  radius: number;
  padding: number;
  shadow: number;
  opacity: number;
}

export interface CanvasElementContent {
  title: string;
  subtitle: string;
  body: string;
  imageUrl: string;
  altText: string;
  actionLabel: string;
  items: string[];
}

export interface CanvasElementFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnapGuides {
  x: number[];
  y: number[];
}

export interface SnapTargets {
  x: number[];
  y: number[];
}

export interface CanvasElement {
  id: string;
  kind: ElementKind;
  name: string;
  frame: CanvasElementFrame;
  defaultFrame: CanvasElementFrame;
  style: CanvasElementStyle;
  content: CanvasElementContent;
  locked: boolean;
}

export interface CanvasProject {
  id: string;
  name: string;
  framework: Framework;
  layoutMode: LayoutMode;
  canvas: {
    width: number;
    height: number;
    background: string;
  };
  elements: CanvasElement[];
  updatedAt: string;
}
