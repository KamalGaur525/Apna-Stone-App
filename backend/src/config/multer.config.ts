import multer from "multer";

// 1. File Filter (Only Images and Videos)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  const allowedVideoTypes = ["video/mp4", "video/quicktime"];

  if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpeg, .png, .jpg, .webp for images and .mp4, .mov for videos are allowed!") as any);
  }
};

// 2. Export Upload Middleware (memoryStorage — files go to S3, not disk)
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit (videos ke liye)
  }
});