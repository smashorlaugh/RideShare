import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import crypto from 'crypto';

const SECRET_KEY = process.env.JWT_SECRET || 'rideshare-secret-key-2025-node-prisma';

export const sendOtp = async (req: Request, res: Response) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ detail: 'Phone number is required' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await prisma.otp.upsert({
            where: { phone },
            update: { otp, expiresAt },
            create: { phone, otp, expiresAt },
        });

        // In production, send via SMS (Twilio/Firebase)
        console.log(`[DEBUG] OTP for ${phone}: ${otp}`);

        res.json({
            success: true,
            message: 'OTP sent successfully'
        });
    } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({ detail: 'Internal server error' });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) {
            return res.status(400).json({ detail: 'Phone and OTP are required' });
        }

        const otpRecord = await prisma.otp.findUnique({ where: { phone } });

        if (!otpRecord || otpRecord.otp !== otp) {
            return res.status(400).json({ detail: 'Invalid OTP' });
        }

        if (new Date() > otpRecord.expiresAt) {
            return res.status(400).json({ detail: 'OTP expired' });
        }

        // Delete OTP after verification
        await prisma.otp.delete({ where: { phone } });

        // Find or create user
        let user = await prisma.user.findUnique({ where: { phone } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    phone,
                    rating: 0,
                    totalRatings: 0,
                    totalRidesAsDriver: 0,
                    totalRidesAsPassenger: 0,
                },
            });
        }

        const token = jwt.sign({ sub: user.id }, SECRET_KEY, { expiresIn: '30d' });

        res.json({
            token,
            user,
        });
    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ detail: 'Internal server error' });
    }
};
