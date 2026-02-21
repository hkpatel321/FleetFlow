const prisma = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { UnauthorizedError, ConflictError } = require('../errors');

/**
 * Register a new user
 */
const register = async ({ email, password, role }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError('A user with this email already exists.');
  }

  const password_hash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, password_hash, role },
    select: { id: true, email: true, role: true, created_at: true },
  });

  const token = generateToken(user);
  return { user, token };
};

/**
 * Login with email and password
 */
const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    },
    token,
  };
};

/**
 * Get user profile by ID
 */
const getProfile = async (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, created_at: true },
  });
};

module.exports = { register, login, getProfile };
