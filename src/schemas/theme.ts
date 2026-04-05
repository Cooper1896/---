/**
 * Zod schemas for theme configuration validation.
 */
import { z } from 'zod';

export const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color');

export const ThemeColorsSchema = z.object({
  bg: HexColorSchema.default('#131313'),
  bgDeep: HexColorSchema.default('#0a0a0a'),
  surface: HexColorSchema.default('#1c1b1b'),
  surfaceAlt: HexColorSchema.default('#0e0e0e'),
  line: HexColorSchema.default('#353535'),
  lineLight: HexColorSchema.default('#454545'),
  text: HexColorSchema.default('#e5e2e1'),
  muted: HexColorSchema.default('#959177'),
  accentPrimary: HexColorSchema.default('#FFF000'),
  accentPrimaryFg: HexColorSchema.default('#353100'),
  accentSecondary: HexColorSchema.default('#FA5C1C'),
  accentTertiary: HexColorSchema.default('#00DAF3'),
  danger: HexColorSchema.default('#ef4444'),
  warning: HexColorSchema.default('#FFF000'),
  success: HexColorSchema.default('#4ade80'),
  info: HexColorSchema.default('#00DAF3'),
});

export type ThemeColorsInput = z.input<typeof ThemeColorsSchema>;
