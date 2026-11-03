import crypto from 'crypto';

// Base32 character set (RFC 4648)
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer into a Base32 string.
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string into a Buffer.
 */
export function base32Decode(input: string): Buffer {
  const cleanInput = input.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanInput.length; i++) {
    const idx = BASE32_CHARS.indexOf(cleanInput[i]);
    if (idx === -1) {
      continue;
    }
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a random Base32 secret for Google Authenticator / 2FA.
 */
export function generateTotpSecret(length: number = 20): string {
  const randomBytes = crypto.randomBytes(length);
  return base32Encode(randomBytes);
}

/**
 * Calculates a 6-digit TOTP code for a secret at a specific Unix timestamp.
 * Standard RFC 6238: 30-second window, HMAC-SHA1.
 */
export function generateTotpCode(secret: string, timestampMs: number = Date.now()): string {
  const key = base32Decode(secret);
  const epoch = Math.floor(timestampMs / 1000);
  const timeStep = 30;
  const counter = Math.floor(epoch / timeStep);

  const counterBuffer = Buffer.alloc(8);
  // Write as 64-bit big-endian integer
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic truncation
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP code with a ±1 window (covering -30s, current, +30s clock drift).
 */
export function verifyTotpCode(secret: string, userCode: string, timestampMs: number = Date.now()): boolean {
  if (!userCode || userCode.trim().length !== 6) return false;
  const cleanCode = userCode.trim();

  // Check windows: current, -30s, +30s
  const windows = [-30000, 0, 30000];
  for (const delta of windows) {
    const expected = generateTotpCode(secret, timestampMs + delta);
    if (expected === cleanCode) {
      return true;
    }
  }
  return false;
}

/**
 * Generates an otpauth:// URI for QR code or Authenticator app import.
 */
export function getOtpAuthUrl(label: string, secret: string, issuer: string = 'LK ONLINE'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
