const {
  findProjectById,
  createArtSession,
  findArtSessionsByProject,
  findArtSessionById,
  updateArtSession,
  updateProject,
  deleteArtSession,
} = require('../db/queries.js');
const { uploadImageBuffer } = require('../lib/cloudinary.js');


// color fields are not here yet — need the extraction algorithms implemented first


const create = async (req, res, next) => {
  try {
    const project = await findProjectById(Number(req.params.projectId), req.user.userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
     if (project.isFinalized) {
      return res.status(400).json({ error: 'Cannot log new sessions on a finalized project' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'An image file is required' });
    }

    const { isFinal, hoursSpent, comments } = req.body;

    const isFinalBool = isFinal === 'true' || isFinal === true;

    const result = await uploadImageBuffer(req.file.buffer);

    const artSession = await createArtSession(project.id, {
      imageUrl: result.secure_url,
      isFinal: isFinalBool,
      hoursSpent: hoursSpent !== undefined && hoursSpent !== '' ? Number(hoursSpent) : null,
      comments: comments || null,
    });

    if (isFinalBool) {
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

    const { isFinal, hoursSpent, comments } = req.body;

    const isFinalBool = isFinal !== undefined
      ? (isFinal === 'true' || isFinal === true)
      : existing.isFinal;

    const becameFinal = !existing.isFinal && isFinalBool;

    if (becameFinal && project.isFinalized) {
      return res.status(400).json({ error: 'This project already has a final session' });
    }

    let imageUrl = existing.imageUrl;
    if (req.file) {
      const result = await uploadImageBuffer(req.file.buffer);
      imageUrl = result.secure_url;
      // this doesn't delete the old image in Cloudinary... oh well
    }

    const hoursSpentNum = hoursSpent !== undefined && hoursSpent !== ''
      ? Number(hoursSpent)
      : existing.hoursSpent;

    const commentsVal = comments !== undefined ? (comments || null) : existing.comments;

    const data = { imageUrl, isFinal: isFinalBool, hoursSpent: hoursSpentNum, comments: commentsVal };

    await updateArtSession(Number(req.params.id), project.id, data);

    const becameUnfinal = existing.isFinal && !isFinalBool;

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

    const existing = await findArtSessionById(Number(req.params.id), project.id);
    if (!existing) {
      return res.status(404).json({ error: 'Art session not found' });
    }

    await deleteArtSession(Number(req.params.id), project.id);

    if (existing.isFinal) {
      await updateProject(project.id, req.user.userId, { isFinalized: false });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { create, getAll, getOne, update, remove };