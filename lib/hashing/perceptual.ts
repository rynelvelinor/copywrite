import sharp from "sharp";
import { bmvbhash } from "blockhash-core";

const HASH_BITS = 16;

export async function perceptualHashFromBuffer(input: Buffer): Promise<string> {
  const { data, info } = await sharp(input)
    .resize(256, 256, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const hex = bmvbhash(
    { data, width: info.width, height: info.height },
    HASH_BITS,
  );
  return hex.toLowerCase();
}

export async function perceptualHashFromUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return perceptualHashFromBuffer(Buffer.from(arrayBuffer));
}

/** Hamming distance between two equal-length hex perceptual hashes. */
export function hammingDistanceHex(a: string, b: string): number {
  const left = a.replace(/^0x/, "").toLowerCase();
  const right = b.replace(/^0x/, "").toLowerCase();
  if (left.length !== right.length) {
    throw new Error("Hash length mismatch");
  }
  let distance = 0;
  for (let i = 0; i < left.length; i++) {
    const x = Number.parseInt(left[i], 16) ^ Number.parseInt(right[i], 16);
    distance += popcount4(x);
  }
  return distance;
}

function popcount4(n: number): number {
  return ((n >> 0) & 1) + ((n >> 1) & 1) + ((n >> 2) & 1) + ((n >> 3) & 1);
}

/** Near-duplicate threshold for 16-bit blockhash (256 bits). Tune for demo. */
export const DUPLICATE_THRESHOLD = 10;
