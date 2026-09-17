import { subscriptionColors } from './SUBSCRIPTION_COLORS';

/**
 * A subscription's colour is either one of the built-in presets -- real Ionic
 * theme colours with their own light and dark shades, declared in
 * src/theme/variables.scss -- or any CSS colour the user picked, which is used
 * as-is in both themes.
 *
 * The card and the add/edit modal both need this distinction, so it lives here
 * rather than being duplicated in two templates that could drift apart.
 */
export function isPresetColor(color: string): boolean {
  return !!color && subscriptionColors.includes(color.toUpperCase());
}

/**
 * Which of Ionic's `light` / `dark` shades stays readable on top of `color`.
 *
 * Presets do not need this -- Ionic pairs each theme colour with its own
 * `-contrast` value -- but a hand-picked colour has no such pairing, so it is
 * derived from the background's WCAG relative luminance.
 *
 * Only hex is parsed. Import can carry any CSS colour string, and resolving
 * those would mean round-tripping through the DOM for a guess; `light` is the
 * safer default because it matches what every preset already uses.
 */
export function contrastFor(color: string): 'light' | 'dark' {
  const rgb = hexToRgb(color);
  if (!rgb) { return 'light'; }

  // WCAG 2.x relative luminance
  const channel = (value: number) => {
    const fraction = value / 255;
    return fraction <= 0.03928 ? fraction / 12.92 : Math.pow((fraction + 0.055) / 1.055, 2.4);
  };
  const luminance = 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);

  // 0.179 is where white and black text reach equal contrast against a background
  return luminance > 0.179 ? 'dark' : 'light';
}

/** Accepts `#rgb` and `#rrggbb`; anything else returns null. */
function hexToRgb(color: string): [number, number, number] | null {
  if (!color) { return null; }

  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(color.trim());
  if (short) {
    return [0, 1, 2].map(i => parseInt(short[i + 1] + short[i + 1], 16)) as [number, number, number];
  }

  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color.trim());
  if (long) {
    return [0, 1, 2].map(i => parseInt(long[i + 1], 16)) as [number, number, number];
  }

  return null;
}

/**
 * Literal text colours for custom tiles.
 *
 * Deliberately not `var(--ion-color-light)` / `--ion-color-dark`: Ionic swaps
 * that pair between themes, so in dark mode "light" resolves to a near-black
 * and the text comes out inverted. A custom tile is one fixed colour in both
 * themes, so its text has to be fixed too. The values match Ionic's own light
 * and dark shades, which are softer than pure white and black.
 */
const CONTRAST_HEX = { light: '#f4f5f8', dark: '#222428' } as const;

export function contrastHexFor(color: string): string {
  return CONTRAST_HEX[contrastFor(color)];
}
