const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { uploadAnalysisImages } = require('../middleware/upload.js');
const { analyze } = require('../controllers/analyzeController.js');

const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many analysis requests from this IP, please try again later.',
  headers: true,
});

router.post('/', analyzeLimiter, uploadAnalysisImages, analyze);

module.exports = router;