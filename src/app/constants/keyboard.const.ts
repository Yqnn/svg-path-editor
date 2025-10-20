/**
 * Keyboard event constants
 *
 * Centralized keyboard key definitions for type safety.
 */

export const KEYBOARD = {
  KEYS: {
    UNDO: 'z',
    ESCAPE: 'Escape',
    DELETE: 'Delete',
    BACKSPACE: 'Backspace'
  },
  PATTERNS: {
    SVG_COMMAND: /^[mlvhcsqtaz]$/i
  }
} as const;
