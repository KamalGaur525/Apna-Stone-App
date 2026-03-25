import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { generateFloor } from '../controllers/visualizer.controller';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.post(
  '/generate',
  // requireAuth,
  // requireRole(['vendor']),        // ← array fix
  upload.fields([
    { name: 'room',   maxCount: 1 },
    { name: 'marble', maxCount: 1 },
  ]),
  generateFloor
);

export default router;