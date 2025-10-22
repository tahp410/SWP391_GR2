import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Cấu hình multer để upload files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/images/';
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Tạo tên file unique với timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Kiểm tra file type
const fileFilter = (req, file, cb) => {
  // Chỉ cho phép các file ảnh
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
  }
});

// @desc    Upload image
// @route   POST /api/upload/image
// @access  Public (có thể thêm auth middleware nếu cần)
router.post('/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không có file nào được upload' });
    }

    // Trả về URL của ảnh
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`;
    
    res.json({
      message: 'Upload ảnh thành công',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Lỗi server khi upload ảnh' });
  }
});

// Error handling middleware cho multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File quá lớn. Giới hạn 5MB' });
    }
  }
  
  if (error.message === 'Chỉ cho phép upload file ảnh!') {
    return res.status(400).json({ message: error.message });
  }
  
  res.status(500).json({ message: 'Lỗi upload file' });
});

export default router;