// Classification and wa.me link building for respondent contact details.

export type ContactKind = 'phone' | 'email' | 'empty' | 'invalid';

// Standard local@domain.tld shape, no spaces anywhere.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Separators respondents commonly include when typing a phone number.
const SEPARATOR_PATTERN = /[\s\-.()[\]]/g;

function stripSeparators(value: string): string {
  return value.replace(SEPARATOR_PATTERN, '');
}

export function classifyContact(contact: string): ContactKind {
  const trimmed = contact.trim();
  if (trimmed === '') return 'empty';
  if (EMAIL_PATTERN.test(trimmed)) return 'email';
  // After separators and a single leading plus, only 7-15 digits read as a phone.
  const compact = stripSeparators(trimmed).replace(/^\+/, '');
  if (/^\d{7,15}$/.test(compact)) return 'phone';
  return 'invalid';
}

export function toE164Phone(contact: string): string | null {
  const compact = stripSeparators(contact.trim());
  // Explicit international numbers: digits after '+' pass through unchanged
  // when the length is a plausible phone number (7-15 digits).
  if (compact.startsWith('+')) {
    const digits = compact.slice(1);
    return /^\d{7,15}$/.test(digits) ? digits : null;
  }
  if (!/^\d+$/.test(compact)) return null;
  // Already international Nigerian: 234 + exactly 10 national digits.
  if (/^234\d{10}$/.test(compact)) return compact;
  // Nigerian local format 0XXXXXXXXXX: swap the leading 0 for 234.
  if (compact.length === 11 && compact.startsWith('0')) return `234${compact.slice(1)}`;
  // Bare Nigerian national number (10 digits, no leading 0): prefix 234.
  if (compact.length === 10 && !compact.startsWith('0')) return `234${compact}`;
  // Everything else (e.g. a 12-digit number without '+') is ambiguous: no guessing.
  return null;
}

export function getWhatsAppLink(contact: string): string | null {
  // Only phone-class values with a confident conversion become links, and never
  // with a text parameter: the admin writes the message manually.
  if (classifyContact(contact) !== 'phone') return null;
  const digits = toE164Phone(contact);
  return digits === null ? null : `https://wa.me/${digits}`;
}
