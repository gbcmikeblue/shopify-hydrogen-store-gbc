import assert from "node:assert/strict";
import test from "node:test";

import {
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  buildProductJsonLd,
  buildStoreJsonLd,
  buildWebSiteJsonLd,
} from "../app/lib/structured-data.ts";

const origin = "https://example.com";

test("organization node omits the logo when the shop has none", () => {
  assert.deepEqual(buildOrganizationJsonLd({ name: "Acme", logo: null }, origin), {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Acme",
    url: origin,
  });
});

test("organization node includes the logo url when available", () => {
  const node = buildOrganizationJsonLd(
    {
      name: "Acme",
      logo: { url: "https://cdn.example.com/logo.png", altText: null, width: 10, height: 10 },
    },
    origin,
  );

  assert.equal(node.logo, "https://cdn.example.com/logo.png");
});

test("website node exposes a search action", () => {
  const node = buildWebSiteJsonLd("Acme", origin) as {
    potentialAction: { target: { urlTemplate: string } };
  };

  assert.equal(node.potentialAction.target.urlTemplate, `${origin}/search?q={search_term_string}`);
});

test("store payload bundles organization and website nodes", () => {
  const nodes = buildStoreJsonLd({ name: "Acme", logo: null }, origin);

  assert.equal(nodes.length, 2);
  assert.deepEqual(
    nodes.map((node) => node["@type"]),
    ["Organization", "WebSite"],
  );
});

test("product node prices the resolved variant and reflects availability", () => {
  const node = buildProductJsonLd(
    {
      handle: "tee",
      title: "Tee",
      description: "Soft cotton tee",
      vendor: "Acme",
      images: [{ url: "https://cdn.example.com/tee.png" }],
      variant: {
        sku: "TEE-1",
        price: { amount: "29.00", currencyCode: "USD" },
        availableForSale: false,
      },
    },
    origin,
  );

  assert.equal(node["@type"], "Product");
  assert.equal(node.url, `${origin}/products/tee`);
  assert.deepEqual(node.brand, { "@type": "Brand", name: "Acme" });
  assert.equal(node.sku, "TEE-1");
  assert.deepEqual(node.offers, {
    "@type": "Offer",
    url: `${origin}/products/tee`,
    price: "29.00",
    priceCurrency: "USD",
    availability: "https://schema.org/OutOfStock",
  });
});

test("product node drops optional fields that are missing", () => {
  const node = buildProductJsonLd(
    { handle: "x", title: "X", images: [], variant: null },
    origin,
  );

  assert.equal(node.offers, undefined);
  assert.equal(node.image, undefined);
  assert.equal(node.description, undefined);
  assert.equal(node.brand, undefined);
});

test("breadcrumb positions follow array order", () => {
  const node = buildBreadcrumbJsonLd([
    { name: "Home", url: `${origin}/` },
    { name: "Tee", url: `${origin}/products/tee` },
  ]);

  assert.deepEqual(node.itemListElement, [
    { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
    { "@type": "ListItem", position: 2, name: "Tee", item: `${origin}/products/tee` },
  ]);
});
