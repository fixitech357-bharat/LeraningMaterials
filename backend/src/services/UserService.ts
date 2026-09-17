import { Types } from 'mongoose';
import { User, Role, Badge, Enrollment, QuizAttempt, Tutorial, Course } from '@/models';
import { cacheGet, cacheSet, cacheDel } from '@/utils/redis';
import { logger } from '@/utils/logger';

export class UserService {
  static async getUserById(id: string | Types.ObjectId, populateRole = false) {
    const query = User.findById(id).select('-password');
    if (populateRole) query.populate('role');
    return query.exec();
  }

  static async getUserByEmail(email: string) {
    return User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('role')
      .exec();
  }

  static async updateUser(id: string, data: Partial<any>) {
    const user = await User.findById(id);
    if (!user) throw new Error('User not found');
    Object.assign(user, data);
    return user.save();
  }

  static async updateStreak(userId: string) {
    const user = await User.findById(userId);
    if (!user) return;
    const now = new Date();
    const lastUpdate = user.lastStreakUpdate || new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const diffDays = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      user.streak += 1;
    } else if (diffDays > 1) {
      user.streak = 1;
    }
    user.lastStreakUpdate = now;
    await user.save();
    await cacheDel(`user:${userId}:stats`);
  }

  static async addXP(userId: string, xp: number) {
    const user = await User.findById(userId);
    if (!user) return;
    user.xp += xp;
    const newLevel = Math.floor(Math.sqrt(user.xp / 100)) + 1;
    if (newLevel > user.level) {
      user.level = newLevel;
    }
    await user.save();
  }

  static async getUserStats(userId: string) {
    const cacheKey = `user:${userId}:stats`;
    const cached = await cacheGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const [enrollments, quizAttempts, tutorials, courses] = await Promise.all([
      Enrollment.countDocuments({ user: userId }),
      QuizAttempt.countDocuments({ user: userId }),
      Tutorial.countDocuments({ author: userId }),
      Course.countDocuments({ author: userId }),
    ]);

    const stats = {
      enrollments,
      quizAttempts,
      tutorials,
      courses,
      streak: (await User.findById(userId))?.streak || 0,
      xp: (await User.findById(userId))?.xp || 0,
      level: (await User.findById(userId))?.level || 1,
    };

    await cacheSet(cacheKey, JSON.stringify(stats), 300);
    return stats;
  }

  static async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) throw new Error('Cannot follow yourself');
    const [follower, following] = await Promise.all([
      User.findById(followerId),
      User.findById(followingId),
    ]);
    if (!follower || !following) throw new Error('User not found');

    if (!follower.following.includes(new Types.ObjectId(followingId))) {
      follower.following.push(new Types.ObjectId(followingId));
      following.followers.push(new Types.ObjectId(followerId));
      await Promise.all([follower.save(), following.save()]);
    }
  }

  static async unfollowUser(followerId: string, followingId: string) {
    const [follower, following] = await Promise.all([
      User.findById(followerId),
      User.findById(followingId),
    ]);
    if (!follower || !following) throw new Error('User not found');

    follower.following = follower.following.filter((id) => id.toString() !== followingId);
    following.followers = following.followers.filter((id) => id.toString() !== followerId);
    await Promise.all([follower.save(), following.save()]);
  }

  static async addBookmark(userId: string, tutorialId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    if (!user.bookmarks.includes(new Types.ObjectId(tutorialId))) {
      user.bookmarks.push(new Types.ObjectId(tutorialId));
      await user.save();
    }
  }

  static async removeBookmark(userId: string, tutorialId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    user.bookmarks = user.bookmarks.filter((id) => id.toString() !== tutorialId);
    await user.save();
  }

  static async checkBadges(userId: string) {
    const user = await User.findById(userId).populate('badges');
    if (!user) return [];
    const newBadges: any[] = [];

    // Streak badge
    if (user.streak >= 7) {
      const badge = await Badge.findOne({ slug: 'streak-7' });
      if (badge && !user.badges.some((b: any) => b._id.toString() === badge._id.toString())) {
        user.badges.push(badge._id);
        newBadges.push(badge);
      }
    }

    // Quiz badge
    const quizCount = await QuizAttempt.countDocuments({ user: userId, passed: true });
    if (quizCount >= 10) {
      const badge = await Badge.findOne({ slug: 'quiz-10' });
      if (badge && !user.badges.some((b: any) => b._id.toString() === badge._id.toString())) {
        user.badges.push(badge._id);
        newBadges.push(badge);
      }
    }

    await user.save();
    return newBadges;
  }

  static async getLeaderboard(limit: number = 10) {
    return User.find({ status: 'active' })
      .sort({ xp: -1 })
      .limit(limit)
      .select('displayName avatar xp level streak slug')
      .exec();
  }
}

export default UserService;