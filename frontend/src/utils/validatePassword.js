// Mirrors backend/app.py's validate_password() so the user gets instant
// feedback instead of waiting on a round trip to the server. The backend
// remains the source of truth and re-validates on every register request.

const SPECIAL_CHARS_REGEX = /[!@#$%^&*()_\-+=[\]{}|\\:;"'<>,.?/~`]/

export const PASSWORD_RULES = [
  { test: pw => pw.length >= 8, message: 'At least 8 characters' },
  { test: pw => /[A-Z]/.test(pw), message: 'One uppercase letter' },
  { test: pw => /[a-z]/.test(pw), message: 'One lowercase letter' },
  { test: pw => /[0-9]/.test(pw), message: 'One number' },
  { test: pw => SPECIAL_CHARS_REGEX.test(pw), message: 'One special character' },
]

export function getPasswordErrors(password) {
  return PASSWORD_RULES.filter(rule => !rule.test(password || '')).map(rule => rule.message)
}

export function isPasswordValid(password) {
  return getPasswordErrors(password).length === 0
}
