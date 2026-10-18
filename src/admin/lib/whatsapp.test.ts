import { describe, expect, it } from 'vitest';
import { classifyContact, getWhatsAppLink, toE164Phone } from './whatsapp';

const NG_DIGITS = '2348031234567';

describe('classifyContact', () => {
  it('classifies Nigerian local and international formats as phone', () => {
    const phones = [
      '08031234567',
      '0803 123 4567',
      '(0803) 123-4567',
      '+2348031234567',
      '2348031234567',
      '8031234567',
      '+44 7911 123456',
      '+1 (415) 555-2671',
    ];
    for (const value of phones) {
      expect(classifyContact(value)).toBe('phone');
    }
  });

  it('classifies empty and whitespace-only as empty', () => {
    expect(classifyContact('')).toBe('empty');
    expect(classifyContact('   ')).toBe('empty');
  });

  it('classifies email addresses, including plus addresses', () => {
    expect(classifyContact('youth@example.com')).toBe('email');
    expect(classifyContact('a+b@mail.com')).toBe('email');
    expect(classifyContact('spaced @example.com')).toBe('invalid');
  });

  it('classifies letters, short digits and over-long digits as invalid', () => {
    expect(classifyContact('abc')).toBe('invalid');
    expect(classifyContact('123')).toBe('invalid');
    expect(classifyContact('0803')).toBe('invalid');
    expect(classifyContact('+99')).toBe('invalid');
    expect(classifyContact('12345678901234567890')).toBe('invalid');
    expect(classifyContact('call me sometime')).toBe('invalid');
  });
});

describe('toE164Phone', () => {
  it('normalizes every Nigerian variant to the same international digits', () => {
    const variants = [
      '08031234567',
      '0803 123 4567',
      '(0803) 123-4567',
      '+2348031234567',
      '2348031234567',
      '8031234567',
    ];
    for (const value of variants) {
      expect(toE164Phone(value)).toBe(NG_DIGITS);
    }
  });

  it('passes explicit international numbers through digit-only', () => {
    expect(toE164Phone('+44 7911 123456')).toBe('447911123456');
    expect(toE164Phone('+1 (415) 555-2671')).toBe('14155552671');
  });

  it('returns null for junk, short, and ambiguous numbers', () => {
    expect(toE164Phone('')).toBeNull();
    expect(toE164Phone('abc')).toBeNull();
    expect(toE164Phone('123')).toBeNull();
    expect(toE164Phone('0803')).toBeNull();
    expect(toE164Phone('08031234567890')).toBeNull();
    expect(toE164Phone('12345678901234567890')).toBeNull();
    expect(toE164Phone('+99')).toBeNull();
    expect(toE164Phone('123456789012')).toBeNull(); // 12 digits, no '+': ambiguous
  });

  it('returns null for emails', () => {
    expect(toE164Phone('youth@example.com')).toBeNull();
    expect(toE164Phone('a+b@mail.com')).toBeNull();
  });
});

describe('getWhatsAppLink', () => {
  it('builds the exact wa.me URL for a Nigerian number', () => {
    expect(getWhatsAppLink('08031234567')).toBe('https://wa.me/2348031234567');
    expect(getWhatsAppLink('0803 123 4567')).toBe('https://wa.me/2348031234567');
    expect(getWhatsAppLink('+2348031234567')).toBe('https://wa.me/2348031234567');
  });

  it('builds links for convertible international numbers', () => {
    expect(getWhatsAppLink('+44 7911 123456')).toBe('https://wa.me/447911123456');
    expect(getWhatsAppLink('+1 (415) 555-2671')).toBe('https://wa.me/14155552671');
  });

  it('returns null for emails, empty, invalid and unconvertible values', () => {
    expect(getWhatsAppLink('youth@example.com')).toBeNull();
    expect(getWhatsAppLink('')).toBeNull();
    expect(getWhatsAppLink('abc')).toBeNull();
    expect(getWhatsAppLink('123')).toBeNull();
    expect(getWhatsAppLink('0803')).toBeNull();
    expect(getWhatsAppLink('08031234567890')).toBeNull();
    expect(getWhatsAppLink('12345678901234567890')).toBeNull();
    expect(getWhatsAppLink('+99')).toBeNull();
  });

  it('never appends a text parameter', () => {
    expect(getWhatsAppLink('08031234567')).not.toContain('?');
  });
});
