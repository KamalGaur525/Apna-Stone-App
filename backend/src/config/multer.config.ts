import multer from "multer";
import path from "path";
import fs from "fs";

// 1. Configure Storage Engine (Dynamic Path)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Base directory logic
        const isService = req.originalUrl.includes("services");
        const isLogo = req.originalUrl.includes("logo");
        const subFolder = isLogo ? "logos" : isService ? "services" : "products";
        const targetDir = path.join(__dirname, `../../public/uploads/${subFolder}`);

        // Ensure specific sub-directory exists
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        cb(null, targetDir);
    },
    filename: (req, file, cb) => {
        // Filename format: timestamp-random_number.extension
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// 2. File Filter (Only Images and Videos)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    const allowedVideoTypes = ["video/mp4", "video/quicktime"]; // .mp4 and .mov

    if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only .jpeg, .png, .jpg, .webp for images and .mp4, .mov for videos are allowed!") as any);
    }
};

// 3. Export Upload Middleware
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { 
        fileSize: 50 * 1024 * 1024 // 50MB limit max (for videos)
    } 
});