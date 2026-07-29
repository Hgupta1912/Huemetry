const {
  findProjectById,
  createArtSession,
  findArtSessionsByProject,
  findArtSessionById,
  updateArtSession,
  replaceArtSessionColors,
  updateProject,
  deleteArtSession,
  findReferenceByProject,
} = require('../db/queries.js');
const { uploadImageBuffer } = require('../lib/cloudinary.js');
const { getPixelData } = require('../lib/imageProcessing.js');
const { extractPalette, flattenPalettesToColorRows, groupColorsByTonalRange } = require('../lib/extractPalette.js');
const { computeImageStatistics } = require('../lib/imageStatistics.js');
const { compareToReference } = require('../lib/compareToReference.js');

// Runs the color/statistics pipeline on an uploaded image; if the
// project has a reference photo, it compares the result against it. Shared
// by create and update, since both need the exact same processing whenever
// a new image is involved.
const processImage = async (buffer, project) => {
  const { pixels } = await getPixelData(buffer);

  const statistics = computeImageStatistics(pixels, project.isMonochrome);
  const colorsData = project.isMonochrome
    ? []
    : flattenPalettesToColorRows(extractPalette(pixels));

  let comparedToReference = null;
  if (project.isRealism) {
    const reference = await findReferenceByProject(project.id);
    if (reference && reference.statistics) {
      comparedToReference = compareToReference(
        {
          palettes: reference.colors?.length > 0 ? groupColorsByTonalRange(reference.colors) : null,
          statistics: reference.statistics,
        },
        {
          palettes: colorsData.length > 0 ? groupColorsByTonalRange(colorsData) : null,
          statistics,
        },
      );
    }
  }

  return { statistics, colorsData, comparedToReference };
};

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

    const uploadResult = await uploadImageBuffer(req.file.buffer);
    const { statistics, colorsData, comparedToReference } = await processImage(req.file.buffer, project);

    const artSession = await createArtSession(
      project.id,
      {
        imageUrl: uploadResult.secure_url,
        isFinal: isFinalBool,
        hoursSpent: hoursSpent !== undefined && hoursSpent !== '' ? Number(hoursSpent) : null,
        comments: comments || null,
        statistics,
        comparedToReference,
      },
      colorsData,
    );

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

    const hoursSpentNum = hoursSpent !== undefined && hoursSpent !== ''
      ? Number(hoursSpent)
      : existing.hoursSpent;
    const commentsVal = comments !== undefined ? (comments || null) : existing.comments;

    let updated;
    if (req.file) {  // New image: full re-processing, palette recomputed, colors replaced.
      const uploadResult = await uploadImageBuffer(req.file.buffer);
      const { statistics, colorsData, comparedToReference } = await processImage(req.file.buffer, project);

      updated = await replaceArtSessionColors(
        Number(req.params.id),
        {
          imageUrl: uploadResult.secure_url,
          isFinal: isFinalBool,
          hoursSpent: hoursSpentNum,
          comments: commentsVal,
          statistics,
          comparedToReference,
        },
        colorsData,
      );
      // this doesn't delete the old image in Cloudinary... oh well
    } else {
      // No new image — simple field update, colors/statistics untouched.
      await updateArtSession(Number(req.params.id), project.id, {
        isFinal: isFinalBool,
        hoursSpent: hoursSpentNum,
        comments: commentsVal,
      });
      updated = await findArtSessionById(Number(req.params.id), project.id);
    }

    const becameUnfinal = existing.isFinal && !isFinalBool;
    if (becameFinal) {
      await updateProject(project.id, req.user.userId, { isFinalized: true });
    } else if (becameUnfinal) {
      await updateProject(project.id, req.user.userId, { isFinalized: false });
    }

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