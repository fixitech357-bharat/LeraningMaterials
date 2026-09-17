import { Request, Response } from 'express';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { logger } from '@/utils/logger';
import { AuthRequest, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/utils/auth';
import bcrypt from 'bcryptjs';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        res.status(400).json({ success: false, message: 'Email already registered' });
        return;
      }
      const studentRole = await Role.findOne({ slug: 'student' });
      const user = await User.create({
        email: email.toLowerCase(),
        password: await bcrypt.hash(password, 12),
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        role: studentRole?._id,
      });
      const role = 'student';
      const token = generateAccessToken({ _id: user._id.toString(), email: user.email, role });
      const refreshToken = generateRefreshToken({ _id: user._id.toString(), email: user.email, role });
      res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.status(201).json({
        success: true,
        data: {
          token,
          user: { id: user._id, email: user.email, displayName: user.displayName, role },
        },
      });
    } catch (error: any) {
      logger.error('Register error', { error });
      res.status(500).json({ success: false, message: 'Registration failed' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password').populate('role');
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }
      user.lastLogin = new Date();
      await user.save();
      const role = (user.role as any).slug;
      const token = generateAccessToken({ _id: user._id.toString(), email: user.email, role });
      const refreshToken = generateRefreshToken({ _id: user._id.toString(), email: user.email, role });
      res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.json({
        success: true,
        data: {
          token,
          user: { id: user._id, email: user.email, displayName: user.displayName, role },
        },
      });
    } catch (error: any) {
      logger.error('Login error', { error });
      res.status(500).json({ success: false, message: 'Login failed' });
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) {
        res.status(401).json({ success: false, message: 'Refresh token required' });
        return;
      }
      const decoded = verifyRefreshToken(token);
      const user = await User.findById(decoded._id).populate('role');
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid refresh token' });
        return;
      }
      const role = (user.role as any).slug;
      const accessToken = generateAccessToken({ _id: user._id.toString(), email: user.email, role });
      res.json({ success: true, data: { token: accessToken } });
    } catch (error) {
      res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out' });
  }

  static async getMe(req: AuthRequest, res: Response) {
    try {
      const user = await User.findById(req.user!._id).select('-password').populate('role');
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
  }
}