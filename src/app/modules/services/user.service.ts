import { Request } from "express";
import prisma from "../models";
import bcrypt from "bcrypt";
import { IFile } from "../../interface/file";
import { fileUploader } from "../../helpers/fileUploader";
import { Prisma, UserRole, UserStatus } from "@prisma/client";
import { IPagenationOptions } from "../../interface/pagination";
import { pagenationHelpars } from "../../helpers/pagenationHelper";
import { userSearchAbleFields } from "../../constants/user.constant";
import { IAuthUser } from "../../interface/common";

const createAdmin = async (req: Request) => {
  const file = req.file as IFile;
  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    req.body.admin.profilePhoto = uploadToCloudinary?.secure_url;
  }
  const hashPassword: string = await bcrypt.hash(req.body.password, 12);

  const userData = {
    name: req.body.admin.name,
    email: req.body.admin.email,
    password: hashPassword,
    role: UserRole.ADMIN,
  };

  const result = await prisma.$transaction(async (transctionClient: any) => {
    await transctionClient.user.create({
      data: userData,
    });

    const createdAdminData = await transctionClient.admin.create({
      data: req.body.admin,
    });
    return createdAdminData;
  });
  return result;
};

const createGuest = async (req: Request) => {
  const file = req.file as IFile;
  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    req.body.guest.profilePhoto = uploadToCloudinary?.secure_url;
  }
  const hashPassword: string = await bcrypt.hash(req.body.password, 12);

  const userData = {
    name: req.body.guest.name,
    email: req.body.guest.email,
    password: hashPassword,
    role: UserRole.GUEST,
  };

  const result = await prisma.$transaction(async (transctionClient: any) => {
    await transctionClient.user.create({
      data: userData,
    });

    const createdAdminData = await transctionClient.guest.create({
      data: req.body.guest,
    });
    return createdAdminData;
  });
  return result;
};

const getAllUserFromDB = async (params: any, options: IPagenationOptions) => {
  const { page, limit, skip } = pagenationHelpars.calculatePagenation(options);
  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.UserWhereInput[] = [];

  // Only fetch users with status 'ACTIVE'
  andConditions.push({
    status: "ACTIVE",
  });

  // If there's a search term, create OR conditions to search by name or email
  if (params.searchTerm) {
    andConditions.push({
      OR: userSearchAbleFields.map((field) => ({
        [field]: {
          contains: params.searchTerm,
          mode: "insensitive", // Case-insensitive search
        },
      })),
    });
  }
  // If there are filter parameters, create AND conditions for exact matches
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      subscription: true,
      needPasswordChange: true,
      createdAt: true,
      updatedAt: true,
      admin: true,
      guest: true,
    },
  });

  const total = await prisma.user.count({
    where: whereConditions,
  });
  return {
    meta: {
      page,
      limit,
    },
    data: result,
  };
};

//-------------Get My Profile-------------
const getMyProfile = async (user: IAuthUser) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      email: user?.email,
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      subscription: true,
    },
  });
  let profileInfo;

  if (userInfo.role === UserRole.ADMIN) {
    profileInfo = await prisma.admin.findUnique({
      where: {
        email: userInfo.email,
      },
    });
  } else if (userInfo.role === UserRole.GUEST) {
    profileInfo = await prisma.guest.findUnique({
      where: {
        email: userInfo.email,
      },
    });
  }
  return { ...userInfo, ...profileInfo };
};

const updateMyProfile = async (user: IAuthUser, req: Request) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      email: user?.email,
      status: UserStatus.ACTIVE,
    },
  });

  const file = req.file as IFile;
  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    req.body.profilePhoto = uploadToCloudinary?.secure_url;
  }

  let profileInfo;

  if (userInfo.role === UserRole.ADMIN) {
    profileInfo = await prisma.admin.update({
      where: {
        email: userInfo.email,
      },
      data: req.body,
    });
  } else if (userInfo.role === UserRole.GUEST) {
    profileInfo = await prisma.guest.update({
      where: {
        email: userInfo.email,
      },
      data: req.body,
    });
  }
  return { ...userInfo, ...profileInfo };
};

const softDeleteFromDB = async (id: string) => {
  await prisma.user.findUniqueOrThrow({
    where: {
      id,
      isDeleteAt: false,
    },
  });

  const result = await prisma.$transaction(async (transationClient) => {
    const userDeletedData = await transationClient.user.update({
      where: {
        id,
      },
      data: {
        isDeleteAt: true,
      },
    });
    await transationClient.user.update({
      where: {
        email: userDeletedData.email,
      },
      data: {
        status: UserStatus.DELETED,
      },
    });

    return userDeletedData;
  });

  return result;
};

export const UserService = {
  createAdmin,
  createGuest,
  getAllUserFromDB,
  getMyProfile,
  updateMyProfile,
  softDeleteFromDB,
};
