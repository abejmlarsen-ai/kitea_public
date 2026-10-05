// ─── Contact form limits ──────────────────────────────────────────────────────
// Shared by app/contact/ContactForm.tsx (maxLength, select options) and
// app/api/contact/route.ts (server-side validation) so the two can't drift.

export const CONTACT_MAX_NAME    = 100
export const CONTACT_MAX_EMAIL   = 254   // RFC 5321 path limit
export const CONTACT_MAX_MESSAGE = 5000

// The "I am a…" options. Keys are what the form sends; values are the labels
// shown in the form and in the email.
export const CONTACT_QUERY_TYPES = {
  customer:     'Customer',
  collaborator: 'Collaborator',
  company:      'Company / Brand',
} as const

export type ContactQueryType = keyof typeof CONTACT_QUERY_TYPES

export function isContactQueryType(value: unknown): value is ContactQueryType {
  return typeof value === 'string' && Object.hasOwn(CONTACT_QUERY_TYPES, value)
}

// Name of the hidden honeypot field. Real visitors never see or fill it.
export const CONTACT_HONEYPOT_FIELD = 'website'
