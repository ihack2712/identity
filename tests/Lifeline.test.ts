// Imports
import SignedIdentity from "../lib/SignedIdentity.ts";
import Lifeline from "../lib/Lifeline.ts";
import {
  assert,
  assertEquals,
  assertObjectMatch,
  assertThrows,
} from "https://deno.land/std@0.84.0/testing/asserts.ts";
import { ExpiredError, HashMismatchError } from "../lib/errors.ts";

const secret = "test";

Deno.test("create lifeline", () => {
  const sident = new SignedIdentity(secret);
  const g = Math.floor(Date.now() / 1000);
  const e = g + 5;
  const lifeline = Lifeline.create(sident, e);
  assertEquals(lifeline.expiresAt, e);
  lifeline.validateHash(sident).validateExpiration().validate({
    signedIdentity: sident,
  });
});

Deno.test("create lifeline from uint8array", () => {
  const sident = new SignedIdentity(secret);
  const g = Math.floor(Date.now() / 1000);
  const e = g + 5;
  const lifeline = Lifeline.create(sident, e);
  const lifeline2 = new Lifeline(lifeline.base64());
  assertEquals(lifeline2.expiresAt, lifeline.expiresAt);
  assertObjectMatch(
    lifeline.hash as unknown as Record<string, unknown>,
    lifeline2.hash as unknown as Record<string, unknown>,
  );
  Lifeline.validate(lifeline2, sident);
});

Deno.test("invalid overload", () => {
  assertThrows(() => new Lifeline(null as unknown as Uint8Array));
});

Deno.test("expired lifeline", () => {
  const sident = new SignedIdentity(secret);
  const g = Math.floor(Date.now() / 1000);
  const e = g - 1;
  const lifeline = Lifeline.create(sident, e);
  assertThrows(() => lifeline.validateExpiration(), ExpiredError);
});

Deno.test("invalid lifeline hash", () => {
  const sident = new SignedIdentity(secret);
  const _lifeline = Lifeline.create(sident, 1).array();
  _lifeline.set([0], 0);
  const lifeline = new Lifeline(_lifeline);
  assertThrows(() => lifeline.validateHash(sident), HashMismatchError);
  (lifeline as unknown as { hash: Uint8Array }).hash = lifeline.hash.subarray(
    0,
    1,
  );
  assertThrows(() => lifeline.validateHash(sident), HashMismatchError);
});
