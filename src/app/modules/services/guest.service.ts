import { Guest, Prisma } from "@prisma/client";
import { pagenationHelpars } from "../../helpers/pagenationHelper";
import { IGuestFilterRequest } from "../../interface/guest";
import { IPagenationOptions } from "../../interface/pagination";
import { guestSearchableFields } from "../../constants/doctor.constant";
import prisma from "../models";

const getAllFromDB = async (
  filters: IGuestFilterRequest,
  options: IPagenationOptions,
) => {
  const { limit, page, skip } = pagenationHelpars.calculatePagenation(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.GuestWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: guestSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    const filterConditions = Object.keys(filterData).map((key) => ({
      [key]: {
        equals: (filterData as any)[key],
      },
    }));
    andConditions.push(...filterConditions);
  }

  andConditions.push({
    isDeleteAt: false,
  });

  const whereConditions: Prisma.GuestWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.guest.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
  });

  const total = await prisma.guest.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

const getByIdFromDB = async (id: string): Promise<Guest | null> => {
  const result = await prisma.guest.findUniqueOrThrow({
    where: {
      id,
      isDeleteAt: false,
    },
  });
  return result;
};

export const GuestService = {
  getAllFromDB,
  getByIdFromDB,
};
