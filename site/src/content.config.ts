import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const baseFields = {
  title: z.string(),
  slug: z.string().optional(),
  date: z.coerce.date(),
  modified: z.coerce.date().optional(),
  status: z.enum(["publish", "draft", "pending", "private"]).default("publish"),
  excerpt: z.string().optional(),
  // Legacy WP IDs/URLs let us preserve canonical URLs and rewrite internal links.
  legacyId: z.number().int().optional(),
  legacyUrl: z.string().optional(),
  featuredImage: z.string().optional(),
};

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: z.object({
    ...baseFields,
    template: z.string().optional(),
    menuOrder: z.number().int().default(0),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z.object({
    ...baseFields,
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { pages, posts };
