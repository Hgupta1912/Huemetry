const express = require('express');
const router = express.Router({ mergeParams: true });
const { create, getAll, getOne, update, remove } = require('../controllers/artSessionController.js');

router.post('/', create);
router.get('/', getAll);
router.get('/:id', getOne);
router.patch('/:id', update);
router.delete('/:id', remove);

module.exports = router;