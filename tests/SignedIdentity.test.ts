// Imports
import {
  assert,
  assertEquals,
  assertObjectMatch,
  assertThrows,
} from "https://deno.land/std@0.84.0/testing/asserts.ts";
import SignedIdentity from "../lib/SignedIdentity.ts";
import {
  ExpiredError,
  HashMismatchError,
  IdentityError,
  IncompleteError,
} from "../lib/errors.ts";
import { getDifference } from "../lib/utils.ts";
import Stage from "../lib/Stage.ts";
import Lifeline from "../lib/Lifeline.ts";

const secret = "hello";

Deno.test("generate (missing secret)", () => {
  assertThrows(() => new SignedIdentity({} as unknown as SignedIdentity));
});

Deno.test("generate (secret)", () => {
  const signedIdentity = new SignedIdentity(secret);
  assertThrows(() => signedIdentity.verifyComplete(), IncompleteError);
  signedIdentity.verifyExpiration().verifyHash();
  assertEquals(SignedIdentity.stage(signedIdentity), Stage.Valid);
});

Deno.test("generate (signedIdentityOptions{secret})", () => {
  const signedIdentity = new SignedIdentity({ secret });
  assertThrows(() => signedIdentity.verifyComplete(), IncompleteError);
  signedIdentity.verifyExpiration().verifyHash();
});

Deno.test("generate (signedIdentityOptions)", () => {
  const generatedAt = new Date();
  const expected = Math.floor(generatedAt.getTime() / 1000);
  const signedIdentity = new SignedIdentity({
    secret,
    counter: 0,
    expiresAt: (expected + 5),
    issuedAt: expected,
    timestamp: generatedAt,
    noise: 0,
  });
  assertThrows(() => signedIdentity.verifyComplete(), IncompleteError);
  signedIdentity.verifyExpiration().verifyHash();
  assertEquals(signedIdentity.counter, 0);
  assertEquals(signedIdentity.noise, 0);
  assertEquals(signedIdentity.timestamp, expected);
  assertEquals(signedIdentity.issuedAt, expected);
  assertEquals(signedIdentity.expiresAt, expected + 5);

  const ident = signedIdentity.identity();
  assertEquals(signedIdentity.timestamp, ident.timestamp);
  assertEquals(signedIdentity.counter, ident.counter);
  assertEquals(signedIdentity.noise, ident.noise);

  const signedIdentity2 = new SignedIdentity({
    secret,
    timestamp: generatedAt,
    counter: 0,
    noise: 0,
    issuedAt: generatedAt,
    expiresAt: new Date(generatedAt.getTime() + 5000),
  });

  assertThrows(() => signedIdentity2.verifyComplete(), IncompleteError);
  signedIdentity2.verifyExpiration().verifyHash();
  assertEquals(signedIdentity2.counter, 0);
  assertEquals(signedIdentity2.noise, 0);
  assertEquals(signedIdentity2.timestamp, expected);
  assertEquals(signedIdentity2.issuedAt, expected);
  assertEquals(signedIdentity2.expiresAt, expected + 5);

  const signedIdentity3 = new SignedIdentity({
    secret,
    timestamp: generatedAt,
    counter: 0,
    noise: 0,
    issuedAt: generatedAt,
    maxAge: 5,
  });

  assertThrows(() => signedIdentity3.verifyComplete(), IncompleteError);
  signedIdentity3.verifyExpiration().verifyHash();
  assertEquals(signedIdentity3.counter, 0);
  assertEquals(signedIdentity3.noise, 0);
  assertEquals(signedIdentity3.timestamp, expected);
  assertEquals(signedIdentity3.issuedAt, expected);
  const diff = getDifference(
    signedIdentity3.issuedAt,
    signedIdentity3.expiresAt,
  );
  assertEquals(diff, 5);
});

Deno.test("generate (SignedIdentity)", () => {
  const generatedAt = new Date();
  const expected = Math.floor(generatedAt.getTime() / 1000);
  const signedIdentity = new SignedIdentity({
    secret,
    counter: 0,
    expiresAt: (expected + 5),
    issuedAt: expected,
    timestamp: generatedAt,
    noise: 0,
  });
  assertThrows(() => signedIdentity.verifyComplete(), IncompleteError);
  signedIdentity.verifyExpiration().verifyHash();
  assertEquals(signedIdentity.counter, 0);
  assertEquals(signedIdentity.noise, 0);
  assertEquals(signedIdentity.timestamp, expected);
  assertEquals(signedIdentity.issuedAt, expected);
  assertEquals(signedIdentity.expiresAt, expected + 5);
  const clone = new SignedIdentity(signedIdentity);
  clone.verifyExpiration().verifyHash();
  assertEquals(clone.counter, 0);
  assertEquals(clone.noise, 0);
  assertEquals(clone.timestamp, expected);
  assertEquals(clone.issuedAt, expected);
  assertEquals(clone.expiresAt, expected + 5);
});

Deno.test("generate (IdentityOptions)", () => {
  const generatedAt = new Date();
  const expected = Math.floor(generatedAt.getTime() / 1000);

  const signedIdentity = new SignedIdentity({
    timestamp: generatedAt,
    counter: 0,
    noise: 0,
  }, secret);

  assertThrows(() => signedIdentity.verifyComplete(), IncompleteError);
  signedIdentity.verifyExpiration().verifyHash();
  assertEquals(signedIdentity.counter, 0);
  assertEquals(signedIdentity.noise, 0);
  assertEquals(signedIdentity.timestamp, expected);
  const diff = getDifference(
    signedIdentity.issuedAt,
    signedIdentity.expiresAt,
  );
  assertEquals(diff, SignedIdentity.DEFAULT_MAX_AGE);
});

Deno.test("generate (Uint8Array)", () => {
  const match = new SignedIdentity({
    secret,
    hash: new Uint8Array([
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
    ]),
    issuedAt: 1,
    expiresAt: 1,
    timestamp: 1,
    counter: 1,
    maxAge: 1,
    noise: 1,
  });

  const sident1 = new SignedIdentity(
    Uint8Array.of(0, 0, 0, 0, 1, 0, 1, 0, 1),
    secret,
  );
  assertEquals(sident1.timestamp, 1);
  assertEquals(sident1.counter, 1);
  assertEquals(sident1.noise, 1);
  assertEquals(
    getDifference(sident1.issuedAt, sident1.expiresAt),
    SignedIdentity.DEFAULT_MAX_AGE,
  );
  assertEquals(sident1.incomplete, true);

  const sident2 = new SignedIdentity(
    Uint8Array.of(
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      1,
      0,
      1,
    ),
    secret,
  );

  assertEquals(sident2.incomplete, false);
  assertObjectMatch(
    sident2.hash as unknown as Record<number, number>,
    match.hash as unknown as Record<number, number>,
  );
  assertEquals(sident2.issuedAt, 1);
  assertEquals(sident2.expiresAt, 1);
  assertEquals(sident2.timestamp, 1);
  assertEquals(sident2.counter, 1);
  assertEquals(sident2.noise, 1);

  const arr1 = sident2.array();
  const arr2 = sident2.array();
  assertEquals(arr1, arr2);

  assertThrows(
    () => new SignedIdentity(Uint8Array.of(1), secret),
    IdentityError,
  );
});

Deno.test("issued & expires date objects", () => {
  const generated = new Date(Math.floor(Date.now() / 1000) * 1000);
  const generated2 = new Date(generated.getTime() + 5000);
  const sident1 = new SignedIdentity({
    secret,
    issuedAt: generated,
    expiresAt: generated2,
  });
  assertEquals(sident1.issued().getTime(), generated.getTime());
  assertEquals(sident1.expires().getTime(), generated2.getTime());
});

Deno.test("hash verification", () => {
  const sident1 = new SignedIdentity({
    secret,
    hash: Uint8Array.of(1),
  });
  assertThrows(() => sident1.verifyHash(), HashMismatchError, "length");

  const sident2 = new SignedIdentity({
    secret,
    hash: Uint8Array.of(
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24,
      25,
      26,
      27,
      28,
      29,
      30,
      31,
      32,
    ),
  });
  assertThrows(() => sident2.verifyHash(), HashMismatchError);
  assertEquals(sident2.stage(), Stage.Invalid);
  sident2.verifyComplete();
});

Deno.test("verify expired", () => {
  const sident1 = new SignedIdentity({
    secret,
    maxAge: -1,
  });
  assertThrows(() => sident1.verifyExpiration(), ExpiredError);
  assertEquals(sident1.stage(), Stage.Expired);
});

Deno.test("create lifeline", () => {
  assert(
    new SignedIdentity(secret).lifeline((Date.now() + 5000) / 1000) instanceof
      Lifeline,
  );
});
