import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import yaml from "js-yaml";

import { profileSchema } from "./profile-schema.mjs";
import { servicesSchema } from "./services-schema.mjs";

const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
  timeZone: "UTC"
});

function monthToLabel(value) {
  if (value === "Present") {
    return value;
  }

  const [year, month] = value.split("-");

  return monthFormatter.format(new Date(`${year}-${month}-01T00:00:00Z`));
}

function formatRange(start, end) {
  return `${monthToLabel(start)} - ${monthToLabel(end)}`;
}

function enrichExperience(experience) {
  return experience.map((item) => ({
    ...item,
    range: formatRange(item.start, item.end)
  }));
}

function enrichEducation(education) {
  return education.map((item) => ({
    ...item,
    range: formatRange(item.start, item.end)
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

export async function loadProfile(rootDir) {
  const sourcePath = resolve(rootDir, "content/profile.yml");
  const raw = await readFile(sourcePath, "utf8");
  const parsed = yaml.load(raw);

  return profileSchema.parse(trimStringsDeep(parsed));
}

export async function loadServices(rootDir) {
  const sourcePath = resolve(rootDir, "content/services.yml");
  const raw = await readFile(sourcePath, "utf8");
  const parsed = yaml.load(raw);

  return servicesSchema.parse(trimStringsDeep(parsed));
}

export function createServicesViewModel(services, profile) {
  return {
    ...services,
    identity: profile.identity,
    featured_service: services.services.find((service) => service.featured),
    page_title: services.seo.title,
    page_description: services.seo.description,
    year: new Date().getUTCFullYear()
  };
}

export function createViewModel(profile) {
  const experience = enrichExperience(profile.experience);
  const education = enrichEducation(profile.education);
  const featuredCaseStudies = profile.case_studies.filter(
    (caseStudy) => caseStudy.readme_featured
  );
  const caseStudyMap = Object.fromEntries(
    profile.case_studies.map((caseStudy) => [caseStudy.key, caseStudy])
  );

  return {
    ...profile,
    experience,
    education,
    case_study_map: caseStudyMap,
    featured_case_studies: featuredCaseStudies,
    site_case_studies: profile.case_studies,
    page_title: profile.seo.title,
    page_description: profile.seo.description,
    year: new Date().getUTCFullYear()
  };
}
