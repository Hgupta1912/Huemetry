const {
  findProjectById,
  createArtSession,
  findArtSessionsByProject,
  findArtSessionById,
  updateArtSession,
  updateProject,
  deleteArtSession,
} = require('../db/queries.js');

// color fields are not here yet — need the extraction algorithms implemented first

const create = async (req, res, next) => {
  try {
    const project = await findProjectById(Number(req.params.projectId), req.user.userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { imageUrl, isFinal, hoursSpent, comments } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    const artSession = await createArtSession(project.id, {
      imageUrl,
      isFinal: !!isFinal,
      hoursSpent: hoursSpent ?? null,
      comments: comments || null,
    });

    if (isFinal) {
      await updateProject(project.id, req.user.userId, { isFinalized: true });
    }

    res.status(201).json(artSession);
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const project = await findProjectById(Number(req.params.projectId), req.user.userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const artSessions = await findArtSessionsByProject(project.id);
    res.status(200).json(artSessions);
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const project = await findProjectById(Number(req.params.projectId), req.user.userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const artSession = await findArtSessionById(Number(req.params.id), project.id);
    if (!artSession) {
      return res.status(404).json({ error: 'Art session not found' });
    }

    res.status(200).json(artSession);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const project = await findProjectById(Number(req.params.projectId), req.user.userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const existing = await findArtSessionById(Number(req.params.id), project.id);
    if (!existing) {
      return res.status(404).json({ error: 'Art session not found' });
    }

    const { imageUrl, isFinal, hoursSpent, comments } = req.body;
    const data = { imageUrl, isFinal, hoursSpent, comments };

    await updateArtSession(Number(req.params.id), project.id, data);

    const becameFinal = !existing.isFinal && isFinal === true;
    const becameUnfinal = existing.isFinal && isFinal === false;

    if (becameFinal) {
      await updateProject(project.id, req.user.userId, { isFinalized: true });
    } else if (becameUnfinal) {
      await updateProject(project.id, req.user.userId, { isFinalized: false });
    }

    const updated = await findArtSessionById(Number(req.params.id), project.id);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const project = await findProjectById(Number(req.params.projectId), req.user.userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await deleteArtSession(Number(req.params.id), project.id);
    if (result.count === 0) {
      return res.status(404).json({ error: 'Art session not found' });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { create, getAll, getOne, update, remove };