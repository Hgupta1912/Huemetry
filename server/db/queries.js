const prisma = require('./prisma.js');

const createProject = (userId, data) =>
  prisma.project.create({ data: { ...data, userId } });

const findProjectsByUser = (userId) =>
  prisma.project.findMany({
    where: { userId },
    include: {
      artSessions: {
        orderBy: { loggedAt: 'desc' },
        take: 1,
        include: { colors: true },
      },
      reference: true,
    },
    orderBy: { createdAt: 'desc' },
  });

const findProjectById = (id, userId) =>
  prisma.project.findFirst({
    where: { id, userId },
    include: {
      artSessions: { include: { colors: true } },
      reference: { include: { colors: true } },
    },
  });

const updateProject = (id, userId, data) =>
  prisma.project.updateMany({
    where: { id, userId },
    data,
  });

const deleteProject = (id, userId) =>
  prisma.project.deleteMany({
    where: { id, userId },
  });

const createArtSession = (projectId, data, colors = []) =>
  prisma.artSession.create({
     data: { ...data, projectId, colors: { create: colors} },
     include: { colors: true },
  });

const findArtSessionsByProject = (projectId) =>
  prisma.artSession.findMany({
    where: { projectId },
    include: { colors: true },
    orderBy: { loggedAt: 'asc' },
  });

const findArtSessionById = (id, projectId) =>
  prisma.artSession.findFirst({
    where: { id, projectId },
    include: { colors: true },
  });

const updateArtSession = (id, projectId, data) =>
  prisma.artSession.updateMany({
    where: { id, projectId },
    data,
  });

// For updates that need to REPLACE the session's colors (i.e. a new image
// was uploaded and the palette was recomputed). Uses singular `update` by
// id, not updateMany, since updateMany doesn't support nested relation writes.
const replaceArtSessionColors = (id, data, colors) =>
  prisma.artSession.update({
    where: { id },
    data: { ...data, colors: { deleteMany: {}, create: colors } },
    include: { colors: true },
  });

const deleteArtSession = (id, projectId) =>
  prisma.artSession.deleteMany({
    where: { id, projectId },
  });

const createReference = (projectId, imageUrl, colors = [], statistics = null) =>
  prisma.reference.create({
    data: { projectId, statistics, imageUrl, colors: { create: colors } },
    include: { colors: true },
  });

const findReferenceByProject = (projectId) =>
  prisma.reference.findUnique({
    where: { projectId },
    include: { colors: true },
  });

const updateReference = (projectId, imageUrl) =>
  prisma.reference.updateMany({
    where: { projectId },
    data: { imageUrl },
  });

const replaceReferenceColors = (projectId, data, colors) =>
  prisma.reference.update({
    where: { projectId },
    data: { ...data, colors: { deleteMany: {}, create: colors } },
    include: { colors: true },
  });

const deleteReference = (projectId) =>
  prisma.reference.deleteMany({
    where: { projectId },
  });

const createCollection = (userId, name, isPublic = false) =>
  prisma.collection.create({ data: { userId, name, isPublic } });

const findCollectionsByUser = (userId) =>
  prisma.collection.findMany({
    where: { userId },
    include: { projects: true },
  });

const findCollectionById = (id, userId) =>
  prisma.collection.findFirst({
    where: { id, userId },
    include: {
      projects: {
        include: {
          artSessions: { include: { colors: true } },
          reference: { include: { colors: true } },
        },
      },
    },
  });
const updateCollection = (id, userId, data) =>
  prisma.collection.updateMany({
    where: { id, userId },
    data,
  });

const deleteCollection = (id, userId) =>
  prisma.collection.deleteMany({
    where: { id, userId },
  });

const addProjectToCollection = (collectionId, projectId, userId) =>
  prisma.collection.updateMany({
    where: { id: collectionId, userId },
    data: { projects: { connect: { id: projectId } } },
  });

const removeProjectFromCollection = (collectionId, projectId, userId) =>
  prisma.collection.updateMany({
    where: { id: collectionId, userId },
    data: { projects: { disconnect: { id: projectId } } },
  });

const findUserByEmail = async (email) => prisma.user.findUnique({ where: { email } });
const findUserByUsername = async (username) => prisma.user.findUnique({ where: { username } });
const createUser = async (data) => prisma.user.create({ data });

const findUserById = (id) =>
  prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, username: true, isPublic: true, createdAt: true },
  });

const findPublicUserByUsername = (username) =>
  prisma.user.findFirst({
    where: { username, isPublic: true },
    select: {
      id: true,
      username: true,
      createdAt: true,
      projects: {
        where: { isFinalized: true, isPublic: true },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          mediums: true,
          genres: true,
          substrates: true,
          dimensions: true,
          artSessions: {
            orderBy: { loggedAt: 'desc' },
            select: { imageUrl: true, loggedAt: true, isFinal: true, hoursSpent: true },
          },
        },
      },
    },
  });

const updateUser = (id, data) =>
  prisma.user.update({
    where: { id },
    data,
  });

const findPublicUsers = () =>
  prisma.user.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      username: true,
      createdAt: true,
      projects: {
        where: { isFinalized: true, isPublic: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          title: true,
          artSessions: {
            where: { isFinal: true },
            orderBy: { loggedAt: 'desc' },
            take: 1,
            select: { imageUrl: true },
          },
        },
      },
      _count: {
        select: { projects: { where: { isFinalized: true, isPublic: true } } },
      },
    },
  });

module.exports = {
  createProject,
  findProjectsByUser,
  findProjectById,
  updateProject,
  deleteProject,
  createArtSession,
  findArtSessionsByProject,
  findArtSessionById,
  updateArtSession,
  replaceArtSessionColors,
  deleteArtSession,
  createReference,
  findReferenceByProject,
  updateReference,
  replaceReferenceColors,
  deleteReference,
  createCollection,
  findCollectionsByUser,
  findCollectionById,
  updateCollection,
  deleteCollection,
  addProjectToCollection,
  removeProjectFromCollection,
  findUserByEmail,
  findUserByUsername,
  createUser,
  findUserById,
  findPublicUserByUsername,
  updateUser,
  findPublicUsers
};