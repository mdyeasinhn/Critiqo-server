import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL,
  salt_rounds: process.env.SALT_ROUNDS || 12,
  stripe_secret: process.env.STRIPE_SECRET_KEY,
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    expires_in: process.env.JWT_EXPIRES_IN || "1d",
    refresh_secret: process.env.JWT_REFRESH_SECRET || "your-refresh-secret",
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },
  cloudinary: {
    cloud_name: "diepqypex",
    api_key: "992165345858327",
    api_secret: "cCArBANK5gfIS9u-d36zsQ8TgZI",
  },
  sp: {
    sp_endpoint: process.env.SP_ENDPOINT,
    sp_username: process.env.SP_USERNAME,
    sp_password: process.env.SP_PASSWORD,
    sp_prefix: process.env.SP_PREFIX,
    sp_return_url: process.env.SP_RETURN_URL,
  },
};
