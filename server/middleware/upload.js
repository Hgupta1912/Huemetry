const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadAnalysisImages = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'referenceImage', maxCount: 1 },
]);

module.exports = { upload, uploadAnalysisImages };