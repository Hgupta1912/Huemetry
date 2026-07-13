const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate.js');
const {
  create,
  getAll,
  getOne,
  update,
  remove,
  addProject,
  removeProject,
} = require('../controllers/collectionController.js');


router.use(authenticate);

router.post('/', create);
router.get('/', getAll);
router.get('/:id', getOne);
router.patch('/:id', update);
router.delete('/:id', remove);

router.post('/:id/projects/:projectId', addProject);
router.delete('/:id/projects/:projectId', removeProject);

module.exports = router;