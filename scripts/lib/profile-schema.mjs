import { z } from "zod";

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/);
const dateOrPresentSchema = z.union([monthSchema, z.literal("Present")]);

const labeledLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().url(),
  short: z.string().min(1)
});

const experienceSchema = z.object({
  company: z.string().min(1),
  logo: z.string().optional(),
  role: z.string().min(1),
  start: monthSchema,
  end: dateOrPresentSchema,
  location: z.string().min(1),
  summary: z.string().min(1),
  highlights: z.array(z.string().min(1)).min(1),
  resume_highlights: z.array(z.string().min(1)).min(1)
});

const caseStudySchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  readme_featured: z.boolean(),
  kind: z.string().min(1),
  summary: z.string().min(1),
  role: z.string().min(1),
  icon: z.string().min(1),
  impact: z
    .object({
      value: z.string().min(1),
      label: z.string().min(1),
      as_of: z.string().min(1).optional()
    })
    .optional(),
  stack: z.array(z.string().min(1)).min(1),
  highlights: z.array(z.string().min(1)).min(1),
  resume_highlight: z.string().min(1)
});

const repoVisualSchema = z.object({
  kind: z.enum(["illustration", "screenshot"]),
  src: z.string().min(1),
  alt: z.string().min(1)
});

const repoSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  url: z.string().url(),
  icon: z.string().min(1),
  stack: z.array(z.string().min(1)).min(1),
  summary: z.string().min(1),
  visual: repoVisualSchema.optional()
});

const educationSchema = z.object({
  school: z.string().min(1),
  degree: z.string().min(1),
  start: monthSchema,
  end: dateOrPresentSchema,
  logo: z.string().optional()
});

const achievementSchema = z.object({
  title: z.string().min(1),
  year: z.string().min(1),
  description: z.string().min(1)
});

const languageSchema = z.object({
  name: z.string().min(1),
  level: z.string().min(1)
});

const seoEntrySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1)
});

export const profileSchema = z.object({
  identity: z.object({
    name: z.string().min(1),
    handle: z.string().min(1),
    role: z.string().min(1),
    hero_title: z.string().min(1),
    headline: z.string().min(1),
    summary: z.string().min(1),
    location: z.string().min(1),
    timezone: z.string().min(1),
    availability: z.string().min(1),
    current_focus: z.string().min(1),
    hero_tagline: z.string().min(1),
    website: z.string().url(),
    services_website: z.string().url(),
    email: z.string().email(),
    github: z.string().url(),
    avatar_url: z.string().min(1),
    header_avatar_url: z.string().url(),
    telegram: z.string().url(),
    vk: z.string().url(),
    linkedin: z.string().url(),
    github_stats: z.object({
      stats_url: z.string().url(),
      langs_url: z.string().url()
    })
  }),
  seo: z.object({
    home: seoEntrySchema,
    resume: seoEntrySchema
  }),
  cta: z.object({
    primary: z.array(labeledLinkSchema).min(1),
    footer: z.array(labeledLinkSchema).min(1)
  }),
  value_props: z
    .array(
      z.object({
        title: z.string().min(1),
        icon: z.string().min(1),
        description: z.string().min(1)
      })
    )
    .length(3),
  experience: z.array(experienceSchema).min(1),
  case_studies: z.array(caseStudySchema).min(3),
  selected_public_repos: z.array(repoSchema).length(4),
  supporting_repo: z.object({
    label: z.string().min(1),
    url: z.string().url(),
    summary: z.string().min(1)
  }),
  stack_groups: z.array(
    z.object({
      label: z.string().min(1),
      items: z.array(
        z.union([
          z.string().min(1),
          z.object({
            name: z.string().min(1),
            icon: z.string().nullable()
          })
        ])
      ).min(1)
    })
  ),
  education: z.array(educationSchema).min(1),
  languages: z.array(languageSchema).min(1),
  achievements: z.array(achievementSchema).min(1),
  resume: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    summary: z.string().min(1),
    strengths: z.array(z.string().min(1)).min(1)
  })
});
