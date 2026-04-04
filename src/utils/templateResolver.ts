/**
 * Resolves {{placeholder}} tokens in a message template using a context values map.
 *
 * - Known placeholders are replaced with their string values from the context map.
 * - Unknown placeholders (no matching key in context) are removed (replaced with empty string)
 *   so that no unresolved {{...}} tokens remain in the output.
 * - A warning is logged for each unresolved placeholder.
 *
 * @param template - Message template string containing {{placeholder}} tokens
 * @param context - Map of placeholder names to their replacement values
 * @returns The resolved message string with all placeholders replaced
 */
export function resolveTemplate(
  template: string,
  context: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    if (key in context) {
      return context[key];
    }
    console.warn(
      `[templateResolver] Unresolved placeholder: {{${key}}}`,
    );
    return '';
  });
}
