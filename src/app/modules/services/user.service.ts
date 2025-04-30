import { Request } from "express";
import prisma from "../models";
import bcrypt from 'bcrypt';
import { IFile } from "../../interface/file";
import { fileUploader } from "../../helpers/fileUploader";
import { UserRole } from "@prisma/client";

const createAdmin = async (req: Request) => {
    const file = req.file as IFile;
    if (file) {
        const uploadToCloudinary = await fileUploader.uploadToCloudinary(file)
        req.body.admin.profilePhoto = uploadToCloudinary?.secure_url

    }
    const hashPassword: string = await bcrypt.hash(req.body.password, 12);


    const userData = {
        email: req.body.admin.email,
        password: hashPassword,
        role: UserRole.ADMIN,
    }

    const result = await prisma.$transaction(async (transctionClient) => {
        await transctionClient.user.create({
            data: userData,
        });

        const createdAdminData = await transctionClient.admin.create({
            data: req.body.admin
        });
        return createdAdminData

    })
    return result
}

const createGuest = async () => {
    console.log("crate guest");
}


export const UserService = {
    createAdmin,
    createGuest
}