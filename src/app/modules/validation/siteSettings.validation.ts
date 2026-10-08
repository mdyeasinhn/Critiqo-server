import { z } from "zod";
import { httpUrlSchema } from "./seo.validation";

export const siteSettingsUpdateSchema = z
  .object({
    siteName: z.string().trim().min(1).max(100).optional(),
    baseUrl: httpUrlSchema.optional(),
    defaultTitle: z.string().trim().min(1).max(60).optional(),
    defaultDescription: z.string().trim().min(1).max(160).optional(),
    defaultOgImage: httpUrlSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one setting must be provided",
  });

export type SiteSettingsUpdateInput = z.infer<typeof siteSettingsUpdateSchema>;
