"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtHelpars = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (payload, secret, expiresIn) => {
    // Make sure payload includes userId if available
    if (payload.id && !payload.userId) {
        payload.userId = payload.id;
    }
    // Create token with payload
    const token = jsonwebtoken_1.default.sign(payload, secret, {
        algorithm: 'HS256',
        expiresIn
    });
    return token;
};
const verifyToken = (token, secret) => {
    try {
        // Verify and decode token
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // Log decoded token for debugging
        console.log('Decoded token:', decoded);
        // Make sure userId is present
        if (decoded.id && !decoded.userId) {
            decoded.userId = decoded.id;
        }
        return decoded;
    }
    catch (error) {
        // Log error and re-throw
        console.error('Token verification error:', error);
        throw error;
    }
};
exports.jwtHelpars = {
    generateToken,
    verifyToken
};
