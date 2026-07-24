import jwt from 'jsonwebtoken';

export const generateToken = (payload: any, expiresIn: string | number = '1d'): string => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn } as jwt.SignOptions);
};

export const verifyTokenPayload = (token: string): any | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string);
  } catch (error) {
    return null;
  }
};
