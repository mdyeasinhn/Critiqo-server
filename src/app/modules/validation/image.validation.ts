import { z } from "zod";

export const imageParamsSchema = z.object({
  type: z.enum(["blogPost", "review"]),
  id: z.string().trim().min(1),
});

export const updateImageParamsSchema = z.object({
  imageId: z.string().trim().min(1),
});

export const updateImageSchema = z
  .object({
    alt: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    fileName: z
      .string()
      .regex(/^[^/\\]+$/, "File name cannot contain path separators")
      .nullable()
      .optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one image field must be provided",
  });

export type UpdateImageInput = z.infer<typeof updateImageSchema>;
