import { Types } from 'mongoose';
import { Quiz, Question, QuizAttempt, User, Notification, Tutorial } from '@/models';
import { cacheDelPattern } from '@/utils/redis';

export class QuizService {
  static async createQuiz(authorId: string, data: any) {
    const quiz = await Quiz.create({
      ...data,
      author: authorId,
      slug: require('@/utils/helpers').generateSlug(data.title),
    });
    return quiz;
  }

  static async addQuestion(quizId: string, data: any) {
    const question = await Question.create({ ...data, quiz: quizId });
    const totalPoints = await Question.find({ quiz: quizId }).then((qs) =>
      qs.reduce((sum, q) => sum + q.points, 0)
    );
    await Quiz.updateOne({ _id: quizId }, { totalPoints });
    return question;
  }

  static async getQuizBySlug(slug: string) {
    const quiz = await Quiz.findOne({ slug, isPublished: true, isApproved: true })
      .populate('category', 'name slug')
      .populate('author', 'displayName')
      .populate({
        path: 'questions',
        options: data.isPreview ? {} : { select: '-options.isCorrect -explanation' },
      })
      .exec();
    return quiz;
  }

  static async submitQuiz(quizId: string, userId: string, answers: any[], timeTaken: number) {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) throw new Error('Quiz not found');

    const questions = await Question.find({ quiz: quizId });
    let score = 0;
    const processedAnswers = answers.map((ans) => {
      const question = questions.find((q) => q._id.toString() === ans.question);
      if (!question) {
        return { question: ans.question, isCorrect: false, points: 0 };
      }

      let isCorrect = false;
      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        isCorrect = question.options[ans.selectedOption]?.isCorrect || false;
      } else if (question.type === 'fill_blank') {
        isCorrect = question.options[0]?.text?.toLowerCase().trim() === ans.answer?.toLowerCase().trim();
      }

      if (isCorrect) score += question.points;

      return {
        question: question._id,
        selectedOption: ans.selectedOption,
        answer: ans.answer,
        isCorrect,
        points: isCorrect ? question.points : 0,
      };
    });

    const percentage = Math.round((score / quiz.totalPoints) * 100);
    const passed = percentage >= quiz.passingScore;

    const attempt = await QuizAttempt.create({
      quiz: quizId,
      user: userId,
      answers: processedAnswers,
      score,
      totalPoints: quiz.totalPoints,
      percentage,
      passed,
      timeTaken,
      completedAt: new Date(),
    });

    await Quiz.updateOne({ _id: quizId }, { $inc: { attemptsCount: 1 } });

    // XP reward
    const { UserService } = await import('@/services/UserService');
    await UserService.addXP(userId, passed ? 50 : 10);
    await UserService.updateStreak(userId);

    // Notify
    await Notification.create({
      user: userId,
      type: 'quiz',
      title: passed ? 'Quiz Passed!' : 'Quiz Completed',
      message: `Score: ${percentage}% - ${passed ? 'Congratulations!' : 'Keep practicing!'}`,
      link: `/quiz/${quiz.slug}`,
    });

    return attempt;
  }

  static async getUserQuizAttempts(userId: string, quizId?: string) {
    const query: any = { user: userId };
    if (quizId) query.quiz = quizId;
    return QuizAttempt.find(query)
      .sort({ createdAt: -1 })
      .populate('quiz', 'title slug')
      .exec();
  }

  static async getQuizLeaderboard(quizId: string, limit: number = 10) {
    return QuizAttempt.find({ quiz: quizId, passed: true })
      .sort({ percentage: -1, timeTaken: 1 })
      .limit(limit)
      .populate('user', 'displayName avatar slug')
      .exec();
  }
}

export default QuizService;