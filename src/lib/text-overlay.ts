import satori from "satori";
import sharp from "sharp";

/* eslint-disable @typescript-eslint/no-explicit-any */
// Satori accepts React-like VDOM objects as { type, props } — not actual React elements.
// We use `any` here because Satori's internal typing doesn't match React.SatoriNode exactly.
type SatoriNode = any;

// ── Font cache (loaded once, reused across requests) ──
let fontDataBold: ArrayBuffer | null = null;
let fontDataRegular: ArrayBuffer | null = null;

async function loadFonts() {
  if (fontDataBold && fontDataRegular) return;

  const [boldRes, regularRes] = await Promise.all([
    fetch("https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf"),
    fetch("https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"),
  ]);

  fontDataBold = await boldRes.arrayBuffer();
  fontDataRegular = await regularRes.arrayBuffer();
}

// ── Types ──
export interface OverlayConfig {
  baseImageBase64: string;
  baseMimeType: string;
  headline: string;
  brandName: string;
  discount?: string | null;       // "-20%"
  originalPrice?: string | null;  // "39,99€"
  salePrice?: string | null;      // "32€"
  ctaText?: string | null;        // "Découvrir"
  brandColors: string[];          // ["#hex1", "#hex2"]
  textColor?: string;             // "#FFFFFF" or "#000000"
  accentColor?: string;           // For discount badge
  format: "square" | "story";
  templateType: "product-showcase" | "comparison" | "text-only" | "lifestyle";
}

// ── Helper: determine if a color is light ──
function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

// ── Build overlay JSX for Satori ──
function buildOverlayJSX(config: OverlayConfig, width: number, height: number): SatoriNode {
  const {
    headline,
    discount,
    originalPrice,
    salePrice,
    ctaText,
    brandColors,
    textColor,
    accentColor,
    templateType,
  } = config;

  // Smart color choices
  const primaryColor = brandColors[0] || "#000000";
  const secondaryColor = brandColors[1] || accentColor || "#FF4444";
  const txtColor = textColor || "#FFFFFF";
  const ctaBg = primaryColor;
  const ctaTextColor = isLightColor(primaryColor) ? "#000000" : "#FFFFFF";
  const discountBg = accentColor || secondaryColor;
  const discountTextColor = isLightColor(discountBg) ? "#000000" : "#FFFFFF";

  // Scale font sizes based on image dimensions
  const scale = width / 1024;
  const headlineSize = Math.round(48 * scale);
  const priceSize = Math.round(28 * scale);
  const priceCrossedSize = Math.round(22 * scale);
  const ctaSize = Math.round(20 * scale);
  const discountSize = Math.round(32 * scale);
  const padding = Math.round(40 * scale);
  const ctaPaddingH = Math.round(32 * scale);
  const ctaPaddingV = Math.round(14 * scale);
  const badgePaddingH = Math.round(20 * scale);
  const badgePaddingV = Math.round(10 * scale);
  const borderRadius = Math.round(12 * scale);
  const gap = Math.round(16 * scale);

  // Position text at bottom with gradient for readability
  const isCenter = templateType === "text-only";

  // Build elements array
  const elements: SatoriNode[] = [];

  // Discount badge
  if (discount) {
    elements.push({
      type: "div",
      props: {
        style: {
          display: "flex",
          backgroundColor: discountBg,
          color: discountTextColor,
          fontSize: discountSize,
          fontWeight: 700,
          paddingLeft: badgePaddingH,
          paddingRight: badgePaddingH,
          paddingTop: badgePaddingV,
          paddingBottom: badgePaddingV,
          borderRadius: borderRadius,
          alignSelf: "flex-start",
        },
        children: discount,
      },
    });
  }

  // Headline
  if (headline) {
    elements.push({
      type: "div",
      props: {
        style: {
          display: "flex",
          color: txtColor,
          fontSize: headlineSize,
          fontWeight: 700,
          textTransform: "uppercase" as const,
          lineHeight: 1.1,
          textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          maxWidth: "90%",
        },
        children: headline,
      },
    });
  }

  // Prices
  if (salePrice) {
    const priceChildren: SatoriNode[] = [];
    if (originalPrice) {
      priceChildren.push({
        type: "span",
        props: {
          style: {
            textDecoration: "line-through",
            color: "rgba(255,255,255,0.6)",
            fontSize: priceCrossedSize,
            marginRight: Math.round(12 * scale),
          },
          children: originalPrice,
        },
      });
    }
    priceChildren.push({
      type: "span",
      props: {
        style: {
          color: txtColor,
          fontSize: priceSize,
          fontWeight: 700,
        },
        children: salePrice,
      },
    });

    elements.push({
      type: "div",
      props: {
        style: {
          display: "flex",
          alignItems: "baseline",
          gap: Math.round(8 * scale),
          textShadow: "0 1px 4px rgba(0,0,0,0.5)",
        },
        children: priceChildren,
      },
    });
  }

  // CTA button
  if (ctaText) {
    elements.push({
      type: "div",
      props: {
        style: {
          display: "flex",
          backgroundColor: ctaBg,
          color: ctaTextColor,
          fontSize: ctaSize,
          fontWeight: 600,
          paddingLeft: ctaPaddingH,
          paddingRight: ctaPaddingH,
          paddingTop: ctaPaddingV,
          paddingBottom: ctaPaddingV,
          borderRadius: Math.round(50 * scale),
          alignSelf: "flex-start",
          marginTop: Math.round(4 * scale),
        },
        children: ctaText,
      },
    });
  }

  // Wrapper with gradient background for readability (bottom-positioned)
  const wrapper: SatoriNode = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column" as const,
        width: "100%",
        height: "100%",
        justifyContent: isCenter ? "center" : "flex-end",
        alignItems: isCenter ? "center" : "flex-start",
        padding: padding,
        gap: gap,
        // Gradient from transparent to dark at bottom for text readability
        ...(isCenter
          ? {}
          : {
              backgroundImage:
                "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)",
            }),
      },
      children: elements,
    },
  };

  return wrapper;
}

// ── Main function: composite text overlay onto base image ──
export async function compositeTextOverlay(
  config: OverlayConfig
): Promise<{ imageBase64: string; mimeType: string }> {
  await loadFonts();

  if (!fontDataBold || !fontDataRegular) {
    throw new Error("Failed to load fonts for text overlay");
  }

  // Get base image dimensions
  const baseBuffer = Buffer.from(config.baseImageBase64, "base64");
  const metadata = await sharp(baseBuffer).metadata();
  const width = metadata.width || 1024;
  const height = metadata.height || 1024;

  // Build the overlay JSX
  const jsx = buildOverlayJSX(config, width, height);

  // Generate SVG with Satori
  const svg = await satori(jsx, {
    width,
    height,
    fonts: [
      {
        name: "Inter",
        data: fontDataBold,
        weight: 700,
        style: "normal",
      },
      {
        name: "Inter",
        data: fontDataRegular,
        weight: 400,
        style: "normal",
      },
    ],
  });

  // Composite SVG overlay directly onto base image using Sharp
  // Sharp can handle SVG input natively for compositing
  const svgBuffer = Buffer.from(svg);

  const result = await sharp(baseBuffer)
    .composite([
      {
        input: svgBuffer,
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();

  return {
    imageBase64: result.toString("base64"),
    mimeType: "image/png",
  };
}
