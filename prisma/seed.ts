import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seedSiteSettings = async (): Promise<void> => {
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      siteName: process.env.SITE_NAME ?? "Critiqo",
      baseUrl: process.env.SITE_URL ?? "http://localhost:3000",
      defaultTitle: process.env.SEO_DEFAULT_TITLE ?? "Critiqo",
      defaultDescription:
        process.env.SEO_DEFAULT_DESCRIPTION ??
        "Discover and share trusted product reviews.",
      defaultOgImage: process.env.SEO_DEFAULT_OG_IMAGE ?? null,
    },
    update: {},
  });
};

seedSiteSettings()
  .catch((error: unknown) => {
    console.error("Failed to seed site settings:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
