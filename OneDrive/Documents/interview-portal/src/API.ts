/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateUserInput = {
  id?: string | null,
  sub: string,
  email: string,
  firstName: string,
  lastName: string,
  phone?: string | null,
  role: UserRole,
  companyId?: string | null,
  isActive: boolean,
  lastLoginAt?: string | null,
  createdAt?: string | null,
  updatedAt?: string | null,
  approvalStatus?: ApprovalStatus | null,
  approvedAt?: string | null,
  approvedBy?: string | null,
  approvalNotes?: string | null,
  rejectedAt?: string | null,
  rejectedBy?: string | null,
  rejectionReason?: string | null,
  resume?: string | null,
};

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  COMPANY_ADMIN = "COMPANY_ADMIN",
  CANDIDATE = "CANDIDATE",
}


export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}


export type ModelUserConditionInput = {
  sub?: ModelStringInput | null,
  email?: ModelStringInput | null,
  firstName?: ModelStringInput | null,
  lastName?: ModelStringInput | null,
  phone?: ModelStringInput | null,
  role?: ModelUserRoleInput | null,
  companyId?: ModelIDInput | null,
  isActive?: ModelBooleanInput | null,
  lastLoginAt?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  approvalStatus?: ModelApprovalStatusInput | null,
  approvedAt?: ModelStringInput | null,
  approvedBy?: ModelIDInput | null,
  approvalNotes?: ModelStringInput | null,
  rejectedAt?: ModelStringInput | null,
  rejectedBy?: ModelIDInput | null,
  rejectionReason?: ModelStringInput | null,
  resume?: ModelStringInput | null,
  and?: Array< ModelUserConditionInput | null > | null,
  or?: Array< ModelUserConditionInput | null > | null,
  not?: ModelUserConditionInput | null,
};

export type ModelStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
  _null = "_null",
}


export type ModelSizeInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
};

export type ModelUserRoleInput = {
  eq?: UserRole | null,
  ne?: UserRole | null,
};

export type ModelIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export type ModelBooleanInput = {
  ne?: boolean | null,
  eq?: boolean | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type ModelApprovalStatusInput = {
  eq?: ApprovalStatus | null,
  ne?: ApprovalStatus | null,
};

export type User = {
  __typename: "User",
  id: string,
  sub: string,
  email: string,
  firstName: string,
  lastName: string,
  phone?: string | null,
  role: UserRole,
  companyId?: string | null,
  company?: Company | null,
  isActive: boolean,
  lastLoginAt?: string | null,
  createdAt: string,
  updatedAt: string,
  approvalStatus?: ApprovalStatus | null,
  approvedAt?: string | null,
  approvedBy?: string | null,
  approvalNotes?: string | null,
  rejectedAt?: string | null,
  rejectedBy?: string | null,
  rejectionReason?: string | null,
  resume?: string | null,
  applications?: ModelApplicationConnection | null,
  testAttempts?: ModelTestAttemptConnection | null,
  videoTestAttempts?: ModelVideoTestAttemptConnection | null,
  interviews?: ModelInterviewConnection | null,
};

export type Company = {
  __typename: "Company",
  id: string,
  name: string,
  email: string,
  phone?: string | null,
  address?: string | null,
  website?: string | null,
  logo?: string | null,
  description?: string | null,
  isActive: boolean,
  admins?: ModelUserConnection | null,
  jobs?: ModelJobConnection | null,
  createdAt: string,
  updatedAt: string,
};

export type ModelUserConnection = {
  __typename: "ModelUserConnection",
  items:  Array<User | null >,
  nextToken?: string | null,
};

export type ModelJobConnection = {
  __typename: "ModelJobConnection",
  items:  Array<Job | null >,
  nextToken?: string | null,
};

export type Job = {
  __typename: "Job",
  id: string,
  title: string,
  department: string,
  location: string,
  type: JobType,
  salary?: string | null,
  description: string,
  requirements: Array< string >,
  responsibilities: Array< string >,
  benefits?: Array< string > | null,
  status: JobStatus,
  companyId: string,
  company: Company,
  applications?: ModelApplicationConnection | null,
  tests?: ModelTestConnection | null,
  videoTests?: ModelVideoTestConnection | null,
  createdAt: string,
  updatedAt: string,
  closingDate?: string | null,
};

export enum JobType {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  CONTRACT = "CONTRACT",
  INTERNSHIP = "INTERNSHIP",
}


export enum JobStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  CLOSED = "CLOSED",
}


export type ModelApplicationConnection = {
  __typename: "ModelApplicationConnection",
  items:  Array<Application | null >,
  nextToken?: string | null,
};

export type Application = {
  __typename: "Application",
  id: string,
  candidateId: string,
  candidate: User,
  jobId: string,
  job: Job,
  appliedAt: string,
  currentStage: number,
  overallStatus: ApplicationStatus,
  applicationStatus: StageStatus,
  writtenTestStatus: StageStatus,
  videoTestStatus: StageStatus,
  interviewStatus: StageStatus,
  feedback?: string | null,
  internalNotes?: string | null,
  testAttempts?: ModelTestAttemptConnection | null,
  videoTestAttempts?: ModelVideoTestAttemptConnection | null,
  interviews?: ModelInterviewConnection | null,
  createdAt: string,
  updatedAt: string,
};

export enum ApplicationStatus {
  ACTIVE = "ACTIVE",
  REJECTED = "REJECTED",
  HIRED = "HIRED",
  WITHDRAWN = "WITHDRAWN",
}


export enum StageStatus {
  NOT_STARTED = "NOT_STARTED",
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  SCHEDULED = "SCHEDULED",
}


export type ModelTestAttemptConnection = {
  __typename: "ModelTestAttemptConnection",
  items:  Array<TestAttempt | null >,
  nextToken?: string | null,
};

export type TestAttempt = {
  __typename: "TestAttempt",
  id: string,
  testId: string,
  test: Test,
  candidateId: string,
  candidate: User,
  applicationId: string,
  application: Application,
  startedAt: string,
  completedAt?: string | null,
  timeRemaining?: number | null,
  status: TestAttemptStatus,
  answers?: string | null,
  score?: number | null,
  percentage?: number | null,
  passed?: boolean | null,
  createdAt: string,
  updatedAt: string,
};

export type Test = {
  __typename: "Test",
  id: string,
  jobId: string,
  job: Job,
  title: string,
  description: string,
  instructions: string,
  timeLimit: number,
  totalPoints: number,
  passingScore: number,
  isActive: boolean,
  questions: string,
  attempts?: ModelTestAttemptConnection | null,
  createdAt: string,
  updatedAt: string,
};

export enum TestAttemptStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ABANDONED = "ABANDONED",
  EXPIRED = "EXPIRED",
}


export type ModelVideoTestAttemptConnection = {
  __typename: "ModelVideoTestAttemptConnection",
  items:  Array<VideoTestAttempt | null >,
  nextToken?: string | null,
};

export type VideoTestAttempt = {
  __typename: "VideoTestAttempt",
  id: string,
  videoTestId: string,
  videoTest: VideoTest,
  candidateId: string,
  candidate: User,
  applicationId: string,
  application: Application,
  startedAt: string,
  completedAt?: string | null,
  status: VideoTestAttemptStatus,
  currentQuestionIndex: number,
  recordings?: string | null,
  totalScore?: number | null,
  feedback?: string | null,
  createdAt: string,
  updatedAt: string,
};

export type VideoTest = {
  __typename: "VideoTest",
  id: string,
  jobId: string,
  job: Job,
  title: string,
  description: string,
  instructions: string,
  totalPoints: number,
  isActive: boolean,
  questions: string,
  attempts?: ModelVideoTestAttemptConnection | null,
  createdAt: string,
  updatedAt: string,
};

export enum VideoTestAttemptStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ABANDONED = "ABANDONED",
}


export type ModelInterviewConnection = {
  __typename: "ModelInterviewConnection",
  items:  Array<Interview | null >,
  nextToken?: string | null,
};

export type Interview = {
  __typename: "Interview",
  id: string,
  candidateId: string,
  candidate: User,
  applicationId: string,
  application: Application,
  scheduledAt: string,
  duration: number,
  type: InterviewType,
  status: InterviewStatus,
  meetingUrl?: string | null,
  interviewerNotes?: string | null,
  candidateFeedback?: string | null,
  finalScore?: number | null,
  recommendation?: InterviewRecommendation | null,
  interviewers?: Array< string > | null,
  createdAt: string,
  updatedAt: string,
};

export enum InterviewType {
  PHONE = "PHONE",
  VIDEO = "VIDEO",
  IN_PERSON = "IN_PERSON",
}


export enum InterviewStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}


export enum InterviewRecommendation {
  STRONG_HIRE = "STRONG_HIRE",
  HIRE = "HIRE",
  NO_HIRE = "NO_HIRE",
  STRONG_NO_HIRE = "STRONG_NO_HIRE",
}


export type ModelTestConnection = {
  __typename: "ModelTestConnection",
  items:  Array<Test | null >,
  nextToken?: string | null,
};

export type ModelVideoTestConnection = {
  __typename: "ModelVideoTestConnection",
  items:  Array<VideoTest | null >,
  nextToken?: string | null,
};

export type UpdateUserInput = {
  id: string,
  sub?: string | null,
  email?: string | null,
  firstName?: string | null,
  lastName?: string | null,
  phone?: string | null,
  role?: UserRole | null,
  companyId?: string | null,
  isActive?: boolean | null,
  lastLoginAt?: string | null,
  createdAt?: string | null,
  updatedAt?: string | null,
  approvalStatus?: ApprovalStatus | null,
  approvedAt?: string | null,
  approvedBy?: string | null,
  approvalNotes?: string | null,
  rejectedAt?: string | null,
  rejectedBy?: string | null,
  rejectionReason?: string | null,
  resume?: string | null,
};

export type DeleteUserInput = {
  id: string,
};

export type CreateCompanyInput = {
  id?: string | null,
  name: string,
  email: string,
  phone?: string | null,
  address?: string | null,
  website?: string | null,
  logo?: string | null,
  description?: string | null,
  isActive: boolean,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type ModelCompanyConditionInput = {
  name?: ModelStringInput | null,
  email?: ModelStringInput | null,
  phone?: ModelStringInput | null,
  address?: ModelStringInput | null,
  website?: ModelStringInput | null,
  logo?: ModelStringInput | null,
  description?: ModelStringInput | null,
  isActive?: ModelBooleanInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelCompanyConditionInput | null > | null,
  or?: Array< ModelCompanyConditionInput | null > | null,
  not?: ModelCompanyConditionInput | null,
};

export type UpdateCompanyInput = {
  id: string,
  name?: string | null,
  email?: string | null,
  phone?: string | null,
  address?: string | null,
  website?: string | null,
  logo?: string | null,
  description?: string | null,
  isActive?: boolean | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type DeleteCompanyInput = {
  id: string,
};

export type CreateJobInput = {
  id?: string | null,
  title: string,
  department: string,
  location: string,
  type: JobType,
  salary?: string | null,
  description: string,
  requirements: Array< string >,
  responsibilities: Array< string >,
  benefits?: Array< string > | null,
  status: JobStatus,
  companyId: string,
  createdAt?: string | null,
  updatedAt?: string | null,
  closingDate?: string | null,
};

export type ModelJobConditionInput = {
  title?: ModelStringInput | null,
  department?: ModelStringInput | null,
  location?: ModelStringInput | null,
  type?: ModelJobTypeInput | null,
  salary?: ModelStringInput | null,
  description?: ModelStringInput | null,
  requirements?: ModelStringInput | null,
  responsibilities?: ModelStringInput | null,
  benefits?: ModelStringInput | null,
  status?: ModelJobStatusInput | null,
  companyId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  closingDate?: ModelStringInput | null,
  and?: Array< ModelJobConditionInput | null > | null,
  or?: Array< ModelJobConditionInput | null > | null,
  not?: ModelJobConditionInput | null,
};

export type ModelJobTypeInput = {
  eq?: JobType | null,
  ne?: JobType | null,
};

export type ModelJobStatusInput = {
  eq?: JobStatus | null,
  ne?: JobStatus | null,
};

export type UpdateJobInput = {
  id: string,
  title?: string | null,
  department?: string | null,
  location?: string | null,
  type?: JobType | null,
  salary?: string | null,
  description?: string | null,
  requirements?: Array< string > | null,
  responsibilities?: Array< string > | null,
  benefits?: Array< string > | null,
  status?: JobStatus | null,
  companyId?: string | null,
  createdAt?: string | null,
  updatedAt?: string | null,
  closingDate?: string | null,
};

export type DeleteJobInput = {
  id: string,
};

export type CreateApplicationInput = {
  id?: string | null,
  candidateId: string,
  jobId: string,
  appliedAt: string,
  currentStage: number,
  overallStatus: ApplicationStatus,
  applicationStatus: StageStatus,
  writtenTestStatus: StageStatus,
  videoTestStatus: StageStatus,
  interviewStatus: StageStatus,
  feedback?: string | null,
  internalNotes?: string | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type ModelApplicationConditionInput = {
  candidateId?: ModelIDInput | null,
  jobId?: ModelIDInput | null,
  appliedAt?: ModelStringInput | null,
  currentStage?: ModelIntInput | null,
  overallStatus?: ModelApplicationStatusInput | null,
  applicationStatus?: ModelStageStatusInput | null,
  writtenTestStatus?: ModelStageStatusInput | null,
  videoTestStatus?: ModelStageStatusInput | null,
  interviewStatus?: ModelStageStatusInput | null,
  feedback?: ModelStringInput | null,
  internalNotes?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelApplicationConditionInput | null > | null,
  or?: Array< ModelApplicationConditionInput | null > | null,
  not?: ModelApplicationConditionInput | null,
};

export type ModelIntInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type ModelApplicationStatusInput = {
  eq?: ApplicationStatus | null,
  ne?: ApplicationStatus | null,
};

export type ModelStageStatusInput = {
  eq?: StageStatus | null,
  ne?: StageStatus | null,
};

export type UpdateApplicationInput = {
  id: string,
  candidateId?: string | null,
  jobId?: string | null,
  appliedAt?: string | null,
  currentStage?: number | null,
  overallStatus?: ApplicationStatus | null,
  applicationStatus?: StageStatus | null,
  writtenTestStatus?: StageStatus | null,
  videoTestStatus?: StageStatus | null,
  interviewStatus?: StageStatus | null,
  feedback?: string | null,
  internalNotes?: string | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type DeleteApplicationInput = {
  id: string,
};

export type CreateTestInput = {
  id?: string | null,
  jobId: string,
  title: string,
  description: string,
  instructions: string,
  timeLimit: number,
  totalPoints: number,
  passingScore: number,
  isActive: boolean,
  questions: string,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type ModelTestConditionInput = {
  jobId?: ModelIDInput | null,
  title?: ModelStringInput | null,
  description?: ModelStringInput | null,
  instructions?: ModelStringInput | null,
  timeLimit?: ModelIntInput | null,
  totalPoints?: ModelIntInput | null,
  passingScore?: ModelIntInput | null,
  isActive?: ModelBooleanInput | null,
  questions?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelTestConditionInput | null > | null,
  or?: Array< ModelTestConditionInput | null > | null,
  not?: ModelTestConditionInput | null,
};

export type UpdateTestInput = {
  id: string,
  jobId?: string | null,
  title?: string | null,
  description?: string | null,
  instructions?: string | null,
  timeLimit?: number | null,
  totalPoints?: number | null,
  passingScore?: number | null,
  isActive?: boolean | null,
  questions?: string | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type DeleteTestInput = {
  id: string,
};

export type CreateTestAttemptInput = {
  id?: string | null,
  testId: string,
  candidateId: string,
  applicationId: string,
  startedAt: string,
  completedAt?: string | null,
  timeRemaining?: number | null,
  status: TestAttemptStatus,
  answers?: string | null,
  score?: number | null,
  percentage?: number | null,
  passed?: boolean | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type ModelTestAttemptConditionInput = {
  testId?: ModelIDInput | null,
  candidateId?: ModelIDInput | null,
  applicationId?: ModelIDInput | null,
  startedAt?: ModelStringInput | null,
  completedAt?: ModelStringInput | null,
  timeRemaining?: ModelIntInput | null,
  status?: ModelTestAttemptStatusInput | null,
  answers?: ModelStringInput | null,
  score?: ModelIntInput | null,
  percentage?: ModelFloatInput | null,
  passed?: ModelBooleanInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelTestAttemptConditionInput | null > | null,
  or?: Array< ModelTestAttemptConditionInput | null > | null,
  not?: ModelTestAttemptConditionInput | null,
};

export type ModelTestAttemptStatusInput = {
  eq?: TestAttemptStatus | null,
  ne?: TestAttemptStatus | null,
};

export type ModelFloatInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type UpdateTestAttemptInput = {
  id: string,
  testId?: string | null,
  candidateId?: string | null,
  applicationId?: string | null,
  startedAt?: string | null,
  completedAt?: string | null,
  timeRemaining?: number | null,
  status?: TestAttemptStatus | null,
  answers?: string | null,
  score?: number | null,
  percentage?: number | null,
  passed?: boolean | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type DeleteTestAttemptInput = {
  id: string,
};

export type CreateVideoTestInput = {
  id?: string | null,
  jobId: string,
  title: string,
  description: string,
  instructions: string,
  totalPoints: number,
  isActive: boolean,
  questions: string,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type ModelVideoTestConditionInput = {
  jobId?: ModelIDInput | null,
  title?: ModelStringInput | null,
  description?: ModelStringInput | null,
  instructions?: ModelStringInput | null,
  totalPoints?: ModelIntInput | null,
  isActive?: ModelBooleanInput | null,
  questions?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelVideoTestConditionInput | null > | null,
  or?: Array< ModelVideoTestConditionInput | null > | null,
  not?: ModelVideoTestConditionInput | null,
};

export type UpdateVideoTestInput = {
  id: string,
  jobId?: string | null,
  title?: string | null,
  description?: string | null,
  instructions?: string | null,
  totalPoints?: number | null,
  isActive?: boolean | null,
  questions?: string | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type DeleteVideoTestInput = {
  id: string,
};

export type CreateVideoTestAttemptInput = {
  id?: string | null,
  videoTestId: string,
  candidateId: string,
  applicationId: string,
  startedAt: string,
  completedAt?: string | null,
  status: VideoTestAttemptStatus,
  currentQuestionIndex: number,
  recordings?: string | null,
  totalScore?: number | null,
  feedback?: string | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type ModelVideoTestAttemptConditionInput = {
  videoTestId?: ModelIDInput | null,
  candidateId?: ModelIDInput | null,
  applicationId?: ModelIDInput | null,
  startedAt?: ModelStringInput | null,
  completedAt?: ModelStringInput | null,
  status?: ModelVideoTestAttemptStatusInput | null,
  currentQuestionIndex?: ModelIntInput | null,
  recordings?: ModelStringInput | null,
  totalScore?: ModelIntInput | null,
  feedback?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelVideoTestAttemptConditionInput | null > | null,
  or?: Array< ModelVideoTestAttemptConditionInput | null > | null,
  not?: ModelVideoTestAttemptConditionInput | null,
};

export type ModelVideoTestAttemptStatusInput = {
  eq?: VideoTestAttemptStatus | null,
  ne?: VideoTestAttemptStatus | null,
};

export type UpdateVideoTestAttemptInput = {
  id: string,
  videoTestId?: string | null,
  candidateId?: string | null,
  applicationId?: string | null,
  startedAt?: string | null,
  completedAt?: string | null,
  status?: VideoTestAttemptStatus | null,
  currentQuestionIndex?: number | null,
  recordings?: string | null,
  totalScore?: number | null,
  feedback?: string | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type DeleteVideoTestAttemptInput = {
  id: string,
};

export type CreateInterviewInput = {
  id?: string | null,
  candidateId: string,
  applicationId: string,
  scheduledAt: string,
  duration: number,
  type: InterviewType,
  status: InterviewStatus,
  meetingUrl?: string | null,
  interviewerNotes?: string | null,
  candidateFeedback?: string | null,
  finalScore?: number | null,
  recommendation?: InterviewRecommendation | null,
  interviewers?: Array< string > | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type ModelInterviewConditionInput = {
  candidateId?: ModelIDInput | null,
  applicationId?: ModelIDInput | null,
  scheduledAt?: ModelStringInput | null,
  duration?: ModelIntInput | null,
  type?: ModelInterviewTypeInput | null,
  status?: ModelInterviewStatusInput | null,
  meetingUrl?: ModelStringInput | null,
  interviewerNotes?: ModelStringInput | null,
  candidateFeedback?: ModelStringInput | null,
  finalScore?: ModelIntInput | null,
  recommendation?: ModelInterviewRecommendationInput | null,
  interviewers?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelInterviewConditionInput | null > | null,
  or?: Array< ModelInterviewConditionInput | null > | null,
  not?: ModelInterviewConditionInput | null,
};

export type ModelInterviewTypeInput = {
  eq?: InterviewType | null,
  ne?: InterviewType | null,
};

export type ModelInterviewStatusInput = {
  eq?: InterviewStatus | null,
  ne?: InterviewStatus | null,
};

export type ModelInterviewRecommendationInput = {
  eq?: InterviewRecommendation | null,
  ne?: InterviewRecommendation | null,
};

export type UpdateInterviewInput = {
  id: string,
  candidateId?: string | null,
  applicationId?: string | null,
  scheduledAt?: string | null,
  duration?: number | null,
  type?: InterviewType | null,
  status?: InterviewStatus | null,
  meetingUrl?: string | null,
  interviewerNotes?: string | null,
  candidateFeedback?: string | null,
  finalScore?: number | null,
  recommendation?: InterviewRecommendation | null,
  interviewers?: Array< string > | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type DeleteInterviewInput = {
  id: string,
};

export type ModelUserFilterInput = {
  id?: ModelIDInput | null,
  sub?: ModelStringInput | null,
  email?: ModelStringInput | null,
  firstName?: ModelStringInput | null,
  lastName?: ModelStringInput | null,
  phone?: ModelStringInput | null,
  role?: ModelUserRoleInput | null,
  companyId?: ModelIDInput | null,
  isActive?: ModelBooleanInput | null,
  lastLoginAt?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  approvalStatus?: ModelApprovalStatusInput | null,
  approvedAt?: ModelStringInput | null,
  approvedBy?: ModelIDInput | null,
  approvalNotes?: ModelStringInput | null,
  rejectedAt?: ModelStringInput | null,
  rejectedBy?: ModelIDInput | null,
  rejectionReason?: ModelStringInput | null,
  resume?: ModelStringInput | null,
  and?: Array< ModelUserFilterInput | null > | null,
  or?: Array< ModelUserFilterInput | null > | null,
  not?: ModelUserFilterInput | null,
};

export type ModelCompanyFilterInput = {
  id?: ModelIDInput | null,
  name?: ModelStringInput | null,
  email?: ModelStringInput | null,
  phone?: ModelStringInput | null,
  address?: ModelStringInput | null,
  website?: ModelStringInput | null,
  logo?: ModelStringInput | null,
  description?: ModelStringInput | null,
  isActive?: ModelBooleanInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelCompanyFilterInput | null > | null,
  or?: Array< ModelCompanyFilterInput | null > | null,
  not?: ModelCompanyFilterInput | null,
};

export type ModelCompanyConnection = {
  __typename: "ModelCompanyConnection",
  items:  Array<Company | null >,
  nextToken?: string | null,
};

export type ModelJobFilterInput = {
  id?: ModelIDInput | null,
  title?: ModelStringInput | null,
  department?: ModelStringInput | null,
  location?: ModelStringInput | null,
  type?: ModelJobTypeInput | null,
  salary?: ModelStringInput | null,
  description?: ModelStringInput | null,
  requirements?: ModelStringInput | null,
  responsibilities?: ModelStringInput | null,
  benefits?: ModelStringInput | null,
  status?: ModelJobStatusInput | null,
  companyId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  closingDate?: ModelStringInput | null,
  and?: Array< ModelJobFilterInput | null > | null,
  or?: Array< ModelJobFilterInput | null > | null,
  not?: ModelJobFilterInput | null,
};

export type ModelApplicationFilterInput = {
  id?: ModelIDInput | null,
  candidateId?: ModelIDInput | null,
  jobId?: ModelIDInput | null,
  appliedAt?: ModelStringInput | null,
  currentStage?: ModelIntInput | null,
  overallStatus?: ModelApplicationStatusInput | null,
  applicationStatus?: ModelStageStatusInput | null,
  writtenTestStatus?: ModelStageStatusInput | null,
  videoTestStatus?: ModelStageStatusInput | null,
  interviewStatus?: ModelStageStatusInput | null,
  feedback?: ModelStringInput | null,
  internalNotes?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelApplicationFilterInput | null > | null,
  or?: Array< ModelApplicationFilterInput | null > | null,
  not?: ModelApplicationFilterInput | null,
};

export enum ModelSortDirection {
  ASC = "ASC",
  DESC = "DESC",
}


export type ModelTestFilterInput = {
  id?: ModelIDInput | null,
  jobId?: ModelIDInput | null,
  title?: ModelStringInput | null,
  description?: ModelStringInput | null,
  instructions?: ModelStringInput | null,
  timeLimit?: ModelIntInput | null,
  totalPoints?: ModelIntInput | null,
  passingScore?: ModelIntInput | null,
  isActive?: ModelBooleanInput | null,
  questions?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelTestFilterInput | null > | null,
  or?: Array< ModelTestFilterInput | null > | null,
  not?: ModelTestFilterInput | null,
};

export type ModelTestAttemptFilterInput = {
  id?: ModelIDInput | null,
  testId?: ModelIDInput | null,
  candidateId?: ModelIDInput | null,
  applicationId?: ModelIDInput | null,
  startedAt?: ModelStringInput | null,
  completedAt?: ModelStringInput | null,
  timeRemaining?: ModelIntInput | null,
  status?: ModelTestAttemptStatusInput | null,
  answers?: ModelStringInput | null,
  score?: ModelIntInput | null,
  percentage?: ModelFloatInput | null,
  passed?: ModelBooleanInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelTestAttemptFilterInput | null > | null,
  or?: Array< ModelTestAttemptFilterInput | null > | null,
  not?: ModelTestAttemptFilterInput | null,
};

export type ModelVideoTestFilterInput = {
  id?: ModelIDInput | null,
  jobId?: ModelIDInput | null,
  title?: ModelStringInput | null,
  description?: ModelStringInput | null,
  instructions?: ModelStringInput | null,
  totalPoints?: ModelIntInput | null,
  isActive?: ModelBooleanInput | null,
  questions?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelVideoTestFilterInput | null > | null,
  or?: Array< ModelVideoTestFilterInput | null > | null,
  not?: ModelVideoTestFilterInput | null,
};

export type ModelVideoTestAttemptFilterInput = {
  id?: ModelIDInput | null,
  videoTestId?: ModelIDInput | null,
  candidateId?: ModelIDInput | null,
  applicationId?: ModelIDInput | null,
  startedAt?: ModelStringInput | null,
  completedAt?: ModelStringInput | null,
  status?: ModelVideoTestAttemptStatusInput | null,
  currentQuestionIndex?: ModelIntInput | null,
  recordings?: ModelStringInput | null,
  totalScore?: ModelIntInput | null,
  feedback?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelVideoTestAttemptFilterInput | null > | null,
  or?: Array< ModelVideoTestAttemptFilterInput | null > | null,
  not?: ModelVideoTestAttemptFilterInput | null,
};

export type ModelInterviewFilterInput = {
  id?: ModelIDInput | null,
  candidateId?: ModelIDInput | null,
  applicationId?: ModelIDInput | null,
  scheduledAt?: ModelStringInput | null,
  duration?: ModelIntInput | null,
  type?: ModelInterviewTypeInput | null,
  status?: ModelInterviewStatusInput | null,
  meetingUrl?: ModelStringInput | null,
  interviewerNotes?: ModelStringInput | null,
  candidateFeedback?: ModelStringInput | null,
  finalScore?: ModelIntInput | null,
  recommendation?: ModelInterviewRecommendationInput | null,
  interviewers?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelInterviewFilterInput | null > | null,
  or?: Array< ModelInterviewFilterInput | null > | null,
  not?: ModelInterviewFilterInput | null,
};

export type ModelSubscriptionUserFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  sub?: ModelSubscriptionStringInput | null,
  email?: ModelSubscriptionStringInput | null,
  firstName?: ModelSubscriptionStringInput | null,
  lastName?: ModelSubscriptionStringInput | null,
  phone?: ModelSubscriptionStringInput | null,
  role?: ModelSubscriptionStringInput | null,
  companyId?: ModelSubscriptionIDInput | null,
  isActive?: ModelSubscriptionBooleanInput | null,
  lastLoginAt?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  approvalStatus?: ModelSubscriptionStringInput | null,
  approvedAt?: ModelSubscriptionStringInput | null,
  approvedBy?: ModelSubscriptionIDInput | null,
  approvalNotes?: ModelSubscriptionStringInput | null,
  rejectedAt?: ModelSubscriptionStringInput | null,
  rejectedBy?: ModelSubscriptionIDInput | null,
  rejectionReason?: ModelSubscriptionStringInput | null,
  resume?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionUserFilterInput | null > | null,
  or?: Array< ModelSubscriptionUserFilterInput | null > | null,
};

export type ModelSubscriptionIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionBooleanInput = {
  ne?: boolean | null,
  eq?: boolean | null,
};

export type ModelSubscriptionCompanyFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  name?: ModelSubscriptionStringInput | null,
  email?: ModelSubscriptionStringInput | null,
  phone?: ModelSubscriptionStringInput | null,
  address?: ModelSubscriptionStringInput | null,
  website?: ModelSubscriptionStringInput | null,
  logo?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  isActive?: ModelSubscriptionBooleanInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionCompanyFilterInput | null > | null,
  or?: Array< ModelSubscriptionCompanyFilterInput | null > | null,
};

export type ModelSubscriptionJobFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  title?: ModelSubscriptionStringInput | null,
  department?: ModelSubscriptionStringInput | null,
  location?: ModelSubscriptionStringInput | null,
  type?: ModelSubscriptionStringInput | null,
  salary?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  requirements?: ModelSubscriptionStringInput | null,
  responsibilities?: ModelSubscriptionStringInput | null,
  benefits?: ModelSubscriptionStringInput | null,
  status?: ModelSubscriptionStringInput | null,
  companyId?: ModelSubscriptionIDInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  closingDate?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionJobFilterInput | null > | null,
  or?: Array< ModelSubscriptionJobFilterInput | null > | null,
};

export type ModelSubscriptionApplicationFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  candidateId?: ModelSubscriptionIDInput | null,
  jobId?: ModelSubscriptionIDInput | null,
  appliedAt?: ModelSubscriptionStringInput | null,
  currentStage?: ModelSubscriptionIntInput | null,
  overallStatus?: ModelSubscriptionStringInput | null,
  applicationStatus?: ModelSubscriptionStringInput | null,
  writtenTestStatus?: ModelSubscriptionStringInput | null,
  videoTestStatus?: ModelSubscriptionStringInput | null,
  interviewStatus?: ModelSubscriptionStringInput | null,
  feedback?: ModelSubscriptionStringInput | null,
  internalNotes?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionApplicationFilterInput | null > | null,
  or?: Array< ModelSubscriptionApplicationFilterInput | null > | null,
};

export type ModelSubscriptionIntInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  in?: Array< number | null > | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionTestFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  jobId?: ModelSubscriptionIDInput | null,
  title?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  instructions?: ModelSubscriptionStringInput | null,
  timeLimit?: ModelSubscriptionIntInput | null,
  totalPoints?: ModelSubscriptionIntInput | null,
  passingScore?: ModelSubscriptionIntInput | null,
  isActive?: ModelSubscriptionBooleanInput | null,
  questions?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionTestFilterInput | null > | null,
  or?: Array< ModelSubscriptionTestFilterInput | null > | null,
};

export type ModelSubscriptionTestAttemptFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  testId?: ModelSubscriptionIDInput | null,
  applicationId?: ModelSubscriptionIDInput | null,
  startedAt?: ModelSubscriptionStringInput | null,
  completedAt?: ModelSubscriptionStringInput | null,
  timeRemaining?: ModelSubscriptionIntInput | null,
  status?: ModelSubscriptionStringInput | null,
  answers?: ModelSubscriptionStringInput | null,
  score?: ModelSubscriptionIntInput | null,
  percentage?: ModelSubscriptionFloatInput | null,
  passed?: ModelSubscriptionBooleanInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionTestAttemptFilterInput | null > | null,
  or?: Array< ModelSubscriptionTestAttemptFilterInput | null > | null,
  candidateId?: ModelStringInput | null,
};

export type ModelSubscriptionFloatInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  in?: Array< number | null > | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionVideoTestFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  jobId?: ModelSubscriptionIDInput | null,
  title?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  instructions?: ModelSubscriptionStringInput | null,
  totalPoints?: ModelSubscriptionIntInput | null,
  isActive?: ModelSubscriptionBooleanInput | null,
  questions?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionVideoTestFilterInput | null > | null,
  or?: Array< ModelSubscriptionVideoTestFilterInput | null > | null,
};

export type ModelSubscriptionVideoTestAttemptFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  videoTestId?: ModelSubscriptionIDInput | null,
  applicationId?: ModelSubscriptionIDInput | null,
  startedAt?: ModelSubscriptionStringInput | null,
  completedAt?: ModelSubscriptionStringInput | null,
  status?: ModelSubscriptionStringInput | null,
  currentQuestionIndex?: ModelSubscriptionIntInput | null,
  recordings?: ModelSubscriptionStringInput | null,
  totalScore?: ModelSubscriptionIntInput | null,
  feedback?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionVideoTestAttemptFilterInput | null > | null,
  or?: Array< ModelSubscriptionVideoTestAttemptFilterInput | null > | null,
  candidateId?: ModelStringInput | null,
};

export type ModelSubscriptionInterviewFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  applicationId?: ModelSubscriptionIDInput | null,
  scheduledAt?: ModelSubscriptionStringInput | null,
  duration?: ModelSubscriptionIntInput | null,
  type?: ModelSubscriptionStringInput | null,
  status?: ModelSubscriptionStringInput | null,
  meetingUrl?: ModelSubscriptionStringInput | null,
  interviewerNotes?: ModelSubscriptionStringInput | null,
  candidateFeedback?: ModelSubscriptionStringInput | null,
  finalScore?: ModelSubscriptionIntInput | null,
  recommendation?: ModelSubscriptionStringInput | null,
  interviewers?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionInterviewFilterInput | null > | null,
  or?: Array< ModelSubscriptionInterviewFilterInput | null > | null,
  candidateId?: ModelStringInput | null,
};

export type CreateUserMutationVariables = {
  input: CreateUserInput,
  condition?: ModelUserConditionInput | null,
};

export type CreateUserMutation = {
  createUser?:  {
    __typename: "User",
    id: string,
    sub: string,
    email: string,
    firstName: string,
    lastName: string,
    phone?: string | null,
    role: UserRole,
    companyId?: string | null,
    company?:  {
      __typename: "Company",
      id: string,
      name: string,
      email: string,
      phone?: string | null,
      address?: string | null,
      website?: string | null,
      logo?: string | null,
      description?: string | null,
      isActive: boolean,
      createdAt: string,
      updatedAt: string,
    } | null,
    isActive: boolean,
    lastLoginAt?: string | null,
    createdAt: string,
    updatedAt: string,
    approvalStatus?: ApprovalStatus | null,
    approvedAt?: string | null,
    approvedBy?: string | null,
    approvalNotes?: string | null,
    rejectedAt?: string | null,
    rejectedBy?: string | null,
    rejectionReason?: string | null,
    resume?: string | null,
    applications?:  {
      __typename: "ModelApplicationConnection",
      nextToken?: string | null,
    } | null,
    testAttempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    videoTestAttempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    interviews?:  {
      __typename: "ModelInterviewConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type UpdateUserMutationVariables = {
  input: UpdateUserInput,
  condition?: ModelUserConditionInput | null,
};

export type UpdateUserMutation = {
  updateUser?:  {
    __typename: "User",
    id: string,
    sub: string,
    email: string,
    firstName: string,
    lastName: string,
    phone?: string | null,
    role: UserRole,
    companyId?: string | null,
    company?:  {
      __typename: "Company",
      id: string,
      name: string,
      email: string,
      phone?: string | null,
      address?: string | null,
      website?: string | null,
      logo?: string | null,
      description?: string | null,
      isActive: boolean,
      createdAt: string,
      updatedAt: string,
    } | null,
    isActive: boolean,
    lastLoginAt?: string | null,
    createdAt: string,
    updatedAt: string,
    approvalStatus?: ApprovalStatus | null,
    approvedAt?: string | null,
    approvedBy?: string | null,
    approvalNotes?: string | null,
    rejectedAt?: string | null,
    rejectedBy?: string | null,
    rejectionReason?: string | null,
    resume?: string | null,
    applications?:  {
      __typename: "ModelApplicationConnection",
      nextToken?: string | null,
    } | null,
    testAttempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    videoTestAttempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    interviews?:  {
      __typename: "ModelInterviewConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type DeleteUserMutationVariables = {
  input: DeleteUserInput,
  condition?: ModelUserConditionInput | null,
};

export type DeleteUserMutation = {
  deleteUser?:  {
    __typename: "User",
    id: string,
    sub: string,
    email: string,
    firstName: string,
    lastName: string,
    phone?: string | null,
    role: UserRole,
    companyId?: string | null,
    company?:  {
      __typename: "Company",
      id: string,
      name: string,
      email: string,
      phone?: string | null,
      address?: string | null,
      website?: string | null,
      logo?: string | null,
      description?: string | null,
      isActive: boolean,
      createdAt: string,
      updatedAt: string,
    } | null,
    isActive: boolean,
    lastLoginAt?: string | null,
    createdAt: string,
    updatedAt: string,
    approvalStatus?: ApprovalStatus | null,
    approvedAt?: string | null,
    approvedBy?: string | null,
    approvalNotes?: string | null,
    rejectedAt?: string | null,
    rejectedBy?: string | null,
    rejectionReason?: string | null,
    resume?: string | null,
    applications?:  {
      __typename: "ModelApplicationConnection",
      nextToken?: string | null,
    } | null,
    testAttempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    videoTestAttempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    interviews?:  {
      __typename: "ModelInterviewConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type CreateCompanyMutationVariables = {
  input: CreateCompanyInput,
  condition?: ModelCompanyConditionInput | null,
};

export type CreateCompanyMutation = {
  createCompany?:  {
    __typename: "Company",
    id: string,
    name: string,
    email: string,
    phone?: string | null,
    address?: string | null,
    website?: string | null,
    logo?: string | null,
    description?: string | null,
    isActive: boolean,
    admins?:  {
      __typename: "ModelUserConnection",
      nextToken?: string | null,
    } | null,
    jobs?:  {
      __typename: "ModelJobConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateCompanyMutationVariables = {
  input: UpdateCompanyInput,
  condition?: ModelCompanyConditionInput | null,
};

export type UpdateCompanyMutation = {
  updateCompany?:  {
    __typename: "Company",
    id: string,
    name: string,
    email: string,
    phone?: string | null,
    address?: string | null,
    website?: string | null,
    logo?: string | null,
    description?: string | null,
    isActive: boolean,
    admins?:  {
      __typename: "ModelUserConnection",
      nextToken?: string | null,
    } | null,
    jobs?:  {
      __typename: "ModelJobConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteCompanyMutationVariables = {
  input: DeleteCompanyInput,
  condition?: ModelCompanyConditionInput | null,
};

export type DeleteCompanyMutation = {
  deleteCompany?:  {
    __typename: "Company",
    id: string,
    name: string,
    email: string,
    phone?: string | null,
    address?: string | null,
    website?: string | null,
    logo?: string | null,
    description?: string | null,
    isActive: boolean,
    admins?:  {
      __typename: "ModelUserConnection",
      nextToken?: string | null,
    } | null,
    jobs?:  {
      __typename: "ModelJobConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateJobMutationVariables = {
  input: CreateJobInput,
  condition?: ModelJobConditionInput | null,
};

export type CreateJobMutation = {
  createJob?:  {
    __typename: "Job",
    id: string,
    title: string,
    department: string,
    location: string,
    type: JobType,
    salary?: string | null,
    description: string,
    requirements: Array< string >,
    responsibilities: Array< string >,
    benefits?: Array< string > | null,
    status: JobStatus,
    companyId: string,
    company:  {
      __typename: "Company",
      id: string,
      name: string,
      email: string,
      phone?: string | null,
      address?: string | null,
      website?: string | null,
      logo?: string | null,
      description?: string | null,
      isActive: boolean,
      createdAt: string,
      updatedAt: string,
    },
    applications?:  {
      __typename: "ModelApplicationConnection",
      nextToken?: string | null,
    } | null,
    tests?:  {
      __typename: "ModelTestConnection",
      nextToken?: string | null,
    } | null,
    videoTests?:  {
      __typename: "ModelVideoTestConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    closingDate?: string | null,
  } | null,
};

export type UpdateJobMutationVariables = {
  input: UpdateJobInput,
  condition?: ModelJobConditionInput | null,
};

export type UpdateJobMutation = {
  updateJob?:  {
    __typename: "Job",
    id: string,
    title: string,
    department: string,
    location: string,
    type: JobType,
    salary?: string | null,
    description: string,
    requirements: Array< string >,
    responsibilities: Array< string >,
    benefits?: Array< string > | null,
    status: JobStatus,
    companyId: string,
    company:  {
      __typename: "Company",
      id: string,
      name: string,
      email: string,
      phone?: string | null,
      address?: string | null,
      website?: string | null,
      logo?: string | null,
      description?: string | null,
      isActive: boolean,
      createdAt: string,
      updatedAt: string,
    },
    applications?:  {
      __typename: "ModelApplicationConnection",
      nextToken?: string | null,
    } | null,
    tests?:  {
      __typename: "ModelTestConnection",
      nextToken?: string | null,
    } | null,
    videoTests?:  {
      __typename: "ModelVideoTestConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    closingDate?: string | null,
  } | null,
};

export type DeleteJobMutationVariables = {
  input: DeleteJobInput,
  condition?: ModelJobConditionInput | null,
};

export type DeleteJobMutation = {
  deleteJob?:  {
    __typename: "Job",
    id: string,
    title: string,
    department: string,
    location: string,
    type: JobType,
    salary?: string | null,
    description: string,
    requirements: Array< string >,
    responsibilities: Array< string >,
    benefits?: Array< string > | null,
    status: JobStatus,
    companyId: string,
    company:  {
      __typename: "Company",
      id: string,
      name: string,
      email: string,
      phone?: string | null,
      address?: string | null,
      website?: string | null,
      logo?: string | null,
      description?: string | null,
      isActive: boolean,
      createdAt: string,
      updatedAt: string,
    },
    applications?:  {
      __typename: "ModelApplicationConnection",
      nextToken?: string | null,
    } | null,
    tests?:  {
      __typename: "ModelTestConnection",
      nextToken?: string | null,
    } | null,
    videoTests?:  {
      __typename: "ModelVideoTestConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    closingDate?: string | null,
  } | null,
};

export type CreateApplicationMutationVariables = {
  input: CreateApplicationInput,
  condition?: ModelApplicationConditionInput | null,
};

export type CreateApplicationMutation = {
  createApplication?:  {
    __typename: "Application",
    id: string,
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    appliedAt: string,
    currentStage: number,
    overallStatus: ApplicationStatus,
    applicationStatus: StageStatus,
    writtenTestStatus: StageStatus,
    videoTestStatus: StageStatus,
    interviewStatus: StageStatus,
    feedback?: string | null,
    internalNotes?: string | null,
    testAttempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    videoTestAttempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    interviews?:  {
      __typename: "ModelInterviewConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateApplicationMutationVariables = {
  input: UpdateApplicationInput,
  condition?: ModelApplicationConditionInput | null,
};

export type UpdateApplicationMutation = {
  updateApplication?:  {
    __typename: "Application",
    id: string,
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    appliedAt: string,
    currentStage: number,
    overallStatus: ApplicationStatus,
    applicationStatus: StageStatus,
    writtenTestStatus: StageStatus,
    videoTestStatus: StageStatus,
    interviewStatus: StageStatus,
    feedback?: string | null,
    internalNotes?: string | null,
    testAttempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    videoTestAttempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    interviews?:  {
      __typename: "ModelInterviewConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteApplicationMutationVariables = {
  input: DeleteApplicationInput,
  condition?: ModelApplicationConditionInput | null,
};

export type DeleteApplicationMutation = {
  deleteApplication?:  {
    __typename: "Application",
    id: string,
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    appliedAt: string,
    currentStage: number,
    overallStatus: ApplicationStatus,
    applicationStatus: StageStatus,
    writtenTestStatus: StageStatus,
    videoTestStatus: StageStatus,
    interviewStatus: StageStatus,
    feedback?: string | null,
    internalNotes?: string | null,
    testAttempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    videoTestAttempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    interviews?:  {
      __typename: "ModelInterviewConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateTestMutationVariables = {
  input: CreateTestInput,
  condition?: ModelTestConditionInput | null,
};

export type CreateTestMutation = {
  createTest?:  {
    __typename: "Test",
    id: string,
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    title: string,
    description: string,
    instructions: string,
    timeLimit: number,
    totalPoints: number,
    passingScore: number,
    isActive: boolean,
    questions: string,
    attempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateTestMutationVariables = {
  input: UpdateTestInput,
  condition?: ModelTestConditionInput | null,
};

export type UpdateTestMutation = {
  updateTest?:  {
    __typename: "Test",
    id: string,
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    title: string,
    description: string,
    instructions: string,
    timeLimit: number,
    totalPoints: number,
    passingScore: number,
    isActive: boolean,
    questions: string,
    attempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteTestMutationVariables = {
  input: DeleteTestInput,
  condition?: ModelTestConditionInput | null,
};

export type DeleteTestMutation = {
  deleteTest?:  {
    __typename: "Test",
    id: string,
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    title: string,
    description: string,
    instructions: string,
    timeLimit: number,
    totalPoints: number,
    passingScore: number,
    isActive: boolean,
    questions: string,
    attempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateTestAttemptMutationVariables = {
  input: CreateTestAttemptInput,
  condition?: ModelTestAttemptConditionInput | null,
};

export type CreateTestAttemptMutation = {
  createTestAttempt?:  {
    __typename: "TestAttempt",
    id: string,
    testId: string,
    test:  {
      __typename: "Test",
      id: string,
      jobId: string,
      title: string,
      description: string,
      instructions: string,
      timeLimit: number,
      totalPoints: number,
      passingScore: number,
      isActive: boolean,
      questions: string,
      createdAt: string,
      updatedAt: string,
    },
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    startedAt: string,
    completedAt?: string | null,
    timeRemaining?: number | null,
    status: TestAttemptStatus,
    answers?: string | null,
    score?: number | null,
    percentage?: number | null,
    passed?: boolean | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateTestAttemptMutationVariables = {
  input: UpdateTestAttemptInput,
  condition?: ModelTestAttemptConditionInput | null,
};

export type UpdateTestAttemptMutation = {
  updateTestAttempt?:  {
    __typename: "TestAttempt",
    id: string,
    testId: string,
    test:  {
      __typename: "Test",
      id: string,
      jobId: string,
      title: string,
      description: string,
      instructions: string,
      timeLimit: number,
      totalPoints: number,
      passingScore: number,
      isActive: boolean,
      questions: string,
      createdAt: string,
      updatedAt: string,
    },
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    startedAt: string,
    completedAt?: string | null,
    timeRemaining?: number | null,
    status: TestAttemptStatus,
    answers?: string | null,
    score?: number | null,
    percentage?: number | null,
    passed?: boolean | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteTestAttemptMutationVariables = {
  input: DeleteTestAttemptInput,
  condition?: ModelTestAttemptConditionInput | null,
};

export type DeleteTestAttemptMutation = {
  deleteTestAttempt?:  {
    __typename: "TestAttempt",
    id: string,
    testId: string,
    test:  {
      __typename: "Test",
      id: string,
      jobId: string,
      title: string,
      description: string,
      instructions: string,
      timeLimit: number,
      totalPoints: number,
      passingScore: number,
      isActive: boolean,
      questions: string,
      createdAt: string,
      updatedAt: string,
    },
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    startedAt: string,
    completedAt?: string | null,
    timeRemaining?: number | null,
    status: TestAttemptStatus,
    answers?: string | null,
    score?: number | null,
    percentage?: number | null,
    passed?: boolean | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateVideoTestMutationVariables = {
  input: CreateVideoTestInput,
  condition?: ModelVideoTestConditionInput | null,
};

export type CreateVideoTestMutation = {
  createVideoTest?:  {
    __typename: "VideoTest",
    id: string,
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    title: string,
    description: string,
    instructions: string,
    totalPoints: number,
    isActive: boolean,
    questions: string,
    attempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateVideoTestMutationVariables = {
  input: UpdateVideoTestInput,
  condition?: ModelVideoTestConditionInput | null,
};

export type UpdateVideoTestMutation = {
  updateVideoTest?:  {
    __typename: "VideoTest",
    id: string,
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    title: string,
    description: string,
    instructions: string,
    totalPoints: number,
    isActive: boolean,
    questions: string,
    attempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteVideoTestMutationVariables = {
  input: DeleteVideoTestInput,
  condition?: ModelVideoTestConditionInput | null,
};

export type DeleteVideoTestMutation = {
  deleteVideoTest?:  {
    __typename: "VideoTest",
    id: string,
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    title: string,
    description: string,
    instructions: string,
    totalPoints: number,
    isActive: boolean,
    questions: string,
    attempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateVideoTestAttemptMutationVariables = {
  input: CreateVideoTestAttemptInput,
  condition?: ModelVideoTestAttemptConditionInput | null,
};

export type CreateVideoTestAttemptMutation = {
  createVideoTestAttempt?:  {
    __typename: "VideoTestAttempt",
    id: string,
    videoTestId: string,
    videoTest:  {
      __typename: "VideoTest",
      id: string,
      jobId: string,
      title: string,
      description: string,
      instructions: string,
      totalPoints: number,
      isActive: boolean,
      questions: string,
      createdAt: string,
      updatedAt: string,
    },
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    startedAt: string,
    completedAt?: string | null,
    status: VideoTestAttemptStatus,
    currentQuestionIndex: number,
    recordings?: string | null,
    totalScore?: number | null,
    feedback?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateVideoTestAttemptMutationVariables = {
  input: UpdateVideoTestAttemptInput,
  condition?: ModelVideoTestAttemptConditionInput | null,
};

export type UpdateVideoTestAttemptMutation = {
  updateVideoTestAttempt?:  {
    __typename: "VideoTestAttempt",
    id: string,
    videoTestId: string,
    videoTest:  {
      __typename: "VideoTest",
      id: string,
      jobId: string,
      title: string,
      description: string,
      instructions: string,
      totalPoints: number,
      isActive: boolean,
      questions: string,
      createdAt: string,
      updatedAt: string,
    },
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    startedAt: string,
    completedAt?: string | null,
    status: VideoTestAttemptStatus,
    currentQuestionIndex: number,
    recordings?: string | null,
    totalScore?: number | null,
    feedback?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteVideoTestAttemptMutationVariables = {
  input: DeleteVideoTestAttemptInput,
  condition?: ModelVideoTestAttemptConditionInput | null,
};

export type DeleteVideoTestAttemptMutation = {
  deleteVideoTestAttempt?:  {
    __typename: "VideoTestAttempt",
    id: string,
    videoTestId: string,
    videoTest:  {
      __typename: "VideoTest",
      id: string,
      jobId: string,
      title: string,
      description: string,
      instructions: string,
      totalPoints: number,
      isActive: boolean,
      questions: string,
      createdAt: string,
      updatedAt: string,
    },
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    startedAt: string,
    completedAt?: string | null,
    status: VideoTestAttemptStatus,
    currentQuestionIndex: number,
    recordings?: string | null,
    totalScore?: number | null,
    feedback?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateInterviewMutationVariables = {
  input: CreateInterviewInput,
  condition?: ModelInterviewConditionInput | null,
};

export type CreateInterviewMutation = {
  createInterview?:  {
    __typename: "Interview",
    id: string,
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    scheduledAt: string,
    duration: number,
    type: InterviewType,
    status: InterviewStatus,
    meetingUrl?: string | null,
    interviewerNotes?: string | null,
    candidateFeedback?: string | null,
    finalScore?: number | null,
    recommendation?: InterviewRecommendation | null,
    interviewers?: Array< string > | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateInterviewMutationVariables = {
  input: UpdateInterviewInput,
  condition?: ModelInterviewConditionInput | null,
};

export type UpdateInterviewMutation = {
  updateInterview?:  {
    __typename: "Interview",
    id: string,
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    scheduledAt: string,
    duration: number,
    type: InterviewType,
    status: InterviewStatus,
    meetingUrl?: string | null,
    interviewerNotes?: string | null,
    candidateFeedback?: string | null,
    finalScore?: number | null,
    recommendation?: InterviewRecommendation | null,
    interviewers?: Array< string > | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteInterviewMutationVariables = {
  input: DeleteInterviewInput,
  condition?: ModelInterviewConditionInput | null,
};

export type DeleteInterviewMutation = {
  deleteInterview?:  {
    __typename: "Interview",
    id: string,
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    scheduledAt: string,
    duration: number,
    type: InterviewType,
    status: InterviewStatus,
    meetingUrl?: string | null,
    interviewerNotes?: string | null,
    candidateFeedback?: string | null,
    finalScore?: number | null,
    recommendation?: InterviewRecommendation | null,
    interviewers?: Array< string > | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type GetUserQueryVariables = {
  id: string,
};

export type GetUserQuery = {
  getUser?:  {
    __typename: "User",
    id: string,
    sub: string,
    email: string,
    firstName: string,
    lastName: string,
    phone?: string | null,
    role: UserRole,
    companyId?: string | null,
    company?:  {
      __typename: "Company",
      id: string,
      name: string,
      email: string,
      phone?: string | null,
      address?: string | null,
      website?: string | null,
      logo?: string | null,
      description?: string | null,
      isActive: boolean,
      createdAt: string,
      updatedAt: string,
    } | null,
    isActive: boolean,
    lastLoginAt?: string | null,
    createdAt: string,
    updatedAt: string,
    approvalStatus?: ApprovalStatus | null,
    approvedAt?: string | null,
    approvedBy?: string | null,
    approvalNotes?: string | null,
    rejectedAt?: string | null,
    rejectedBy?: string | null,
    rejectionReason?: string | null,
    resume?: string | null,
    applications?:  {
      __typename: "ModelApplicationConnection",
      nextToken?: string | null,
    } | null,
    testAttempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    videoTestAttempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    interviews?:  {
      __typename: "ModelInterviewConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type ListUsersQueryVariables = {
  filter?: ModelUserFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUsersQuery = {
  listUsers?:  {
    __typename: "ModelUserConnection",
    items:  Array< {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetCompanyQueryVariables = {
  id: string,
};

export type GetCompanyQuery = {
  getCompany?:  {
    __typename: "Company",
    id: string,
    name: string,
    email: string,
    phone?: string | null,
    address?: string | null,
    website?: string | null,
    logo?: string | null,
    description?: string | null,
    isActive: boolean,
    admins?:  {
      __typename: "ModelUserConnection",
      nextToken?: string | null,
    } | null,
    jobs?:  {
      __typename: "ModelJobConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListCompaniesQueryVariables = {
  filter?: ModelCompanyFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListCompaniesQuery = {
  listCompanies?:  {
    __typename: "ModelCompanyConnection",
    items:  Array< {
      __typename: "Company",
      id: string,
      name: string,
      email: string,
      phone?: string | null,
      address?: string | null,
      website?: string | null,
      logo?: string | null,
      description?: string | null,
      isActive: boolean,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetJobQueryVariables = {
  id: string,
};

export type GetJobQuery = {
  getJob?:  {
    __typename: "Job",
    id: string,
    title: string,
    department: string,
    location: string,
    type: JobType,
    salary?: string | null,
    description: string,
    requirements: Array< string >,
    responsibilities: Array< string >,
    benefits?: Array< string > | null,
    status: JobStatus,
    companyId: string,
    company:  {
      __typename: "Company",
      id: string,
      name: string,
      email: string,
      phone?: string | null,
      address?: string | null,
      website?: string | null,
      logo?: string | null,
      description?: string | null,
      isActive: boolean,
      createdAt: string,
      updatedAt: string,
    },
    applications?:  {
      __typename: "ModelApplicationConnection",
      nextToken?: string | null,
    } | null,
    tests?:  {
      __typename: "ModelTestConnection",
      nextToken?: string | null,
    } | null,
    videoTests?:  {
      __typename: "ModelVideoTestConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    closingDate?: string | null,
  } | null,
};

export type ListJobsQueryVariables = {
  filter?: ModelJobFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListJobsQuery = {
  listJobs?:  {
    __typename: "ModelJobConnection",
    items:  Array< {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetApplicationQueryVariables = {
  id: string,
};

export type GetApplicationQuery = {
  getApplication?:  {
    __typename: "Application",
    id: string,
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    appliedAt: string,
    currentStage: number,
    overallStatus: ApplicationStatus,
    applicationStatus: StageStatus,
    writtenTestStatus: StageStatus,
    videoTestStatus: StageStatus,
    interviewStatus: StageStatus,
    feedback?: string | null,
    internalNotes?: string | null,
    testAttempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    videoTestAttempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    interviews?:  {
      __typename: "ModelInterviewConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListApplicationsQueryVariables = {
  filter?: ModelApplicationFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListApplicationsQuery = {
  listApplications?:  {
    __typename: "ModelApplicationConnection",
    items:  Array< {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type UsersBySubQueryVariables = {
  sub: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelUserFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type UsersBySubQuery = {
  usersBySub?:  {
    __typename: "ModelUserConnection",
    items:  Array< {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type UsersByEmailQueryVariables = {
  email: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelUserFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type UsersByEmailQuery = {
  usersByEmail?:  {
    __typename: "ModelUserConnection",
    items:  Array< {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type UsersByCompanyIdQueryVariables = {
  companyId: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelUserFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type UsersByCompanyIdQuery = {
  usersByCompanyId?:  {
    __typename: "ModelUserConnection",
    items:  Array< {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type UsersByApprovalStatusQueryVariables = {
  approvalStatus: ApprovalStatus,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelUserFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type UsersByApprovalStatusQuery = {
  usersByApprovalStatus?:  {
    __typename: "ModelUserConnection",
    items:  Array< {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type CompaniesByEmailQueryVariables = {
  email: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelCompanyFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type CompaniesByEmailQuery = {
  companiesByEmail?:  {
    __typename: "ModelCompanyConnection",
    items:  Array< {
      __typename: "Company",
      id: string,
      name: string,
      email: string,
      phone?: string | null,
      address?: string | null,
      website?: string | null,
      logo?: string | null,
      description?: string | null,
      isActive: boolean,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type JobsByCompanyIdQueryVariables = {
  companyId: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelJobFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type JobsByCompanyIdQuery = {
  jobsByCompanyId?:  {
    __typename: "ModelJobConnection",
    items:  Array< {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ApplicationsByCandidateIdQueryVariables = {
  candidateId: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelApplicationFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ApplicationsByCandidateIdQuery = {
  applicationsByCandidateId?:  {
    __typename: "ModelApplicationConnection",
    items:  Array< {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ApplicationsByJobIdQueryVariables = {
  jobId: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelApplicationFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ApplicationsByJobIdQuery = {
  applicationsByJobId?:  {
    __typename: "ModelApplicationConnection",
    items:  Array< {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetTestQueryVariables = {
  id: string,
};

export type GetTestQuery = {
  getTest?:  {
    __typename: "Test",
    id: string,
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    title: string,
    description: string,
    instructions: string,
    timeLimit: number,
    totalPoints: number,
    passingScore: number,
    isActive: boolean,
    questions: string,
    attempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListTestsQueryVariables = {
  filter?: ModelTestFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListTestsQuery = {
  listTests?:  {
    __typename: "ModelTestConnection",
    items:  Array< {
      __typename: "Test",
      id: string,
      jobId: string,
      title: string,
      description: string,
      instructions: string,
      timeLimit: number,
      totalPoints: number,
      passingScore: number,
      isActive: boolean,
      questions: string,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type TestsByJobIdQueryVariables = {
  jobId: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelTestFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type TestsByJobIdQuery = {
  testsByJobId?:  {
    __typename: "ModelTestConnection",
    items:  Array< {
      __typename: "Test",
      id: string,
      jobId: string,
      title: string,
      description: string,
      instructions: string,
      timeLimit: number,
      totalPoints: number,
      passingScore: number,
      isActive: boolean,
      questions: string,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetTestAttemptQueryVariables = {
  id: string,
};

export type GetTestAttemptQuery = {
  getTestAttempt?:  {
    __typename: "TestAttempt",
    id: string,
    testId: string,
    test:  {
      __typename: "Test",
      id: string,
      jobId: string,
      title: string,
      description: string,
      instructions: string,
      timeLimit: number,
      totalPoints: number,
      passingScore: number,
      isActive: boolean,
      questions: string,
      createdAt: string,
      updatedAt: string,
    },
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    startedAt: string,
    completedAt?: string | null,
    timeRemaining?: number | null,
    status: TestAttemptStatus,
    answers?: string | null,
    score?: number | null,
    percentage?: number | null,
    passed?: boolean | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListTestAttemptsQueryVariables = {
  filter?: ModelTestAttemptFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListTestAttemptsQuery = {
  listTestAttempts?:  {
    __typename: "ModelTestAttemptConnection",
    items:  Array< {
      __typename: "TestAttempt",
      id: string,
      testId: string,
      candidateId: string,
      applicationId: string,
      startedAt: string,
      completedAt?: string | null,
      timeRemaining?: number | null,
      status: TestAttemptStatus,
      answers?: string | null,
      score?: number | null,
      percentage?: number | null,
      passed?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type TestAttemptsByTestIdQueryVariables = {
  testId: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelTestAttemptFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type TestAttemptsByTestIdQuery = {
  testAttemptsByTestId?:  {
    __typename: "ModelTestAttemptConnection",
    items:  Array< {
      __typename: "TestAttempt",
      id: string,
      testId: string,
      candidateId: string,
      applicationId: string,
      startedAt: string,
      completedAt?: string | null,
      timeRemaining?: number | null,
      status: TestAttemptStatus,
      answers?: string | null,
      score?: number | null,
      percentage?: number | null,
      passed?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type TestAttemptsByCandidateIdQueryVariables = {
  candidateId: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelTestAttemptFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type TestAttemptsByCandidateIdQuery = {
  testAttemptsByCandidateId?:  {
    __typename: "ModelTestAttemptConnection",
    items:  Array< {
      __typename: "TestAttempt",
      id: string,
      testId: string,
      candidateId: string,
      applicationId: string,
      startedAt: string,
      completedAt?: string | null,
      timeRemaining?: number | null,
      status: TestAttemptStatus,
      answers?: string | null,
      score?: number | null,
      percentage?: number | null,
      passed?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type TestAttemptsByApplicationIdQueryVariables = {
  applicationId: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelTestAttemptFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type TestAttemptsByApplicationIdQuery = {
  testAttemptsByApplicationId?:  {
    __typename: "ModelTestAttemptConnection",
    items:  Array< {
      __typename: "TestAttempt",
      id: string,
      testId: string,
      candidateId: string,
      applicationId: string,
      startedAt: string,
      completedAt?: string | null,
      timeRemaining?: number | null,
      status: TestAttemptStatus,
      answers?: string | null,
      score?: number | null,
      percentage?: number | null,
      passed?: boolean | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetVideoTestQueryVariables = {
  id: string,
};

export type GetVideoTestQuery = {
  getVideoTest?:  {
    __typename: "VideoTest",
    id: string,
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    title: string,
    description: string,
    instructions: string,
    totalPoints: number,
    isActive: boolean,
    questions: string,
    attempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListVideoTestsQueryVariables = {
  filter?: ModelVideoTestFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListVideoTestsQuery = {
  listVideoTests?:  {
    __typename: "ModelVideoTestConnection",
    items:  Array< {
      __typename: "VideoTest",
      id: string,
      jobId: string,
      title: string,
      description: string,
      instructions: string,
      totalPoints: number,
      isActive: boolean,
      questions: string,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type VideoTestsByJobIdQueryVariables = {
  jobId: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelVideoTestFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type VideoTestsByJobIdQuery = {
  videoTestsByJobId?:  {
    __typename: "ModelVideoTestConnection",
    items:  Array< {
      __typename: "VideoTest",
      id: string,
      jobId: string,
      title: string,
      description: string,
      instructions: string,
      totalPoints: number,
      isActive: boolean,
      questions: string,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetVideoTestAttemptQueryVariables = {
  id: string,
};

export type GetVideoTestAttemptQuery = {
  getVideoTestAttempt?:  {
    __typename: "VideoTestAttempt",
    id: string,
    videoTestId: string,
    videoTest:  {
      __typename: "VideoTest",
      id: string,
      jobId: string,
      title: string,
      description: string,
      instructions: string,
      totalPoints: number,
      isActive: boolean,
      questions: string,
      createdAt: string,
      updatedAt: string,
    },
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    startedAt: string,
    completedAt?: string | null,
    status: VideoTestAttemptStatus,
    currentQuestionIndex: number,
    recordings?: string | null,
    totalScore?: number | null,
    feedback?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListVideoTestAttemptsQueryVariables = {
  filter?: ModelVideoTestAttemptFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListVideoTestAttemptsQuery = {
  listVideoTestAttempts?:  {
    __typename: "ModelVideoTestAttemptConnection",
    items:  Array< {
      __typename: "VideoTestAttempt",
      id: string,
      videoTestId: string,
      candidateId: string,
      applicationId: string,
      startedAt: string,
      completedAt?: string | null,
      status: VideoTestAttemptStatus,
      currentQuestionIndex: number,
      recordings?: string | null,
      totalScore?: number | null,
      feedback?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type VideoTestAttemptsByVideoTestIdQueryVariables = {
  videoTestId: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelVideoTestAttemptFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type VideoTestAttemptsByVideoTestIdQuery = {
  videoTestAttemptsByVideoTestId?:  {
    __typename: "ModelVideoTestAttemptConnection",
    items:  Array< {
      __typename: "VideoTestAttempt",
      id: string,
      videoTestId: string,
      candidateId: string,
      applicationId: string,
      startedAt: string,
      completedAt?: string | null,
      status: VideoTestAttemptStatus,
      currentQuestionIndex: number,
      recordings?: string | null,
      totalScore?: number | null,
      feedback?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type VideoTestAttemptsByCandidateIdQueryVariables = {
  candidateId: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelVideoTestAttemptFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type VideoTestAttemptsByCandidateIdQuery = {
  videoTestAttemptsByCandidateId?:  {
    __typename: "ModelVideoTestAttemptConnection",
    items:  Array< {
      __typename: "VideoTestAttempt",
      id: string,
      videoTestId: string,
      candidateId: string,
      applicationId: string,
      startedAt: string,
      completedAt?: string | null,
      status: VideoTestAttemptStatus,
      currentQuestionIndex: number,
      recordings?: string | null,
      totalScore?: number | null,
      feedback?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type VideoTestAttemptsByApplicationIdQueryVariables = {
  applicationId: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelVideoTestAttemptFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type VideoTestAttemptsByApplicationIdQuery = {
  videoTestAttemptsByApplicationId?:  {
    __typename: "ModelVideoTestAttemptConnection",
    items:  Array< {
      __typename: "VideoTestAttempt",
      id: string,
      videoTestId: string,
      candidateId: string,
      applicationId: string,
      startedAt: string,
      completedAt?: string | null,
      status: VideoTestAttemptStatus,
      currentQuestionIndex: number,
      recordings?: string | null,
      totalScore?: number | null,
      feedback?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetInterviewQueryVariables = {
  id: string,
};

export type GetInterviewQuery = {
  getInterview?:  {
    __typename: "Interview",
    id: string,
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    scheduledAt: string,
    duration: number,
    type: InterviewType,
    status: InterviewStatus,
    meetingUrl?: string | null,
    interviewerNotes?: string | null,
    candidateFeedback?: string | null,
    finalScore?: number | null,
    recommendation?: InterviewRecommendation | null,
    interviewers?: Array< string > | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListInterviewsQueryVariables = {
  filter?: ModelInterviewFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListInterviewsQuery = {
  listInterviews?:  {
    __typename: "ModelInterviewConnection",
    items:  Array< {
      __typename: "Interview",
      id: string,
      candidateId: string,
      applicationId: string,
      scheduledAt: string,
      duration: number,
      type: InterviewType,
      status: InterviewStatus,
      meetingUrl?: string | null,
      interviewerNotes?: string | null,
      candidateFeedback?: string | null,
      finalScore?: number | null,
      recommendation?: InterviewRecommendation | null,
      interviewers?: Array< string > | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type InterviewsByCandidateIdQueryVariables = {
  candidateId: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelInterviewFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type InterviewsByCandidateIdQuery = {
  interviewsByCandidateId?:  {
    __typename: "ModelInterviewConnection",
    items:  Array< {
      __typename: "Interview",
      id: string,
      candidateId: string,
      applicationId: string,
      scheduledAt: string,
      duration: number,
      type: InterviewType,
      status: InterviewStatus,
      meetingUrl?: string | null,
      interviewerNotes?: string | null,
      candidateFeedback?: string | null,
      finalScore?: number | null,
      recommendation?: InterviewRecommendation | null,
      interviewers?: Array< string > | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type InterviewsByApplicationIdQueryVariables = {
  applicationId: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelInterviewFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type InterviewsByApplicationIdQuery = {
  interviewsByApplicationId?:  {
    __typename: "ModelInterviewConnection",
    items:  Array< {
      __typename: "Interview",
      id: string,
      candidateId: string,
      applicationId: string,
      scheduledAt: string,
      duration: number,
      type: InterviewType,
      status: InterviewStatus,
      meetingUrl?: string | null,
      interviewerNotes?: string | null,
      candidateFeedback?: string | null,
      finalScore?: number | null,
      recommendation?: InterviewRecommendation | null,
      interviewers?: Array< string > | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type OnCreateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
};

export type OnCreateUserSubscription = {
  onCreateUser?:  {
    __typename: "User",
    id: string,
    sub: string,
    email: string,
    firstName: string,
    lastName: string,
    phone?: string | null,
    role: UserRole,
    companyId?: string | null,
    company?:  {
      __typename: "Company",
      id: string,
      name: string,
      email: string,
      phone?: string | null,
      address?: string | null,
      website?: string | null,
      logo?: string | null,
      description?: string | null,
      isActive: boolean,
      createdAt: string,
      updatedAt: string,
    } | null,
    isActive: boolean,
    lastLoginAt?: string | null,
    createdAt: string,
    updatedAt: string,
    approvalStatus?: ApprovalStatus | null,
    approvedAt?: string | null,
    approvedBy?: string | null,
    approvalNotes?: string | null,
    rejectedAt?: string | null,
    rejectedBy?: string | null,
    rejectionReason?: string | null,
    resume?: string | null,
    applications?:  {
      __typename: "ModelApplicationConnection",
      nextToken?: string | null,
    } | null,
    testAttempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    videoTestAttempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    interviews?:  {
      __typename: "ModelInterviewConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type OnUpdateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
};

export type OnUpdateUserSubscription = {
  onUpdateUser?:  {
    __typename: "User",
    id: string,
    sub: string,
    email: string,
    firstName: string,
    lastName: string,
    phone?: string | null,
    role: UserRole,
    companyId?: string | null,
    company?:  {
      __typename: "Company",
      id: string,
      name: string,
      email: string,
      phone?: string | null,
      address?: string | null,
      website?: string | null,
      logo?: string | null,
      description?: string | null,
      isActive: boolean,
      createdAt: string,
      updatedAt: string,
    } | null,
    isActive: boolean,
    lastLoginAt?: string | null,
    createdAt: string,
    updatedAt: string,
    approvalStatus?: ApprovalStatus | null,
    approvedAt?: string | null,
    approvedBy?: string | null,
    approvalNotes?: string | null,
    rejectedAt?: string | null,
    rejectedBy?: string | null,
    rejectionReason?: string | null,
    resume?: string | null,
    applications?:  {
      __typename: "ModelApplicationConnection",
      nextToken?: string | null,
    } | null,
    testAttempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    videoTestAttempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    interviews?:  {
      __typename: "ModelInterviewConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type OnDeleteUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
};

export type OnDeleteUserSubscription = {
  onDeleteUser?:  {
    __typename: "User",
    id: string,
    sub: string,
    email: string,
    firstName: string,
    lastName: string,
    phone?: string | null,
    role: UserRole,
    companyId?: string | null,
    company?:  {
      __typename: "Company",
      id: string,
      name: string,
      email: string,
      phone?: string | null,
      address?: string | null,
      website?: string | null,
      logo?: string | null,
      description?: string | null,
      isActive: boolean,
      createdAt: string,
      updatedAt: string,
    } | null,
    isActive: boolean,
    lastLoginAt?: string | null,
    createdAt: string,
    updatedAt: string,
    approvalStatus?: ApprovalStatus | null,
    approvedAt?: string | null,
    approvedBy?: string | null,
    approvalNotes?: string | null,
    rejectedAt?: string | null,
    rejectedBy?: string | null,
    rejectionReason?: string | null,
    resume?: string | null,
    applications?:  {
      __typename: "ModelApplicationConnection",
      nextToken?: string | null,
    } | null,
    testAttempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    videoTestAttempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    interviews?:  {
      __typename: "ModelInterviewConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type OnCreateCompanySubscriptionVariables = {
  filter?: ModelSubscriptionCompanyFilterInput | null,
};

export type OnCreateCompanySubscription = {
  onCreateCompany?:  {
    __typename: "Company",
    id: string,
    name: string,
    email: string,
    phone?: string | null,
    address?: string | null,
    website?: string | null,
    logo?: string | null,
    description?: string | null,
    isActive: boolean,
    admins?:  {
      __typename: "ModelUserConnection",
      nextToken?: string | null,
    } | null,
    jobs?:  {
      __typename: "ModelJobConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateCompanySubscriptionVariables = {
  filter?: ModelSubscriptionCompanyFilterInput | null,
};

export type OnUpdateCompanySubscription = {
  onUpdateCompany?:  {
    __typename: "Company",
    id: string,
    name: string,
    email: string,
    phone?: string | null,
    address?: string | null,
    website?: string | null,
    logo?: string | null,
    description?: string | null,
    isActive: boolean,
    admins?:  {
      __typename: "ModelUserConnection",
      nextToken?: string | null,
    } | null,
    jobs?:  {
      __typename: "ModelJobConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteCompanySubscriptionVariables = {
  filter?: ModelSubscriptionCompanyFilterInput | null,
};

export type OnDeleteCompanySubscription = {
  onDeleteCompany?:  {
    __typename: "Company",
    id: string,
    name: string,
    email: string,
    phone?: string | null,
    address?: string | null,
    website?: string | null,
    logo?: string | null,
    description?: string | null,
    isActive: boolean,
    admins?:  {
      __typename: "ModelUserConnection",
      nextToken?: string | null,
    } | null,
    jobs?:  {
      __typename: "ModelJobConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateJobSubscriptionVariables = {
  filter?: ModelSubscriptionJobFilterInput | null,
};

export type OnCreateJobSubscription = {
  onCreateJob?:  {
    __typename: "Job",
    id: string,
    title: string,
    department: string,
    location: string,
    type: JobType,
    salary?: string | null,
    description: string,
    requirements: Array< string >,
    responsibilities: Array< string >,
    benefits?: Array< string > | null,
    status: JobStatus,
    companyId: string,
    company:  {
      __typename: "Company",
      id: string,
      name: string,
      email: string,
      phone?: string | null,
      address?: string | null,
      website?: string | null,
      logo?: string | null,
      description?: string | null,
      isActive: boolean,
      createdAt: string,
      updatedAt: string,
    },
    applications?:  {
      __typename: "ModelApplicationConnection",
      nextToken?: string | null,
    } | null,
    tests?:  {
      __typename: "ModelTestConnection",
      nextToken?: string | null,
    } | null,
    videoTests?:  {
      __typename: "ModelVideoTestConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    closingDate?: string | null,
  } | null,
};

export type OnUpdateJobSubscriptionVariables = {
  filter?: ModelSubscriptionJobFilterInput | null,
};

export type OnUpdateJobSubscription = {
  onUpdateJob?:  {
    __typename: "Job",
    id: string,
    title: string,
    department: string,
    location: string,
    type: JobType,
    salary?: string | null,
    description: string,
    requirements: Array< string >,
    responsibilities: Array< string >,
    benefits?: Array< string > | null,
    status: JobStatus,
    companyId: string,
    company:  {
      __typename: "Company",
      id: string,
      name: string,
      email: string,
      phone?: string | null,
      address?: string | null,
      website?: string | null,
      logo?: string | null,
      description?: string | null,
      isActive: boolean,
      createdAt: string,
      updatedAt: string,
    },
    applications?:  {
      __typename: "ModelApplicationConnection",
      nextToken?: string | null,
    } | null,
    tests?:  {
      __typename: "ModelTestConnection",
      nextToken?: string | null,
    } | null,
    videoTests?:  {
      __typename: "ModelVideoTestConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    closingDate?: string | null,
  } | null,
};

export type OnDeleteJobSubscriptionVariables = {
  filter?: ModelSubscriptionJobFilterInput | null,
};

export type OnDeleteJobSubscription = {
  onDeleteJob?:  {
    __typename: "Job",
    id: string,
    title: string,
    department: string,
    location: string,
    type: JobType,
    salary?: string | null,
    description: string,
    requirements: Array< string >,
    responsibilities: Array< string >,
    benefits?: Array< string > | null,
    status: JobStatus,
    companyId: string,
    company:  {
      __typename: "Company",
      id: string,
      name: string,
      email: string,
      phone?: string | null,
      address?: string | null,
      website?: string | null,
      logo?: string | null,
      description?: string | null,
      isActive: boolean,
      createdAt: string,
      updatedAt: string,
    },
    applications?:  {
      __typename: "ModelApplicationConnection",
      nextToken?: string | null,
    } | null,
    tests?:  {
      __typename: "ModelTestConnection",
      nextToken?: string | null,
    } | null,
    videoTests?:  {
      __typename: "ModelVideoTestConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    closingDate?: string | null,
  } | null,
};

export type OnCreateApplicationSubscriptionVariables = {
  filter?: ModelSubscriptionApplicationFilterInput | null,
};

export type OnCreateApplicationSubscription = {
  onCreateApplication?:  {
    __typename: "Application",
    id: string,
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    appliedAt: string,
    currentStage: number,
    overallStatus: ApplicationStatus,
    applicationStatus: StageStatus,
    writtenTestStatus: StageStatus,
    videoTestStatus: StageStatus,
    interviewStatus: StageStatus,
    feedback?: string | null,
    internalNotes?: string | null,
    testAttempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    videoTestAttempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    interviews?:  {
      __typename: "ModelInterviewConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateApplicationSubscriptionVariables = {
  filter?: ModelSubscriptionApplicationFilterInput | null,
};

export type OnUpdateApplicationSubscription = {
  onUpdateApplication?:  {
    __typename: "Application",
    id: string,
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    appliedAt: string,
    currentStage: number,
    overallStatus: ApplicationStatus,
    applicationStatus: StageStatus,
    writtenTestStatus: StageStatus,
    videoTestStatus: StageStatus,
    interviewStatus: StageStatus,
    feedback?: string | null,
    internalNotes?: string | null,
    testAttempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    videoTestAttempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    interviews?:  {
      __typename: "ModelInterviewConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteApplicationSubscriptionVariables = {
  filter?: ModelSubscriptionApplicationFilterInput | null,
};

export type OnDeleteApplicationSubscription = {
  onDeleteApplication?:  {
    __typename: "Application",
    id: string,
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    appliedAt: string,
    currentStage: number,
    overallStatus: ApplicationStatus,
    applicationStatus: StageStatus,
    writtenTestStatus: StageStatus,
    videoTestStatus: StageStatus,
    interviewStatus: StageStatus,
    feedback?: string | null,
    internalNotes?: string | null,
    testAttempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    videoTestAttempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    interviews?:  {
      __typename: "ModelInterviewConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateTestSubscriptionVariables = {
  filter?: ModelSubscriptionTestFilterInput | null,
};

export type OnCreateTestSubscription = {
  onCreateTest?:  {
    __typename: "Test",
    id: string,
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    title: string,
    description: string,
    instructions: string,
    timeLimit: number,
    totalPoints: number,
    passingScore: number,
    isActive: boolean,
    questions: string,
    attempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateTestSubscriptionVariables = {
  filter?: ModelSubscriptionTestFilterInput | null,
};

export type OnUpdateTestSubscription = {
  onUpdateTest?:  {
    __typename: "Test",
    id: string,
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    title: string,
    description: string,
    instructions: string,
    timeLimit: number,
    totalPoints: number,
    passingScore: number,
    isActive: boolean,
    questions: string,
    attempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteTestSubscriptionVariables = {
  filter?: ModelSubscriptionTestFilterInput | null,
};

export type OnDeleteTestSubscription = {
  onDeleteTest?:  {
    __typename: "Test",
    id: string,
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    title: string,
    description: string,
    instructions: string,
    timeLimit: number,
    totalPoints: number,
    passingScore: number,
    isActive: boolean,
    questions: string,
    attempts?:  {
      __typename: "ModelTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateTestAttemptSubscriptionVariables = {
  filter?: ModelSubscriptionTestAttemptFilterInput | null,
  candidateId?: string | null,
};

export type OnCreateTestAttemptSubscription = {
  onCreateTestAttempt?:  {
    __typename: "TestAttempt",
    id: string,
    testId: string,
    test:  {
      __typename: "Test",
      id: string,
      jobId: string,
      title: string,
      description: string,
      instructions: string,
      timeLimit: number,
      totalPoints: number,
      passingScore: number,
      isActive: boolean,
      questions: string,
      createdAt: string,
      updatedAt: string,
    },
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    startedAt: string,
    completedAt?: string | null,
    timeRemaining?: number | null,
    status: TestAttemptStatus,
    answers?: string | null,
    score?: number | null,
    percentage?: number | null,
    passed?: boolean | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateTestAttemptSubscriptionVariables = {
  filter?: ModelSubscriptionTestAttemptFilterInput | null,
  candidateId?: string | null,
};

export type OnUpdateTestAttemptSubscription = {
  onUpdateTestAttempt?:  {
    __typename: "TestAttempt",
    id: string,
    testId: string,
    test:  {
      __typename: "Test",
      id: string,
      jobId: string,
      title: string,
      description: string,
      instructions: string,
      timeLimit: number,
      totalPoints: number,
      passingScore: number,
      isActive: boolean,
      questions: string,
      createdAt: string,
      updatedAt: string,
    },
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    startedAt: string,
    completedAt?: string | null,
    timeRemaining?: number | null,
    status: TestAttemptStatus,
    answers?: string | null,
    score?: number | null,
    percentage?: number | null,
    passed?: boolean | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteTestAttemptSubscriptionVariables = {
  filter?: ModelSubscriptionTestAttemptFilterInput | null,
  candidateId?: string | null,
};

export type OnDeleteTestAttemptSubscription = {
  onDeleteTestAttempt?:  {
    __typename: "TestAttempt",
    id: string,
    testId: string,
    test:  {
      __typename: "Test",
      id: string,
      jobId: string,
      title: string,
      description: string,
      instructions: string,
      timeLimit: number,
      totalPoints: number,
      passingScore: number,
      isActive: boolean,
      questions: string,
      createdAt: string,
      updatedAt: string,
    },
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    startedAt: string,
    completedAt?: string | null,
    timeRemaining?: number | null,
    status: TestAttemptStatus,
    answers?: string | null,
    score?: number | null,
    percentage?: number | null,
    passed?: boolean | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateVideoTestSubscriptionVariables = {
  filter?: ModelSubscriptionVideoTestFilterInput | null,
};

export type OnCreateVideoTestSubscription = {
  onCreateVideoTest?:  {
    __typename: "VideoTest",
    id: string,
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    title: string,
    description: string,
    instructions: string,
    totalPoints: number,
    isActive: boolean,
    questions: string,
    attempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateVideoTestSubscriptionVariables = {
  filter?: ModelSubscriptionVideoTestFilterInput | null,
};

export type OnUpdateVideoTestSubscription = {
  onUpdateVideoTest?:  {
    __typename: "VideoTest",
    id: string,
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    title: string,
    description: string,
    instructions: string,
    totalPoints: number,
    isActive: boolean,
    questions: string,
    attempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteVideoTestSubscriptionVariables = {
  filter?: ModelSubscriptionVideoTestFilterInput | null,
};

export type OnDeleteVideoTestSubscription = {
  onDeleteVideoTest?:  {
    __typename: "VideoTest",
    id: string,
    jobId: string,
    job:  {
      __typename: "Job",
      id: string,
      title: string,
      department: string,
      location: string,
      type: JobType,
      salary?: string | null,
      description: string,
      requirements: Array< string >,
      responsibilities: Array< string >,
      benefits?: Array< string > | null,
      status: JobStatus,
      companyId: string,
      createdAt: string,
      updatedAt: string,
      closingDate?: string | null,
    },
    title: string,
    description: string,
    instructions: string,
    totalPoints: number,
    isActive: boolean,
    questions: string,
    attempts?:  {
      __typename: "ModelVideoTestAttemptConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateVideoTestAttemptSubscriptionVariables = {
  filter?: ModelSubscriptionVideoTestAttemptFilterInput | null,
  candidateId?: string | null,
};

export type OnCreateVideoTestAttemptSubscription = {
  onCreateVideoTestAttempt?:  {
    __typename: "VideoTestAttempt",
    id: string,
    videoTestId: string,
    videoTest:  {
      __typename: "VideoTest",
      id: string,
      jobId: string,
      title: string,
      description: string,
      instructions: string,
      totalPoints: number,
      isActive: boolean,
      questions: string,
      createdAt: string,
      updatedAt: string,
    },
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    startedAt: string,
    completedAt?: string | null,
    status: VideoTestAttemptStatus,
    currentQuestionIndex: number,
    recordings?: string | null,
    totalScore?: number | null,
    feedback?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateVideoTestAttemptSubscriptionVariables = {
  filter?: ModelSubscriptionVideoTestAttemptFilterInput | null,
  candidateId?: string | null,
};

export type OnUpdateVideoTestAttemptSubscription = {
  onUpdateVideoTestAttempt?:  {
    __typename: "VideoTestAttempt",
    id: string,
    videoTestId: string,
    videoTest:  {
      __typename: "VideoTest",
      id: string,
      jobId: string,
      title: string,
      description: string,
      instructions: string,
      totalPoints: number,
      isActive: boolean,
      questions: string,
      createdAt: string,
      updatedAt: string,
    },
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    startedAt: string,
    completedAt?: string | null,
    status: VideoTestAttemptStatus,
    currentQuestionIndex: number,
    recordings?: string | null,
    totalScore?: number | null,
    feedback?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteVideoTestAttemptSubscriptionVariables = {
  filter?: ModelSubscriptionVideoTestAttemptFilterInput | null,
  candidateId?: string | null,
};

export type OnDeleteVideoTestAttemptSubscription = {
  onDeleteVideoTestAttempt?:  {
    __typename: "VideoTestAttempt",
    id: string,
    videoTestId: string,
    videoTest:  {
      __typename: "VideoTest",
      id: string,
      jobId: string,
      title: string,
      description: string,
      instructions: string,
      totalPoints: number,
      isActive: boolean,
      questions: string,
      createdAt: string,
      updatedAt: string,
    },
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    startedAt: string,
    completedAt?: string | null,
    status: VideoTestAttemptStatus,
    currentQuestionIndex: number,
    recordings?: string | null,
    totalScore?: number | null,
    feedback?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateInterviewSubscriptionVariables = {
  filter?: ModelSubscriptionInterviewFilterInput | null,
  candidateId?: string | null,
};

export type OnCreateInterviewSubscription = {
  onCreateInterview?:  {
    __typename: "Interview",
    id: string,
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    scheduledAt: string,
    duration: number,
    type: InterviewType,
    status: InterviewStatus,
    meetingUrl?: string | null,
    interviewerNotes?: string | null,
    candidateFeedback?: string | null,
    finalScore?: number | null,
    recommendation?: InterviewRecommendation | null,
    interviewers?: Array< string > | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateInterviewSubscriptionVariables = {
  filter?: ModelSubscriptionInterviewFilterInput | null,
  candidateId?: string | null,
};

export type OnUpdateInterviewSubscription = {
  onUpdateInterview?:  {
    __typename: "Interview",
    id: string,
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    scheduledAt: string,
    duration: number,
    type: InterviewType,
    status: InterviewStatus,
    meetingUrl?: string | null,
    interviewerNotes?: string | null,
    candidateFeedback?: string | null,
    finalScore?: number | null,
    recommendation?: InterviewRecommendation | null,
    interviewers?: Array< string > | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteInterviewSubscriptionVariables = {
  filter?: ModelSubscriptionInterviewFilterInput | null,
  candidateId?: string | null,
};

export type OnDeleteInterviewSubscription = {
  onDeleteInterview?:  {
    __typename: "Interview",
    id: string,
    candidateId: string,
    candidate:  {
      __typename: "User",
      id: string,
      sub: string,
      email: string,
      firstName: string,
      lastName: string,
      phone?: string | null,
      role: UserRole,
      companyId?: string | null,
      isActive: boolean,
      lastLoginAt?: string | null,
      createdAt: string,
      updatedAt: string,
      approvalStatus?: ApprovalStatus | null,
      approvedAt?: string | null,
      approvedBy?: string | null,
      approvalNotes?: string | null,
      rejectedAt?: string | null,
      rejectedBy?: string | null,
      rejectionReason?: string | null,
      resume?: string | null,
    },
    applicationId: string,
    application:  {
      __typename: "Application",
      id: string,
      candidateId: string,
      jobId: string,
      appliedAt: string,
      currentStage: number,
      overallStatus: ApplicationStatus,
      applicationStatus: StageStatus,
      writtenTestStatus: StageStatus,
      videoTestStatus: StageStatus,
      interviewStatus: StageStatus,
      feedback?: string | null,
      internalNotes?: string | null,
      createdAt: string,
      updatedAt: string,
    },
    scheduledAt: string,
    duration: number,
    type: InterviewType,
    status: InterviewStatus,
    meetingUrl?: string | null,
    interviewerNotes?: string | null,
    candidateFeedback?: string | null,
    finalScore?: number | null,
    recommendation?: InterviewRecommendation | null,
    interviewers?: Array< string > | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};
