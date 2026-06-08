import { Image, Layers, MousePointer2, Square, Type } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ElementKind } from './types';

export const iconByKind: Record<ElementKind, ReactNode> = {
  section: <Layers size={17} />,
  card: <Square size={17} />,
  heading: <Type size={17} />,
  text: <Type size={17} />,
  image: <Image size={17} />,
  button: <MousePointer2 size={17} />,
  'badge-list': <Layers size={17} />,
};
