import type { TranslationSchema } from '@/i18n/translations';

/**
 * Better Auth returns English messages (e.g. "Invalid email or password").
 * Map its stable error codes / HTTP statuses to our own bn/en text instead.
 */
export function localizeAuthError(
  error: { code?: string; status?: number; message?: string } | null | undefined,
  t: TranslationSchema,
  fallback: string
): string {
  switch (error?.code) {
    case 'INVALID_EMAIL_OR_PASSWORD':
    case 'INVALID_PASSWORD':
    case 'INVALID_EMAIL':
    case 'USER_NOT_FOUND':
      return t.auth.invalidCredentials;
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return t.auth.emailTaken;
    case 'PASSWORD_TOO_SHORT':
    case 'PASSWORD_TOO_LONG':
      return t.auth.weakPassword;
  }
  if (error?.status === 401) return t.auth.invalidCredentials;
  if (error?.status === 429) return t.auth.tooManyAttempts;
  return fallback;
}
