import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

export interface ScrapedImage {
  alt: string;
  src: string;
  context: string; // nearby text (product name, price, etc.)
  width?: number;
  height?: number;
}

export interface ScrapedData {
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  headings: string[];
  bodyText: string;
  links: string[];
  jsonLd: unknown[];
  colors: string[];
  images: { alt: string; src: string }[];
  productImages: ScrapedImage[]; // enriched product images
}

/**
 * Resolve a potentially relative image URL to absolute
 */
function resolveUrl(src: string, baseUrl: string): string {
  if (!src || src.startsWith("data:")) return src;
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return src;
  }
}

/**
 * Extract context text around an image element (parent card, nearby text)
 */
function extractImageContext($: cheerio.CheerioAPI, el: AnyNode): string {
  const $el = $(el);

  // Look for the closest product card / container
  const $card = $el.closest(
    '[class*="product"], [class*="card"], [class*="item"], [data-product], article, li, .grid > div, .col'
  );

  if ($card.length) {
    // Get text from the card (product name, price, description)
    const cardText = $card
      .find('h1, h2, h3, h4, h5, [class*="title"], [class*="name"], [class*="price"], [class*="description"], p, span')
      .map((_, textEl) => $(textEl).text().trim())
      .get()
      .filter((t) => t.length > 1 && t.length < 200)
      .slice(0, 5)
      .join(" | ");
    return cardText;
  }

  // Fallback: get text from parent and siblings
  const parentText = $el
    .parent()
    .find("h1, h2, h3, h4, p, span")
    .map((_, textEl) => $(textEl).text().trim())
    .get()
    .filter((t) => t.length > 1 && t.length < 200)
    .slice(0, 3)
    .join(" | ");

  return parentText;
}

/**
 * Check if an image is likely a product image (not icon, logo, decoration)
 */
function isLikelyProductImage($: cheerio.CheerioAPI, el: AnyNode, src: string): boolean {
  const $el = $(el);
  const alt = ($el.attr("alt") || "").toLowerCase();
  const className = ($el.attr("class") || "").toLowerCase();
  const parentClass = ($el.parent().attr("class") || "").toLowerCase();
  const width = parseInt($el.attr("width") || "0", 10);
  const height = parseInt($el.attr("height") || "0", 10);

  // Skip data URIs, SVGs, tiny tracking pixels
  if (src.startsWith("data:") || src.endsWith(".svg") || src.includes("pixel") || src.includes("tracking")) return false;

  // Skip if explicitly small (icons, favicons)
  if ((width > 0 && width < 50) || (height > 0 && height < 50)) return false;

  // Skip obvious non-product images
  const skipPatterns = [
    "icon", "logo", "favicon", "sprite", "arrow", "chevron", "close", "menu",
    "social", "facebook", "twitter", "instagram", "linkedin", "youtube",
    "payment", "visa", "mastercard", "paypal", "badge", "flag", "emoji",
    "placeholder", "loading", "spinner", "blank", "spacer",
  ];
  if (skipPatterns.some((p) => src.toLowerCase().includes(p) || alt.includes(p) || className.includes(p))) return false;

  // Boost if in a product context
  const productPatterns = ["product", "item", "card", "shop", "catalog", "gallery"];
  const isInProductContext = productPatterns.some(
    (p) => parentClass.includes(p) || className.includes(p)
  );

  // Boost if has meaningful alt text
  const hasMeaningfulAlt = alt.length > 3 && !alt.includes("image") && !alt.includes("photo");

  return isInProductContext || hasMeaningfulAlt || (width >= 100 && height >= 100) || (!width && !height);
}

export async function scrapeUrl(url: string): Promise<ScrapedData> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status} en chargeant ${url}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove noise
  $("script, style, noscript, iframe, svg").remove();

  // Extract colors from inline styles and style tags
  const colorRegex = /#[0-9a-fA-F]{3,8}\b|rgb\([^)]+\)/g;
  const colorSet = new Set<string>();
  $("[style]").each((_, el) => {
    const style = $(el).attr("style") || "";
    const matches = style.match(colorRegex);
    if (matches) matches.forEach((c) => colorSet.add(c));
  });

  // Extract JSON-LD structured data
  const jsonLd: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      jsonLd.push(JSON.parse($(el).html() || ""));
    } catch {
      // ignore malformed JSON-LD
    }
  });

  const bodyText = $("main, article, [role='main'], .content, #content, body")
    .first()
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 10000);

  // ── Extract enriched product images ──
  const productImages: ScrapedImage[] = [];
  const seenSrcs = new Set<string>();

  $("img").each((_, el) => {
    const rawSrc = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src") || "";
    if (!rawSrc) return;

    const absoluteSrc = resolveUrl(rawSrc, url);
    if (seenSrcs.has(absoluteSrc)) return;

    if (isLikelyProductImage($, el, absoluteSrc)) {
      seenSrcs.add(absoluteSrc);
      productImages.push({
        alt: $(el).attr("alt") || "",
        src: absoluteSrc,
        context: extractImageContext($, el),
        width: parseInt($(el).attr("width") || "0", 10) || undefined,
        height: parseInt($(el).attr("height") || "0", 10) || undefined,
      });
    }
  });

  // Also check srcset and picture sources
  $("source[srcset], img[srcset]").each((_, el) => {
    const srcset = $(el).attr("srcset") || "";
    // Get the highest resolution image from srcset
    const sources = srcset.split(",").map((s) => s.trim().split(/\s+/));
    if (sources.length > 0) {
      const bestSrc = sources[sources.length - 1]?.[0];
      if (bestSrc) {
        const absoluteSrc = resolveUrl(bestSrc, url);
        if (!seenSrcs.has(absoluteSrc)) {
          seenSrcs.add(absoluteSrc);
          // Only add if parent img was already identified as product image
        }
      }
    }
  });

  return {
    title: $("title").text().trim(),
    metaDescription: $('meta[name="description"]').attr("content") || "",
    ogTitle: $('meta[property="og:title"]').attr("content") || "",
    ogDescription: $('meta[property="og:description"]').attr("content") || "",
    headings: $("h1, h2, h3")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean)
      .slice(0, 30),
    bodyText,
    links: $("a")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((t) => t.length > 2)
      .slice(0, 50),
    jsonLd,
    colors: Array.from(colorSet).slice(0, 10),
    images: $("img")
      .map((_, el) => ({
        alt: $(el).attr("alt") || "",
        src: $(el).attr("src") || "",
      }))
      .get()
      .slice(0, 20),
    productImages: productImages.slice(0, 15), // Max 15 product candidates
  };
}

/**
 * Download an image from URL and convert to base64
 */
export async function downloadImageAsBase64(
  imageUrl: string
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "image/*",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Skip non-image responses
    if (!contentType.startsWith("image/")) return null;

    const buffer = await response.arrayBuffer();

    // Skip very small images (< 5KB, likely icons) or very large (> 5MB)
    if (buffer.byteLength < 5000 || buffer.byteLength > 5 * 1024 * 1024) return null;

    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = contentType.split(";")[0].trim();

    return { base64, mimeType };
  } catch {
    return null;
  }
}
