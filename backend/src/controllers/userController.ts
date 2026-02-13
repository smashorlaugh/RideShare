import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export const getProfile = async (req: AuthRequest, res: Response) => {
    res.json(req.user);
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { name, photo, carModel, carNumber } = req.body;
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { name, photo, carModel, carNumber },
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ detail: 'Error updating profile' });
    }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
    try {
        // Delete related data first or rely on cascade if configured (Prisma doesn't auto cascade delete unless specified)
        // Here we'll just delete the user, and if foreign keys are set to restrict, it will fail.
        // For simplicity, we'll assume the client handles or we add cleanup logic.
        await prisma.user.delete({ where: { id: req.user.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ detail: 'Error deleting account' });
    }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.params.id as string } });
        if (!user) return res.status(404).json({ detail: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ detail: 'Error fetching user' });
    }
};
