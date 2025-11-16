const fs = require('fs');
const path = require('path');

/**
 * Delete a file from the filesystem
 * @param {string} filePath - Relative path to the file (e.g., 'uploads/image.jpg')
 */
const deleteFile = (filePath) => {
  if (!filePath) return;

  const fullPath = path.join(__dirname, '..', filePath);

  fs.unlink(fullPath, (err) => {
    if (err) {
      // ENOENT means file doesn't exist - not an error
      if (err.code !== 'ENOENT') {
        console.error('Error deleting file:', fullPath, err);
      }
    } else {
      console.log('✓ Deleted old file:', filePath);
    }
  });
};

/**
 * Delete multiple files
 * @param {string[]} filePaths - Array of relative file paths
 */
const deleteFiles = (filePaths) => {
  if (!Array.isArray(filePaths)) return;
  filePaths.forEach(filePath => deleteFile(filePath));
};

module.exports = {
  deleteFile,
  deleteFiles
};
