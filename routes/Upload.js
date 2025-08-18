const express = require('express');
const multer = require('multer');
const path = require('path');
const uploadcontroller = require('../controllers/uploadController')

const router = express.Router();


// const storage = multer.diskStorage({
//     destination: function(req, file, cb) {
//         cb(null, 'uploads')
//     },
//     filename: function(req, file, cb) {
//         cb(null, Date.now() + '-' + file.originalname)
//     }
// });

const storage = multer.memoryStorage();

// ✅ File filter para PDF ug DOCX ra
const fileFilter = function(req, file, cb) {
    const allowedMimeTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    const allowedExtensions = ['.pdf', '.docx'];
    const extName = allowedExtensions.includes(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedMimeTypes.includes(file.mimetype);

    if (extName && mimeType) {
        cb(null, true);
    } else {
        console.log("❌ File rejected:", file.originalname, file.mimetype);
        cb(new Error('Only .pdf and .docx files are allowed'), false);
    }
};

const upload = multer({
    storage: storage
        /*,
           fileFilter: fileFilter */
});
router.post('/upload', upload.single('resume'), uploadcontroller.uploadResume)


module.exports = router;