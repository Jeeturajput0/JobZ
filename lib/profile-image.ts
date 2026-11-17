const MAX_IMAGE_BYTES = 1024 * 1024;
const DATA_IMAGE = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

export function isValidProfileImage(value: string): boolean {
  if (!value) return true;
  if (value.length > 1_500_000) return false;

  const match = DATA_IMAGE.exec(value);
  if (match) {
    const payload = match[2];
    if (payload.length % 4 !== 0) return false;
    const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
    if (Math.floor((payload.length * 3) / 4) - padding > MAX_IMAGE_BYTES) return false;

    const bytes = Buffer.from(payload, "base64");
    if (match[1] === "png") return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (match[1] === "jpeg") return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    return bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return value.startsWith("/") && !value.startsWith("//") && value.length <= 2048;
  }
}
