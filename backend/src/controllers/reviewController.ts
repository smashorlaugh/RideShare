import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export const createReview = async (req: AuthRequest, res: Response) => {
    try {
        const { rideId, revieweeId, rating, comment } = req.body;

        // Check if ride completed
        const ride = await prisma.ride.findUnique({ where: { id: rideId } });
        if (!ride || ride.status !== 'completed') {
            return res.status(400).json({ detail: 'Can only review completed rides' });
        }

        const review = await prisma.review.create({
            data: {
                rideId,
                reviewerId: req.user.id,
                revieweeId,
                rating,
                comment,
            },
        });

        // Update reviewee stats
        const allReviews = await prisma.review.findMany({ where: { revieweeId } });
        const avgRating = allReviews.reduce((acc: number, curr: any) => acc + curr.rating, 0) / allReviews.length;

        await prisma.user.update({
            where: { id: revieweeId },
            data: {
                rating: avgRating,
                totalRatings: allReviews.length
            },
        });

        res.json(review);
    } catch (error) {
        res.status(500).json({ detail: 'Error creating review' });
    }
};

export const getUserReviews = async (req: AuthRequest, res: Response) => {
    const reviews = await prisma.review.findMany({
        where: { revieweeId: req.params.userId as string },
        include: { reviewer: true },
        orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
};
