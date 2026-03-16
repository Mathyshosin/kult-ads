/**
 * Text Overlay — Satori + Sharp
 *
 * Composites pixel-perfect text (headline, prices, discount, CTA) onto
 * a Gemini-generated image using Satori (JSX → SVG) and Sharp (compositing).
 */

import satori from "satori";
import sharp from "sharp";
import type { ReactNode } from "react";

// ── Interfaces ──────────────────────────────────────────────────────

export interface OverlayConfig {
  headline: string;
  ctaText: string;
  discountBadge?: string;   // "-60%"
  originalPrice?: string;   // "59,99€" (crossed out)
  salePrice?: string;       // "29,99€"
  price?: string;           // single price (no sale)
}

export interface OverlayStyle {
  templateType: "product-showcase" | "comparison" | "text-only" | "lifestyle";
  textPosition: string;
  ctaPosition: string;
  textColor: string;        // "#FFFFFF" or "#000000"
  accentColor?: string;
  brandPrimaryColor: string;
  dimensions: { width: number; height: number };
}

// ── Font Cache ──────────────────────────────────────────────────────

let fontRegularData: ArrayBuffer | null = null;
let fontBoldData: ArrayBuffer | null = null;

async function loadFonts(): Promise<void> {
  if (fontRegularData && fontBoldData) return;

  const [regular, bold] = await Promise.all([
    fetch(
      "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.woff"
    ).then((r) => r.arrayBuffer()),
    fetch(
      "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hjQ.woff"
    ).then((r) => r.arrayBuffer()),
  ]);

  fontRegularData = regular;
  fontBoldData = bold;
}

// ── Helpers ─────────────────────────────────────────────────────────

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

/** Derive font sizes relative to image width */
function sizes(w: number) {
  return {
    headline: Math.round(w * 0.06),       // ~62px on 1024
    price: Math.round(w * 0.04),          // ~41px
    discount: Math.round(w * 0.035),      // ~36px
    cta: Math.round(w * 0.032),           // ~33px
    padding: Math.round(w * 0.05),        // ~51px
    ctaPadH: Math.round(w * 0.04),
    ctaPadV: Math.round(w * 0.015),
    gap: Math.round(w * 0.015),
  };
}

// ── JSX Builders (Satori uses React-element-like objects) ───────────

function h(
  type: string,
  props: Record<string, unknown>,
  ...children: (ReactNode | string | null | undefined | false)[]
): ReactNode {
  const filtered = children.filter((c) => c !== null && c !== undefined && c !== false);
  return { type, props: { ...props, children: filtered.length === 1 ? filtered[0] : filtered } } as unknown as ReactNode;
}

function buildBottomOverlay(config: OverlayConfig, style: OverlayStyle, s: ReturnType<typeof sizes>): ReactNode {
  const { width, height } = style.dimensions;
  const textColor = style.textColor || "#FFFFFF";
  const accent = style.accentColor || "#FF4444";
  const brandColor = style.brandPrimaryColor || "#6B46C1";

  const hasDiscount = !!config.discountBadge;
  const hasPrices = !!(config.originalPrice && config.salePrice);
  const hasSinglePrice = !!config.price && !hasPrices;

  return h("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      width: `${width}px`,
      height: `${height}px`,
      position: "relative",
    },
  },
    // Spacer to push content to bottom
    h("div", { style: { display: "flex", flex: 1 } }),

    // Gradient overlay at bottom
    h("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: `${s.gap}px`,
        padding: `${s.padding * 2}px ${s.padding}px ${s.padding}px`,
        background: "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.75))",
      },
    },
      // Discount badge
      hasDiscount && h("div", {
        style: {
          display: "flex",
          alignSelf: "flex-start",
          backgroundColor: accent,
          color: "#FFFFFF",
          fontSize: `${s.discount}px`,
          fontWeight: 700,
          fontFamily: "Inter",
          padding: `${s.gap / 2}px ${s.gap}px`,
          borderRadius: `${s.gap}px`,
        },
      }, config.discountBadge),

      // Headline
      h("div", {
        style: {
          display: "flex",
          fontSize: `${s.headline}px`,
          fontWeight: 700,
          fontFamily: "Inter",
          color: "#FFFFFF",
          lineHeight: 1.1,
          textShadow: "0 2px 8px rgba(0,0,0,0.5)",
        },
      }, config.headline),

      // Prices
      hasPrices && h("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: `${s.gap}px`,
        },
      },
        // Original price (crossed out)
        h("div", {
          style: {
            display: "flex",
            position: "relative",
            fontSize: `${s.price}px`,
            fontFamily: "Inter",
            color: "rgba(255,255,255,0.6)",
          },
        },
          config.originalPrice,
          // Strikethrough line
          h("div", {
            style: {
              display: "flex",
              position: "absolute",
              top: "50%",
              left: "-4px",
              right: "-4px",
              height: "2px",
              backgroundColor: "rgba(255,255,255,0.7)",
            },
          }),
        ),
        // Sale price
        h("div", {
          style: {
            display: "flex",
            fontSize: `${s.price * 1.2}px`,
            fontWeight: 700,
            fontFamily: "Inter",
            color: accent,
          },
        }, config.salePrice),
      ),

      // Single price
      hasSinglePrice && h("div", {
        style: {
          display: "flex",
          fontSize: `${s.price}px`,
          fontWeight: 700,
          fontFamily: "Inter",
          color: "#FFFFFF",
        },
      }, config.price),

      // CTA button
      config.ctaText && h("div", {
        style: {
          display: "flex",
          alignSelf: "flex-start",
          backgroundColor: brandColor,
          color: isLightColor(brandColor) ? "#000000" : "#FFFFFF",
          fontSize: `${s.cta}px`,
          fontWeight: 600,
          fontFamily: "Inter",
          padding: `${s.ctaPadV}px ${s.ctaPadH}px`,
          borderRadius: `${s.ctaPadV * 2}px`,
          marginTop: `${s.gap / 2}px`,
        },
      }, config.ctaText),
    ),
  );
}

function buildCenterOverlay(config: OverlayConfig, style: OverlayStyle, s: ReturnType<typeof sizes>): ReactNode {
  const { width, height } = style.dimensions;
  const accent = style.accentColor || "#FF4444";
  const brandColor = style.brandPrimaryColor || "#6B46C1";

  const hasDiscount = !!config.discountBadge;
  const hasPrices = !!(config.originalPrice && config.salePrice);

  // Larger fonts for text-only
  const headlineSize = Math.round(s.headline * 1.5);
  const priceSize = Math.round(s.price * 1.3);

  return h("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: `${width}px`,
      height: `${height}px`,
      textAlign: "center",
    },
  },
    // Semi-transparent backdrop
    h("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: `${s.gap * 1.5}px`,
        padding: `${s.padding * 1.5}px`,
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: `${s.gap * 2}px`,
        maxWidth: `${width * 0.85}px`,
      },
    },
      // Discount badge
      hasDiscount && h("div", {
        style: {
          display: "flex",
          backgroundColor: accent,
          color: "#FFFFFF",
          fontSize: `${s.discount * 1.3}px`,
          fontWeight: 700,
          fontFamily: "Inter",
          padding: `${s.gap / 2}px ${s.gap * 1.5}px`,
          borderRadius: `${s.gap}px`,
        },
      }, config.discountBadge),

      // Headline
      h("div", {
        style: {
          display: "flex",
          fontSize: `${headlineSize}px`,
          fontWeight: 700,
          fontFamily: "Inter",
          color: "#FFFFFF",
          lineHeight: 1.1,
        },
      }, config.headline),

      // Prices
      hasPrices && h("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: `${s.gap}px`,
        },
      },
        h("div", {
          style: {
            display: "flex",
            position: "relative",
            fontSize: `${priceSize}px`,
            fontFamily: "Inter",
            color: "rgba(255,255,255,0.6)",
          },
        },
          config.originalPrice,
          h("div", {
            style: {
              display: "flex",
              position: "absolute",
              top: "50%",
              left: "-4px",
              right: "-4px",
              height: "2px",
              backgroundColor: "rgba(255,255,255,0.7)",
            },
          }),
        ),
        h("div", {
          style: {
            display: "flex",
            fontSize: `${priceSize * 1.2}px`,
            fontWeight: 700,
            fontFamily: "Inter",
            color: accent,
          },
        }, config.salePrice),
      ),

      // CTA button
      config.ctaText && h("div", {
        style: {
          display: "flex",
          backgroundColor: brandColor,
          color: isLightColor(brandColor) ? "#000000" : "#FFFFFF",
          fontSize: `${s.cta * 1.2}px`,
          fontWeight: 600,
          fontFamily: "Inter",
          padding: `${s.ctaPadV * 1.3}px ${s.ctaPadH * 1.5}px`,
          borderRadius: `${s.ctaPadV * 2.5}px`,
          marginTop: `${s.gap}px`,
        },
      }, config.ctaText),
    ),
  );
}

// ── Main Export ──────────────────────────────────────────────────────

export async function compositeTextOverlay(
  imageBase64: string,
  imageMimeType: string,
  config: OverlayConfig,
  style: OverlayStyle
): Promise<{ imageBase64: string; mimeType: string }> {
  await loadFonts();

  const { width, height } = style.dimensions;
  const s = sizes(width);

  // Choose layout based on template type
  const jsx =
    style.templateType === "text-only"
      ? buildCenterOverlay(config, style, s)
      : buildBottomOverlay(config, style, s);

  // Satori → SVG
  const svg = await satori(jsx as React.ReactElement, {
    width,
    height,
    fonts: [
      { name: "Inter", data: fontRegularData!, weight: 400, style: "normal" },
      { name: "Inter", data: fontBoldData!, weight: 700, style: "normal" },
    ],
  });

  // Sharp: load base image + composite SVG overlay
  const imageBuffer = Buffer.from(imageBase64, "base64");
  const svgBuffer = Buffer.from(svg);

  const result = await sharp(imageBuffer)
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .png()
    .toBuffer();

  return {
    imageBase64: result.toString("base64"),
    mimeType: "image/png",
  };
}
