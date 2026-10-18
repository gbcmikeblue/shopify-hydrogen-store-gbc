// schema.org payloads for the layout and product pages. Kept as plain builders so
// they can be unit-tested without rendering React or hitting the Storefront API.

import type { StorefrontShop } from "~/lib/storefront-shop";

export type JsonLd = Record<string, unknown>;

export type StoreJsonLdInput = Pick<StorefrontShop, "name" | "logo">;

/** Organization node: brand identity plus logo when the shop has one. */
export function buildOrganizationJsonLd(shop: StoreJsonLdInput, origin: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: shop.name,
    url: origin,
    ...(shop.logo ? { logo: shop.logo.url } : {}),
  };
}

/** WebSite node with a SearchAction, enabling the sitelinks search box. */
export function buildWebSiteJsonLd(name: string, origin: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: origin,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${origin}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Both site-level nodes, emitted once per page from the root layout. */
export function buildStoreJsonLd(shop: StoreJsonLdInput, origin: string): JsonLd[] {
  return [buildOrganizationJsonLd(shop, origin), buildWebSiteJsonLd(shop.name, origin)];
}

export type ProductJsonLdInput = {
  handle: string;
  title: string;
  description?: string | null;
  vendor?: string | null;
  images: readonly { url: string }[];
  variant?: {
    sku?: string | null;
    price: { amount: string; currencyCode: string };
    availableForSale: boolean;
  } | null;
};

/** Product node with a single Offer, mirroring the variant the page renders. */
export function buildProductJsonLd(product: ProductJsonLdInput, origin: string): JsonLd {
  const url = `${origin}/products/${product.handle}`;
  const variant = product.variant ?? null;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    url,
    ...(product.description ? { description: product.description } : {}),
    ...(product.vendor ? { brand: { "@type": "Brand", name: product.vendor } } : {}),
    ...(product.images.length > 0 ? { image: product.images.map((image) => image.url) } : {}),
    ...(variant
      ? {
          sku: variant.sku ?? undefined,
          offers: {
            "@type": "Offer",
            url,
            price: variant.price.amount,
            priceCurrency: variant.price.currencyCode,
            availability: variant.availableForSale
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        }
      : {}),
  };
}

export type BreadcrumbItem = { name: string; url: string };

/** BreadcrumbList node; positions are assigned in array order. */
export function buildBreadcrumbJsonLd(items: readonly BreadcrumbItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
