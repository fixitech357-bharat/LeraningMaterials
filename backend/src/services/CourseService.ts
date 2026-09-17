import { Types } from 'mongoose';
import { Course, Chapter, Enrollment, Review, User, Notification, Category } from '@/models';
import { sanitizeHtml, generateSlug } from '@/utils/helpers';
import { cacheSet, cacheDel, cacheDelPattern } from '@/utils/redis';

export class CourseService {
  static async createCourse(authorId: string, data: any) {
    const course = await Course.create({
      ...data,
      author: authorId,
      slug: generateSlug(data.title),
      isFree: data.price === 0,
      isPremium: data.price > 0,
    });
    return course;
  }

  static async addChapter(courseId: string, data: any) {
    const course = await Course.findById(courseId);
    if (!course) throw new Error('Course not found');

    const existingChapters = await Chapter.countDocuments({ course: courseId });
    const chapter = await Chapter.create({
      ...data,
      course: courseId,
      order: data.order || existingChapters + 1,
      content: data.content ? await sanitizeHtml(data.content) : '',
    });

    const totalChapters = await Chapter.countDocuments({ course: courseId });
    const totalDuration = await Chapter.find({ course: courseId }).then((chs) =>
      chs.reduce((sum, ch) => sum + (ch.videoDuration || 0), 0)
    );

    await Course.updateOne({ _id: courseId }, { totalChapters, totalDuration });
    await cacheDelPattern('courses:*');
    return chapter;
  }

  static async getCourseBySlug(slug: string) {
    const cacheKey = `course:slug:${slug}`;
    const cached = await (await import('@/utils/redis')).cacheGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const course = await Course.findOne({ slug })
      .populate('category', 'name slug')
      .populate('author', 'displayName avatar slug bio')
      .populate({
        path: 'chapters',
        sort: { order: 1 },
      })
      .exec();

    if (course) {
      await cacheSet(cacheKey, JSON.stringify(course), 3600);
    }
    return course;
  }

  static async enroll(courseId: string, userId: string) {
    const existing = await Enrollment.findOne({ course: courseId, user: userId });
    if (existing) throw new Error('Already enrolled');

    const enrollment = await Enrollment.create({ course: courseId, user: userId });
    await Course.updateOne({ _id: courseId }, { $inc: { enrolledCount: 1 } });

    // Notify
    const course = await Course.findById(courseId);
    if (course) {
      await Notification.create({
        user: userId,
        type: 'enrollment',
        title: 'Enrollment Confirmed',
        message: `You have enrolled in "${course.title}"`,
        link: `/course/${course.slug}`,
      });
    }

    return enrollment;
  }

  static async updateProgress(courseId: string, userId: string, chapterId: string, completed: boolean) {
    const enrollment = await Enrollment.findOne({ course: courseId, user: userId });
    if (!enrollment) throw new Error('Not enrolled');

    if (completed) {
      if (!enrollment.completedChapters.includes(new Types.ObjectId(chapterId))) {
        enrollment.completedChapters.push(new Types.ObjectId(chapterId));
      }
    } else {
      enrollment.completedChapters = enrollment.completedChapters.filter(
        (id) => id.toString() !== chapterId
      );
    }

    const totalChapters = await Chapter.countDocuments({ course: courseId });
    enrollment.progress = Math.round((enrollment.completedChapters.length / totalChapters) * 100);
    enrollment.lastAccessed = new Date();

    if (enrollment.progress === 100 && !enrollment.completed) {
      enrollment.completed = true;
      enrollment.completedAt = new Date();
    }

    await enrollment.save();
    return enrollment;
  }

  static async getCourses(filters: any = {}, page: number = 1, limit: number = 20) {
    const { category, author, difficulty, isPremium, search, sort = 'createdAt:desc', skip = 0 } = filters;
    const query: any = { isPublished: true, isApproved: true };

    if (category) query.category = category;
    if (author) query.author = author;
    if (difficulty) query.difficulty = difficulty;
    if (isPremium !== undefined) query.isPremium = isPremium === 'true';
    if (search) query.$text = { $search: search };

    const [sortField, sortDir] = sort.split(':');
    const sortObj: any = { [sortField]: sortDir === 'desc' ? -1 : 1 };

    const [courses, total] = await Promise.all([
      Course.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug')
        .populate('author', 'displayName avatar')
        .exec(),
      Course.countDocuments(query),
    ]);

    return { courses, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async addReview(courseId: string, userId: string, rating: number, comment: string, title?: string) {
    const existing = await Review.findOne({ course: courseId, user: userId });
    if (existing) throw new Error('Already reviewed');

    const review = await Review.create({ course: courseId, user: userId, rating, comment, title });

    // Update course rating
    const reviews = await Review.find({ course: courseId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Course.updateOne({ _id: courseId }, { rating: avgRating });

    return review;
  }

  static async getEnrolledCourses(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [enrollments, total] = await Promise.all([
      Enrollment.find({ user: userId })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'course',
          populate: { path: 'author', select: 'displayName' },
        })
        .exec(),
      Enrollment.countDocuments({ user: userId }),
    ]);

    return { enrollments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export default CourseService;