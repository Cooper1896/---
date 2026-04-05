/**
 * Zenless Tavern Design Tokens
 *
 * All visual constants live here. Pages import tokens instead of
 * hard-coding hex values. The tokens are also injected as CSS custom
 * properties (see tokens.css) so Tailwind utilities can reference them.
 */

export const colors = {
  /* ── backgrounds ─────────────────────────────────── */
  bg: '#131313',
  bgDeep: '#0a0a0a',
  surface: '#1c1b1b',
  surfaceAlt: '#0e0e0e',

  /* ── borders / lines ─────────────────────────────── */
  line: '#353535',
  lineLight: '#454545',

  /* ── text ─────────────────────────────────────────── */
  text: '#e5e2e1',
  muted: '#959177',

  /* ── accent: primary (yellow / signal) ───────────── */
  accentPrimary: '#FFF000',
  accentPrimaryFg: '#353100',

  /* ── accent: secondary (orange / industrial) ─────── */
  accentSecondary: '#FA5C1C',

  /* ── accent: tertiary (cyan / terminal) ──────────── */
  accentTertiary: '#00DAF3',

  /* ── status ───────────────────────────────────────── */
  danger: '#ef4444',
  dangerMuted: 'rgba(239,68,68,0.1)',
  warning: '#FFF000',
  success: '#4ade80',
  successMuted: 'rgba(74,222,128,0.1)',
  info: '#00DAF3',
} as const;

export const fonts = {
  sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
  headline: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
} as const;

export const spacing = {
  navHeight: '56px',
  sidebarWidth: '256px',
  footerHeight: '40px',
  phoneMaxWidth: '430px',
  phoneMaxHeight: '932px',
} as const;

export type ThemeColors = typeof colors;
export type ThemeFonts = typeof fonts;
export type ThemeSpacing = typeof spacing;
