/**
 * Extract bytes from a Uint8Array.
 * 
 * @param src The Uint8Array to extract bytes from.
 * @param offset The amount position to start extracting
 *  bytes from.
 * @param length The amount of bytes to extract.
 * @returns The extracted bytes in a Uint8Array.
 */
export function extract(src: Uint8Array, offset = 0, length?: number) {
  return src.subarray(offset, offset + (length ?? src.length - offset));
}

/**
 * Turn a Uint8Array into a Base64 string.
 * 
 * **Note** that the Base64 string uses `-` instead of `+`
 * and `_` instead of `/`. The padding (`=`) is removed.
 * 
 * @param src The Uint8Array to extract bytes from.
 * @returns The Base64 encoded string.
 */
export function toBase64(src: Uint8Array): string {
  let str = "";
  for (const chunk of src) {
    str += String.fromCharCode(chunk);
  }
  str = btoa(str);
  let index!: number;
  for (let i = str.length - 1; i > -1; i--) {
    if (str[i] !== "=") {
      index = i + 1;
      break;
    }
  }
  str = str.substring(0, index).replaceAll("+", "-").replaceAll("/", "_");
  return str;
}

/**
 * Turn a Base64 encoded string back into a Uint8Array.
 * 
 * @param str The Base64 encoded string.
 * @returns The decoded Uint8Array.
 */
export function toUint8Array(str: string): Uint8Array {
  str = atob(str.replaceAll("-", "+").replaceAll("_", "/"));
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i);
  }
  return arr;
}

/**
 * Turn a number into a Uint8Array.
 */
export function fromNumber(n: number): Uint8Array {
  if (n === 0) return Uint8Array.of(0);
  const arr: number[] = [];
  n = Math.floor(n);
  if (n < 0) n *= -1;
  while (n > 0) {
    arr.unshift(n & 255);
    n = n >> 8;
  }
  return new Uint8Array(arr);
}

/**
 * Turn a Uint8Array into a number.
 * 
 * @param src The Uint8Array.
 * @returns The decoded number.
 */
export function toNumber(src: Uint8Array): number {
  let n = 0;
  for (let i = 0; i < src.length; i++) {
    n |= src[src.length - 1 - i] << (i * 8);
  }
  return n;
}

/**
 * Pad the start of a Uint8Array.
 * 
 * @param src The Uint8Array to pad.
 * @param length The amount of bytes the Uint8Array should
 *  have.
 * @returns A Uint8Array that is definitely the same length
 *  as the one provided in the arguments.
 */
export function padStart(
  src: Uint8Array,
  length: number,
  paddingByte = 0,
): Uint8Array {
  const arr: number[] = [];
  for (let i = 0; i < length - src.length; i++) arr.push(paddingByte);
  for (let i = 0; i < src.length; i++) arr.push(src[i]);
  return new Uint8Array(arr);
}

/**
 * Get the difference between two numbers.
 * 
 * @param a Number a.
 * @param b Number b.
 * @returns The difference.
 */
export function getDifference(a: number, b: number): number {
  const diff = a - b;
  if (diff < 0) return diff * -1;
  return diff;
}

/**
 * Get the current UNIX time.
 * 
 * @param offset The amount of time to add to the
 *  timestamp (in seconds).
 * @returns The current time.
 */
export function getTimestamp(offset = 0): number {
  return Math.floor((Date.now() / 1000) + offset);
}

/**
 * Turn the timestamp into bytes.
 * 
 * @param offset The amount of time to add to the
 *  timestamp (in seconds).
 * @returns The current time in a byte array.
 */
export function getTimestampBytes(offset?: number): Uint8Array {
  return padStart(fromNumber(getTimestamp(offset)), 5);
}
