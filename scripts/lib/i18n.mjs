// One i18n mechanism for both surfaces. Any string in a content file can be
// replaced by a { en, ru } map, so the structure of the content is written
// once and only the prose is duplicated. Technology names, URLs, dates, and
// icon names stay plain strings and cannot drift between languages.

export const LOCALES = ["en", "ru"];

// Deliberately not content: a language is labelled the same way whichever page
// you are on, and its own name is written in itself. Putting these in a
// { en, ru } map would also collide with the localized-node convention below.
export const LOCALE_LABELS = { en: "EN", ru: "RU" };
export const LOCALE_AUTONYMS = { en: "English", ru: "Русский" };

const localeKeys = new Set(LOCALES);

function isLocalizedNode(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const keys = Object.keys(value);

  return keys.length > 0 && keys.every((key) => localeKeys.has(key));
}

export function localize(value, locale) {
  if (isLocalizedNode(value)) {
    return localize(value[locale], locale);
  }

  if (Array.isArray(value)) {
    return value.map((item) => localize(item, locale));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, localize(item, locale)])
    );
  }

  return value;
}

// A half-translated content file still parses and still renders, it just
// silently ships English to Russian readers. Collecting the gaps up front
// turns that into a build failure with the exact path.
export function collectMissingTranslations(value, path = "") {
  if (isLocalizedNode(value)) {
    return LOCALES.filter((locale) => {
      const translation = value[locale];

      return typeof translation !== "string" || translation.length === 0;
    }).map((locale) => `${path || "<root>"}.${locale}`);
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectMissingTranslations(item, `${path}[${index}]`)
    );
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      collectMissingTranslations(item, path ? `${path}.${key}` : key)
    );
  }

  return [];
}

export function assertFullyTranslated(value, sourceLabel) {
  const missing = collectMissingTranslations(value);

  if (missing.length > 0) {
    throw new Error(
      `Missing translations in ${sourceLabel}:\n  ${missing.join("\n  ")}`
    );
  }
}
