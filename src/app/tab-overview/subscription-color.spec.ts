import { chipOverlayFor, contrastFor, contrastHexFor, isPresetColor } from './subscription-color';

describe('isPresetColor', () => {
  it('recognises the built-in colours whatever the casing', () => {
    expect(isPresetColor('BLUE')).toBe(true);
    expect(isPresetColor('blue')).toBe(true);
    expect(isPresetColor('Grey')).toBe(true);
  });

  it('rejects anything that is not a preset', () => {
    expect(isPresetColor('#3880ff')).toBe(false);
    expect(isPresetColor('purple')).toBe(false);
    expect(isPresetColor('')).toBe(false);
  });
});

describe('contrastFor', () => {
  it('uses dark text on light backgrounds', () => {
    expect(contrastFor('#ffffff')).toBe('dark');
    expect(contrastFor('#ffc409')).toBe('dark');   // the yellow preset
    expect(contrastFor('#ffffaa')).toBe('dark');
  });

  it('uses light text on dark backgrounds', () => {
    expect(contrastFor('#000000')).toBe('light');
    expect(contrastFor('#1f1f1f')).toBe('light');
    expect(contrastFor('#22194d')).toBe('light');
  });

  it('goes by readability, not by what Ionic picks for its own palette', () => {
    // Ionic pairs its blue with white text, but black is measurably better on
    // it (5.7:1 against 3.7:1). Presets never reach this function -- they use
    // Ionic's own -contrast value -- so custom colours optimise for legibility.
    expect(contrastFor('#3880ff')).toBe('dark');
  });

  it('handles the short hex form', () => {
    expect(contrastFor('#fff')).toBe('dark');
    expect(contrastFor('#000')).toBe('light');
  });

  it('falls back to light for colours it cannot parse', () => {
    expect(contrastFor('rebeccapurple')).toBe('light');
    expect(contrastFor('rgb(1, 2, 3)')).toBe('light');
    expect(contrastFor('')).toBe('light');
  });
});

describe('contrastHexFor', () => {
  it('returns a literal colour, never an Ionic variable', () => {
    // var(--ion-color-light) resolves to a near-black in dark mode, which
    // rendered the text inverted on custom tiles. Literal values only.
    expect(contrastHexFor('#22194d')).toMatch(/^#[0-9a-f]{6}$/i);
    expect(contrastHexFor('#ffffaa')).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('pairs light text with dark tiles and dark text with light tiles', () => {
    expect(contrastHexFor('#22194d')).toBe('#f4f5f8');
    expect(contrastHexFor('#ffffaa')).toBe('#222428');
  });
});

describe('chipOverlayFor', () => {
  it('darkens on light tiles, where a white overlay would vanish', () => {
    expect(chipOverlayFor('#ffddaa')).toBe('rgba(0, 0, 0, 0.24)');   // pale peach
    expect(chipOverlayFor('#afccff')).toBe('rgba(0, 0, 0, 0.24)');   // the dark-theme blue
    expect(chipOverlayFor('#ffffff')).toBe('rgba(0, 0, 0, 0.24)');
  });

  it('lightens on dark tiles', () => {
    expect(chipOverlayFor('#22194d')).toBe('rgba(255, 255, 255, 0.24)');
    expect(chipOverlayFor('#1f1f1f')).toBe('rgba(255, 255, 255, 0.24)');
  });

  it('tints in the same direction as the text, so both stay legible together', () => {
    for (const tile of ['#ffddaa', '#afccff', '#2dd36f', '#22194d', '#1f1f1f']) {
      const wantsDarkText = contrastFor(tile) === 'dark';
      expect(chipOverlayFor(tile).startsWith('rgba(0, 0, 0')).toBe(wantsDarkText);
    }
  });
});
