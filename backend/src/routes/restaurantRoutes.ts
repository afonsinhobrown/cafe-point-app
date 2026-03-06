import { Router } from 'express';
import { getRestaurantSettings, updateRestaurantSettings } from '../controllers/restaurantController';
import { authenticateToken, isAdmin } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });
const router = Router();

router.get('/', authenticateToken, getRestaurantSettings as any);
router.put('/', authenticateToken, isAdmin, upload.single('logoFile'), updateRestaurantSettings as any);

export default router;
