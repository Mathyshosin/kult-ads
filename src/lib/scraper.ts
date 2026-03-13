import * as cheerio from "cheerio";

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
  };
}
