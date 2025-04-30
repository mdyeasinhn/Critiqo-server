import { z } from "zod";

const updateProfile = z.object({
    name: z.string().optional(),
    contactNumber: z.string().optional()
});

export const adminValidation = {
    updateProfile
};