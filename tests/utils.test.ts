// Imports
import {
  assert,
  assertEquals,
  assertObjectMatch,
} from "https://deno.land/std@0.84.0/testing/asserts.ts";
import {
  extract,
  fromNumber,
  getDifference,
  getTimestamp,
  getTimestampBytes,
  padStart,
  toBase64,
  toNumber,
  toUint8Array,
} from "../lib/utils.ts";

Deno.test("extract from empty Uint8Array", () => {
  const src = Uint8Array.of();
  const res = extract(src);
  assertEquals(src.length, 0);
  assertEquals(res.length, src.length);
  assertObjectMatch(
    res as unknown as Record<number, number>,
    src as unknown as Record<number, number>,
  );
});

Deno.test("extract all from Uint8Array", () => {
  const src = Uint8Array.of(1, 2, 3, 4, 5, 6);
  const res = extract(src);
  assertEquals(src.length, 6);
  assertObjectMatch(
    res as unknown as Record<number, number>,
    src as unknown as Record<number, number>,
  );
});

Deno.test("extract from Uint8Array with offset", () => {
  const src = Uint8Array.of(1, 2, 3, 4, 5, 6);
  const exp = Uint8Array.of(2, 3, 4, 5, 6);
  const res = extract(src, 1);
  assertEquals(res.length, exp.length);
  assertObjectMatch(
    res as unknown as Record<number, number>,
    exp as unknown as Record<number, number>,
  );
});

Deno.test("extract from Uint8Array with length", () => {
  const src = Uint8Array.of(1, 2, 3, 4, 5, 6);
  const exp = Uint8Array.of(1, 2, 3, 4, 5);
  const res = extract(src, undefined, 5);
  assertEquals(res.length, exp.length);
  assertObjectMatch(
    res as unknown as Record<number, number>,
    exp as unknown as Record<number, number>,
  );
});

Deno.test("extract from Uint8Array with offset and length", () => {
  const src = Uint8Array.of(1, 2, 3, 4, 5, 6);
  const exp = Uint8Array.of(2, 3, 4, 5);
  const res = extract(src, 1, 4);
  assertEquals(res.length, exp.length);
  assertObjectMatch(
    res as unknown as Record<number, number>,
    exp as unknown as Record<number, number>,
  );
});

Deno.test("Uint8Array to Base64", () => {
  assertEquals(toBase64(Uint8Array.of(1)), "AQ");
  assertEquals(toBase64(Uint8Array.of(2)), "Ag");
  assertEquals(toBase64(Uint8Array.of(1, 2)), "AQI");
});

Deno.test("Base64 to Uint8Array", () => {
  assertObjectMatch(
    toUint8Array("AQ") as unknown as Record<number, number>,
    Uint8Array.of(1) as unknown as Record<number, number>,
  );
  assertObjectMatch(
    toUint8Array("Ag") as unknown as Record<number, number>,
    Uint8Array.of(2) as unknown as Record<number, number>,
  );
  assertObjectMatch(
    toUint8Array("STI") as unknown as Record<number, number>,
    Uint8Array.of(73) as unknown as Record<number, number>,
  );
});

Deno.test("number to Uint8Array", () => {
  assertObjectMatch(
    fromNumber(0) as unknown as Record<number, number>,
    Uint8Array.of(0) as unknown as Record<number, number>,
  );
  assertObjectMatch(
    fromNumber(1) as unknown as Record<number, number>,
    Uint8Array.of(1) as unknown as Record<number, number>,
  );
  assertObjectMatch(
    fromNumber(-1) as unknown as Record<number, number>,
    Uint8Array.of(1) as unknown as Record<number, number>,
  );
  assertObjectMatch(
    fromNumber(255) as unknown as Record<number, number>,
    Uint8Array.of(255) as unknown as Record<number, number>,
  );
  assertObjectMatch(
    fromNumber(256) as unknown as Record<number, number>,
    Uint8Array.of(1, 0) as unknown as Record<number, number>,
  );
});

Deno.test("Uint8Array to number", () => {
  assertEquals(toNumber(Uint8Array.of(0)), 0);
  assertEquals(toNumber(Uint8Array.of(1)), 1);
  assertEquals(toNumber(Uint8Array.of(1, 0)), 256);
});

Deno.test("pad start", () => {
  assertObjectMatch(
    padStart(Uint8Array.of(1), 1) as unknown as Record<number, number>,
    Uint8Array.of(1) as unknown as Record<number, number>,
  );
  assertObjectMatch(
    padStart(Uint8Array.of(1), 2) as unknown as Record<number, number>,
    Uint8Array.of(0, 1) as unknown as Record<number, number>,
  );
});

Deno.test("pad start with custom padding byte", () => {
  assertObjectMatch(
    padStart(Uint8Array.of(1), 2, 32) as unknown as Record<number, number>,
    Uint8Array.of(32, 1) as unknown as Record<number, number>,
  );
});

Deno.test("get difference", () => {
  assertEquals(getDifference(1, 2), 1);
  assertEquals(getDifference(2, 1), 1);
});

Deno.test("get timestamp", () => {
  assert(getDifference(getTimestamp(), Math.floor(Date.now() / 1000)) < 2);
  const diff = getDifference(getTimestamp(1), Math.floor(Date.now() / 1000));
  assert(diff > 0);
  assert(diff < 3);
});

Deno.test("get timestamp bytes", () => {
  assert(
    getDifference(
      toNumber(getTimestampBytes()),
      Math.floor(Date.now() / 1000),
    ) < 2,
  );
  const diff = getDifference(
    toNumber(getTimestampBytes(1)),
    Math.floor(Date.now() / 1000),
  );
  assert(diff > 0);
  assert(diff < 3);
});
