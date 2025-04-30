import prisma from "../models";
import { IFile, IPaginationOptions } from "../../interface/file";
import { ReviewStatus, UserRole, UserStatus } from "@prisma/client";
import ApiError from "../../shared/ApiError";
import { StatusCodes } from "http-status-codes";
import { fileUploader } from "../../helpers/fileUploader";

const getDashboardStats = async () => {
    // Get total users count by role
    const userCounts = await prisma.user.groupBy({
        by: ['role'],
        _count: {
            id: true
        }
    });

    // Get total reviews count by status
    const reviewCounts = await prisma.review.groupBy({
        by: ['status'],
        _count: {
            id: true
        }
    });

    // Get total categories count
    const categoryCount = await prisma.category.count();

    // Get total premium reviews
    const premiumReviewCount = await prisma.review.count({
        where: {
            isPremium: true
        }
    });

    // Get total completed payments
    const totalPayments = await prisma.payment.aggregate({
        _sum: {
            amount: true
        },
        where: {
            status: 'COMPLETEED' // Note: Typo in your enum
        }
    });

    // Get recent reviews (last 5)
    const recentReviews = await prisma.review.findMany({
        take: 5,
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            user: {
                select: {
                    name: true
                }
            },
            category: true
        }
    });

    // Format user counts
    const formattedUserCounts = {
        admin: 0,
        user: 0,
        guest: 0
    };

    userCounts.forEach(count => {
        const role = count.role.toLowerCase();
        if (role === 'admin') formattedUserCounts.admin = count._count.id;
        if (role === 'user') formattedUserCounts.user = count._count.id;
        if (role === 'guest') formattedUserCounts.guest = count._count.id;
    });

    // Format review counts
    const formattedReviewCounts = {
        draft: 0,
        published: 0,
        unpublished: 0
    };

    reviewCounts.forEach(count => {
        const status = count.status.toLowerCase();
        if (status === 'draft') formattedReviewCounts.draft = count._count.id;
        if (status === 'published') formattedReviewCounts.published = count._count.id;
        if (status === 'unpublished') formattedReviewCounts.unpublished = count._count.id;
    });

    return {
        users: formattedUserCounts,
        reviews: formattedReviewCounts,
        categories: categoryCount,
        premiumReviews: premiumReviewCount,
        revenue: totalPayments._sum.amount || 0,
        recentReviews: recentReviews.map(review => ({
            id: review.id,
            title: review.title,
            author: review.user.name,
            category: review.category.name,
            status: review.status,
            createdAt: review.createdAt
        }))
    };
};

const getPendingReviews = async (paginationOptions: IPaginationOptions) => {
    const { page = 1, limit = 10 } = paginationOptions;

    const skip = (page - 1) * limit;
    const take = limit;

    // Get reviews with DRAFT status
    const reviews = await prisma.review.findMany({
        where: {
            status: ReviewStatus.DRAFT
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            category: true
        },
        orderBy: {
            createdAt: 'desc'
        },
        skip,
        take
    });

    const total = await prisma.review.count({
        where: {
            status: ReviewStatus.DRAFT
        }
    });

    return {
        meta: {
            page,
            limit,
            total
        },
        data: reviews
    };
};

const getAdminProfile = async (userId: string) => {
    // Get user
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE
        },
        include: {
            admin: true
        }
    });

    if (!user || !user.admin) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Admin profile not found');
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.admin.profilePhoto,
        contactNumber: user.admin.contactNumber,
        createdAt: user.createdAt
    };
};

const updateAdminProfile = async (
    userId: string,
    updateData: {
        name?: string;
        contactNumber?: string;
    },
    file?: Express.Multer.File
) => {
    // Get user
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE
        },
        include: {
            admin: true
        }
    });

    if (!user || !user.admin) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Admin profile not found');
    }

    let profilePhotoUrl: string | undefined;

    // Upload profile photo if provided
    if (file) {
        const uploadToCloudinary = await fileUploader.uploadToCloudinary(file as unknown as IFile);
        profilePhotoUrl = uploadToCloudinary?.secure_url;
    }

    // Update admin profile
    const updatedAdmin = await prisma.$transaction(async (transactionClient) => {
        // Update user name if provided
        if (updateData.name) {
            await transactionClient.user.update({
                where: {
                    id: userId
                },
                data: {
                    name: updateData.name
                }
            });
        }

        // Update admin profile
        const adminUpdateData: any = {};
        
        if (updateData.name) {
            adminUpdateData.name = updateData.name;
        }
        
        if (updateData.contactNumber) {
            adminUpdateData.contactNumber = updateData.contactNumber;
        }
        
        if (profilePhotoUrl) {
            adminUpdateData.profilePhoto = profilePhotoUrl;
        }

        const updatedAdminProfile = await transactionClient.admin.update({
            where: {
                email: user.email
            },
            data: adminUpdateData
        });

        return updatedAdminProfile;
    });

    return {
        id: user.id,
        name: updateData.name || user.name,
        email: user.email,
        role: user.role,
        profilePhoto: profilePhotoUrl || user.admin.profilePhoto,
        contactNumber: updateData.contactNumber || user.admin.contactNumber,
        createdAt: user.createdAt
    };
};

export const AdminService = {
    getDashboardStats,
    getPendingReviews,
    getAdminProfile,
    updateAdminProfile
};