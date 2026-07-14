const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate.js');
const {
  create,
  getAll,
  getOne,
  update,
  remove,
  uploadReference,
  getReference,
  editReference,
  removeReference,
} = require('../controllers/projectController.js');
const artSessionRouter = require('./artSessionRouter.js');
const upload = require('../middleware/upload.js');


router.use(authenticate);

router.post('/', create);
router.get('/', getAll);
router.get('/:id', getOne);
router.patch('/:id', update);
router.delete('/:id', remove);

router.post('/:id/reference', upload.single('image'), uploadReference);
router.get('/:id/reference', getReference);
router.patch('/:id/reference', upload.single('image'), editReference);
router.delete('/:id/reference', removeReference);

router.use('/:projectId/sessions', artSessionRouter);

module.exports = router;