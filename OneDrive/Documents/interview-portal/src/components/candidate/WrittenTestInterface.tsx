// File: src/components/candidate/WrittenTestInterface.tsx (Fixed version)
import { useState, useEffect, useCallback, useRef } from "react";
import { Test, TestAttempt } from "./types";
import { Button } from "@/components/ui/button";
import {
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

interface WrittenTestInterfaceProps {
  test: Test;
  attempt: TestAttempt;
  onAnswerChange: (questionId: string, answer: any) => void;
  onSubmit: () => Promise<TestAttempt>;
  onAbandon: () => void;
  onTimeUpdate: (timeRemaining: number) => void;
}

export default function WrittenTestInterface({
  test,
  attempt,
  onAnswerChange,
  onSubmit,
  onAbandon,
  onTimeUpdate,
}: WrittenTestInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(attempt.timeRemaining);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const autoSubmitRef = useRef(false);

  const currentQuestion = test.questions[currentQuestionIndex];
  const totalQuestions = test.questions.length;
  const answeredQuestions = Object.keys(attempt.answers).length;

  // Handle auto-submit when time expires
  const handleAutoSubmit = useCallback(async () => {
    if (isSubmitting || autoSubmitRef.current) return;
    autoSubmitRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit();
    } catch (error) {
      console.error("Auto-submit failed:", error);
    }
  }, [isSubmitting, onSubmit]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = Math.max(0, prev - 1);
        onTimeUpdate(newTime);

        if (newTime === 0 && !autoSubmitRef.current) {
          handleAutoSubmit();
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeUpdate, handleAutoSubmit]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (answer: any) => {
    onAnswerChange(currentQuestion.id, answer);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit();
    } catch (error) {
      console.error("Submit failed:", error);
      setIsSubmitting(false);
    }
  };

  const getTimeWarningColor = () => {
    if (timeRemaining <= 300) return "text-red-600"; // Last 5 minutes
    if (timeRemaining <= 900) return "text-yellow-600"; // Last 15 minutes
    return "text-green-600";
  };

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case "multiple_choice":
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <label
                key={index}
                className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={index}
                  checked={attempt.answers[currentQuestion.id] === index}
                  onChange={() => handleAnswerChange(index)}
                  className="mt-1 text-abhh-teal-600 focus:ring-abhh-teal-600"
                />
                <span className="text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        );

      case "text":
        return (
          <div>
            <textarea
              value={attempt.answers[currentQuestion.id] || ""}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              rows={6}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-abhh-teal-600 focus:border-abhh-teal-600 resize-none bg-white text-gray-900 placeholder-gray-500"
            />
            <p className="text-sm text-gray-500 mt-2">
              Please provide a detailed answer explaining your reasoning.
            </p>
          </div>
        );

      default:
        return <div>Question type not supported</div>;
    }
  };

  if (showSubmitConfirm) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Submit Test?
          </h2>
          <p className="text-gray-600 mb-6">
            You have answered {answeredQuestions} out of {totalQuestions}{" "}
            questions. Once submitted, you cannot make changes.
          </p>

          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowSubmitConfirm(false)}
              disabled={isSubmitting}
            >
              Review Answers
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-abhh-teal-600 hover:bg-abhh-teal-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Test"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
            <p className="text-gray-600">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>

          <div className="flex items-center space-x-6">
            <div
              className={`flex items-center space-x-2 ${getTimeWarningColor()}`}
            >
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg font-semibold">
                {formatTime(timeRemaining)}
              </span>
            </div>

            <Button
              variant="outline"
              onClick={onAbandon}
              className="text-red-600 border-red-600 hover:bg-red-50"
              disabled={isSubmitting}
            >
              Exit Test
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Progress</span>
            <span>
              {answeredQuestions}/{totalQuestions} answered
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-abhh-teal-600 h-2 rounded-full transition-all"
              style={{
                width: `${(answeredQuestions / totalQuestions) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-abhh-teal-100 text-abhh-teal-800 text-sm font-medium rounded-full">
                {currentQuestion.category}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                {currentQuestion.difficulty}
              </span>
              <span className="text-sm text-gray-500">
                {currentQuestion.points} points
              </span>
            </div>

            {attempt.answers[currentQuestion.id] !== undefined && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {currentQuestion.question}
          </h2>
        </div>

        {renderQuestion()}
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() =>
              setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
            }
            disabled={currentQuestionIndex === 0 || isSubmitting}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-2">
            {test.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                disabled={isSubmitting}
                className={`w-8 h-8 rounded-full text-sm font-medium ${
                  index === currentQuestionIndex
                    ? "bg-abhh-teal-600 text-white"
                    : attempt.answers[test.questions[index].id] !== undefined
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex === totalQuestions - 1 ? (
            <Button
              onClick={() => setShowSubmitConfirm(true)}
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit Test
            </Button>
          ) : (
            <Button
              onClick={() =>
                setCurrentQuestionIndex(
                  Math.min(totalQuestions - 1, currentQuestionIndex + 1)
                )
              }
              disabled={isSubmitting}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
