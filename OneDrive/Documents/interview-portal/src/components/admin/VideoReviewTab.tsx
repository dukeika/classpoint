// src/components/admin/VideoReviewTab.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  Star,
  FileText,
  Clock,
  User,
  Building,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Download,
  Share
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface VideoTestAttemptReview {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  testTitle: string;
  submittedAt: string;
  duration: number; // in minutes
  recordings: VideoRecording[];
  overallScore?: number;
  reviewStatus: 'pending' | 'in_review' | 'completed';
  reviewer?: string;
  reviewedAt?: string;
  feedback?: string;
  recommendation?: 'strong_hire' | 'hire' | 'maybe' | 'no_hire' | 'strong_no_hire';
}

export interface VideoRecording {
  questionId: string;
  questionText: string;
  videoUrl: string;
  duration: number; // in seconds
  transcription?: string;
  score?: number;
  notes?: string;
}

export interface VideoReviewTabProps {
  className?: string;
}

// Mock data for demonstration
const mockVideoReviews: VideoTestAttemptReview[] = [
  {
    id: '1',
    candidateId: 'candidate-1',
    candidateName: 'John Smith',
    candidateEmail: 'john.smith@email.com',
    jobTitle: 'Senior Frontend Developer',
    companyName: 'TechCorp Solutions',
    testTitle: 'Technical Video Assessment',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    duration: 45,
    recordings: [
      {
        questionId: '1',
        questionText: 'Tell us about a challenging project you worked on and how you overcame the obstacles.',
        videoUrl: '/demo-videos/question-1.mp4',
        duration: 180, // 3 minutes
        transcription: 'In my previous role at XYZ Company, I worked on a complex e-commerce platform that needed to handle high traffic during Black Friday...',
        score: 8
      },
      {
        questionId: '2', 
        questionText: 'How would you approach debugging a performance issue in a React application?',
        videoUrl: '/demo-videos/question-2.mp4',
        duration: 240, // 4 minutes
        transcription: 'When debugging performance issues in React, I would start by using the React Developer Tools profiler...',
        score: 9
      }
    ],
    overallScore: 8.5,
    reviewStatus: 'pending'
  },
  {
    id: '2',
    candidateId: 'candidate-2',
    candidateName: 'Jane Doe',
    candidateEmail: 'jane.doe@email.com',
    jobTitle: 'Product Manager',
    companyName: 'InnovateLabs',
    testTitle: 'Product Management Assessment',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    duration: 30,
    recordings: [
      {
        questionId: '1',
        questionText: 'Describe your approach to prioritizing features in a product roadmap.',
        videoUrl: '/demo-videos/question-3.mp4',
        duration: 210,
        score: 7
      }
    ],
    overallScore: 7,
    reviewStatus: 'completed',
    reviewer: 'Sarah Johnson',
    reviewedAt: new Date().toISOString(),
    feedback: 'Good understanding of product prioritization frameworks. Could benefit from more specific examples.',
    recommendation: 'hire'
  }
];

export const VideoReviewTab: React.FC<VideoReviewTabProps> = ({ className }) => {
  const [reviews, setReviews] = useState<VideoTestAttemptReview[]>(mockVideoReviews);
  const [selectedReview, setSelectedReview] = useState<VideoTestAttemptReview | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<VideoRecording | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_review' | 'completed'>('pending');
  
  // Video player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Review state
  const [reviewNotes, setReviewNotes] = useState('');
  const [questionScore, setQuestionScore] = useState<number>(0);
  const [overallFeedback, setOverallFeedback] = useState('');

  const filteredReviews = reviews.filter(review => 
    filter === 'all' ? true : review.reviewStatus === filter
  );

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (seekTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(seekTime, duration));
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecommendationColor = (recommendation?: string) => {
    switch (recommendation) {
      case 'strong_hire': return 'text-green-700 bg-green-100';
      case 'hire': return 'text-green-600 bg-green-50';
      case 'maybe': return 'text-yellow-600 bg-yellow-50';
      case 'no_hire': return 'text-red-600 bg-red-50';
      case 'strong_no_hire': return 'text-red-700 bg-red-100';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-700 bg-orange-100';
      case 'in_review': return 'text-blue-700 bg-blue-100';
      case 'completed': return 'text-green-700 bg-green-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const startReview = (review: VideoTestAttemptReview) => {
    setSelectedReview(review);
    setSelectedRecording(review.recordings[0]);
    setReviewNotes(review.recordings[0]?.notes || '');
    setQuestionScore(review.recordings[0]?.score || 0);
    setOverallFeedback(review.feedback || '');
    
    // Update status to in_review
    setReviews(prev => prev.map(r => 
      r.id === review.id ? { ...r, reviewStatus: 'in_review' } : r
    ));
  };

  const saveQuestionReview = () => {
    if (!selectedReview || !selectedRecording) return;

    setReviews(prev => prev.map(review => 
      review.id === selectedReview.id ? {
        ...review,
        recordings: review.recordings.map(rec =>
          rec.questionId === selectedRecording.questionId 
            ? { ...rec, score: questionScore, notes: reviewNotes }
            : rec
        )
      } : review
    ));

    // Move to next recording if available
    const currentIndex = selectedReview.recordings.findIndex(r => r.questionId === selectedRecording.questionId);
    if (currentIndex < selectedReview.recordings.length - 1) {
      const nextRecording = selectedReview.recordings[currentIndex + 1];
      setSelectedRecording(nextRecording);
      setQuestionScore(nextRecording.score || 0);
      setReviewNotes(nextRecording.notes || '');
    }
  };

  const completeReview = (recommendation: string) => {
    if (!selectedReview) return;

    const avgScore = selectedReview.recordings
      .filter(r => r.score)
      .reduce((sum, r) => sum + (r.score || 0), 0) / selectedReview.recordings.length;

    setReviews(prev => prev.map(review => 
      review.id === selectedReview.id ? {
        ...review,
        reviewStatus: 'completed',
        reviewer: 'Current User', // Would be actual reviewer name
        reviewedAt: new Date().toISOString(),
        feedback: overallFeedback,
        recommendation: recommendation as any,
        overallScore: Math.round(avgScore * 10) / 10
      } : review
    ));

    setSelectedReview(null);
    setSelectedRecording(null);
  };

  if (selectedReview && selectedRecording) {
    return (
      <div className={className}>
        <div className="bg-white rounded-lg shadow-sm">
          {/* Review Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Video Review: {selectedReview.candidateName}
                </h2>
                <p className="text-sm text-gray-600">
                  {selectedReview.jobTitle} at {selectedReview.companyName}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedReview(null)}
              >
                Back to List
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <div className="bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-96 object-contain"
                  onTimeUpdate={handleVideoTimeUpdate}
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  poster="/video-placeholder.png"
                >
                  <source src={selectedRecording.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Video Controls */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4 mb-3">
                  <button
                    onClick={() => handleSeek(currentTime - 10)}
                    className="p-2 text-gray-600 hover:text-gray-800"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={togglePlayPause}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  
                  <button
                    onClick={() => handleSeek(currentTime + 10)}
                    className="p-2 text-gray-600 hover:text-gray-800"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={toggleMute}
                    className="p-2 text-gray-600 hover:text-gray-800"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{formatTime(currentTime)}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-700">
                  <strong>Question:</strong> {selectedRecording.questionText}
                </div>
              </div>

              {/* Question Navigation */}
              <div className="mt-4 flex space-x-2">
                {selectedReview.recordings.map((recording, index) => (
                  <button
                    key={recording.questionId}
                    onClick={() => {
                      setSelectedRecording(recording);
                      setQuestionScore(recording.score || 0);
                      setReviewNotes(recording.notes || '');
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedRecording.questionId === recording.questionId
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Question {index + 1}
                    {recording.score && (
                      <span className="ml-2 text-xs">({recording.score}/10)</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Review Panel */}
            <div className="space-y-6">
              {/* Question Scoring */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Score This Answer</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Score (1-10)
                  </label>
                  <div className="flex space-x-2">
                    {[1,2,3,4,5,6,7,8,9,10].map(score => (
                      <button
                        key={score}
                        onClick={() => setQuestionScore(score)}
                        className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                          questionScore === score
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes for this question
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add your notes about this answer..."
                  />
                </div>

                <Button
                  onClick={saveQuestionReview}
                  className="w-full"
                  size="sm"
                >
                  Save & Continue
                </Button>
              </div>

              {/* Transcription */}
              {selectedRecording.transcription && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Transcription</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedRecording.transcription}
                  </p>
                </div>
              )}

              {/* Overall Review */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Overall Review</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Feedback
                  </label>
                  <textarea
                    value={overallFeedback}
                    onChange={(e) => setOverallFeedback(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Provide overall feedback for this candidate..."
                  />
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Recommendation</h4>
                  {[
                    { value: 'strong_hire', label: 'Strong Hire', color: 'bg-green-600' },
                    { value: 'hire', label: 'Hire', color: 'bg-green-500' },
                    { value: 'maybe', label: 'Maybe', color: 'bg-yellow-500' },
                    { value: 'no_hire', label: 'No Hire', color: 'bg-red-500' },
                    { value: 'strong_no_hire', label: 'Strong No Hire', color: 'bg-red-600' }
                  ].map(rec => (
                    <button
                      key={rec.value}
                      onClick={() => completeReview(rec.value)}
                      className={`w-full p-2 text-white rounded text-sm font-medium hover:opacity-90 transition-opacity ${rec.color}`}
                    >
                      {rec.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main review list view
  return (
    <div className={className}>
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Video Interview Reviews</h2>
            <div className="flex items-center space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Reviews</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="divide-y divide-gray-200">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No video reviews found</h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'No video interview submissions to review yet.'
                  : `No ${filter} video reviews found.`
                }
              </p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {review.candidateName}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(review.reviewStatus)}`}>
                        {review.reviewStatus.replace('_', ' ')}
                      </span>
                      {review.recommendation && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRecommendationColor(review.recommendation)}`}>
                          {review.recommendation.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{review.candidateEmail}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4" />
                        <span>{review.jobTitle}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{review.duration} min test</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>{review.recordings.length} questions</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Submitted {new Date(review.submittedAt).toLocaleDateString()}</span>
                      {review.overallScore && (
                        <span>Score: {review.overallScore}/10</span>
                      )}
                      {review.reviewer && (
                        <span>Reviewed by {review.reviewer}</span>
                      )}
                    </div>

                    {review.feedback && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-900">{review.feedback}</p>
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    <Button
                      onClick={() => startReview(review)}
                      className="text-sm"
                      disabled={review.reviewStatus === 'completed'}
                    >
                      {review.reviewStatus === 'completed' ? 'View Review' : 'Start Review'}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoReviewTab;