// Imports
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.84.0/testing/asserts.ts";
import Counter from "../lib/Counter.ts";

Deno.test("counter does count", () => {
  const counter = new Counter(3);
  assert(counter instanceof Counter);
  assertEquals(counter.count()[1], 0);
  assertEquals(counter.count()[1], 1);
  assertEquals(counter.count()[1], 2);
  assertEquals(counter.count()[1], 0);
  assertEquals(counter.count()[1], 1);
  assertEquals(counter.count()[1], 2);
  assertEquals(counter.count()[1], 0);
});
