const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/authMiddleware');
const ExtractedResume = require('../models/ExtractedResume');

// ✅ Serve original uploaded PDF
router.get('/original-pdf/:resumeId', requireAuth, async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    console.log('📄 Serving original PDF for:', resumeId);
    
    const resume = await ExtractedResume.findOne({
      _id: resumeId,
      userId: req.session.user._id
    });

    if (!resume || !resume.originalFile) {
      console.log('❌ PDF not found in database');
      return res.status(404).json({ message: 'Original PDF not found' });
    }

    const filePath = path.join(__dirname, '..', resume.originalFile);
    
    console.log('📂 Looking for file at:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ PDF file not found on disk');
      return res.status(404).json({ message: 'PDF file not found on server' });
    }

    console.log('✅ PDF found, serving file');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('❌ Error serving original PDF:', error);
    res.status(500).json({ message: 'Failed to load PDF' });
  }
});

module.exports = router;