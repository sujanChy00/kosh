/**
 * Whether a value is an http(s) URL.
 *
 * Deliberately free of platform imports. The same predicate gates chat image
 * sharing, kosh icon validation and profile picture validation, and the browser
 * needs it too - keeping it next to the Cloudinary upload helper would drag
 * `expo-file-system` into the web bundle just to test a regex.
 */
export const isRemoteImage = (value?: string | null): value is string =>
  !!value && /^https?:\/\//i.test(value);
