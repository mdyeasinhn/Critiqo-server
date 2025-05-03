"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const models_1 = __importDefault(require("../models"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const fileUploader_1 = require("../../helpers/fileUploader");
const client_1 = require("@prisma/client");
const pagenationHelper_1 = require("../../helpers/pagenationHelper");
const user_constant_1 = require("../../constants/user.constant");
const createAdmin = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const file = req.file;
    if (file) {
        const uploadToCloudinary = yield fileUploader_1.fileUploader.uploadToCloudinary(file);
        req.body.admin.profilePhoto = uploadToCloudinary === null || uploadToCloudinary === void 0 ? void 0 : uploadToCloudinary.secure_url;
    }
    const hashPassword = yield bcrypt_1.default.hash(req.body.password, 12);
    const userData = {
        name: req.body.admin.name,
        email: req.body.admin.email,
        password: hashPassword,
        role: client_1.UserRole.ADMIN,
    };
    const result = yield models_1.default.$transaction((transctionClient) => __awaiter(void 0, void 0, void 0, function* () {
        yield transctionClient.user.create({
            data: userData,
        });
        const createdAdminData = yield transctionClient.admin.create({
            data: req.body.admin
        });
        return createdAdminData;
    }));
    return result;
});
const createGuest = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const file = req.file;
    if (file) {
        const uploadToCloudinary = yield fileUploader_1.fileUploader.uploadToCloudinary(file);
        req.body.guest.profilePhoto = uploadToCloudinary === null || uploadToCloudinary === void 0 ? void 0 : uploadToCloudinary.secure_url;
    }
    const hashPassword = yield bcrypt_1.default.hash(req.body.password, 12);
    const userData = {
        name: req.body.guest.name,
        email: req.body.guest.email,
        password: hashPassword,
        role: client_1.UserRole.GUEST,
    };
    const result = yield models_1.default.$transaction((transctionClient) => __awaiter(void 0, void 0, void 0, function* () {
        yield transctionClient.user.create({
            data: userData,
        });
        const createdAdminData = yield transctionClient.guest.create({
            data: req.body.guest
        });
        return createdAdminData;
    }));
    return result;
});
const getAllUserFromDB = (params, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip } = pagenationHelper_1.pagenationHelpars.calculatePagenation(options);
    const { searchTerm } = params, filterData = __rest(params, ["searchTerm"]);
    const andConditions = [];
    // If there's a search term, create OR conditions to search by name or email
    if (params.searchTerm) {
        andConditions.push({
            OR: user_constant_1.userSearchAbleFields.map(field => ({
                [field]: {
                    contains: params.searchTerm,
                    mode: "insensitive" // Case-insensitive search
                }
            }))
        });
    }
    ;
    // If there are filter parameters, create AND conditions for exact matches
    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals: filterData[key]
                }
            }))
        });
    }
    ;
    const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};
    const result = yield models_1.default.user.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder ? {
            [options.sortBy]: options.sortOrder
        } : {
            createdAt: 'desc'
        },
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
            needPasswordChange: true,
            createdAt: true,
            updatedAt: true,
            admin: true,
            guest: true
        }
    });
    const total = yield models_1.default.user.count({
        where: whereConditions
    });
    return {
        meta: {
            page,
            limit,
        },
        data: result
    };
});
//-------------Get My Profile-------------
const getMyProfile = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const userInfo = yield models_1.default.user.findUniqueOrThrow({
        where: {
            email: user === null || user === void 0 ? void 0 : user.email,
            status: client_1.UserStatus.ACTIVE
        },
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
        }
    });
    let profileInfo;
    if (userInfo.role === client_1.UserRole.ADMIN) {
        profileInfo = yield models_1.default.admin.findUnique({
            where: {
                email: userInfo.email
            }
        });
    }
    else if (userInfo.role === client_1.UserRole.GUEST) {
        profileInfo = yield models_1.default.guest.findUnique({
            where: {
                email: userInfo.email
            }
        });
    }
    return Object.assign(Object.assign({}, userInfo), profileInfo);
});
const updateMyProfile = (user, req) => __awaiter(void 0, void 0, void 0, function* () {
    const userInfo = yield models_1.default.user.findUniqueOrThrow({
        where: {
            email: user === null || user === void 0 ? void 0 : user.email,
            status: client_1.UserStatus.ACTIVE
        }
    });
    const file = req.file;
    if (file) {
        const uploadToCloudinary = yield fileUploader_1.fileUploader.uploadToCloudinary(file);
        req.body.profilePhoto = uploadToCloudinary === null || uploadToCloudinary === void 0 ? void 0 : uploadToCloudinary.secure_url;
    }
    let profileInfo;
    if (userInfo.role === client_1.UserRole.ADMIN) {
        profileInfo = yield models_1.default.admin.update({
            where: {
                email: userInfo.email
            },
            data: req.body
        });
    }
    else if (userInfo.role === client_1.UserRole.GUEST) {
        profileInfo = yield models_1.default.guest.update({
            where: {
                email: userInfo.email
            },
            data: req.body
        });
    }
    return Object.assign(Object.assign({}, userInfo), profileInfo);
});
exports.UserService = {
    createAdmin,
    createGuest,
    getAllUserFromDB,
    getMyProfile,
    updateMyProfile
};
