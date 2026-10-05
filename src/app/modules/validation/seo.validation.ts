import { z } from "zod";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ]),
);

export const httpUrlSchema = z
  .string()
  .url("Must be a valid URL")
  .refine((value) => /^https?:\/\//i.test(value), "URL must use HTTP or HTTPS");

export const seoContentTypeSchema = z.enum(["page", "blog", "review"]);
export const seoContentTypeInputSchema = z.enum([
  "page",
  "blog",
  "blogPost",
  "review",
]);

export const seoParamsSchema = z.object({
  type: seoContentTypeInputSchema,
  id: z.string().trim().min(1, "Content ID is required"),
});

export const publicSeoParamsSchema = z.object({
  type: seoContentTypeInputSchema,
  slug: z.string().trim().min(1, "Slug is required"),
});

export const seoUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    contentHtml: z.string().optional(),
    published: z.boolean().optional(),
    seoTitle: z.string().trim().min(1).max(60).nullable().optional(),
    metaDescription: z.string().trim().min(1).max(160).nullable().optional(),
    slug: z
      .string()
      .trim()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain lowercase letters, numbers, and hyphens only",
      )
      .optional(),
    focusKeyword: z.string().trim().min(1).nullable().optional(),
    canonicalUrl: httpUrlSchema.nullable().optional(),
    noindex: z.boolean().optional(),
    ogTitle: z.string().trim().min(1).max(60).nullable().optional(),
    ogDescription: z.string().trim().min(1).max(160).nullable().optional(),
    ogImage: httpUrlSchema.nullable().optional(),
    twitterTitle: z.string().trim().min(1).max(60).nullable().optional(),
    twitterDescription: z.string().trim().min(1).max(160).nullable().optional(),
    twitterImage: httpUrlSchema.nullable().optional(),
    schemaMarkup: z
      .array(
        z.object({
          type: z.string().trim().min(1),
          json: z.record(jsonValueSchema),
        }),
      )
      .optional(),
    contentImages: z
      .array(
        z.object({
          url: httpUrlSchema,
          alt: z.string().nullable().optional(),
          title: z.string().nullable().optional(),
          fileName: z.string().nullable().optional(),
        }),
      )
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const seoAnalysisSchema = z.object({
  html: z
    .string()
    .max(100_000, "HTML content cannot exceed 100,000 characters"),
  seoTitle: z.string().max(255, "SEO title cannot exceed 255 characters"),
  metaDescription: z
    .string()
    .max(500, "Meta description cannot exceed 500 characters"),
  slug: z.string().max(255, "Slug cannot exceed 255 characters"),
  focusKeyword: z
    .string()
    .max(200, "Focus keyword cannot exceed 200 characters"),
});

export type SeoContentType = z.infer<typeof seoContentTypeSchema>;
export type SeoContentTypeInput = z.infer<typeof seoContentTypeInputSchema>;
export type SeoUpdateInput = z.infer<typeof seoUpdateSchema>;
export type SeoAnalysisInput = z.infer<typeof seoAnalysisSchema>;

export const normalizeSeoContentType = (
  type: SeoContentTypeInput,
): SeoContentType => (type === "blogPost" ? "blog" : type);
