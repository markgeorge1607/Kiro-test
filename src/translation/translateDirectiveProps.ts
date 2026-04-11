/**
 * translateDirectiveProps — shallow translation of string values
 * in a UIDirective props object.
 *
 * Non-string values are passed through unchanged.
 * Used at the integration boundary (MenuPage, CheckoutPage) to
 * translate NudgeEvent directive props before rendering.
 */
export function translateDirectiveProps(
  props: Record<string, unknown>,
  t: (s: string) => string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    const value = props[key];
    result[key] = typeof value === 'string' ? t(value) : value;
  }
  return result;
}
