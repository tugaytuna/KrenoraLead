import assert from "node:assert/strict";
import test from "node:test";
import { normalizeBusinessName, normalizeDomain, normalizePhone } from "../src/index";

test("normalizes Turkish business suffixes and punctuation", () => {
  assert.equal(normalizeBusinessName("Özel Minik Melekler Ltd. Şti."), "ozel minik melekler");
});

test("normalizes domain and Turkish phone", () => {
  assert.equal(normalizeDomain("https://www.Example.COM/hakkimizda"), "example.com");
  assert.equal(normalizePhone("(0216) 555 12 34"), "+902165551234");
});

