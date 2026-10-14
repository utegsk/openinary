import { test } from "node:test";
import assert from "node:assert/strict";
import { KeyGenerator, LEGACY_CACHE_KEY } from "./key-generator";

const PHOTO = "e5ca/damages/1110/photo.jpg";

test("variants are grouped under their original's path", () => {
  const key = KeyGenerator.generateKey(PHOTO, { width: 240, format: "webp" });
  assert.match(key, /^cache\/e5ca\/damages\/1110\/photo\.jpg\/[0-9a-f]{32}\.jpg$/);
  assert.ok(key.startsWith(KeyGenerator.variantsPrefix(PHOTO)));
});

test("the same path and params always give the same key, different params a different one", () => {
  const a = KeyGenerator.generateKey(PHOTO, { width: 240 });
  assert.equal(KeyGenerator.generateKey(PHOTO, { width: 240 }), a);
  assert.notEqual(KeyGenerator.generateKey(PHOTO, { width: 800 }), a);
});

test("the variants prefix ignores leading and trailing slashes", () => {
  assert.equal(KeyGenerator.variantsPrefix(`/${PHOTO}`), `cache/${PHOTO}/`);
  assert.equal(KeyGenerator.variantsPrefix("e5ca/damages/"), "cache/e5ca/damages/");
});

test("isVariantOf matches the file's own variants, not a same-named folder's files", () => {
  const own = KeyGenerator.generateKey("a/b.jpg", { width: 1 });
  const nested = KeyGenerator.generateKey("a/b.jpg/c.png", { width: 1 });
  assert.ok(KeyGenerator.isVariantOf("a/b.jpg", own));
  assert.ok(!KeyGenerator.isVariantOf("a/b.jpg", nested));
  assert.ok(!KeyGenerator.isVariantOf("a/b.jpg", "cache/a/b.jpgx/0123.jpg"));
});

test("only the old flat layout counts as legacy", () => {
  assert.ok(LEGACY_CACHE_KEY.test("cache/9f2c1a7e4b0d3c2a1f9e8d7c6b5a4e31.jpg"));
  assert.ok(!LEGACY_CACHE_KEY.test(KeyGenerator.generateKey(PHOTO, { width: 240 })));
  assert.ok(!LEGACY_CACHE_KEY.test("public/9f2c1a7e4b0d3c2a1f9e8d7c6b5a4e31.jpg"));
  assert.ok(!LEGACY_CACHE_KEY.test("cache/not-a-hash.jpg"));
});
