import { LOCALES } from "./i18n.mjs";
import {
  createServicesViewModel,
  createViewModel,
  loadContent,
  localizedProfile,
  localizedServices,
  localizedUi
} from "./profile-data.mjs";
import { createRenderer } from "./render.mjs";
import { OG_IMAGES, PAGES, SURFACES } from "./routes.mjs";
import { SITEMAP_FILES, buildRobots, buildSitemap } from "./sitemap.mjs";
import {
  collectServicesIconNames,
  collectSiteIconNames,
  loadLucideIcons
} from "./ui-assets.mjs";

const OG_VARIANTS = {
  cv: { accent: "#397CFF", accent_glow: "rgba(255, 122, 89, 0.34)" },
  services: { accent: "#FF7A59", accent_glow: "rgba(53, 224, 198, 0.28)" }
};

// A missing dictionary key renders as an empty string in Nunjucks and a typo'd
// one renders the literal "undefined". With a few hundred keys across two
// languages, that is worth failing the build over.
function assertNoUnresolvedCopy(files) {
  const broken = [...files.entries()]
    .filter(([name]) => name.endsWith(".html"))
    .filter(([, html]) => /\bundefined\b/.test(html))
    .map(([name]) => name);

  if (broken.length > 0) {
    throw new Error(
      `Rendered "undefined" into: ${broken.join(", ")} — check the keys used from content/ui.yml`
    );
  }
}

function titleSize(title) {
  if (title.length > 44) {
    return 46;
  }

  if (title.length > 26) {
    return 56;
  }

  return 86;
}

function ogPageModels(content) {
  return LOCALES.flatMap((locale) => {
    const profile = localizedProfile(content, locale);
    const services = localizedServices(content, locale);
    const ui = localizedUi(content, locale);

    return [
      {
        name: `cv-${locale}`,
        output: OG_IMAGES.home[locale],
        model: {
          ...OG_VARIANTS.cv,
          lang: locale,
          kicker: ui.og.cv.kicker,
          title: profile.identity.name,
          subtitle: profile.identity.role,
          footer: ui.og.cv.footer,
          avatar_url: profile.identity.avatar_url,
          domain: SURFACES.cv.origin.replace("https://", ""),
          title_size: titleSize(profile.identity.name)
        }
      },
      {
        name: `services-${locale}`,
        output: OG_IMAGES.services[locale],
        model: {
          ...OG_VARIANTS.services,
          lang: locale,
          kicker: ui.og.services.kicker,
          title: services.hero.title,
          subtitle: `${profile.identity.name} — ${ui.services.brand_role}`,
          footer: ui.og.services.footer,
          avatar_url: profile.identity.avatar_url,
          domain: SURFACES.services.origin.replace("https://", ""),
          title_size: titleSize(services.hero.title)
        }
      }
    ];
  });
}

// Everything the build writes out of templates, in one place, so `npm run
// check` can re-render and compare instead of keeping its own copy of the list.
export async function renderSiteFiles(rootDir) {
  const content = await loadContent(rootDir);
  const renderer = createRenderer(rootDir);
  const siteIcons = await loadLucideIcons(
    rootDir,
    collectSiteIconNames(localizedProfile(content, "en"))
  );
  const servicesIcons = await loadLucideIcons(
    rootDir,
    collectServicesIconNames(localizedServices(content, "en"))
  );
  const files = new Map();
  let readme = "";

  for (const locale of LOCALES) {
    const cvModel = {
      ...createViewModel(content, locale, "home"),
      ui_icons: siteIcons
    };
    const resumeModel = {
      ...createViewModel(content, locale, "resume"),
      ui_icons: siteIcons
    };
    const servicesModel = {
      ...createServicesViewModel(content, locale),
      ui_icons: servicesIcons
    };

    files.set(PAGES.home.outputs[locale], renderer.render("site.njk", cvModel));
    files.set(PAGES.resume.outputs[locale], renderer.render("resume.njk", resumeModel));
    files.set(
      PAGES.services.outputs[locale],
      renderer.render("services.njk", servicesModel)
    );

    if (locale === "en") {
      readme = renderer.render("readme.njk", cvModel);
    }
  }

  const lastmod = new Date().toISOString().slice(0, 10);

  for (const [surfaceName, names] of Object.entries(SITEMAP_FILES)) {
    files.set(names.sitemap, buildSitemap(surfaceName, lastmod));
    files.set(names.robots, buildRobots(surfaceName));
  }

  assertNoUnresolvedCopy(files);

  return {
    files,
    readme,
    ogPages: ogPageModels(content).map((page) => ({
      ...page,
      html: renderer.render("og.njk", page.model)
    }))
  };
}
