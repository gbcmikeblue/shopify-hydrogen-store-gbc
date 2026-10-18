import { Link, useRouteLoaderData } from "react-router";

import {
  FALLBACK_SHOP_NAME,
  formatPageTitle,
  getShopNameFromRootMatch,
} from "~/lib/storefront-shop";
import type { loader as rootLoader } from "~/root";

import type { Route } from "./+types/about";

export function meta({ matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  return [
    { title: formatPageTitle("About", shopName) },
    {
      name: "description",
      content: `Who we are, how our products are made, and how to reach ${shopName}.`,
    },
  ];
}

const primaryLinkClass =
  "rounded-button button-primary focus-visible:outline-accent inline-flex h-11 items-center justify-center px-5 text-sm font-medium no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:transition-[color,background-color,border-color,transform] motion-safe:active:scale-[0.97]";

const secondaryLinkClass =
  "rounded-button button-outline focus-visible:outline-accent inline-flex h-11 items-center justify-center px-5 text-sm font-medium no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:transition-[color,background-color,border-color,transform] motion-safe:active:scale-[0.97]";

export default function AboutRoute() {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const shopName = rootData?.shopInfo.name ?? FALLBACK_SHOP_NAME;

  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      <div className="max-w-page px-margin mx-auto w-full py-12 md:py-16">
        <p className="type-subheading text-on-surface-secondary uppercase tracking-[0.2em]">
          About
        </p>
        <h1 className="type-display mt-2 max-w-3xl wrap-anywhere">{shopName}</h1>
        <p className="type-body-lg text-on-surface-secondary mt-4 max-w-2xl">
          We design and sell a small, considered collection: pieces we want to wear ourselves,
          made in limited runs with suppliers we visit in person.
        </p>

        <div className="mt-12 grid gap-10 md:grid-cols-3">
          <section aria-labelledby="about-products-heading">
            <h2 id="about-products-heading" className="type-heading-sm text-on-surface">
              What we make
            </h2>
            <p className="type-body-sm text-on-surface-secondary mt-2">
              Everyday pieces built from durable materials. Each season we refine the same core
              shapes instead of starting over, so what you buy stays in the catalog.
            </p>
          </section>

          <section aria-labelledby="about-shipping-heading">
            <h2 id="about-shipping-heading" className="type-heading-sm text-on-surface">
              Shipping and returns
            </h2>
            <p className="type-body-sm text-on-surface-secondary mt-2">
              Orders ship within two business days. Unworn items can be returned within 30 days of
              delivery; checkout shows the final shipping cost and taxes before you pay.
            </p>
          </section>

          <section aria-labelledby="about-contact-heading">
            <h2 id="about-contact-heading" className="type-heading-sm text-on-surface">
              Get in touch
            </h2>
            <p className="type-body-sm text-on-surface-secondary mt-2">
              Questions about sizing or an order? Start with the search page or sign in to your
              account to see order status and tracking.
            </p>
          </section>
        </div>

        <div className="border-border mt-12 flex flex-wrap gap-3 border-t pt-8">
          <Link to="/collections" className={primaryLinkClass}>
            Browse the catalog
          </Link>
          <Link to="/search" className={secondaryLinkClass}>
            Search products
          </Link>
        </div>
      </div>
    </main>
  );
}
