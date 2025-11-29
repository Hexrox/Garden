const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Create uploads directory if it doesn't exist
// Production: use /var/www/garden-uploads (served by nginx)
// Development: use local uploads directory
const uploadDir = process.env.NODE_ENV === 'production'
  ? '/var/www/garden-uploads'
  : path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Sanitize extension - tylko alfanumeryczne
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');

    // Whitelist dozwolonych rozszerzeń
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!allowedExts.includes(ext)) {
      return cb(new Error('Invalid file extension'));
    }

    // Cryptographically secure random filename (prevent enumeration)
    crypto.randomBytes(16, (err, buf) => {
      if (err) return cb(err);

      const filename = buf.toString('hex') + ext;
      cb(null, filename);
    });
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Tylko pliki graficzne są dozwolone (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;
