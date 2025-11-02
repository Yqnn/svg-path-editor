/**
 * SVG Path Command Type Definitions
 *
 * Pure union types for SVG path commands with zero runtime overhead.
 */

/**
 * Absolute SVG path command types (uppercase)
 */
export type SvgCommandType = 'M' | 'L' | 'H' | 'V' | 'C' | 'S' | 'Q' | 'T' | 'A' | 'Z';

/**
 * Relative SVG path command types (lowercase)
 */
export type SvgCommandTypeRelative = 'm' | 'l' | 'h' | 'v' | 'c' | 's' | 'q' | 't' | 'a' | 'z';

/**
 * Any SVG path command type (absolute or relative)
 */
export type SvgCommandTypeAny = SvgCommandType | SvgCommandTypeRelative;

/**
 * Type guard to check if a string is a valid absolute SVG command type
 */
export function isSvgCommandType(value: string): value is SvgCommandType {
  return /^[MLHVCSQTAZ]$/.test(value);
}

/**
 * Type guard to check if a string is a valid relative SVG command type
 */
export function isSvgCommandTypeRelative(value: string): value is SvgCommandTypeRelative {
  return /^[mlhvcsqtaz]$/.test(value);
}

/**
 * Type guard to check if a string is any valid SVG command type
 */
export function isSvgCommandTypeAny(value: string): value is SvgCommandTypeAny {
  return /^[MLHVCSQTAZmlhvcsqtaz]$/.test(value);
}
