// InterviewSchedulingModal.tsx - Schedule final interviews for candidates
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Video, MapPin, User, Mail, Phone, 
  CheckCircle, AlertCircle, Send, X, Plus, Trash2,
  ExternalLink, Copy, Settings, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Application } from '@/API';

interface InterviewSchedulingModalProps {
  application: Application & { candidateName: string; jobTitle: string; };
  isOpen: boolean;
  onClose: () => void;
  onScheduleInterview: (interviewData: InterviewData) => Promise<void>;
}

export interface InterviewData {
  applicationId: string;
  scheduledAt: string;
  duration: number; // in minutes
  type: 'video' | 'phone' | 'in_person';
  meetingUrl?: string;
  location?: string;
  interviewers: string[];
  instructions?: string;
  candidateInstructions?: string;
  agenda?: string[];
  preparationMaterials?: string[];
}

interface TimeSlot {
  id: string;
  datetime: string;
  available: boolean;
  duration: number;
}

export default function InterviewSchedulingModal({
  application,
  isOpen,
  onClose,
  onScheduleInterview
}: InterviewSchedulingModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [duration, setDuration] = useState<number>(60);
  const [interviewType, setInterviewType] = useState<'video' | 'phone' | 'in_person'>('video');
  const [meetingUrl, setMeetingUrl] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [interviewers, setInterviewers] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string>('');
  const [candidateInstructions, setCandidateInstructions] = useState<string>('');
  const [agenda, setAgenda] = useState<string[]>(['']);
  const [preparationMaterials, setPreparationMaterials] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'datetime' | 'details' | 'confirmation'>('datetime');

  // Generate available time slots
  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          id: timeString,
          datetime: timeString,
          available: true, // In real app, check against calendar
          duration: 30
        });
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleAddField = (fieldType: 'interviewer' | 'agenda' | 'materials') => {
    switch (fieldType) {
      case 'interviewer':
        setInterviewers([...interviewers, '']);
        break;
      case 'agenda':
        setAgenda([...agenda, '']);
        break;
      case 'materials':
        setPreparationMaterials([...preparationMaterials, '']);
        break;
    }
  };

  const handleRemoveField = (fieldType: 'interviewer' | 'agenda' | 'materials', index: number) => {
    switch (fieldType) {
      case 'interviewer':
        setInterviewers(interviewers.filter((_, i) => i !== index));
        break;
      case 'agenda':
        setAgenda(agenda.filter((_, i) => i !== index));
        break;
      case 'materials':
        setPreparationMaterials(preparationMaterials.filter((_, i) => i !== index));
        break;
    }
  };

  const handleFieldChange = (fieldType: 'interviewer' | 'agenda' | 'materials', index: number, value: string) => {
    switch (fieldType) {
      case 'interviewer':
        const newInterviewers = [...interviewers];
        newInterviewers[index] = value;
        setInterviewers(newInterviewers);
        break;
      case 'agenda':
        const newAgenda = [...agenda];
        newAgenda[index] = value;
        setAgenda(newAgenda);
        break;
      case 'materials':
        const newMaterials = [...preparationMaterials];
        newMaterials[index] = value;
        setPreparationMaterials(newMaterials);
        break;
    }
  };

  const generateMeetingUrl = () => {
    // In real app, integrate with Zoom, Teams, Google Meet APIs
    const meetingId = Math.random().toString(36).substring(2, 15);
    setMeetingUrl(`https://meet.company.com/interview/${meetingId}`);
  };

  const handleSchedule = async () => {
    const scheduledDateTime = `${selectedDate}T${selectedTime}:00.000Z`;
    
    const interviewData: InterviewData = {
      applicationId: application.id,
      scheduledAt: scheduledDateTime,
      duration,
      type: interviewType,
      meetingUrl: interviewType === 'video' ? meetingUrl : undefined,
      location: interviewType === 'in_person' ? location : undefined,
      interviewers: interviewers.filter(email => email.trim()),
      instructions,
      candidateInstructions,
      agenda: agenda.filter(item => item.trim()),
      preparationMaterials: preparationMaterials.filter(item => item.trim())
    };

    setLoading(true);
    try {
      await onScheduleInterview(interviewData);
      onClose();
    } catch (error) {
      console.error('Error scheduling interview:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInterviewDateTime = () => {
    return new Date(`${selectedDate}T${selectedTime}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Schedule Final Interview</h2>
              <p className="text-sm text-gray-600 mt-1">
                {application.candidateName} • {application.jobTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="mt-4">
            <div className="flex items-center space-x-4">
              {[
                { key: 'datetime', label: 'Date & Time', icon: Calendar },
                { key: 'details', label: 'Interview Details', icon: Settings },
                { key: 'confirmation', label: 'Confirmation', icon: CheckCircle }
              ].map((step, index) => (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep === step.key || (index === 0 && currentStep === 'datetime') || 
                    (index === 1 && currentStep === 'details') || 
                    (index === 2 && currentStep === 'confirmation')
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 text-gray-400'
                  }`}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    currentStep === step.key ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                  {index < 2 && (
                    <div className={`w-8 h-0.5 mx-4 ${
                      (currentStep === 'details' && index === 0) || (currentStep === 'confirmation' && index <= 1)
                        ? 'bg-blue-500'
                        : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Step 1: Date & Time Selection */}
          {currentStep === 'datetime' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Interview Date & Time</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>
                </div>

                {/* Time Slots */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Times</label>
                  <div className="grid grid-cols-6 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedTime(slot.datetime)}
                        className={`p-3 text-sm rounded-md border transition-colors ${
                          selectedTime === slot.datetime
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : slot.available
                            ? 'border-gray-300 hover:border-gray-400 text-gray-700'
                            : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!slot.available}
                      >
                        {slot.datetime}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interview Type */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interview Type</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'video', label: 'Video Call', icon: Video, description: 'Online video interview' },
                      { value: 'phone', label: 'Phone Call', icon: Phone, description: 'Phone interview' },
                      { value: 'in_person', label: 'In Person', icon: MapPin, description: 'Face-to-face interview' }
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setInterviewType(type.value as any)}
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          interviewType === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          <type.icon className="w-5 h-5 mr-2 text-blue-600" />
                          <span className="font-medium text-gray-900">{type.label}</span>
                        </div>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Interview Details */}
          {currentStep === 'details' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Interview Details</h3>

              {/* Meeting URL or Location */}
              {interviewType === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meeting URL</label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={meetingUrl}
                      onChange={(e) => setMeetingUrl(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://meet.company.com/interview/..."
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateMeetingUrl}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              )}

              {interviewType === 'in_person' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Office address or meeting room"
                  />
                </div>
              )}

              {/* Interviewers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Interviewers</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddField('interviewer')}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Interviewer
                  </Button>
                </div>
                <div className="space-y-2">
                  {interviewers.map((interviewer, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="email"
                        value={interviewer}
                        onChange={(e) => handleFieldChange('interviewer', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="interviewer@company.com"
                      />
                      {interviewers.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveField('interviewer', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions for Interviewers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internal Instructions (for interviewers)
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Special instructions or notes for the interview team..."
                />
              </div>

              {/* Candidate Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions for Candidate
                </label>
                <textarea
                  value={candidateInstructions}
                  onChange={(e) => setCandidateInstructions(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What should the candidate know or prepare for this interview..."
                />
              </div>

              {/* Interview Agenda */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Interview Agenda</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddField('agenda')}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                <div className="space-y-2">
                  {agenda.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleFieldChange('agenda', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Technical discussion (15 min)"
                      />
                      {agenda.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveField('agenda', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preparation Materials */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Preparation Materials</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddField('materials')}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Material
                  </Button>
                </div>
                <div className="space-y-2">
                  {preparationMaterials.map((material, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={material}
                        onChange={(e) => handleFieldChange('materials', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Company overview presentation, Portfolio examples"
                      />
                      {preparationMaterials.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveField('materials', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 'confirmation' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Interview Details</h3>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Interview Information</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Candidate:</span>
                        <span className="ml-2 text-gray-900">{application.candidateName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Position:</span>
                        <span className="ml-2 text-gray-900">{application.jobTitle}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date & Time:</span>
                        <span className="ml-2 text-gray-900">
                          {getInterviewDateTime().toLocaleDateString()} at {getInterviewDateTime().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Duration:</span>
                        <span className="ml-2 text-gray-900">{duration} minutes</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <span className="ml-2 text-gray-900 capitalize">{interviewType.replace('_', ' ')}</span>
                      </div>
                      {meetingUrl && (
                        <div>
                          <span className="font-medium text-gray-700">Meeting URL:</span>
                          <div className="ml-2 flex items-center space-x-2">
                            <span className="text-blue-600 truncate">{meetingUrl}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(meetingUrl)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {location && (
                        <div>
                          <span className="font-medium text-gray-700">Location:</span>
                          <span className="ml-2 text-gray-900">{location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Interviewers</h4>
                    <div className="space-y-2">
                      {interviewers.filter(email => email.trim()).map((interviewer, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <Mail className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-900">{interviewer}</span>
                        </div>
                      ))}
                    </div>

                    {agenda.filter(item => item.trim()).length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium text-gray-900 mb-2">Agenda</h4>
                        <ul className="space-y-1 text-sm">
                          {agenda.filter(item => item.trim()).map((item, index) => (
                            <li key={index} className="text-gray-700">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {candidateInstructions && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Instructions for Candidate</h4>
                    <p className="text-sm text-gray-700">{candidateInstructions}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              {currentStep !== 'datetime' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStep === 'details') setCurrentStep('datetime');
                    if (currentStep === 'confirmation') setCurrentStep('details');
                  }}
                  disabled={loading}
                >
                  Back
                </Button>
              )}
            </div>

            <div>
              {currentStep === 'datetime' && (
                <Button
                  onClick={() => setCurrentStep('details')}
                  disabled={!selectedDate || !selectedTime}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              {currentStep === 'details' && (
                <Button
                  onClick={() => setCurrentStep('confirmation')}
                  disabled={interviewers.filter(email => email.trim()).length === 0}
                >
                  Review
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              {currentStep === 'confirmation' && (
                <Button
                  onClick={handleSchedule}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? 'Scheduling...' : 'Schedule Interview'}
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}