import { RESUME_PDFS, SURFACES } from "./routes.mjs";

const LOCALE_NAMES = {
  en: { en: "English", ru: "Английский" },
  ru: { en: "Russian", ru: "Русский" }
};

function absolute(origin, path) {
  return path.startsWith("http") ? path : `${origin}${path}`;
}

function sameAs(identity) {
  return [
    identity.github,
    identity.telegram,
    identity.linkedin,
    identity.vk,
    identity.services_website
  ].filter(Boolean);
}

function personNode(profile, { locale, origin, url, otherName }) {
  const identity = profile.identity;
  const currentJob = profile.experience.find((job) => job.end === "Present");

  return {
    "@type": "Person",
    name: identity.name,
    alternateName: otherName,
    jobTitle: identity.role,
    description: identity.summary,
    url,
    image: absolute(origin, identity.avatar_url),
    email: `mailto:${identity.email}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: identity.location.split(",")[0].trim(),
      addressCountry: "RU"
    },
    ...(currentJob
      ? { worksFor: { "@type": "Organization", name: currentJob.company } }
      : {}),
    alumniOf: profile.education.map((entry) => ({
      "@type": "EducationalOrganization",
      name: entry.school
    })),
    knowsLanguage: profile.languages.map((language) => ({
      "@type": "Language",
      name: language.name
    })),
    knowsAbout: profile.stack_groups
      .flatMap((group) => group.items)
      .map((item) => (typeof item === "string" ? item : item.name)),
    sameAs: sameAs(identity)
  };
}

export function cvStructuredData(profile, { locale, url, otherName }) {
  const origin = SURFACES.cv.origin;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${url}#page`,
        url,
        inLanguage: locale,
        mainEntity: { "@id": `${origin}/#person` },
        primaryImageOfPage: absolute(origin, profile.identity.avatar_url)
      },
      {
        "@id": `${origin}/#person`,
        ...personNode(profile, { locale, origin, url, otherName }),
        hasOccupation: {
          "@type": "Occupation",
          name: profile.identity.role,
          occupationalCategory: "15-1252.00"
        },
        // The PDF is the machine-readable copy of the same person, so it is
        // worth pointing at explicitly rather than leaving it as one more link.
        subjectOf: {
          "@type": "DigitalDocument",
          name: profile.seo.resume.title,
          url: absolute(origin, RESUME_PDFS[locale]),
          encodingFormat: "application/pdf",
          inLanguage: locale
        }
      }
    ]
  };
}

function priceValue(price) {
  const digits = price.replace(/[^\d]/g, "");

  return digits.length > 0 ? Number(digits) : null;
}

export function servicesStructuredData(services, profile, { locale, url }) {
  const origin = SURFACES.services.origin;
  const offers = [...services.services, services.retainer]
    .map((offer) => {
      const minPrice = priceValue(offer.price);
      const name = offer.name;

      return {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name,
          description: offer.outcome ?? offer.summary,
          serviceType: name,
          provider: { "@id": `${origin}/#person` }
        },
        ...(minPrice === null
          ? {}
          : {
              priceSpecification: {
                "@type": "PriceSpecification",
                minPrice,
                priceCurrency: "USD"
              }
            })
      };
    });

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${origin}/#business`,
        name: `${profile.identity.name} — ${services.seo.title}`,
        description: services.seo.description,
        url,
        inLanguage: locale,
        image: `${origin}/og/services-${locale}.png`,
        areaServed: { "@type": "Place", name: "Worldwide" },
        availableLanguage: [
          { "@type": "Language", name: LOCALE_NAMES.en[locale] },
          { "@type": "Language", name: LOCALE_NAMES.ru[locale] }
        ],
        priceRange: "$$",
        provider: { "@id": `${origin}/#person` },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: services.seo.title,
          itemListElement: offers
        }
      },
      {
        "@id": `${origin}/#person`,
        ...personNode(profile, {
          locale,
          origin,
          url: SURFACES.cv.origin + "/",
          otherName: undefined
        })
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        inLanguage: locale,
        mainEntity: services.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer
          }
        }))
      }
    ]
  };
}
