"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userValidation = void 0;
const zod_1 = require("zod");
const createAdmin = zod_1.z.object({
    password: zod_1.z.string({
        required_error: "Password is required"
    }),
    admin: zod_1.z.object({
        name: zod_1.z.string({
            required_error: "Name is required!"
        }),
        email: zod_1.z.string({
            required_error: "Email is required!"
        }),
        contactNumber: zod_1.z.string({
            required_error: "Contact Number is required!"
        })
    })
});
const createGuest = zod_1.z.object({
    password: zod_1.z.string({
        required_error: "Password is required"
    }),
    guest: zod_1.z.object({
        name: zod_1.z.string({
            required_error: "Name is required!"
        }),
        email: zod_1.z.string({
            required_error: "Email is required!"
        }),
        contactNumber: zod_1.z.string({
            required_error: "Contact Number is required!"
        })
    })
});
exports.userValidation = {
    createAdmin,
    createGuest
};
