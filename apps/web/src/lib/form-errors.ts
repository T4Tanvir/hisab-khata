import type { Language } from '@/i18n/translations';

interface FieldErrorLike {
  type?: unknown;
  message?: unknown;
}

/**
 * Returns a user-facing message for a react-hook-form field error.
 *
 * The shared zod schemas carry custom Bengali messages, but zod's own defaults
 * (e.g. "Expected number, received nan" for an empty number input, or
 * "Number must be greater than or equal to 1") are English. Those defaults are
 * replaced by `fallback`. In English mode the fallback is always used so the
 * Bengali schema messages don't leak into the English UI.
 */
export function localizeFieldError(
  error: FieldErrorLike | undefined,
  fallback: string,
  language: Language
): string | undefined {
  if (!error) return undefined;
  const message = typeof error.message === 'string' ? error.message : '';
  if (language === 'en') return fallback;
  // zod default messages are plain ASCII; our custom ones are Bengali
  if (!message || error.type === 'invalid_type' || /^[\x00-\x7F]*$/.test(message)) {
    return fallback;
  }
  return message;
}
