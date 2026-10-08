import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiError";
import prisma from "../models";
import { SiteSettingsUpdateInput } from "../validation/siteSettings.validation";

export const getSiteSettings = async () => {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Site settings have not been initialized",
    );
  }

  return settings;
};

export const updateSiteSettings = async (input: SiteSettingsUpdateInput) => {
  const settings = await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      siteName: input.siteName ?? "Critiqo",
      baseUrl: input.baseUrl ?? "http://localhost:3000",
      defaultTitle: input.defaultTitle ?? "Critiqo",
      defaultDescription:
        input.defaultDescription ??
        "Discover and share trusted product reviews.",
      defaultOgImage: input.defaultOgImage ?? null,
    },
    update: input,
  });

  return settings;
};
