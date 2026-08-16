import { z } from "zod";

const labeledLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().url(),
  short: z.string().min(1)
});

const ctaSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1)
});

const impactSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1)
});

const serviceSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().min(1),
  price: z.string().min(1),
  timeline: z.string().min(1),
  featured: z.boolean(),
  problem: z.string().min(1),
  outcome: z.string().min(1),
  includes: z.array(z.string().min(1)).min(1),
  note: z.string().min(1).optional(),
  footnote: z.string().min(1).optional()
});

const caseStudySchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  kind: z.string().min(1),
  icon: z.string().min(1),
  impact: impactSchema.optional(),
  problem: z.string().min(1),
  action: z.string().min(1),
  result: z.string().min(1),
  stack: z.array(z.string().min(1)).min(1)
});

export const servicesSchema = z.object({
  // Canonical and cross-site URLs live in scripts/lib/routes.mjs now: they are
  // per-language and have to agree with the nginx route table.
  site: z.object({
    cv_label: z.string().min(1)
  }),
  seo: z.object({
    title: z.string().min(1),
    description: z.string().min(1)
  }),
  hero: z.object({
    kicker: z.string().min(1),
    title: z.string().min(1),
    lede: z.string().min(1),
    proof: z.string().min(1),
    primary_cta: ctaSchema,
    email_cta: ctaSchema,
    secondary_cta: ctaSchema,
    retainer_cta: ctaSchema
  }),
  proof_points: z
    .array(
      z.object({
        value: z.string().min(1),
        label: z.string().min(1),
        meta: z.string().min(1),
        icon: z.string().min(1)
      })
    )
    .min(1),
  services: z.array(serviceSchema).min(1),
  retainer: z.object({
    name: z.string().min(1),
    icon: z.string().min(1),
    price: z.string().min(1),
    summary: z.string().min(1),
    includes: z.array(z.string().min(1)).min(1)
  }),
  engagement_principles: z
    .array(
      z.object({
        title: z.string().min(1),
        icon: z.string().min(1),
        description: z.string().min(1)
      })
    )
    .min(1),
  case_studies: z.array(caseStudySchema).min(1),
  evidence: z.object({
    intro: z.string().min(1),
    repos: z
      .array(
        z.object({
          label: z.string().min(1),
          url: z.string().url(),
          icon: z.string().min(1),
          relevance: z.string().min(1),
          stack: z.array(z.string().min(1)).min(1)
        })
      )
      .min(1)
  }),
  process: z
    .array(
      z.object({
        step: z.string().min(1),
        icon: z.string().min(1),
        duration: z.string().min(1),
        description: z.string().min(1)
      })
    )
    .min(1),
  faq: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1)
      })
    )
    .min(1),
  contact: z.object({
    heading: z.string().min(1),
    lede: z.string().min(1),
    links: z.array(labeledLinkSchema).min(1)
  })
});
