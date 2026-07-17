const express = require('express');
const router = express.Router({ mergeParams: true });
const { create, getAll, getOne, update, remove } = require('../controllers/artSessionController.js');
const { upload } = require('../middleware/upload.js');

router.post('/', upload.single('image'), create);
router.get('/', getAll);
router.get('/:id', getOne);
router.patch('/:id', upload.single('image'), update);
router.delete('/:id', remove);

module.exports = router;