const prisma = require('./prisma.js');

// db/queries.js
const findUserByEmail = async (email) => prisma.user.findUnique({ where: { email } });
const findUserByUsername = async (username) => prisma.user.findUnique({ where: { username } });
const createUser = async (data) => prisma.user.create({ data });

module.exports = { findUserByEmail, findUserByUsername, createUser };