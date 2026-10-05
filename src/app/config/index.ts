import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

// Fail at boot with a clear message rather than deep inside a request handler.
const requireEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Set it in your .env file.`,
    );
  }

  return value;
};

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT || 5000,
  database_url: requireEnv("DATABASE_URL"),
  salt_rounds: process.env.SALT_ROUNDS || 12,
  stripe_secret: process.env.STRIPE_SECRET_KEY,
  jwt: {
    secret: requireEnv("JWT_SECRET"),
    expires_in: process.env.JWT_EXPIRES_IN || "1d",
    refresh_secret: requireEnv("JWT_REFRESH_SECRET"),
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },
  sp: {
    sp_endpoint: process.env.SP_ENDPOINT,
    sp_username: process.env.SP_USERNAME,
    sp_password: process.env.SP_PASSWORD,
    sp_prefix: process.env.SP_PREFIX,
    sp_return_url: process.env.SP_RETURN_URL,
  },
};
