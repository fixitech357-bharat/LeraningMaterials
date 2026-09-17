import { Types } from 'mongoose';
import { Tutorial, Category, Comment, User, Notification, CodingProblem } from '@/models';
import { sanitizeHtml, generateSlug } from '@/utils/helpers';
import { cacheSet, cacheDel, cacheDelPattern } from '@/utils/redis';
import { logger } from '@/utils/logger';

export class TutorialService {
  static async createTutorial(authorId: string, data: any) {
    const sanitizedContent = await sanitizeHtml(data.content);
    const tutorial = await Tutorial.create({
      ...data,
      author: authorId,
      content: sanitizedContent,
      slug: generateSlug(data.title),
    });
    await Category.updateOne({ _id: tutorial.category }, { $inc: { articleCount: 1 } });
    await cacheDelPattern('tutorials:*');
    return tutorial;
  }

  static async updateTutorial(id: string, data: any, userId: string, userRole: string) {
    const tutorial = await Tutorial.findById(id);
    if (!tutorial) throw new Error('Tutorial not found');

    if (tutorial.author.toString() !== userId && userRole !== 'admin' && userRole !== 'moderator') {
      throw new Error('Not authorized');
    }

    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.content) {
      updateData.content = await sanitizeHtml(data.content);
    }
    if (data.title) {
      updateData.slug = generateSlug(data.title);
    }

    Object.assign(tutorial, updateData);
    return tutorial.save();
  }

  static async getTutorials(filters: any = {}, page: number = 1, limit: number = 20) {
    const { category, author, difficulty, language, isPremium, search, sort = 'createdAt:desc', skip = 0 } = filters;
    const query: any = { isPublished: true, isApproved: true };

    if (category) query.category = category;
    if (author) query.author = author;
    if (difficulty) query.difficulty = difficulty;
    if (language) query.language = language;
    if (isPremium !== undefined) query.isPremium = isPremium === 'true';
    if (search) query.$text = { $search: search };

    const [sortField, sortDir] = sort.split(':');
    const sortObj: any = { [sortField]: sortDir === 'desc' ? -1 : 1 };

    const [tutorials, total] = await Promise.all([
      Tutorial.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug')
        .populate('author', 'displayName avatar slug')
        .exec(),
      Tutorial.countDocuments(query),
    ]);

    return { tutorials, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getTutorialBySlug(slug: string) {
    const cacheKey = `tutorial:slug:${slug}`;
    const cached = await (await import('@/utils/redis')).cacheGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const tutorial = await Tutorial.findOne({ slug })
      .populate('category', 'name slug')
      .populate('author', 'displayName avatar slug bio')
      .populate({
        path: 'relatedTutorials',
        populate: { path: 'author', select: 'displayName' },
      })
      .exec();

    if (tutorial) {
      await cacheSet(cacheKey, JSON.stringify(tutorial), 3600);
    }
    return tutorial;
  }

  static async incrementView(id: string) {
    const tutorial = await Tutorial.findById(id);
    if (tutorial) {
      tutorial.views += 1;
      await tutorial.save();
    }
  }

  static async likeTutorial(userId: string, tutorialId: string) {
    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial) throw new Error('Tutorial not found');
    const userIdObj = new Types.ObjectId(userId);
    const hasLiked = tutorial.likes.includes(userIdObj);
    if (hasLiked) {
      tutorial.likes = tutorial.likes.filter((id) => id.toString() !== userId);
    } else {
      tutorial.likes.push(userIdObj);
      tutorial.dislikes = tutorial.dislikes.filter((id) => id.toString() !== userId);
    }
    await tutorial.save();
    return { liked: !hasLiked, likes: tutorial.likes.length };
  }

  static async addComment(tutorialId: string, userId: string, content: string, parentId?: string) {
    const comment = await Comment.create({
      tutorial: tutorialId,
      user: userId,
      content,
      parent: parentId || null,
    });
    await Tutorial.updateOne({ _id: tutorialId }, { $inc: { commentsCount: 1 } });
    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'displayName avatar slug')
      .exec();
    return populatedComment;
  }

  static async getComments(tutorialId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [comments, total] = await Promise.all([
      Comment.find({ tutorial: tutorialId, parent: null, isApproved: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'displayName avatar slug')
        .populate({
          path: 'replies',
          populate: { path: 'user', select: 'displayName avatar slug' },
        })
        .exec(),
      Comment.countDocuments({ tutorial: tutorialId, parent: null, isApproved: true }),
    ]);
    return { comments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async deleteTutorial(id: string) {
    const tutorial = await Tutorial.findByIdAndDelete(id);
    if (tutorial) {
      await Category.updateOne({ _id: tutorial.category }, { $inc: { articleCount: -1 } });
      await Comment.deleteMany({ tutorial: id });
      await cacheDelPattern('tutorials:*');
      await cacheDel(`tutorial:slug:${tutorial.slug}`);
    }
    return tutorial;
  }

  static async getRelated(tutorialId: string, limit: number = 5) {
    const tutorial = await Tutorial.findById(tutorialId).populate('category');
    if (!tutorial) return [];
    return Tutorial.find({
      _id: { $ne: tutorialId },
      category: tutorial.category,
      isPublished: true,
      isApproved: true,
    })
      .sort({ views: -1 })
      .limit(limit)
      .populate('author', 'displayName')
      .exec();
  }

  static async getTrending(limit: number = 10) {
    return Tutorial.find({ isPublished: true, isApproved: true })
      .sort({ views: -1, createdAt: -1 })
      .limit(limit)
      .populate('category', 'name slug')
      .populate('author', 'displayName avatar')
      .exec();
  }
}

export default TutorialService;