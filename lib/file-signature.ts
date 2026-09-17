const PDF = Buffer.from('%PDF');
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const GIF87 = Buffer.from('GIF87a');
const GIF89 = Buffer.from('GIF89a');
const JPEG = Buffer.from([0xff, 0xd8, 0xff]);
const OLE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const ZIP = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

function startsWith(buffer: Buffer, signature: Buffer, offset = 0): boolean {
  if (buffer.length < offset + signature.length) return false;
  return buffer.subarray(offset, offset + signature.length).equals(signature);
}

export function detectMimeFromMagicBytes(buffer: Buffer): string | null {
  if (startsWith(buffer, JPEG)) return 'image/jpeg';
  if (startsWith(buffer, PNG)) return 'image/png';
  if (startsWith(buffer, GIF87) || startsWith(buffer, GIF89)) return 'image/gif';
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (startsWith(buffer, PDF)) return 'application/pdf';
  if (startsWith(buffer, OLE)) return 'application/msword';
  if (startsWith(buffer, ZIP)) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  return null;
}

export function isMimeAllowed(detected: string, allowed: readonly string[]): boolean {
  const normalized = detected === 'image/jpg' ? 'image/jpeg' : detected;
  return allowed.some((item) => {
    const allowedMime = item === 'image/jpg' ? 'image/jpeg' : item;
    return allowedMime === normalized;
  });
}
