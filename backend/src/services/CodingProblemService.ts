import { CodingProblem, ProblemSubmission, User } from '@/models';
import { cacheDelPattern } from '@/utils/redis';

export class CodingProblemService {
  static async createProblem(authorId: string, data: any) {
    const problem = await CodingProblem.create({
      ...data,
      author: authorId,
      slug: require('@/utils/helpers').generateSlug(data.title),
    });
    return problem;
  }

  static async getProblems(filters: any = {}, page: number = 1, limit: number = 20) {
    const { difficulty, category, tags, search, sort = 'createdAt:desc', skip = 0 } = filters;
    const query: any = { isPublished: true, isApproved: true };

    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;
    if (tags) query.tags = { $in: tags };
    if (search) query.$text = { $search: search };

    const [sortField, sortDir] = sort.split(':');
    const sortObj: any = { [sortField]: sortDir === 'desc' ? -1 : 1 };

    const [problems, total] = await Promise.all([
      CodingProblem.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug')
        .populate('author', 'displayName')
        .exec(),
      CodingProblem.countDocuments(query),
    ]);

    return { problems, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getProblemBySlug(slug: string) {
    const problem = await CodingProblem.findOne({ slug })
      .populate('category', 'name slug')
      .populate('author', 'displayName')
      .exec();
    return problem;
  }

  static async submitProblem(userId: string, problemId: string, language: string, code: string) {
    const problem = await CodingProblem.findById(problemId);
    if (!problem) throw new Error('Problem not found');

    const submission = await ProblemSubmission.create({
      problem: problemId,
      user: userId,
      language,
      code,
    });

    // Judge0 evaluation (mock for now)
    const { evaluateCode } = await import('@/utils/judge0');
    const result = await evaluateCode(language, code, problem.testCases, problem.timeLimit, problem.memoryLimit);

    submission.status = result.status;
    submission.runtime = result.runtime;
    submission.memory = result.memory;
    submission.passedTests = result.passedTests;
    submission.totalTests = result.totalTests;
    await submission.save();

    // Update problem stats
    const totalSubmissions = await ProblemSubmission.countDocuments({ problem: problemId });
    const acceptedSubmissions = await ProblemSubmission.countDocuments({ problem: problemId, status: 'accepted' });
    await CodingProblem.updateOne(
      { _id: problemId },
      {
        $inc: { submissionsCount: 1 },
        acceptanceRate: totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0,
      }
    );

    // XP reward
    const { UserService } = await import('@/services/UserService');
    await UserService.addXP(userId, result.status === 'accepted' ? 75 : 5);
    await UserService.updateStreak(userId);

    return submission;
  }

  static async getUserSubmissions(userId: string, problemId?: string) {
    const query: any = { user: userId };
    if (problemId) query.problem = problemId;
    return ProblemSubmission.find(query)
      .sort({ createdAt: -1 })
      .populate('problem', 'title slug difficulty')
      .exec();
  }
}

export default CodingProblemService;