import assert from "node:assert/strict";
import test from "node:test";

import {
  FALLBACK_SHOP_NAME,
  formatPageTitle,
  getShopNameFromRootMatch,
  truncateMetaDescription,
} from "../app/lib/storefront-shop.ts";

test("formats document titles as `<page> · <shop>`", () => {
  assert.equal(formatPageTitle("Cart", "Acme"), "Cart · Acme");
});

test("falls back to a neutral shop name when the root loader has none", () => {
  assert.equal(getShopNameFromRootMatch(undefined), FALLBACK_SHOP_NAME);
  assert.equal(getShopNameFromRootMatch(null), FALLBACK_SHOP_NAME);
  assert.equal(
    getShopNameFromRootMatch({ loaderData: { shopInfo: { name: "   " } } }),
    FALLBACK_SHOP_NAME,
  );
  assert.equal(getShopNameFromRootMatch({ loaderData: { shopInfo: { name: "Acme" } } }), "Acme");
});

test("collapses whitespace in short meta descriptions", () => {
  assert.equal(truncateMetaDescription("  Soft\n cotton\t tee.  "), "Soft cotton tee.");
  assert.equal(truncateMetaDescription(""), "");
});

test("clamps long meta descriptions on a word boundary", () => {
  const result = truncateMetaDescription("word ".repeat(60), 60);

  assert.ok(result.length <= 60);
  assert.ok(result.endsWith("…"));
  assert.ok(!result.includes("  "));
  assert.equal(result, truncateMetaDescription("word ".repeat(60), 60));
});
