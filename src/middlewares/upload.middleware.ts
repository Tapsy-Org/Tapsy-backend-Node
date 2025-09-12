import multer from 'multer';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Allow only video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      const error = new Error('Only video files are allowed!') as any;
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  },
});
