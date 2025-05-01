import { UserStatus } from "@prisma/client";
import prisma from "../models";
import bcrypt from 'bcrypt';
import { jwtHelpars } from "../../helpers/jwtHelpers";
import config from "../../config";
import { Secret } from "jsonwebtoken";


const loginUser = async (payload: {
    email: string,
    password: string
}) => {
    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: payload.email,
            status: UserStatus.ACTIVE
        }
    });

    const isCorrectPassword: boolean = await bcrypt.compare(payload.password, userData.password);

    if (!isCorrectPassword) {
        throw new Error("Password incorrect!")
    };

    const accessToken = jwtHelpars.generateToken({
        email: userData.email,
        role: userData.role
    },
        config.jwt.secret as Secret,
        config.jwt.expires_in as string
    );

    const refreshToken = jwtHelpars.generateToken({
        email: userData.email,
        role: userData.role
    },
        config.jwt.refresh_secret as Secret,
        config.jwt.refresh_expires_in as string
    );

    return {
        accessToken,
        refreshToken,
        needPasswordChange: userData.needPasswordChange
    }

}


const refresToken = async (token: string) => {
    let decodedData;
    try {
        decodedData = jwtHelpars.verifyToken(token, config.jwt.refresh_secret as Secret);

        console.log(decodedData)
    } catch (error) {
        throw new Error("You are not authorizeed!")
    }

    const isUserExist = await prisma.user.findUniqueOrThrow({
        where: {
            email: decodedData?.email
        }
    });


    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: decodedData?.email,
            status: UserStatus.ACTIVE
        }
    })
    const accessToken = jwtHelpars.generateToken({
        email: userData.email,
        role: userData.role
    },
        config.jwt.refresh_secret as Secret,
        config.jwt.expires_in as string
    )
    return {
        accessToken,
        needPasswordChange: userData.needPasswordChange
    }
};

export const AuthService = {
    loginUser,
    refresToken
} 