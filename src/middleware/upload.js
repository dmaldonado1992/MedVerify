const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024,      // 1GB
  },
  fileFilter: (req, file, cb) => {
    // Validar solo videos
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de video'), false);
    }
  },
});

module.exports = upload;
