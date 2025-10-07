const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Preview PDF files under uploads directory
router.get('/preview', async (req, res) => {
  try {
    const fileParam = req.query.file;
    if (!fileParam || typeof fileParam !== 'string') {
      return res.status(400).json({ message: 'Thiếu tham số file' });
    }
    // Only allow paths under /uploads and with .pdf extension
    const uploadsRoot = path.join(process.cwd(), 'uploads');
    const rel = fileParam.startsWith('/uploads') ? fileParam.replace(/^\/+/, '') : `uploads/${fileParam.replace(/^\/+/, '')}`;
    const absPath = path.join(process.cwd(), rel);
    const norm = path.normalize(absPath);
    if (!norm.startsWith(uploadsRoot)) {
      return res.status(400).json({ message: 'Đường dẫn không hợp lệ' });
    }
    if (!norm.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ message: 'Chỉ hỗ trợ xem trước PDF' });
    }
    if (!fs.existsSync(norm)) {
      return res.status(404).json({ message: 'Không tìm thấy file' });
    }
    // Remove X-Frame-Options for this response to allow embedding in iframe
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('Content-Disposition', 'inline');
    fs.createReadStream(norm).pipe(res);
  } catch (e) {
    console.error('file preview error:', e);
    res.status(500).json({ message: 'Lỗi xem file' });
  }
});

module.exports = router;