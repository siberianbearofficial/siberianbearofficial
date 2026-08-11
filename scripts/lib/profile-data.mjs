import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import yaml from "js-yaml";

import { profileSchema } from "./profile-schema.mjs";
import { servicesSchema } from "./services-schema.mjs";
import {
  LOCALES,
  LOCALE_AUTONYMS,
  LOCALE_LABELS,
  assertFullyTranslated,
  localize
} from "./i18n.mjs";
import { cvStructuredData, servicesStructuredData } from "./structured-data.mjs";
import {
  OG_IMAGES,
  PAGES,
  RESUME_PDFS,
  SURFACES,
  alternateLinks,
  localeSwitchPaths,
  pageUrl
} from "./routes.mjs";

const OG_LOCALES = { en: "en_US", ru: "ru_RU" };
const INTL_LOCALES = { en: "en", ru: "ru-RU" };

// Intl gives "нояб. 2025 г." for Russian; the era suffix is correct prose but
// noise in a date range, so the parts are reassembled by hand.
function monthToLabel(value, locale, presentLabel) {
  if (value === "Present") {
    return presentLabel;
  }

  const [year, month] = value.split("-");
  const parts = new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).formatToParts(new Date(`${year}-${month}-01T00:00:00Z`));
  const find = (type) => parts.find((part) => part.type === type)?.value ?? "";

  return `${find("month")} ${find("year")}`;
}

function withRange(items, locale, presentLabel) {
  return items.map((item) => ({
    ...item,
    range: `${monthToLabel(item.start, locale, presentLabel)} - ${monthToLabel(
      item.end,
      locale,
      presentLabel
    )}`
  }));
}

function trimStringsDeep(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value.map((item) => trimStringsDeep(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, trimStringsDeep(item)])
    );
  }

  return value;
}

async function readContentFile(rootDir, name) {
  const raw = await readFile(resolve(rootDir, "content", name), "utf8");
  const parsed = trimStringsDeep(yaml.load(raw));

  assertFullyTranslated(parsed, `content/${name}`);

  return parsed;
}

// Read and validate once, then project into each language. A translation gap
// fails the build here rather than shipping English into the Russian page.
export async function loadContent(rootDir) {
  const [profile, services, ui] = await Promise.all([
    readContentFile(rootDir, "profile.yml"),
    readContentFile(rootDir, "services.yml"),
    readContentFile(rootDir, "ui.yml")
  ]);

  return { profile, services, ui };
}

export function localizedProfile(content, locale) {
  return profileSchema.parse(localize(content.profile, locale));
}

export function localizedServices(content, locale) {
  return servicesSchema.parse(localize(content.services, locale));
}

export function localizedUi(content, locale) {
  return localize(content.ui, locale);
}

function pageMeta(pageId, locale, { title, description, ogImage, ogType }) {
  const surface = SURFACES[PAGES[pageId].surface];
  const switchPaths = localeSwitchPaths(pageId);

  return {
    id: pageId,
    lang: locale,
    title,
    description,
    canonical: pageUrl(pageId, locale),
    alternates: alternateLinks(pageId),
    switch_paths: switchPaths,
    // Fixed EN, RU order in the UI regardless of which language the surface
    // serves from its root.
    switch_options: LOCALES.map((code) => ({
      code,
      path: switchPaths[code],
      label: LOCALE_LABELS[code],
      title: LOCALE_AUTONYMS[code]
    })),
    og_image: `${surface.origin}${ogImage}`,
    og_type: ogType,
    og_locale: OG_LOCALES[locale],
    og_locale_alternate: OG_LOCALES[locale === "en" ? "ru" : "en"]
  };
}

// Printed contact lines drop the scheme: the resume gained a LinkedIn URL,
// and "https://www." in front of it is the difference between one line and two
// in the Russian layout, where the role line is longer.
function resumeContacts(identity) {
  const bare = (url) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

  return [
    { href: `mailto:${identity.email}`, text: identity.email },
    { href: identity.telegram, text: bare(identity.telegram) },
    { href: identity.linkedin, text: bare(identity.linkedin) },
    { href: identity.github, text: bare(identity.github) },
    { href: identity.website, text: bare(identity.website) }
  ];
}

function otherLocaleName(content, locale) {
  return localize(content.profile.identity.name, locale === "en" ? "ru" : "en");
}

export function createViewModel(content, locale, pageId) {
  const profile = localizedProfile(content, locale);
  const ui = localizedUi(content, locale);
  const seo = pageId === "resume" ? profile.seo.resume : profile.seo.home;
  const page = pageMeta(pageId, locale, {
    title: seo.title,
    description: seo.description,
    ogImage: OG_IMAGES.home[locale],
    ogType: "profile"
  });

  return {
    ...profile,
    t: ui,
    lang: locale,
    page,
    experience: withRange(profile.experience, locale, ui.common.present),
    education: withRange(profile.education, locale, ui.common.present),
    featured_case_studies: profile.case_studies.filter(
      (caseStudy) => caseStudy.readme_featured
    ),
    site_case_studies: profile.case_studies,
    resume_contacts: resumeContacts(profile.identity),
    links: {
      home: pageUrl("home", locale),
      resume: pageUrl("resume", locale),
      services: pageUrl("services", locale),
      resume_pdf: RESUME_PDFS[locale]
    },
    structured_data:
      pageId === "home"
        ? cvStructuredData(profile, {
            locale,
            url: page.canonical,
            otherName: otherLocaleName(content, locale)
          })
        : null,
    year: new Date().getUTCFullYear()
  };
}

export function createServicesViewModel(content, locale) {
  const services = localizedServices(content, locale);
  const profile = localizedProfile(content, locale);
  const ui = localizedUi(content, locale);
  const page = pageMeta("services", locale, {
    title: services.seo.title,
    description: services.seo.description,
    ogImage: OG_IMAGES.services[locale],
    ogType: "website"
  });

  return {
    ...services,
    t: ui,
    lang: locale,
    page,
    identity: profile.identity,
    featured_service: services.services.find((service) => service.featured),
    links: {
      cv: pageUrl("home", locale),
      services: pageUrl("services", locale)
    },
    structured_data: servicesStructuredData(services, profile, {
      locale,
      url: page.canonical
    }),
    year: new Date().getUTCFullYear()
  };
}
