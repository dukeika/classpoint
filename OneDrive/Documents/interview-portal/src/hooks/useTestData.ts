// File: src/hooks/useTestData.ts
import { useState, useEffect, useCallback } from "react";
import { Test, TestQuestion, TestAttempt } from "@/components/candidate/types";

// Mock test data
const mockTests: Test[] = [
  {
    id: "test1",
    jobId: "1",
    title: "Frontend Developer Assessment",
    description: "Technical assessment for Senior Frontend Developer position",
    instructions:
      "Please answer all questions to the best of your ability. You have 60 minutes to complete this test. Once you start, the timer cannot be paused.",
    timeLimit: 60, // 60 minutes
    totalPoints: 100,
    passingScore: 70,
    isActive: true,
    createdAt: "2024-08-15",
    questions: [
      {
        id: "q1",
        question: "What is the virtual DOM in React?",
        type: "multiple_choice",
        options: [
          "A direct copy of the real DOM",
          "A JavaScript representation of the real DOM kept in memory",
          "A database that stores DOM elements",
          "A tool for debugging React applications",
        ],
        correctAnswer: 1,
        points: 10,
        category: "React",
        difficulty: "medium",
      },
      {
        id: "q2",
        question:
          "Which of the following is the correct way to update state in a React functional component?",
        type: "multiple_choice",
        options: [
          "this.setState({value: newValue})",
          "useState.set(newValue)",
          "setValue(newValue)",
          "state.value = newValue",
        ],
        correctAnswer: 2,
        points: 10,
        category: "React",
        difficulty: "easy",
      },
      {
        id: "q3",
        question:
          "Explain the difference between let, const, and var in JavaScript.",
        type: "text",
        points: 15,
        category: "JavaScript",
        difficulty: "medium",
      },
      {
        id: "q4",
        question: "What is the purpose of useEffect in React?",
        type: "multiple_choice",
        options: [
          "To create side effects in functional components",
          "To update component state",
          "To render JSX elements",
          "To define component props",
        ],
        correctAnswer: 0,
        points: 10,
        category: "React",
        difficulty: "medium",
      },
      {
        id: "q5",
        question: "Which CSS property is used to make a flex container?",
        type: "multiple_choice",
        options: [
          "display: flexbox",
          "display: flex",
          "flex: container",
          "flex-direction: row",
        ],
        correctAnswer: 1,
        points: 10,
        category: "CSS",
        difficulty: "easy",
      },
    ],
  },
];

export function useTestData() {
  const [tests, setTests] = useState<Test[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<TestAttempt | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTests(mockTests);
  }, []);

  const getTestForJob = useCallback(
    (jobId: string): Test | null => {
      return (
        tests.find((test) => test.jobId === jobId && test.isActive) || null
      );
    },
    [tests]
  );

  const startTest = useCallback(
    async (testId: string, applicationId: string): Promise<TestAttempt> => {
      const test = tests.find((t) => t.id === testId);
      if (!test) throw new Error("Test not found");

      const attempt: TestAttempt = {
        id: `attempt_${Date.now()}`,
        testId,
        candidateId: "current_user",
        applicationId,
        startedAt: new Date().toISOString(),
        timeRemaining: test.timeLimit * 60, // Convert to seconds
        status: "in_progress",
        answers: {},
      };

      setCurrentAttempt(attempt);
      return attempt;
    },
    [tests]
  );

  const saveAnswer = useCallback(
    (questionId: string, answer: any) => {
      if (!currentAttempt) return;

      setCurrentAttempt((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          answers: {
            ...prev.answers,
            [questionId]: answer,
          },
        };
      });
    },
    [currentAttempt]
  );

  const submitTest = useCallback(async (): Promise<TestAttempt> => {
    if (!currentAttempt) throw new Error("No active test attempt");

    const test = tests.find((t) => t.id === currentAttempt.testId);
    if (!test) throw new Error("Test not found");

    // Calculate score
    let totalScore = 0;
    let maxScore = 0;

    test.questions.forEach((question) => {
      maxScore += question.points;
      const answer = currentAttempt.answers[question.id];

      if (
        question.type === "multiple_choice" &&
        answer === question.correctAnswer
      ) {
        totalScore += question.points;
      } else if (question.type === "text" && answer && answer.trim()) {
        // For text questions, give partial credit if answered
        totalScore += question.points * 0.8; // 80% for attempting
      }
    });

    const percentage = Math.round((totalScore / maxScore) * 100);
    const passed = percentage >= test.passingScore;

    const completedAttempt: TestAttempt = {
      ...currentAttempt,
      completedAt: new Date().toISOString(),
      status: "completed",
      score: totalScore,
      percentage,
      passed,
    };

    setCurrentAttempt(null);
    return completedAttempt;
  }, [currentAttempt, tests]);

  const abandonTest = useCallback(() => {
    setCurrentAttempt(null);
  }, []);

  return {
    tests,
    currentAttempt,
    loading,
    getTestForJob,
    startTest,
    saveAnswer,
    submitTest,
    abandonTest,
    setCurrentAttempt,
  };
}
