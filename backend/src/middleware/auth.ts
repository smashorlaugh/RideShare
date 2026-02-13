import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

const SECRET_KEY = process.env.JWT_SECRET || 'rideshare-secret-key-2025-node-prisma';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ detail: 'Unauthenticated' });
        }

        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, SECRET_KEY) as any;

        const user = await prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) {
            return res.status(401).json({ detail: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ detail: 'Invalid token' });
    }
};
