import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { z } from 'zod';
import { env } from '../config/env.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']).optional().default('STAFF')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const isHttpsOrProduction = env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production' || (env.CLIENT_URL && env.CLIENT_URL.startsWith('https://'));

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isHttpsOrProduction,
  sameSite: isHttpsOrProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/'
};

export const register = async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ where: { email: validated.email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validated.password, salt);

    const user = await User.create({
      name: validated.name,
      email: validated.email,
      password: hashedPassword,
      role: validated.role
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set Refresh Token in secure HttpOnly Cookie
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.errors });
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await User.findOne({ where: { email: validated.email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(validated.password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set Refresh Token in secure HttpOnly Cookie
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    res.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.errors });
    }
    next(error);
  }
};

export const refresh = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required.' });
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    return res.status(403).json({ error: 'Invalid or expired refresh token.' });
  }

  const user = await User.findByPk(decoded.id);
  if (!user) {
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    return res.status(404).json({ error: 'User no longer exists.' });
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  // Rotate Refresh Token in HttpOnly Cookie
  res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

  res.json({
    accessToken: newAccessToken
  });
};

export const logout = (req, res) => {
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
  res.json({ message: 'Logged out successfully' });
};
