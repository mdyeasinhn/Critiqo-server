import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { IJwtPayload } from "../interface/common";

const generateToken = (
  payload: IJwtPayload,
  secret: Secret,
  expiresIn: string | number,
): string => {
  const options = {
    expiresIn: expiresIn as any,
  };

  return jwt.sign(payload, secret, options);
};

const verifyToken = (
  token: string,
  secret: Secret,
): JwtPayload & IJwtPayload => {
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload & IJwtPayload;

    console.log("Decoded token:", decoded);

    return decoded;
  } catch (error) {
    console.error("Token verification error:", error);
    throw error;
  }
};

export const jwtHelpars = {
  generateToken,
  verifyToken,
};
