/**
 * App theming: semantic color tokens that follow the system appearance.
 *
 * Only the *chrome* (bars, sheets, cards, controls) is themed — canvas
 * content renders exactly as authored in the project, same as a design tool.
 */
import { useColorScheme } from 'react-native';

export interface Theme {
  scheme: 'light' | 'dark';
  /** Screen background. */
  bg: string;
  /** Raised chrome: bars, sheets, cards. */
  surface: string;
  /** Subtle fill: inputs, chips, inactive buttons. */
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  /** Text placed on `accent` fills. */
  accentText: string;
  /** Tinted accent background (active rows, empty-state icons). */
  accentSoft: string;
  /** The "desk" area the artboard sits on. */
  canvasBg: string;
}

export const lightTheme: Theme = {
  scheme: 'light',
  bg: '#f1f5f9',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  border: '#e2e8f0',
  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  accent: '#2563eb',
  accentText: '#ffffff',
  accentSoft: '#eff6ff',
  canvasBg: '#e8edf3',
};

export const darkTheme: Theme = {
  scheme: 'dark',
  bg: '#0b1220',
  surface: '#131c2e',
  surfaceAlt: '#1a2436',
  border: '#243044',
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  accent: '#3b82f6',
  accentText: '#ffffff',
  accentSoft: 'rgba(59, 130, 246, 0.16)',
  canvasBg: '#080d16',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}
