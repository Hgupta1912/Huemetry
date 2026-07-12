const prisma = require('./prisma.js');

const findUserByEmail = async (email) => prisma.user.findUnique({ where: { email } });
const findUserByUsername = async (username) => prisma.user.findUnique({ where: { username } });
const createUser = async (data) => prisma.user.create({ data });

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

const createArtSession = (projectId, data) =>
  prisma.artSession.create({ data: { ...data, projectId } });

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

const deleteArtSession = (id, projectId) =>
  prisma.artSession.deleteMany({
    where: { id, projectId },
  });

//when color algorithms are made, update this to also create the colors that are to be nested 
const createReference = (projectId, imageUrl) =>
  prisma.reference.create({ data: { projectId, imageUrl } });

const findReferenceByProject = (projectId) =>
  prisma.reference.findUnique({
    where: { projectId },
    include: { colors: true },
  });

//when color algorithms are made, update this to also create the colors that are to be nested
const updateReference = (projectId, imageUrl) =>
  prisma.reference.updateMany({
    where: { projectId },
    data: { imageUrl },
  });

const deleteReference = (projectId) =>
  prisma.reference.deleteMany({
    where: { projectId },
  });

const createCollection = (userId, name) =>
  prisma.collection.create({ data: { userId, name } });

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
const updateCollectionName = (id, userId, name) =>
  prisma.collection.updateMany({
    where: { id, userId },
    data: { name },
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

module.exports = {
  findUserByEmail,
  findUserByUsername,
  createUser,
  createProject,
  findProjectsByUser,
  findProjectById,
  updateProject,
  deleteProject,
  createArtSession,
  findArtSessionsByProject,
  findArtSessionById,
  updateArtSession,
  deleteArtSession,
  createReference,
  findReferenceByProject,
  updateReference,
  deleteReference,
  createCollection,
  findCollectionsByUser,
  findCollectionById,
  updateCollectionName,
  deleteCollection,
  addProjectToCollection,
  removeProjectFromCollection
};