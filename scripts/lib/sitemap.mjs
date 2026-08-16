import { LOCALES } from "./i18n.mjs";
import { PAGES, SURFACES, alternateLinks, pageUrl, pagesForSurface } from "./routes.mjs";

// One build, two hosts: a single /sitemap.xml would have to claim URLs from
// both domains, which is exactly what search engines reject. Each surface gets
// its own file and nginx serves the right one per server block.
export const SITEMAP_FILES = {
  cv: { sitemap: "sitemap-ru.xml", robots: "robots-ru.txt" },
  services: { sitemap: "sitemap-dev.xml", robots: "robots-dev.txt" }
};

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildSitemap(surfaceName, lastmod) {
  const entries = pagesForSurface(surfaceName).flatMap((pageId) =>
    LOCALES.map((locale) => {
      const alternates = alternateLinks(pageId)
        .map(
          (alternate) =>
            `    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${escapeXml(alternate.href)}" />`
        )
        .join("\n");

      return [
        "  <url>",
        `    <loc>${escapeXml(pageUrl(pageId, locale))}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${PAGES[pageId].sitemap.changefreq}</changefreq>`,
        `    <priority>${PAGES[pageId].sitemap.priority}</priority>`,
        alternates,
        "  </url>"
      ].join("\n");
    })
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    "</urlset>",
    ""
  ].join("\n");
}

export function buildRobots(surfaceName) {
  const origin = SURFACES[surfaceName].origin;

  return [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    ""
  ].join("\n");
}
