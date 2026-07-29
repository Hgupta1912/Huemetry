const { getPixelData } = require('../lib/imageProcessing.js');
const { extractPalette, flattenPalettesToColorRows, groupColorsByTonalRange } = require('../lib/extractPalette.js');
const { computeImageStatistics } = require('../lib/imageStatistics.js');
const { compareToReference } = require('../lib/compareToReference.js');

const {
  createProject,
  findProjectsByUser,
  findProjectById,
  updateProject,
  deleteProject,
  createReference,
  findReferenceByProject,
  updateReference,
  replaceReferenceColors,
  deleteReference,
  findArtSessionsByProject,
  updateArtSessionComparison
} = require('../db/queries.js');
const { uploadImageBuffer } = require('../lib/cloudinary.js');


const ALLOWED_MODES = ['retrospective', 'progressive'];

//helper for when reference is switched or deleted midway
const recalculateAllSessionComparisons = async (projectId, reference) => {
  const sessions = await findArtSessionsByProject(projectId);

  for (const session of sessions) {
    if (!session.statistics) continue;

    const comparedToReference = reference
      ? compareToReference(
          {
            palettes: reference.colors?.length > 0 ? groupColorsByTonalRange(reference.colors) : null,
            statistics: reference.statistics,
          },
          {
            palettes: session.colors?.length > 0 ? groupColorsByTonalRange(session.colors) : null,
            statistics: session.statistics,
          },
        )
      : null;

    await updateArtSessionComparison(session.id, comparedToReference);
  }
};

const create = async (req, res, next) => {
  try {
    const { title, mediums, substrates, genres, dimensions, mode, collaborators, createdAt, isRealism, isMonochrome, isPublic } = req.body;

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
      isMonochrome: !!isMonochrome,
      isPublic: !!isPublic,
    };

    if (mode === 'retrospective') {
      if (!createdAt) {
        return res.status(400).json({ error: 'createdAt is required for retrospective projects' });
      }
      data.createdAt = new Date(createdAt);
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
    const { title, mediums, substrates, genres, dimensions, collaborators, isRealism, isMonochrome, isPublic } = req.body;

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

    const data = { title, mediums, substrates, dimensions, genres, collaborators, isRealism, isMonochrome, isPublic };

    const result = await updateProject(Number(req.params.id), req.user.userId, data);

    if (result.count === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (isRealism === false) {
      await deleteReference(Number(req.params.id));
      await recalculateAllSessionComparisons(Number(req.params.id), null);
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
    if (!req.file) {
      return res.status(400).json({ error: 'An image file is required' });
    }

    const uploadResult = await uploadImageBuffer(req.file.buffer);
    const { pixels } = await getPixelData(req.file.buffer);

    const statistics = computeImageStatistics(pixels, project.isMonochrome);
    const colorsData = project.isMonochrome
      ? []
      : flattenPalettesToColorRows(extractPalette(pixels));

    const reference = await createReference(
      project.id,
      uploadResult.secure_url,
      colorsData,
      statistics,
    );

    await recalculateAllSessionComparisons(project.id, { colors: colorsData, statistics });

    const final = await findReferenceByProject(project.id);

    res.status(201).json(final);
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
    if (!req.file) {
      return res.status(400).json({ error: 'An image file is required' });
    }

    const uploadResult = await uploadImageBuffer(req.file.buffer);
    const { pixels } = await getPixelData(req.file.buffer);

    const statistics = computeImageStatistics(pixels, project.isMonochrome);
    const colorsData = project.isMonochrome
      ? []
      : flattenPalettesToColorRows(extractPalette(pixels));

    const reference = await replaceReferenceColors(
      project.id,
      { imageUrl: uploadResult.secure_url, statistics },
      colorsData,
    );

    await recalculateAllSessionComparisons(project.id, { colors: colorsData, statistics });


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

    await recalculateAllSessionComparisons(project.id, null);

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