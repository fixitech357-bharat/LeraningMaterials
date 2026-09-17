import { User, Role, Setting } from '@/models';
import { cacheDelPattern } from '@/utils/redis';

export class AdminService {
  static async getDashboardStats() {
    const [users, tutorials, courses, quizzes, enrollments, revenue] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: { $ne: 'admin' } }),
      (await import('@/models')).Tutorial.countDocuments({ isPublished: true }),
      (await import('@/models')).Course.countDocuments({ isPublished: true }),
      (await import('@/models')).Quiz.countDocuments({ isPublished: true }),
      (await import('@/models')).Enrollment.countDocuments(),
      (await import('@/services/PaymentService')).PaymentService.getRevenueStats(),
    ]);

    return {
      totalUsers: users,
      totalTutorials: tutorials,
      totalCourses: courses,
      totalQuizzes: quizzes,
      totalEnrollments: enrollments,
      revenue,
    };
  }

  static async getUsers(page: number = 1, limit: number = 50, filters: any = {}) {
    const { search, role, status, sort = 'createdAt:desc' } = filters;
    const query: any = {};
    if (search) query.$or = [{ displayName: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    if (role) query.role = role;
    if (status) query.status = status;

    const [sortField, sortDir] = sort.split(':');
    const sortObj: any = { [sortField]: sortDir === 'desc' ? -1 : 1 };
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .select('-password')
        .populate('role', 'name slug')
        .exec(),
      User.countDocuments(query),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async updateUser(userId: string, data: any) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    if (data.role) {
      const role = await Role.findById(data.role);
      if (!role) throw new Error('Role not found');
    }
    if (data.status) {
      user.status = data.status;
    }
    if (data.role) user.role = data.role;
    if (data.displayName) user.displayName = data.displayName;
    if (data.bio !== undefined) user.bio = data.bio;
    await user.save();
    await cacheDelPattern('user:*');
    return user;
  }

  static async getSettings() {
    return Setting.find().sort({ group: 1, key: 1 }).exec();
  }

  static async updateSettings(settings: any[]) {
    const ops = settings.map((s) => ({
      updateOne: {
        filter: { key: s.key },
        update: { $set: { value: s.value, group: s.group, updatedAt: new Date() } },
        upsert: true,
      },
    }));
    await Setting.bulkWrite(ops);
  }

  static async getAnalytics() {
    const { Tutorial, Course, QuizAttempt, Enrollment } = await import('@/models');
    const [tutorialViews, courseEnrollments, quizAttempts, recentUsers] = await Promise.all([
      Tutorial.aggregate([{ $group: { _id: null, totalViews: { $sum: '$views' } } }]),
      Enrollment.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$enrolledAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
      QuizAttempt.aggregate([
        { $group: { _id: '$passed', count: { $sum: 1 } } },
      ]),
      User.find().sort({ createdAt: -1 }).limit(10).select('displayName email createdAt').exec(),
    ]);

    return {
      tutorialViews: tutorialViews[0]?.totalViews || 0,
      courseEnrollments,
      quizAttempts,
      recentUsers,
    };
  }
}

export default AdminService;