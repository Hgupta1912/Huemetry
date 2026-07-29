const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate.js');
const {
  getMe,
  updateMe,
  getDiscoverArtists,
  getPublicProfile,
  getPublicProjectDetail,
  getPublicArtSession,
  getPublicReference
} = require('../controllers/userController.js');

router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateMe);
router.get('/', getDiscoverArtists);
router.get('/:username', getPublicProfile);
router.get('/:username/projects/:projectId', getPublicProjectDetail);
router.get('/:username/projects/:projectId/sessions/:sessionId', getPublicArtSession);
router.get('/:username/projects/:projectId/reference', getPublicReference);

module.exports = router;