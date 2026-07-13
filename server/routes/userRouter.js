const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate.js');
const {
  getMe,
  updateMe,
  getDashboard,
  getDiscoverArtists,
  getPublicProfile,
} = require('../controllers/userController.js');

router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateMe);
router.get('/dashboard', authenticate, getDashboard);
router.get('/', getDiscoverArtists);
router.get('/:username', getPublicProfile);

module.exports = router;