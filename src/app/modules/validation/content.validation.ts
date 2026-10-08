import { z } from "zod";

const sharedFields = {
  title: z.string().trim().min(1).max(255),
  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must use lowercase letters, numbers, and hyphens",
    ),
  contentHtml: z.string(),
  published: z.boolean().optional().default(false),
};

export const createBlogPostSchema = z.object(sharedFields);

export const updateBlogPostSchema = z
  .object({
    ...sharedFields,
    title: sharedFields.title.optional(),
    slug: sharedFields.slug.optional(),
    contentHtml: sharedFields.contentHtml.optional(),
    published: z.boolean().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field must be provided",
  });

export const createReviewContentSchema = z
  .object({
    ...sharedFields,
    categoryId: z.string().trim().min(1),
    rating: z.number().int().min(1).max(5),
    description: z.string().optional(),
    purchaseSource: z.string().optional(),
    isPremium: z.boolean().optional().default(false),
    premiumPrice: z.number().nonnegative().optional(),
  })
  .refine((input) => !input.isPremium || input.premiumPrice !== undefined, {
    message: "Premium price is required for premium reviews",
    path: ["premiumPrice"],
  });

export const updateReviewContentSchema = z
  .object({
    ...sharedFields,
    title: sharedFields.title.optional(),
    slug: sharedFields.slug.optional(),
    contentHtml: sharedFields.contentHtml.optional(),
    published: z.boolean().optional(),
    categoryId: z.string().trim().min(1).optional(),
    rating: z.number().int().min(1).max(5).optional(),
    description: z.string().optional(),
    purchaseSource: z.string().optional(),
    isPremium: z.boolean().optional(),
    premiumPrice: z.number().nonnegative().nullable().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field must be provided",
  });

export const contentParamsSchema = z.object({
  type: z.enum(["blogPost", "review"]),
  id: z.string().trim().min(1),
});

export const contentSlugParamsSchema = z.object({
  type: z.enum(["blogPost", "review"]),
  slug: z.string().trim().min(1),
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
export type CreateReviewContentInput = z.infer<
  typeof createReviewContentSchema
>;
export type UpdateReviewContentInput = z.infer<
  typeof updateReviewContentSchema
>;
