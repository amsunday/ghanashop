/**
 * Normalizes and sanitizes a phone number to standard international format (e.g., 23354XXXXXXX).
 * Tailored to cleanly parse local Ghanaian number patterns and international inputs.
 * 
 * @param phone Raw phone number input string
 * @returns Cleaned numeric international dialing string (e.g., '233541234567')
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';

  // 1. Remove all non-numeric characters (spaces, dashes, plus, parentheses)
  let cleaned = phone.replace(/\D/g, '');

  // 2. If empty after stripping, return empty string
  if (cleaned.length === 0) return '';

  // 3. Handle Ghanaian local leading zero representation: e.g. 0541234567 -> 233541234567
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '233' + cleaned.slice(1);
  }

  // 4. Handle leading double zero international prefixes: e.g. 00233541234567 -> 233541234567
  if (cleaned.startsWith('00233')) {
    return cleaned.slice(2);
  }

  // 5. If it starts with 233 and has the correct length, return as-is
  if (cleaned.startsWith('233') && (cleaned.length === 12 || cleaned.length === 11)) {
    return cleaned;
  }

  // 6. If it lacks a country code entirely (e.g. 9-digit input starting without a zero like 541234567)
  if (cleaned.length === 9) {
    return '233' + cleaned;
  }

  // 7. Default fallback: return stripped digits
  return cleaned;
}
