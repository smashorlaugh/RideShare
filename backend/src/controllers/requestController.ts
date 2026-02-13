import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export const createRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { fromLocation, fromLat, fromLng, toLocation, toLat, toLng, preferredDate, preferredTime, seatsNeeded, message } = req.body;

        const request = await prisma.privateRequest.create({
            data: {
                passengerId: req.user.id,
                fromLocation, fromLat, fromLng,
                toLocation, toLat, toLng,
                preferredDate: new Date(preferredDate),
                preferredTime,
                seatsNeeded,
                message,
            },
        });

        res.json(request);
    } catch (error) {
        res.status(500).json({ detail: 'Error creating request' });
    }
};

export const getMyRequests = async (req: AuthRequest, res: Response) => {
    const requests = await prisma.privateRequest.findMany({
        where: { passengerId: req.user.id },
        orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
};

export const getNearbyRequests = async (req: AuthRequest, res: Response) => {
    const requests = await prisma.privateRequest.findMany({
        where: { status: 'active' },
        include: { passenger: true },
        orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
};

export const respondToRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        // In a real app, this would create a Chat or a special "Offer" entity.
        // Here we'll just update status to responded and assume chat handles the rest.
        const request = await prisma.privateRequest.update({
            where: { id: id as string },
            data: { status: 'responded' },
        });

        res.json({ success: true, request });
    } catch (error) {
        res.status(500).json({ detail: 'Error responding to request' });
    }
};
