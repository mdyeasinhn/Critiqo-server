import { UserRole } from "@prisma/client";

export type IAuthUser = {
  email: string;
  role: UserRole;
} | null;

export interface IJwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}
