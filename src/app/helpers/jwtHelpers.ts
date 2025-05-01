import jwt, { JwtPayload, Secret } from 'jsonwebtoken';

const generateToken = (payload: any, secret: Secret, expiresIn: string) => {
    // Make sure payload includes userId if available
    if (payload.id && !payload.userId) {
        payload.userId = payload.id;
    }

    // Create token with payload
    const token = jwt.sign(
        payload,
        secret,
        {
            algorithm: 'HS256',
            expiresIn
        }
    );
    
    return token;
};

const verifyToken = (token: string, secret: Secret) => {
    try {
        // Verify and decode token
        const decoded = jwt.verify(token, secret) as JwtPayload;
        
        // Log decoded token for debugging
        console.log('Decoded token:', decoded);
        
        // Make sure userId is present
        if (decoded.id && !decoded.userId) {
            decoded.userId = decoded.id;
        }
        
        return decoded;
    } catch (error) {
        // Log error and re-throw
        console.error('Token verification error:', error);
        throw error;
    }
};

export const jwtHelpars = {
    generateToken,
    verifyToken
};