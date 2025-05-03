"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), '.env') });
exports.default = {
    env: process.env.NODE_ENV,
    port: process.env.PORT || 5000,
    database_url: process.env.DATABASE_URL,
    salt_rounds: process.env.SALT_ROUNDS || 12,
    stripe_secret: process.env.STRIPE_SECRET_KEY,
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expires_in: process.env.JWT_EXPIRES_IN || '1d',
        refresh_secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
        refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },
    cloudinary: {
        cloud_name: 'diepqypex',
        api_key: '992165345858327',
        api_secret: 'cCArBANK5gfIS9u-d36zsQ8TgZI',
    }
};
