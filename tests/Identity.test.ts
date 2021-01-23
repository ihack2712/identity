// Imports
import {
  assert,
  assertEquals,
  assertObjectMatch,
  assertThrows,
} from "https://deno.land/std@0.84.0/testing/asserts.ts";
import Identity from "../lib/Identity.ts";
import SignedIdentity from "../lib/SignedIdentity.ts";

Deno.test("identity class", () => {
  const ident = new Identity(1, 1, 1);
  assert(ident instanceof Identity);
  assertEquals(ident.noise, 1);
  assertEquals(ident.counter, 1);
  assertEquals(ident.timestamp, 1);
  assert(ident.date() instanceof Date);
  assertObjectMatch(
    ident.array() as unknown as Record<number, number>,
    Uint8Array.of(0, 0, 0, 0, 1, 0, 1, 0, 1) as unknown as Record<
      number,
      number
    >,
  );
  assertEquals(ident.base64(), "AAAAAAEAAQAB");
  assertEquals(ident.toString(), "AAAAAAEAAQAB");
  assertEquals(ident.toJSON(), "AAAAAAEAAQAB");
  assert(ident.date() instanceof Date);
});

Deno.test("identity from string", () => {
  const ident = new Identity("AAAAAAEAAQAB");
  const match = new Identity(1, 1, 1);
  assertObjectMatch(
    ident as unknown as Record<string, unknown>,
    match as unknown as Record<string, unknown>,
  );
});

Deno.test("clone identity", () => {
  const src = new Identity(1, 1, 1);
  const dst = new Identity(src);
  assertObjectMatch(
    src as unknown as Record<string, unknown>,
    dst as unknown as Record<string, unknown>,
  );
});

Deno.test("identity from Uint8Array", () => {
  const match = new Identity(1, 1, 1);
  const ident = new Identity(Uint8Array.of(0, 0, 0, 0, 1, 0, 1, 0, 1));
  assertObjectMatch(
    ident as unknown as Record<string, unknown>,
    match as unknown as Record<string, unknown>,
  );

  const ident2 = new Identity(ident.array());
  assertObjectMatch(
    ident2 as unknown as Record<string, unknown>,
    match as unknown as Record<string, unknown>,
  );

  const sident = new SignedIdentity({
    counter: 1,
    noise: 1,
    timestamp: 1,
  }, "hello");
  const ident3 = new Identity(sident.array());
  assertObjectMatch(
    ident3 as unknown as Record<string, unknown>,
    match as unknown as Record<string, unknown>,
  );
});

Deno.test("identity from options", () => {
  const ident1 = new Identity({
    timestamp: 1,
    counter: 1,
  });
  const match1 = new Identity(1, 1, ident1.noise);
  assertObjectMatch(
    ident1 as unknown as Record<string, unknown>,
    match1 as unknown as Record<string, unknown>,
  );

  const ident2 = new Identity({ noise: 1 });
  assert(ident2 instanceof Identity);

  const ident3 = new Identity({ timestamp: 1 });
  assert(ident3 instanceof Identity);

  const ident4 = new Identity({ counter: 1 });
  assert(ident4 instanceof Identity);

  const timestamp = new Date(new Date().getTime() - 2000);
  const expected = Math.floor(timestamp.getTime() / 1000);

  const ident5 = new Identity({ timestamp });
  assert(ident5 instanceof Identity);
  assertEquals(ident5.timestamp, expected);

  const ident6 = new Identity(timestamp);
  assert(ident6 instanceof Identity);
  assertEquals(ident6.timestamp, expected);
});

Deno.test("invalid byte array length", () => {
  assertThrows(() => new Identity(Uint8Array.of(1, 2, 3, 4)));
});
