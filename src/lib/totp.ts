import { createHmac, randomBytes } from "node:crypto";

const TOTP_STEP_SECONDS = 30;
const TOTP_WINDOW = 1;

function hotp(secret: Buffer, counter: bigint): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(counter);
  const h = createHmac("sha1", secret).update(buf).digest();
  const offset = h[h.length - 1] & 0x0f;
  const code =
    ((h[offset] & 0x7f) << 24) |
    (h[offset + 1] << 16) |
    (h[offset + 2] << 8) |
    h[offset + 3];
  return String(code % 1_000_000).padStart(6, "0");
}

function counterAt(stepSeconds = TOTP_STEP_SECONDS): bigint {
  return BigInt(Math.floor(Date.now() / 1000 / stepSeconds));
}

export function newAttendanceSecret(): string {
  return randomBytes(20).toString("hex");
}

export function attendanceCode(
  secretHex: string,
  stepSeconds = TOTP_STEP_SECONDS,
): string {
  return hotp(Buffer.from(secretHex, "hex"), counterAt(stepSeconds));
}

export function codeRemainingSeconds(stepSeconds = TOTP_STEP_SECONDS): number {
  return stepSeconds - (Math.floor(Date.now() / 1000) % stepSeconds);
}

export function verifyAttendanceCode(
  secretHex: string,
  code: string,
  window = TOTP_WINDOW,
  stepSeconds = TOTP_STEP_SECONDS,
): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const now = counterAt(stepSeconds);
  for (let i = -window; i <= window; i++) {
    if (hotp(Buffer.from(secretHex, "hex"), now + BigInt(i)) === code) {
      return true;
    }
  }
  return false;
}