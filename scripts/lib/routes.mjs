// The two domains are still one build and one nginx image, so every URL in
// this file exists in both worlds: a path inside dist/ and a public path on
// exactly one of the two hosts. Keeping both halves in one table is what lets
// templates, the sitemaps, and the nginx route list stay in agreement.
//
// Each surface serves its default language from the root and the second
// language from a prefix, which is what makes hreflang and per-language
// <title> possible on a static site.

export const SURFACES = {
  cv: {
    origin: "https://aleksei-orlov.ru",
    default_locale: "ru"
  },
  services: {
    origin: "https://aleksei-orlov.dev",
    default_locale: "en"
  }
};

export const PAGES = {
  home: {
    surface: "cv",
    template: "site.njk",
    paths: { ru: "/", en: "/en/" },
    outputs: { ru: "index.html", en: "en/index.html" },
    sitemap: { priority: "1.0", changefreq: "monthly" }
  },
  resume: {
    surface: "cv",
    template: "resume.njk",
    paths: { ru: "/resume/", en: "/en/resume/" },
    outputs: { ru: "resume/index.html", en: "en/resume/index.html" },
    sitemap: { priority: "0.6", changefreq: "monthly" }
  },
  services: {
    surface: "services",
    template: "services.njk",
    paths: { en: "/", ru: "/ru/" },
    outputs: { en: "services/index.html", ru: "services/ru/index.html" },
    sitemap: { priority: "1.0", changefreq: "monthly" }
  }
};

// The English PDF keeps the original filename: it is the link people already
// have, and it is the version a non-Russian recruiter should get by default.
export const RESUME_PDFS = {
  en: "/Aleksei-Orlov-Resume.pdf",
  ru: "/Aleksei-Orlov-Resume-RU.pdf"
};

export const OG_IMAGES = {
  home: { ru: "/og/cv-ru.png", en: "/og/cv-en.png" },
  services: { en: "/og/services-en.png", ru: "/og/services-ru.png" }
};

export function surfaceOf(pageId) {
  return SURFACES[PAGES[pageId].surface];
}

export function pagePath(pageId, locale) {
  return PAGES[pageId].paths[locale];
}

export function pageUrl(pageId, locale) {
  return `${surfaceOf(pageId).origin}${pagePath(pageId, locale)}`;
}

// x-default goes to English on both surfaces: it is the fallback shown to
// visitors whose language matches neither entry, and English is the wider net.
export function alternateLinks(pageId) {
  return [
    ...Object.keys(PAGES[pageId].paths).map((locale) => ({
      hreflang: locale,
      href: pageUrl(pageId, locale)
    })),
    { hreflang: "x-default", href: pageUrl(pageId, "en") }
  ];
}

// Same-origin paths for the client-side language preference script. Absolute
// URLs would work too, but staying on paths keeps the redirect inside the
// current host and makes local previews behave like production.
export function localeSwitchPaths(pageId) {
  return { ...PAGES[pageId].paths };
}

export function crossSurfaceUrl(pageId, locale) {
  return pageUrl(pageId, locale);
}

export function pagesForSurface(surfaceName) {
  return Object.entries(PAGES)
    .filter(([, page]) => page.surface === surfaceName)
    .map(([id]) => id);
}
