export interface QuizAnswerDetail {
  questionId: string;
  questionText: string;
  selectedOption: string;
  correctOption: string;
  correct: boolean;
  pointsEarned: number;
}

export interface QuizResult {
  id: string;
  quizId: string;
  lessonId: string;
  studentId: string;
  courseId: string;
  disciplineId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  scorePercentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  attempts: number;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuizResultInput {
  quizId: string;
  lessonId: string;
  courseId: string;
  disciplineId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  scorePercentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  attempts: number;
  submittedAt?: string;
  answers: QuizAnswerDetail[];
}
