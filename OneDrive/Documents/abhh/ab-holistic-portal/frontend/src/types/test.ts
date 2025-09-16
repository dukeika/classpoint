export interface Question {
  questionId: string;
  type: 'mcq' | 'short_answer' | 'essay' | 'video_prompt';
  text: string;
  options?: string[]; // for MCQ
  correctAnswer?: string; // for auto-grading
  points?: number;
  timeLimit?: number; // for video questions in seconds
  required?: boolean;
  order: number;
}

export interface Test {
  testId: string;
  jobId: string;
  type: 'written' | 'video';
  title: string;
  description?: string;
  instructions: string;
  timeLimit: number; // minutes
  questions: Question[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  passingScore?: number;
  maxAttempts?: number;
  showResults?: boolean;
}

export interface TestFormData {
  title: string;
  description?: string;
  instructions: string;
  timeLimit: number;
  passingScore?: number;
  maxAttempts?: number;
  showResults?: boolean;
}

export interface QuestionFormData {
  type: Question['type'];
  text: string;
  options?: string[];
  correctAnswer?: string;
  points?: number;
  timeLimit?: number;
  required?: boolean;
}

export interface TestSubmission {
  submissionId: string;
  testId: string;
  applicantId: string;
  answers: Answer[];
  submittedAt: string;
  score?: number;
  timeSpent: number; // seconds
  status: 'submitted' | 'graded' | 'reviewed';
  adminReview?: string;
  gradeBy?: string;
  gradedAt?: string;
}

export interface Answer {
  questionId: string;
  response: string | string[]; // text or file URLs
  timeSpent?: number; // seconds
  isCorrect?: boolean; // for auto-graded questions
  points?: number; // points awarded
}

export interface TestStats {
  totalSubmissions: number;
  averageScore: number;
  passingRate: number;
  averageTimeSpent: number;
  completionRate: number;
}

export interface TestAttempt {
  attemptId: string;
  testId: string;
  applicationId: string;
  applicantId: string;
  startTime: string;
  endTime?: string;
  timeSpent: number;
  status: 'in-progress' | 'completed' | 'submitted' | 'expired';
  answers: Record<string, string | string[]>;
}

export interface TestSession {
  attemptId: string;
  test: Test;
  answers: Record<string, Answer>;
  currentQuestionIndex: number;
  timeRemaining: number;
  isSubmitted: boolean;
  startTime: number;
  flaggedQuestions: Set<string>;
}