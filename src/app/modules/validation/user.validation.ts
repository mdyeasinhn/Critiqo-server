import { z } from "zod";

const createAdmin = z.object({
  password: z.string({
    required_error: "Password is required",
  }),
  admin: z.object({
    name: z.string({
      required_error: "Name is required!",
    }),
    email: z.string({
      required_error: "Email is required!",
    }),
    contactNumber: z.string({
      required_error: "Contact Number is required!",
    }),
    profilePhoto: z.string().url().optional(), 
  }),
});

//   password: z.string({
//     required_error: "Password is required",
//   }),
//   guest: z.object({
//     name: z.string({
//       required_error: "Name is required!",
//     }),
//     email: z.string({
//       required_error: "Email is required!",
//     }),
//     contactNumber: z.string({
//       required_error: "Contact Number is required!",
//     }),
//     profilePhoto: z.string().url().optional(),
//   }),
// });
const createGuest = z.object({
  password: z.string({
    required_error: "Password is required",
  }),
  guest: z.object({
    name: z.string({
      required_error: "Name is required!",
    }),
    email: z.string({
      required_error: "Email is required!",
    }),
    contactNumber: z.string({
      required_error: "Contact Number is required!",
    }),
    profilePhoto: z.string().url().optional(),
  }),
});
export const userValidation = {
  createAdmin,
  createGuest,
};
