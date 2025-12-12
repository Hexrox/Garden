const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Generuje 3 wersje zdjęcia:
 * - thumb: 200x200px (miniaturka do galerii)
 * - medium: 800x600px (do przeglądania)
 * - original: oryginalne zdjęcie
 */
const generateThumbnails = async (originalPath, filename) => {
  const uploadDir = process.env.NODE_ENV === 'production'
    ? '/var/www/garden-uploads'
    : path.join(__dirname, '..', 'uploads');

  // Ustalamy katalogi dla różnych rozmiarów
  const thumbDir = path.join(uploadDir, 'thumbs');
  const mediumDir = path.join(uploadDir, 'medium');

  // Tworzymy katalogi jeśli nie istnieją
  [thumbDir, mediumDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const baseFilename = path.parse(filename).name;
  const ext = path.parse(filename).ext;

  // Generujemy nazwy plików
  const thumbFilename = `${baseFilename}_thumb${ext}`;
  const mediumFilename = `${baseFilename}_medium${ext}`;

  const thumbPath = path.join(thumbDir, thumbFilename);
  const mediumPath = path.join(mediumDir, mediumFilename);

  try {
    // Generuj miniaturkę 200x200px (cover - wypełnia całe pole)
    await sharp(originalPath)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbPath);

    // Generuj średnie zdjęcie 800x600px (contain - zachowuje proporcje)
    await sharp(originalPath)
      .resize(800, 600, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toFile(mediumPath);

    return {
      original: `uploads/${filename}`,
      thumb: `uploads/thumbs/${thumbFilename}`,
      medium: `uploads/medium/${mediumFilename}`
    };
  } catch (error) {
    console.error('Error generating thumbnails:', error);
    throw error;
  }
};

/**
 * Usuwa wszystkie wersje zdjęcia (original, thumb, medium)
 */
const deleteAllVersions = (originalPath) => {
  const uploadDir = process.env.NODE_ENV === 'production'
    ? '/var/www/garden-uploads'
    : path.join(__dirname, '..', 'uploads');

  const filename = path.basename(originalPath);
  const baseFilename = path.parse(filename).name;
  const ext = path.parse(filename).ext;

  const paths = [
    path.join(uploadDir, filename), // original
    path.join(uploadDir, 'thumbs', `${baseFilename}_thumb${ext}`), // thumb
    path.join(uploadDir, 'medium', `${baseFilename}_medium${ext}`) // medium
  ];

  paths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', filePath, err);
      });
    }
  });
};

module.exports = {
  generateThumbnails,
  deleteAllVersions
};
