import { Request } from "express";

const createAdmin = async(req: Request) =>{
    console.log("crate user");
}

const createGuest= async() =>{
    console.log("crate guest");
}


export const UserService={
    createAdmin,
    createGuest
}