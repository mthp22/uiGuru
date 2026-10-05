import {
  AlignLeft,
  CreditCard,
  Image,
  LayoutGrid,
  Layers,
  LogIn,
  Mail,
  Menu,
  MessageSquare,
  MousePointer2,
  PanelBottom,
  Sparkles,
  Square,
  TextCursorInput,
  Type,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { ComponentId, ElementKind } from './types';

export const iconByKind: Record<ElementKind, ReactNode> = {
  section: <Layers size={17} />,
  card: <Square size={17} />,
  heading: <Type size={17} />,
  text: <Type size={17} />,
  image: <Image size={17} />,
  button: <MousePointer2 size={17} />,
  'badge-list': <Layers size={17} />,
  input: <TextCursorInput size={17} />,
  textarea: <AlignLeft size={17} />,
};

export const componentIcon: Record<ComponentId, ReactNode> = {
  navbar: <Menu size={16} />,
  hero: <Sparkles size={16} />,
  'feature-grid': <LayoutGrid size={16} />,
  'pricing-card': <CreditCard size={16} />,
  'login-form': <LogIn size={16} />,
  'contact-form': <Mail size={16} />,
  testimonial: <MessageSquare size={16} />,
  footer: <PanelBottom size={16} />,
};
