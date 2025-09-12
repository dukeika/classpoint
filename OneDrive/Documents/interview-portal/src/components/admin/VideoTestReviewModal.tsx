// VideoTestReviewModal.tsx - Video Test Review Interface for Admin
import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, User, Clock, Play, Pause, Volume2, VolumeX, SkipForward, SkipBack,
  ThumbsUp, ThumbsDown, Award, AlertCircle, MessageSquare, RotateCcw,
  Maximize, Minimize, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { testService } from '@/services/testService';
import { Application, VideoTestAttempt, VideoTest } from '@/API';

interface VideoTestReviewModalProps {
  application: Application & { candidateName: string; jobTitle: string; };
  isOpen: boolean;
  onClose: () => void;
  onApprove: (feedback?: string, scores?: Record<string, number>) => void;
  onReject: (reason: string) => void;
}

interface VideoQuestion {
  id: string;
  question: string;
  description?: string;
  timeLimit: number;
  points: number;
  preparationTime?: number;
  recordingUrl?: string;
  recordingDuration?: number;
  score?: number;
  feedback?: string;
}

export default function VideoTestReviewModal({ 
  application, 
  isOpen, 
  onClose, 
  onApprove, 
  onReject 
}: VideoTestReviewModalProps) {
  const [videoTestAttempt, setVideoTestAttempt] = useState<VideoTestAttempt | null>(null);
  const [videoTest, setVideoTest] = useState<VideoTest | null>(null);
  const [questions, setQuestions] = useState<VideoQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [questionScores, setQuestionScores] = useState<Record<string, number>>({});
  const [questionFeedback, setQuestionFeedback] = useState<Record<string, string>>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && application) {
      loadVideoTestData();
    }
  }, [isOpen, application]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [questions, currentQuestionIndex]);

  const loadVideoTestData = async () => {
    try {
      setLoading(true);
      
      // Get the video test attempt for this application
      const attempts = Array.isArray(application.videoTestAttempts) ? application.videoTestAttempts : 
                      (application.videoTestAttempts?.items || []);
      const latestAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;
      
      if (!latestAttempt) {
        console.error('No video test attempt found');
        return;
      }

      // Get the video test details
      const testDetails = await testService.getVideoTest(latestAttempt.videoTestId);
      
      if (!testDetails) {
        console.error('Video test not found');
        return;
      }

      setVideoTestAttempt(latestAttempt);
      setVideoTest(testDetails);

      // Parse questions and recordings
      const testQuestions = JSON.parse(testDetails.questions || '[]');
      const recordings = latestAttempt.recordings ? JSON.parse(latestAttempt.recordings as string) : {};
      
      const videoQuestions: VideoQuestion[] = testQuestions.map((q: any) => {
        const recording = recordings[q.id];
        return {
          id: q.id,
          question: q.question,
          description: q.description,
          timeLimit: q.timeLimit,
          points: q.points,
          preparationTime: q.preparationTime,
          recordingUrl: recording?.url, // This would come from S3 or storage service
          recordingDuration: recording?.duration,
          score: questionScores[q.id] || 0,
          feedback: questionFeedback[q.id] || ''
        };
      });

      setQuestions(videoQuestions);
    } catch (error) {
      console.error('Error loading video test data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
  };

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleFullscreenToggle = () => {
    if (!isFullscreen && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleQuestionScore = (questionId: string, score: number) => {
    setQuestionScores(prev => ({ ...prev, [questionId]: score }));
  };

  const handleQuestionFeedback = (questionId: string, feedback: string) => {
    setQuestionFeedback(prev => ({ ...prev, [questionId]: feedback }));
  };

  const calculateTotalScore = () => {
    const total = Object.values(questionScores).reduce((sum, score) => sum + score, 0);
    const possible = questions.reduce((sum, q) => sum + q.points, 0);
    return { total, possible, percentage: possible > 0 ? Math.round((total / possible) * 100) : 0 };
  };

  const handleApprove = () => {
    onApprove(feedback, questionScores);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    onReject(rejectionReason);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading video test review...</p>
        </div>
      </div>
    );
  }

  if (!videoTestAttempt || !videoTest || questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-800">Unable to load video test data</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const scoreData = calculateTotalScore();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-900 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Video className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-bold">Video Test Review</h2>
                <p className="text-sm text-gray-300">{videoTest.title} - {application.candidateName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Video Player Section */}
          <div className="flex-1 flex flex-col bg-black" ref={containerRef}>
            {/* Video Player */}
            <div className="flex-1 relative">
              {currentQuestion.recordingUrl ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  src={currentQuestion.recordingUrl}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <Video className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400">No recording available for this question</p>
                  </div>
                </div>
              )}
              
              {/* Video Controls Overlay */}
              {currentQuestion.recordingUrl && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePlayPause}
                      className="text-white hover:bg-white/20"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMuteToggle}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    
                    {/* Progress Bar */}
                    <div className="flex-1 mx-4">
                      <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={(e) => handleSeek(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-300 mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFullscreenToggle}
                      className="text-white hover:bg-white/20"
                    >
                      {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Question Navigation */}
            <div className="bg-gray-900 p-4 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="text-white hover:bg-white/20"
                >
                  <SkipBack className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                <div className="text-center text-white">
                  <div className="text-sm text-gray-300">Question {currentQuestionIndex + 1} of {questions.length}</div>
                  <div className="font-medium">{currentQuestion.question}</div>
                  {currentQuestion.description && (
                    <div className="text-sm text-gray-400 mt-1">{currentQuestion.description}</div>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="text-white hover:bg-white/20"
                >
                  Next
                  <SkipForward className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* Scoring Panel */}
          <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Question Scoring</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Current Question Score */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-blue-900">Question {currentQuestionIndex + 1}</span>
                  <span className="text-sm text-blue-700">{currentQuestion.points} points max</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-1">Score</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max={currentQuestion.points}
                        value={questionScores[currentQuestion.id] || 0}
                        onChange={(e) => handleQuestionScore(currentQuestion.id, Math.min(currentQuestion.points, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-sm text-gray-500">/ {currentQuestion.points}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-1">Question Feedback</label>
                    <textarea
                      value={questionFeedback[currentQuestion.id] || ''}
                      onChange={(e) => handleQuestionFeedback(currentQuestion.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Specific feedback for this question..."
                    />
                  </div>
                </div>
              </div>

              {/* Overall Score Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Overall Score</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Points:</span>
                    <span className="font-medium">{scoreData.total} / {scoreData.possible}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Percentage:</span>
                    <span className="font-medium">{scoreData.percentage}%</span>
                  </div>
                </div>
              </div>

              {/* Question List */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">All Questions</h4>
                <div className="space-y-2">
                  {questions.map((question, index) => (
                    <button
                      key={question.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        index === currentQuestionIndex 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">Q{index + 1}</div>
                          <div className="text-xs text-gray-600 truncate">{question.question}</div>
                        </div>
                        <div className="text-right ml-2">
                          <div className="text-sm font-medium">
                            {questionScores[question.id] || 0}/{question.points}
                          </div>
                          {question.recordingUrl ? (
                            <div className="text-xs text-green-600">Recorded</div>
                          ) : (
                            <div className="text-xs text-gray-400">No recording</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {/* Overall Feedback */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Feedback for Candidate
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Provide overall feedback about the candidate's video responses..."
            />
          </div>

          {/* Rejection Form */}
          {showRejectionForm && (
            <div className="mb-4 p-4 border border-red-200 rounded-lg bg-red-50">
              <label className="block text-sm font-medium text-red-700 mb-2">
                Reason for Rejection *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-red-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={2}
                placeholder="Please provide a clear reason for rejecting this application..."
                required
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {!showRejectionForm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowRejectionForm(true)}
                  className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectionForm(false);
                      setRejectionReason('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReject}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Confirm Rejection
                  </Button>
                </div>
              )}
            </div>

            {!showRejectionForm && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Score</div>
                  <div className="text-lg font-bold text-blue-600">
                    {scoreData.total}/{scoreData.possible} ({scoreData.percentage}%)
                  </div>
                </div>
                <Button
                  onClick={handleApprove}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Approve & Progress
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}