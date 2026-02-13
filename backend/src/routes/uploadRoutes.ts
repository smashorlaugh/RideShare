import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

router.post('/image', authenticate, upload.single('file'), (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ detail: 'No file uploaded' });
    }

    // In a real app, upload to S3/Cloudinary. Here we return base64.
    const base64Image = req.file.buffer.toString('base64');
    const contentType = req.file.mimetype;

    res.json({
        success: true,
        image: `data:${contentType};base64,${base64Image}`,
    });
});

export default router;
