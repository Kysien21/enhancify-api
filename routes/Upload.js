const express = require('express');
const multer = require('multer');
const path = require('path');
const uploadcontroller = require('../controllers/uploadController')
const uploadRateLimiter = require('../middleware/uploadRateLimiter');

const router = express.Router();

const storage = multer.memoryStorage();

// ✅ File filter - PDF ONLY
const fileFilter = function(req, file, cb) {
    const allowedMimeType = "application/pdf";
    const allowedExtension = '.pdf';
    
    const extName = path.extname(file.originalname).toLowerCase() === allowedExtension;
    const mimeType = file.mimetype === allowedMimeType;

    if (extName && mimeType) {
        cb(null, true);
    } else {
        console.log("❌ File rejected:", file.originalname, file.mimetype);
        cb(new Error('Only PDF files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

router.post('/upload', 
    uploadRateLimiter,  // Check limit first
    upload.single('resume'), 
    uploadcontroller.uploadResume
);

module.exports = router;