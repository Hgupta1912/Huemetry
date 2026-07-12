const {
  findProjectById,
  createCollection,
  findCollectionsByUser,
  findCollectionById,
  updateCollectionName,
  deleteCollection,
  addProjectToCollection,
  removeProjectFromCollection,
} = require('../db/queries.js');

const create = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const collection = await createCollection(req.user.userId, name);
    res.status(201).json(collection);
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const collections = await findCollectionsByUser(req.user.userId);
    res.status(200).json(collections);
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const collection = await findCollectionById(Number(req.params.id), req.user.userId);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.status(200).json(collection);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const result = await updateCollectionName(Number(req.params.id), req.user.userId, name);
    if (result.count === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const updated = await findCollectionById(Number(req.params.id), req.user.userId);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await deleteCollection(Number(req.params.id), req.user.userId);
    if (result.count === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const addProject = async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);

    const project = await findProjectById(projectId, req.user.userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await addProjectToCollection(Number(req.params.id), projectId, req.user.userId);
    if (result.count === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const updated = await findCollectionById(Number(req.params.id), req.user.userId);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

const removeProject = async (req, res, next) => {
  try {
    const result = await removeProjectFromCollection(
      Number(req.params.id),
      Number(req.params.projectId),
      req.user.userId
    );
    if (result.count === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const updated = await findCollectionById(Number(req.params.id), req.user.userId);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

module.exports = { create, getAll, getOne, update, remove, addProject, removeProject };