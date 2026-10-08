import { z } from "zod";
import { jsonLdTypes } from "../../../lib/seo-analysis/jsonLd";

export const schemaContentParamsSchema = z.object({
  type: z.enum(["page", "blogPost", "review"]),
  id: z.string().trim().min(1),
});

export const schemaTypeQuerySchema = z.object({
  schemaType: z.enum(jsonLdTypes),
});

export const updateSchemaBodySchema = z.object({
  schemaType: z.enum(jsonLdTypes),
  json: z.unknown(),
});

export type SchemaContentType = z.infer<
  typeof schemaContentParamsSchema
>["type"];
