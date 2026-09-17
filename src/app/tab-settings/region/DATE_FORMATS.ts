export const dateFormats = ['D. MMMM YYYY', 'DD.MM.YYYY', 'YYYY-MM-DD', 'MMMM D, YYYY'];

/**
 * The values above are Ionic 5 `displayFormat` tokens and are what gets persisted
 * in user settings, so they are kept verbatim. Ionic 6 removed `displayFormat`;
 * dates are now rendered with Angular's DatePipe, which uses different tokens.
 */
export const angularDateFormats: Record<string, string> = {
  'D. MMMM YYYY': 'd. MMMM y',
  'DD.MM.YYYY': 'dd.MM.y',
  'YYYY-MM-DD': 'y-MM-dd',
  'MMMM D, YYYY': 'MMMM d, y',
};
