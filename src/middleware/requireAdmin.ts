import { UserRole } from "@prisma/client";
import auth from "./auth";

const requireAdmin = auth(UserRole.ADMIN);

export default requireAdmin;
