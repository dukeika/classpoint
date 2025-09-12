// File: src/hooks/useVideoData.ts
import { useState, useEffect, useCallback } from "react";
import {
  VideoTest,
  VideoTestAttempt,
  VideoRecording,
  VideoQuestion,
} from "@/components/candidate/types";

// Mock video test data
const mockVideoTests: VideoTest[] = [
  {
    id: "videotest1",
    jobId: "1",
    title: "Frontend Developer Video Interview",
    description:
      "Video interview assessment for Senior Frontend Developer position",
    instructions:
      "You'll be presented with behavioral and technical questions. Take 15 seconds to read each question, then record your response. Maximum 2 minutes per question.",
    questions: [
      {
        id: "vq1",
        question:
          "Tell us about yourself and why you're interested in this position.",
        description:
          "Introduce yourself professionally and explain your motivation for applying.",
        prepTime: 15,
        recordTime: 120,
        category: "Introduction",
        points: 20,
        tips: [
          "Keep it professional and relevant",
          "Mention key achievements",
          "Connect your experience to the role",
        ],
      },
      {
        id: "vq2",
        question:
          "Describe a challenging project you worked on and how you overcame obstacles.",
        description:
          "Focus on problem-solving skills and technical challenges.",
        prepTime: 15,
        recordTime: 120,
        category: "Technical Experience",
        points: 25,
        tips: [
          "Use the STAR method (Situation, Task, Action, Result)",
          "Be specific about your contributions",
          "Mention technologies used",
        ],
      },
      {
        id: "vq3",
        question:
          "How do you stay updated with the latest frontend technologies and best practices?",
        description: "Demonstrate your commitment to continuous learning.",
        prepTime: 15,
        recordTime: 120,
        category: "Professional Development",
        points: 20,
        tips: [
          "Mention specific resources you use",
          "Talk about recent technologies you've learned",
          "Show passion for your field",
        ],
      },
      {
        id: "vq4",
        question:
          "Describe a time when you had to work with a difficult team member. How did you handle it?",
        description: "Show your interpersonal and conflict resolution skills.",
        prepTime: 15,
        recordTime: 120,
        category: "Teamwork",
        points: 25,
        tips: [
          "Focus on professional communication",
          "Show empathy and understanding",
          "Highlight positive outcomes",
        ],
      },
      {
        id: "vq5",
        question:
          "Where do you see yourself in your career five years from now?",
        description:
          "Discuss your career goals and alignment with the company.",
        prepTime: 15,
        recordTime: 120,
        category: "Career Goals",
        points: 10,
        tips: [
          "Show ambition but be realistic",
          "Align goals with company growth",
          "Mention skills you want to develop",
        ],
      },
    ],
    totalPoints: 100,
    createdAt: "2024-08-15",
    isActive: true,
  },
  {
    id: "videotest2",
    jobId: "2",
    title: "Product Manager Video Interview",
    description:
      "Behavioral and strategic thinking assessment for Product Manager role",
    instructions:
      "Focus on your product management experience, strategic thinking, and leadership skills. Each question has 15 seconds prep time and 2 minutes recording time.",
    questions: [
      {
        id: "vq2_1",
        question:
          "Tell us about a product feature you successfully launched from concept to market.",
        description:
          "Demonstrate your end-to-end product management experience.",
        prepTime: 15,
        recordTime: 120,
        category: "Product Experience",
        points: 30,
        tips: [
          "Include market research and user feedback",
          "Mention metrics and success criteria",
          "Discuss challenges and how you overcame them",
        ],
      },
      {
        id: "vq2_2",
        question:
          "How do you prioritize features when you have limited development resources?",
        description:
          "Show your strategic thinking and decision-making process.",
        prepTime: 15,
        recordTime: 120,
        category: "Strategy",
        points: 25,
        tips: [
          "Mention frameworks you use (e.g., RICE, MoSCoW)",
          "Consider business impact and user needs",
          "Discuss stakeholder communication",
        ],
      },
      {
        id: "vq2_3",
        question:
          "Describe a time when you had to make a difficult product decision with incomplete data.",
        description:
          "Demonstrate your ability to make decisions under uncertainty.",
        prepTime: 15,
        recordTime: 120,
        category: "Decision Making",
        points: 25,
        tips: [
          "Explain your thought process",
          "Mention how you gathered additional insights",
          "Discuss the outcome and lessons learned",
        ],
      },
      {
        id: "vq2_4",
        question:
          "How do you work with engineering teams to ensure product requirements are clearly understood?",
        description: "Show your collaboration and communication skills.",
        prepTime: 15,
        recordTime: 120,
        category: "Collaboration",
        points: 20,
        tips: [
          "Mention tools and processes you use",
          "Discuss how you handle requirement changes",
          "Show understanding of technical constraints",
        ],
      },
    ],
    totalPoints: 100,
    createdAt: "2024-08-10",
    isActive: true,
  },
];

export function useVideoData() {
  const [videoTests, setVideoTests] = useState<VideoTest[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<VideoTestAttempt | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setVideoTests(mockVideoTests);
  }, []);

  const getVideoTestForJob = useCallback(
    (jobId: string): VideoTest | null => {
      const test = videoTests.find(
        (test) => test.jobId === jobId && test.isActive
      );
      console.log(
        "🎥 Getting video test for job:",
        jobId,
        test ? "FOUND" : "NOT FOUND"
      );
      return test || null;
    },
    [videoTests]
  );

  const startVideoTest = useCallback(
    async (
      testId: string,
      applicationId: string
    ): Promise<VideoTestAttempt> => {
      const test = videoTests.find((t) => t.id === testId);
      if (!test) throw new Error("Video test not found");

      console.log(
        "🎥 Starting video test:",
        testId,
        "for application:",
        applicationId
      );

      const attempt: VideoTestAttempt = {
        id: `video_attempt_${Date.now()}`,
        testId,
        candidateId: "current_user",
        applicationId,
        startedAt: new Date().toISOString(),
        status: "in_progress",
        currentQuestionIndex: 0,
        recordings: {},
      };

      setCurrentAttempt(attempt);
      return attempt;
    },
    [videoTests]
  );

  const saveRecording = useCallback(
    (questionId: string, recording: VideoRecording) => {
      if (!currentAttempt) return;

      console.log("🎥 Saving recording for question:", questionId);

      setCurrentAttempt((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          recordings: {
            ...prev.recordings,
            [questionId]: recording,
          },
        };
      });
    },
    [currentAttempt]
  );

  const moveToNextQuestion = useCallback(() => {
    if (!currentAttempt) return;

    const test = videoTests.find((t) => t.id === currentAttempt.testId);
    if (!test) return;

    const nextIndex = currentAttempt.currentQuestionIndex + 1;
    console.log(
      "🎥 Moving to next question:",
      nextIndex,
      "of",
      test.questions.length
    );

    if (nextIndex < test.questions.length) {
      setCurrentAttempt((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentQuestionIndex: nextIndex,
        };
      });
    }
  }, [currentAttempt, videoTests]);

  const submitVideoTest = useCallback(async (): Promise<VideoTestAttempt> => {
    if (!currentAttempt) throw new Error("No active video test attempt");

    const test = videoTests.find((t) => t.id === currentAttempt.testId);
    if (!test) throw new Error("Video test not found");

    console.log(
      "🎥 Submitting video test with",
      Object.keys(currentAttempt.recordings).length,
      "recordings"
    );

    // Calculate total score based on completed recordings
    const recordingsCount = Object.keys(currentAttempt.recordings).length;
    const totalPossibleScore = test.totalPoints;
    const scorePerRecording = totalPossibleScore / test.questions.length;
    const totalScore = recordingsCount * scorePerRecording;

    const completedAttempt: VideoTestAttempt = {
      ...currentAttempt,
      completedAt: new Date().toISOString(),
      status: "completed",
      totalScore,
    };

    setCurrentAttempt(null);
    return completedAttempt;
  }, [currentAttempt, videoTests]);

  const abandonVideoTest = useCallback(() => {
    console.log("🎥 Abandoning video test");
    setCurrentAttempt(null);
  }, []);

  const getCurrentQuestion = useCallback((): VideoQuestion | null => {
    if (!currentAttempt) return null;

    const test = videoTests.find((t) => t.id === currentAttempt.testId);
    if (!test) return null;

    return test.questions[currentAttempt.currentQuestionIndex] || null;
  }, [currentAttempt, videoTests]);

  const isLastQuestion = useCallback((): boolean => {
    if (!currentAttempt) return false;

    const test = videoTests.find((t) => t.id === currentAttempt.testId);
    if (!test) return false;

    return currentAttempt.currentQuestionIndex === test.questions.length - 1;
  }, [currentAttempt, videoTests]);

  const getProgress = useCallback((): {
    current: number;
    total: number;
    percentage: number;
  } => {
    if (!currentAttempt) return { current: 0, total: 0, percentage: 0 };

    const test = videoTests.find((t) => t.id === currentAttempt.testId);
    if (!test) return { current: 0, total: 0, percentage: 0 };

    const recordingsCount = Object.keys(currentAttempt.recordings).length;
    const totalQuestions = test.questions.length;
    const percentage = Math.round((recordingsCount / totalQuestions) * 100);

    return {
      current: recordingsCount,
      total: totalQuestions,
      percentage,
    };
  }, [currentAttempt, videoTests]);

  return {
    videoTests,
    currentAttempt,
    loading,
    getVideoTestForJob,
    startVideoTest,
    saveRecording,
    moveToNextQuestion,
    submitVideoTest,
    abandonVideoTest,
    getCurrentQuestion,
    isLastQuestion,
    getProgress,
    setCurrentAttempt,
  };
}
