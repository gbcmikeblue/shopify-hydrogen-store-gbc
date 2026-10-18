import type { ImgHTMLAttributes, Ref } from "react";

/**
 * Candidate widths for Shopify's image CDN. The CDN resizes on the fly and
 * ignores widths larger than the source, so the list can stay generic.
 */
export const SHOPIFY_IMAGE_WIDTHS = [160, 240, 320, 480, 640, 800, 960, 1200, 1600, 2000] as const;

/** Width used for the plain `src` fallback when `srcSet` is available. */
const FALLBACK_WIDTH = 640;

/**
 * Appends the Shopify CDN `width` query parameter. Relative paths and data
 * URLs are returned unchanged, so the helper is safe for icons as well.
 */
export function shopifyImageUrl(url: string, width: number): string {
  if (!/^https?:\/\//i.test(url)) return url;

  try {
    const parsed = new URL(url);
    parsed.searchParams.set("width", String(width));
    return parsed.toString();
  } catch {
    return url;
  }
}

export type ShopifyImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "srcSet" | "sizes" | "width" | "height"
> & {
  src: string;
  alt: string;
  /** Intrinsic width from the Storefront API, used to cap `srcSet` and set the aspect ratio. */
  srcWidth?: number | null;
  /** Intrinsic height from the Storefront API, used for the aspect ratio. */
  srcHeight?: number | null;
  /** Layout width hint for the browser; defaults to `100vw`. */
  sizes?: string;
  /** Override the candidate widths, e.g. `[80, 160, 240]` for a thumbnail. */
  widths?: readonly number[];
  ref?: Ref<HTMLImageElement>;
};

/**
 * `<img>` with Shopify CDN `width` variants and an optional `srcSet`, so phones
 * don't download desktop-sized product imagery. Visual behavior is unchanged
 * from a plain `<img>`; callers keep owning `className` and dimensions.
 */
export function ShopifyImage({
  src,
  alt,
  srcWidth,
  srcHeight,
  sizes = "100vw",
  widths = SHOPIFY_IMAGE_WIDTHS,
  loading = "lazy",
  decoding = "async",
  ref,
  ...imgProps
}: ShopifyImageProps) {
  const resizable = /^https?:\/\//i.test(src);
  const maxWidth = srcWidth ?? Number.POSITIVE_INFINITY;
  const candidates = resizable ? widths.filter((width) => width <= maxWidth) : [];

  const srcSet =
    candidates.length > 1
      ? candidates.map((width) => `${shopifyImageUrl(src, width)} ${width}w`).join(", ")
      : undefined;

  const fallbackWidth = candidates.find((width) => width >= FALLBACK_WIDTH) ?? candidates.at(-1);

  return (
    <img
      {...imgProps}
      ref={ref}
      src={fallbackWidth ? shopifyImageUrl(src, fallbackWidth) : src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={srcWidth && srcHeight ? srcWidth : undefined}
      height={srcWidth && srcHeight ? srcHeight : undefined}
      loading={loading}
      decoding={decoding}
    />
  );
}
