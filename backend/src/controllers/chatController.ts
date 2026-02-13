import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { content, bookingId, requestId } = req.body;

        // Basic verification: user must be part of booking or request
        if (bookingId) {
            const booking = await prisma.booking.findUnique({
                where: { id: bookingId },
                include: { ride: true },
            });
            if (!booking || (booking.passengerId !== req.user.id && booking.ride.driverId !== req.user.id)) {
                return res.status(403).json({ detail: 'Not authorized' });
            }
        }

        const message = await prisma.chatMessage.create({
            data: {
                content,
                senderId: req.user.id,
                bookingId,
                requestId,
            },
        });

        res.json(message);
    } catch (error) {
        res.status(500).json({ detail: 'Error sending message' });
    }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
    const { type, id } = req.params; // type: booking, request

    const where: any = {};
    if (type === 'booking') where.bookingId = id as string;
    else where.requestId = id as string;

    const messages = await prisma.chatMessage.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        include: { sender: true },
    });

    // Mark as read
    await prisma.chatMessage.updateMany({
        where: { ...where, senderId: { not: req.user.id } },
        data: { read: true },
    });

    res.json(messages);
};
