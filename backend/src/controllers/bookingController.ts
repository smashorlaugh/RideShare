import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export const createBooking = async (req: AuthRequest, res: Response) => {
    try {
        const { rideId, seats, message } = req.body;

        const ride = await prisma.ride.findUnique({ where: { id: rideId } });
        if (!ride) return res.status(404).json({ detail: 'Ride not found' });
        if (ride.driverId === req.user.id) {
            return res.status(400).json({ detail: 'Cannot book your own ride' });
        }
        if (ride.availableSeats < seats) {
            return res.status(400).json({ detail: 'Not enough seats available' });
        }

        const booking = await prisma.booking.create({
            data: {
                rideId,
                passengerId: req.user.id,
                seats,
                message,
            },
        });

        res.json(booking);
    } catch (error) {
        res.status(500).json({ detail: 'Error creating booking' });
    }
};

export const getMyBookings = async (req: AuthRequest, res: Response) => {
    const bookings = await prisma.booking.findMany({
        where: { passengerId: req.user.id },
        include: { ride: { include: { driver: true } } },
        orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
};

export const getIncomingRequests = async (req: AuthRequest, res: Response) => {
    const bookings = await prisma.booking.findMany({
        where: { ride: { driverId: req.user.id } },
        include: { ride: true, passenger: true },
        orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
};

export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // accepted, rejected, cancelled, completed

        const booking = await prisma.booking.findUnique({
            where: { id: id as string },
            include: { ride: true },
        });

        if (!booking) return res.status(404).json({ detail: 'Booking not found' });

        const isDriver = booking.ride.driverId === req.user.id;
        const isPassenger = booking.passengerId === req.user.id;

        if (!isDriver && !isPassenger) {
            return res.status(403).json({ detail: 'Not authorized' });
        }

        // Driver can accept/reject
        if (status === 'accepted' || status === 'rejected') {
            if (!isDriver) return res.status(403).json({ detail: 'Only driver can accept/reject' });

            if (status === 'accepted') {
                if (booking.ride.availableSeats < booking.seats) {
                    return res.status(400).json({ detail: 'Not enough seats available' });
                }
                // Deduct seats
                await prisma.ride.update({
                    where: { id: booking.rideId },
                    data: { availableSeats: { decrement: booking.seats } },
                });
            }
        }

        // Update status
        const updated = await prisma.booking.update({
            where: { id: id as string },
            data: { status },
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ detail: 'Error updating booking' });
    }
};
