import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export const createRide = async (req: AuthRequest, res: Response) => {
    try {
        const {
            pickupLocation, pickupLat, pickupLng,
            dropLocation, dropLat, dropLng,
            date, time, availableSeats, pricePerSeat,
            carModel, carNumber, notes
        } = req.body;

        const ride = await prisma.ride.create({
            data: {
                driverId: req.user.id,
                pickupLocation, pickupLat, pickupLng,
                dropLocation, dropLat, dropLng,
                date: new Date(date),
                time,
                availableSeats,
                pricePerSeat,
                carModel,
                carNumber,
                notes,
            },
        });

        res.json(ride);
    } catch (error) {
        console.error('Create Ride Error:', error);
        res.status(500).json({ detail: 'Error creating ride' });
    }
};

export const getRides = async (req: AuthRequest, res: Response) => {
    const { status } = req.query;
    const rides = await prisma.ride.findMany({
        where: status ? { status: status as string } : {},
        include: { driver: true },
        orderBy: { createdAt: 'desc' },
    });
    res.json(rides);
};

export const getMyRides = async (req: AuthRequest, res: Response) => {
    const rides = await prisma.ride.findMany({
        where: { driverId: req.user.id },
        include: { driver: true },
        orderBy: { createdAt: 'desc' },
    });
    res.json(rides);
};

export const searchRides = async (req: AuthRequest, res: Response) => {
    try {
        const { pickupLat, pickupLng, dropLat, dropLng, date, seatsNeeded } = req.body;

        let whereClause: any = {
            status: 'active',
            availableSeats: { gte: seatsNeeded || 1 },
        };

        if (date) {
            const searchDate = new Date(date);
            searchDate.setHours(0, 0, 0, 0);
            const nextDate = new Date(searchDate);
            nextDate.setDate(nextDate.getDate() + 1);
            whereClause.date = {
                gte: searchDate,
                lt: nextDate,
            };
        }

        const rides = await prisma.ride.findMany({
            where: whereClause,
            include: { driver: true },
        });

        // Basic scoring if coordinates are provided
        if (pickupLat && pickupLng) {
            rides.sort((a: any, b: any) => {
                const distA = Math.sqrt(Math.pow(a.pickupLat - pickupLat, 2) + Math.pow(a.pickupLng - pickupLng, 2));
                const distB = Math.sqrt(Math.pow(b.pickupLat - pickupLat, 2) + Math.pow(b.pickupLng - pickupLng, 2));
                return distA - distB;
            });
        }

        res.json(rides);
    } catch (error) {
        res.status(500).json({ detail: 'Error searching rides' });
    }
};

export const getRideById = async (req: AuthRequest, res: Response) => {
    const ride = await prisma.ride.findUnique({
        where: { id: req.params.id as string },
        include: { driver: true },
    });
    if (!ride) return res.status(404).json({ detail: 'Ride not found' });
    res.json(ride);
};

export const updateRide = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const ride = await prisma.ride.findUnique({ where: { id: id as string } });
        if (!ride || ride.driverId !== req.user.id) {
            return res.status(403).json({ detail: 'Not authorized' });
        }

        const updated = await prisma.ride.update({
            where: { id: id as string },
            data: req.body,
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ detail: 'Error updating ride' });
    }
};

export const cancelRide = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const ride = await prisma.ride.findUnique({ where: { id: id as string } });
        if (!ride || ride.driverId !== req.user.id) {
            return res.status(403).json({ detail: 'Not authorized' });
        }

        await prisma.ride.update({
            where: { id: id as string },
            data: { status: 'cancelled' },
        });

        // Also cancel all pending/accepted bookings
        await prisma.booking.updateMany({
            where: { rideId: id as string, status: { in: ['pending', 'accepted'] } },
            data: { status: 'cancelled' },
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ detail: 'Error cancelling ride' });
    }
};
