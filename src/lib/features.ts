/**
 * Feature switches. Paused features keep their code and tests; flip the
 * value to true (and rebuild) to turn them back on.
 */
export const FEATURES = {
  /** "Forgot password" link, /forgot-password, /reset-password and the reset emails. */
  passwordReset: false,
  /** Limits on repeated sign-up, login, reset and checkout attempts (src/lib/rate-limit.ts). */
  rateLimiting: false,
} as const;
