const {
  createProject,
  findProjectsByUser,
  findProjectById,
  updateProject,
  deleteProject,
  createReference,
  findReferenceByProject,
  updateReference,
  deleteReference,
} = require('../db/queries.js');

const ALLOWED_MODES = ['retrospective', 'progressive'];

const create = async (req, res, next) => {
  try {
    const { title, mediums, substrates, genres, dimensions, mode, collaborators, createdAt, isRealism, isPublic } = req.body;

    if (!title || !mediums?.length || !genres?.length || !mode || !dimensions?.length) {
      return res.status(400).json({ error: 'title, mediums, genres, mode, and dimensions are required' });
    }

    if (dimensions.length !== 2 && dimensions.length !== 3) {
      return res.status(400).json({ error: 'dimensions must have exactly 2 or 3 entries' });
    }

    if (dimensions.some((d) => typeof d !== 'number' || d <= 0)) {
      return res.status(400).json({ error: 'dimensions must be positive numbers' });
    }

    if (!ALLOWED_MODES.includes(mode)) {
      return res.status(400).json({ error: `mode must be one of: ${ALLOWED_MODES.join(', ')}` });
    }

    const data = {
      title,
      mediums,
      substrates: substrates || [],
      genres,
      dimensions: dimensions || [],
      mode,
      collaborators: collaborators || [],
      isRealism: !!isRealism,
      isPublic: !!isPublic,
    };

    if (mode === 'retrospective') {
      if (!createdAt) {
        return res.status(400).json({ error: 'createdAt is required for retrospective projects' });
      }
      data.createdAt = new Date(createdAt);
      data.isFinalized = true;
    }

    const project = await createProject(req.user.userId, data);

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const projects = await findProjectsByUser(req.user.userId);
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const project = await findProjectById(Number(req.params.id), req.user.userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { title, mediums, substrates, genres, dimensions, collaborators, isFinalized, isRealism, isPublic } = req.body;

    if (
      (title !== undefined && !title) ||
      (mediums !== undefined && !mediums.length) ||
      (genres !== undefined && !genres.length)
    ) {
      return res.status(400).json({ error: 'title, mediums, and genres cannot be empty' });
    }

    if (dimensions !== undefined) {
      if (dimensions.length !== 2 && dimensions.length !== 3) {
        return res.status(400).json({ error: 'dimensions must have exactly 2 or 3 entries' });
      }
      if (dimensions.some((d) => typeof d !== 'number' || d <= 0)) {
        return res.status(400).json({ error: 'dimensions must be positive numbers' });
      }
    }

    const data = { title, mediums, substrates, dimensions, genres, collaborators, isFinalized, isRealism, isPublic };

    const result = await updateProject(Number(req.params.id), req.user.userId, data);

    if (result.count === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (isRealism === false) {
      await deleteReference(Number(req.params.id));
    }

    const updated = await findProjectById(Number(req.params.id), req.user.userId);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await deleteProject(Number(req.params.id), req.user.userId);
    if (result.count === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const uploadReference = async (req, res, next) => {
  try {
    const project = await findProjectById(Number(req.params.id), req.user.userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (!project.isRealism) {
      return res.status(400).json({ error: 'Reference photos are only allowed on realism projects' });
    }

    const { imageUrl } = req.body;
    // TEMP until Milestone 3 Cloudinary wiring

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    const reference = await createReference(project.id, imageUrl);
    res.status(201).json(reference);
  } catch (err) {
    next(err);
  }
};

const getReference = async (req, res, next) => {
  try {
    const project = await findProjectById(Number(req.params.id), req.user.userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const reference = await findReferenceByProject(project.id);
    if (!reference) {
      return res.status(404).json({ error: 'No reference photo uploaded for this project' });
    }

    res.status(200).json(reference);
  } catch (err) {
    next(err);
  }
};

const editReference = async (req, res, next) => {
  try {
    const project = await findProjectById(Number(req.params.id), req.user.userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    const result = await updateReference(project.id, imageUrl);
    if (result.count === 0) {
      return res.status(404).json({ error: 'Reference not found' });
    }

    const reference = await findReferenceByProject(project.id);
    res.status(200).json(reference);
  } catch (err) {
    next(err);
  }
};

const removeReference = async (req, res, next) => {
  try {
    const project = await findProjectById(Number(req.params.id), req.user.userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await deleteReference(project.id);
    if (result.count === 0) {
      return res.status(404).json({ error: 'Reference not found' });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
  uploadReference,
  getReference,
  editReference,
  removeReference,
};