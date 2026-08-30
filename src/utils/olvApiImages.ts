// thank you big gpt
import sharp from "sharp";

function stripDataUrlPrefix(base64: string): string {
  const commaIndex = base64.indexOf(",");
  return commaIndex !== -1 ? base64.slice(commaIndex + 1) : base64;
}

function byteAt(buf: Uint8Array, index: number): number {
  const value = buf[index];
  if (value === undefined) {
    throw new RangeError(`Index ${index} out of bounds`);
  }
  return value;
}

export async function pngBase64ToTgaBase64(pngBase64: string): Promise<string> {
  const base64Data = stripDataUrlPrefix(pngBase64);
  const pngBuffer = Buffer.from(base64Data, "base64");

  const { data: rgba, info } = await sharp(pngBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;

  const header = Buffer.alloc(18);
  header[2] = 2;
  header.writeUInt16LE(width, 12);
  header.writeUInt16LE(height, 14);
  header[16] = 32;
  header[17] = 0x28;

  const pixelData = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const s = i * 4;
    pixelData[s] = byteAt(rgba, s + 2);     // B
    pixelData[s + 1] = byteAt(rgba, s + 1); // G
    pixelData[s + 2] = byteAt(rgba, s);     // R
    pixelData[s + 3] = byteAt(rgba, s + 3); // A
  }

  const tgaBuffer = Buffer.concat([header, pixelData]);
  return tgaBuffer.toString("base64");
}

export async function toJpegBase64(imageBase64: string, quality = 90): Promise<string> {
  const base64Data = stripDataUrlPrefix(imageBase64);
  const inputBuffer = Buffer.from(base64Data, "base64");

  const jpegBuffer = await sharp(inputBuffer)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  return jpegBuffer.toString("base64");
}