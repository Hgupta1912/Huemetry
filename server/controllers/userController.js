const {
  findUserById,
  findUserByUsername,
  findPublicUserByUsername,
  findPublicUsers,
  findProjectsByUser,
  findCollectionsByUser,
  updateUser,
} = require('../db/queries.js');

const getMe = async (req, res, next) => {
  try {
    const user = await findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const { username, isPublic } = req.body;
    const data = {};

    if (username !== undefined) {
      const existing = await findUserByUsername(username);
      if (existing && existing.id !== req.user.userId) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      data.username = username;
    }

    if (isPublic !== undefined) {
      data.isPublic = !!isPublic;
    }

    const updated = await updateUser(req.user.userId, data);
    res.status(200).json({
      id: updated.id,
      email: updated.email,
      username: updated.username,
      isPublic: updated.isPublic,
    });
  } catch (err) {
    next(err);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const user = await findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const projects = await findProjectsByUser(req.user.userId);
    const collections = await findCollectionsByUser(req.user.userId);

    res.status(200).json({ user, projects, collections });
  } catch (err) {
    next(err);
  }
};

const getDiscoverArtists = async (req, res, next) => {
  try {
    const users = await findPublicUsers();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

const getPublicProfile = async (req, res, next) => {
  try {
    const user = await findPublicUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const projects = user.projects.map((project) => {
      const finalSession = project.artSessions.find((s) => s.isFinal);

      const totalHoursSpent = project.artSessions.reduce((sum, session) => {
        return typeof session.hoursSpent === 'number' ? sum + session.hoursSpent : sum;
      }, 0);

      return {
        id: project.id,
        title: project.title,
        mediums: project.mediums,
        genres: project.genres,
        substrates: project.substrates,
        dimensions: project.dimensions,
        imageUrl: finalSession?.imageUrl ?? null,
        loggedAt: finalSession?.loggedAt ?? null,
        totalHoursSpent,
      };
    });

    res.status(200).json({ ...user, projects });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMe, updateMe, getDashboard, getDiscoverArtists, getPublicProfile };