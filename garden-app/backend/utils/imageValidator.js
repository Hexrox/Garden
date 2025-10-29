const fs = require('fs').promises;

/**
 * Image file magic numbers (first few bytes that identify file type)
 */
const IMAGE_SIGNATURES = {
  jpg: [
    { bytes: [0xFF, 0xD8, 0xFF], offset: 0 }
  ],
  png: [
    { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], offset: 0 }
  ],
  gif: [
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], offset: 0 }, // GIF87a
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], offset: 0 }  // GIF89a
  ],
  webp: [
    { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, // RIFF
      additionalCheck: { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 } } // WEBP
  ]
};

/**
 * Validates if a file is a real image by checking its magic numbers
 * @param {string} filePath - Path to the file to validate
 * @returns {Promise<{isValid: boolean, type: string|null, error: string|null}>}
 */
async function validateImageFile(filePath) {
  try {
    // Read first 12 bytes (enough for all image signatures)
    const fileHandle = await fs.open(filePath, 'r');
    const buffer = Buffer.alloc(12);
    await fileHandle.read(buffer, 0, 12, 0);
    await fileHandle.close();

    // Check each image type
    for (const [type, signatures] of Object.entries(IMAGE_SIGNATURES)) {
      for (const signature of signatures) {
        // Check main signature
        const matches = signature.bytes.every((byte, index) => {
          return buffer[signature.offset + index] === byte;
        });

        if (matches) {
          // Check additional signature if present (for WEBP)
          if (signature.additionalCheck) {
            const additionalMatches = signature.additionalCheck.bytes.every((byte, index) => {
              return buffer[signature.additionalCheck.offset + index] === byte;
            });

            if (additionalMatches) {
              return { isValid: true, type, error: null };
            }
          } else {
            return { isValid: true, type, error: null };
          }
        }
      }
    }

    return {
      isValid: false,
      type: null,
      error: 'Plik nie jest prawidłowym obrazem. Wykryto próbę przesłania pliku o nieprawidłowym formacie.'
    };

  } catch (error) {
    return {
      isValid: false,
      type: null,
      error: `Błąd podczas walidacji pliku: ${error.message}`
    };
  }
}

/**
 * Middleware for validating uploaded images
 * Should be used after multer upload
 */
function imageValidationMiddleware(req, res, next) {
  if (!req.file) {
    return next(); // No file uploaded, let other validation handle it
  }

  validateImageFile(req.file.path)
    .then(result => {
      if (result.isValid) {
        // Attach detected type to request for logging
        req.file.detectedType = result.type;
        next();
      } else {
        // Delete invalid file
        fs.unlink(req.file.path).catch(err => {
          console.error('Error deleting invalid file:', err);
        });

        res.status(400).json({
          error: result.error || 'Nieprawidłowy format pliku'
        });
      }
    })
    .catch(error => {
      console.error('Image validation error:', error);
      res.status(500).json({ error: 'Błąd podczas walidacji pliku' });
    });
}

module.exports = {
  validateImageFile,
  imageValidationMiddleware
};
