/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateUser = /* GraphQL */ `subscription OnCreateUser($filter: ModelSubscriptionUserFilterInput) {
  onCreateUser(filter: $filter) {
    id
    sub
    email
    firstName
    lastName
    phone
    role
    companyId
    company {
      id
      name
      email
      phone
      address
      website
      logo
      description
      isActive
      createdAt
      updatedAt
      __typename
    }
    isActive
    lastLoginAt
    createdAt
    updatedAt
    approvalStatus
    approvedAt
    approvedBy
    approvalNotes
    rejectedAt
    rejectedBy
    rejectionReason
    resume
    applications {
      nextToken
      __typename
    }
    testAttempts {
      nextToken
      __typename
    }
    videoTestAttempts {
      nextToken
      __typename
    }
    interviews {
      nextToken
      __typename
    }
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateUserSubscriptionVariables,
  APITypes.OnCreateUserSubscription
>;
export const onUpdateUser = /* GraphQL */ `subscription OnUpdateUser($filter: ModelSubscriptionUserFilterInput) {
  onUpdateUser(filter: $filter) {
    id
    sub
    email
    firstName
    lastName
    phone
    role
    companyId
    company {
      id
      name
      email
      phone
      address
      website
      logo
      description
      isActive
      createdAt
      updatedAt
      __typename
    }
    isActive
    lastLoginAt
    createdAt
    updatedAt
    approvalStatus
    approvedAt
    approvedBy
    approvalNotes
    rejectedAt
    rejectedBy
    rejectionReason
    resume
    applications {
      nextToken
      __typename
    }
    testAttempts {
      nextToken
      __typename
    }
    videoTestAttempts {
      nextToken
      __typename
    }
    interviews {
      nextToken
      __typename
    }
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateUserSubscriptionVariables,
  APITypes.OnUpdateUserSubscription
>;
export const onDeleteUser = /* GraphQL */ `subscription OnDeleteUser($filter: ModelSubscriptionUserFilterInput) {
  onDeleteUser(filter: $filter) {
    id
    sub
    email
    firstName
    lastName
    phone
    role
    companyId
    company {
      id
      name
      email
      phone
      address
      website
      logo
      description
      isActive
      createdAt
      updatedAt
      __typename
    }
    isActive
    lastLoginAt
    createdAt
    updatedAt
    approvalStatus
    approvedAt
    approvedBy
    approvalNotes
    rejectedAt
    rejectedBy
    rejectionReason
    resume
    applications {
      nextToken
      __typename
    }
    testAttempts {
      nextToken
      __typename
    }
    videoTestAttempts {
      nextToken
      __typename
    }
    interviews {
      nextToken
      __typename
    }
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteUserSubscriptionVariables,
  APITypes.OnDeleteUserSubscription
>;
export const onCreateCompany = /* GraphQL */ `subscription OnCreateCompany($filter: ModelSubscriptionCompanyFilterInput) {
  onCreateCompany(filter: $filter) {
    id
    name
    email
    phone
    address
    website
    logo
    description
    isActive
    admins {
      nextToken
      __typename
    }
    jobs {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateCompanySubscriptionVariables,
  APITypes.OnCreateCompanySubscription
>;
export const onUpdateCompany = /* GraphQL */ `subscription OnUpdateCompany($filter: ModelSubscriptionCompanyFilterInput) {
  onUpdateCompany(filter: $filter) {
    id
    name
    email
    phone
    address
    website
    logo
    description
    isActive
    admins {
      nextToken
      __typename
    }
    jobs {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateCompanySubscriptionVariables,
  APITypes.OnUpdateCompanySubscription
>;
export const onDeleteCompany = /* GraphQL */ `subscription OnDeleteCompany($filter: ModelSubscriptionCompanyFilterInput) {
  onDeleteCompany(filter: $filter) {
    id
    name
    email
    phone
    address
    website
    logo
    description
    isActive
    admins {
      nextToken
      __typename
    }
    jobs {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteCompanySubscriptionVariables,
  APITypes.OnDeleteCompanySubscription
>;
export const onCreateJob = /* GraphQL */ `subscription OnCreateJob($filter: ModelSubscriptionJobFilterInput) {
  onCreateJob(filter: $filter) {
    id
    title
    department
    location
    type
    salary
    description
    requirements
    responsibilities
    benefits
    status
    companyId
    company {
      id
      name
      email
      phone
      address
      website
      logo
      description
      isActive
      createdAt
      updatedAt
      __typename
    }
    applications {
      nextToken
      __typename
    }
    tests {
      nextToken
      __typename
    }
    videoTests {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    closingDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateJobSubscriptionVariables,
  APITypes.OnCreateJobSubscription
>;
export const onUpdateJob = /* GraphQL */ `subscription OnUpdateJob($filter: ModelSubscriptionJobFilterInput) {
  onUpdateJob(filter: $filter) {
    id
    title
    department
    location
    type
    salary
    description
    requirements
    responsibilities
    benefits
    status
    companyId
    company {
      id
      name
      email
      phone
      address
      website
      logo
      description
      isActive
      createdAt
      updatedAt
      __typename
    }
    applications {
      nextToken
      __typename
    }
    tests {
      nextToken
      __typename
    }
    videoTests {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    closingDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateJobSubscriptionVariables,
  APITypes.OnUpdateJobSubscription
>;
export const onDeleteJob = /* GraphQL */ `subscription OnDeleteJob($filter: ModelSubscriptionJobFilterInput) {
  onDeleteJob(filter: $filter) {
    id
    title
    department
    location
    type
    salary
    description
    requirements
    responsibilities
    benefits
    status
    companyId
    company {
      id
      name
      email
      phone
      address
      website
      logo
      description
      isActive
      createdAt
      updatedAt
      __typename
    }
    applications {
      nextToken
      __typename
    }
    tests {
      nextToken
      __typename
    }
    videoTests {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    closingDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteJobSubscriptionVariables,
  APITypes.OnDeleteJobSubscription
>;
export const onCreateApplication = /* GraphQL */ `subscription OnCreateApplication(
  $filter: ModelSubscriptionApplicationFilterInput
) {
  onCreateApplication(filter: $filter) {
    id
    candidateId
    candidate {
      id
      sub
      email
      firstName
      lastName
      phone
      role
      companyId
      isActive
      lastLoginAt
      createdAt
      updatedAt
      approvalStatus
      approvedAt
      approvedBy
      approvalNotes
      rejectedAt
      rejectedBy
      rejectionReason
      resume
      __typename
    }
    jobId
    job {
      id
      title
      department
      location
      type
      salary
      description
      requirements
      responsibilities
      benefits
      status
      companyId
      createdAt
      updatedAt
      closingDate
      __typename
    }
    appliedAt
    currentStage
    overallStatus
    applicationStatus
    writtenTestStatus
    videoTestStatus
    interviewStatus
    feedback
    internalNotes
    testAttempts {
      nextToken
      __typename
    }
    videoTestAttempts {
      nextToken
      __typename
    }
    interviews {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateApplicationSubscriptionVariables,
  APITypes.OnCreateApplicationSubscription
>;
export const onUpdateApplication = /* GraphQL */ `subscription OnUpdateApplication(
  $filter: ModelSubscriptionApplicationFilterInput
) {
  onUpdateApplication(filter: $filter) {
    id
    candidateId
    candidate {
      id
      sub
      email
      firstName
      lastName
      phone
      role
      companyId
      isActive
      lastLoginAt
      createdAt
      updatedAt
      approvalStatus
      approvedAt
      approvedBy
      approvalNotes
      rejectedAt
      rejectedBy
      rejectionReason
      resume
      __typename
    }
    jobId
    job {
      id
      title
      department
      location
      type
      salary
      description
      requirements
      responsibilities
      benefits
      status
      companyId
      createdAt
      updatedAt
      closingDate
      __typename
    }
    appliedAt
    currentStage
    overallStatus
    applicationStatus
    writtenTestStatus
    videoTestStatus
    interviewStatus
    feedback
    internalNotes
    testAttempts {
      nextToken
      __typename
    }
    videoTestAttempts {
      nextToken
      __typename
    }
    interviews {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateApplicationSubscriptionVariables,
  APITypes.OnUpdateApplicationSubscription
>;
export const onDeleteApplication = /* GraphQL */ `subscription OnDeleteApplication(
  $filter: ModelSubscriptionApplicationFilterInput
) {
  onDeleteApplication(filter: $filter) {
    id
    candidateId
    candidate {
      id
      sub
      email
      firstName
      lastName
      phone
      role
      companyId
      isActive
      lastLoginAt
      createdAt
      updatedAt
      approvalStatus
      approvedAt
      approvedBy
      approvalNotes
      rejectedAt
      rejectedBy
      rejectionReason
      resume
      __typename
    }
    jobId
    job {
      id
      title
      department
      location
      type
      salary
      description
      requirements
      responsibilities
      benefits
      status
      companyId
      createdAt
      updatedAt
      closingDate
      __typename
    }
    appliedAt
    currentStage
    overallStatus
    applicationStatus
    writtenTestStatus
    videoTestStatus
    interviewStatus
    feedback
    internalNotes
    testAttempts {
      nextToken
      __typename
    }
    videoTestAttempts {
      nextToken
      __typename
    }
    interviews {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteApplicationSubscriptionVariables,
  APITypes.OnDeleteApplicationSubscription
>;
export const onCreateTest = /* GraphQL */ `subscription OnCreateTest($filter: ModelSubscriptionTestFilterInput) {
  onCreateTest(filter: $filter) {
    id
    jobId
    job {
      id
      title
      department
      location
      type
      salary
      description
      requirements
      responsibilities
      benefits
      status
      companyId
      createdAt
      updatedAt
      closingDate
      __typename
    }
    title
    description
    instructions
    timeLimit
    totalPoints
    passingScore
    isActive
    questions
    attempts {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateTestSubscriptionVariables,
  APITypes.OnCreateTestSubscription
>;
export const onUpdateTest = /* GraphQL */ `subscription OnUpdateTest($filter: ModelSubscriptionTestFilterInput) {
  onUpdateTest(filter: $filter) {
    id
    jobId
    job {
      id
      title
      department
      location
      type
      salary
      description
      requirements
      responsibilities
      benefits
      status
      companyId
      createdAt
      updatedAt
      closingDate
      __typename
    }
    title
    description
    instructions
    timeLimit
    totalPoints
    passingScore
    isActive
    questions
    attempts {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateTestSubscriptionVariables,
  APITypes.OnUpdateTestSubscription
>;
export const onDeleteTest = /* GraphQL */ `subscription OnDeleteTest($filter: ModelSubscriptionTestFilterInput) {
  onDeleteTest(filter: $filter) {
    id
    jobId
    job {
      id
      title
      department
      location
      type
      salary
      description
      requirements
      responsibilities
      benefits
      status
      companyId
      createdAt
      updatedAt
      closingDate
      __typename
    }
    title
    description
    instructions
    timeLimit
    totalPoints
    passingScore
    isActive
    questions
    attempts {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteTestSubscriptionVariables,
  APITypes.OnDeleteTestSubscription
>;
export const onCreateTestAttempt = /* GraphQL */ `subscription OnCreateTestAttempt(
  $filter: ModelSubscriptionTestAttemptFilterInput
  $candidateId: String
) {
  onCreateTestAttempt(filter: $filter, candidateId: $candidateId) {
    id
    testId
    test {
      id
      jobId
      title
      description
      instructions
      timeLimit
      totalPoints
      passingScore
      isActive
      questions
      createdAt
      updatedAt
      __typename
    }
    candidateId
    candidate {
      id
      sub
      email
      firstName
      lastName
      phone
      role
      companyId
      isActive
      lastLoginAt
      createdAt
      updatedAt
      approvalStatus
      approvedAt
      approvedBy
      approvalNotes
      rejectedAt
      rejectedBy
      rejectionReason
      resume
      __typename
    }
    applicationId
    application {
      id
      candidateId
      jobId
      appliedAt
      currentStage
      overallStatus
      applicationStatus
      writtenTestStatus
      videoTestStatus
      interviewStatus
      feedback
      internalNotes
      createdAt
      updatedAt
      __typename
    }
    startedAt
    completedAt
    timeRemaining
    status
    answers
    score
    percentage
    passed
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateTestAttemptSubscriptionVariables,
  APITypes.OnCreateTestAttemptSubscription
>;
export const onUpdateTestAttempt = /* GraphQL */ `subscription OnUpdateTestAttempt(
  $filter: ModelSubscriptionTestAttemptFilterInput
  $candidateId: String
) {
  onUpdateTestAttempt(filter: $filter, candidateId: $candidateId) {
    id
    testId
    test {
      id
      jobId
      title
      description
      instructions
      timeLimit
      totalPoints
      passingScore
      isActive
      questions
      createdAt
      updatedAt
      __typename
    }
    candidateId
    candidate {
      id
      sub
      email
      firstName
      lastName
      phone
      role
      companyId
      isActive
      lastLoginAt
      createdAt
      updatedAt
      approvalStatus
      approvedAt
      approvedBy
      approvalNotes
      rejectedAt
      rejectedBy
      rejectionReason
      resume
      __typename
    }
    applicationId
    application {
      id
      candidateId
      jobId
      appliedAt
      currentStage
      overallStatus
      applicationStatus
      writtenTestStatus
      videoTestStatus
      interviewStatus
      feedback
      internalNotes
      createdAt
      updatedAt
      __typename
    }
    startedAt
    completedAt
    timeRemaining
    status
    answers
    score
    percentage
    passed
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateTestAttemptSubscriptionVariables,
  APITypes.OnUpdateTestAttemptSubscription
>;
export const onDeleteTestAttempt = /* GraphQL */ `subscription OnDeleteTestAttempt(
  $filter: ModelSubscriptionTestAttemptFilterInput
  $candidateId: String
) {
  onDeleteTestAttempt(filter: $filter, candidateId: $candidateId) {
    id
    testId
    test {
      id
      jobId
      title
      description
      instructions
      timeLimit
      totalPoints
      passingScore
      isActive
      questions
      createdAt
      updatedAt
      __typename
    }
    candidateId
    candidate {
      id
      sub
      email
      firstName
      lastName
      phone
      role
      companyId
      isActive
      lastLoginAt
      createdAt
      updatedAt
      approvalStatus
      approvedAt
      approvedBy
      approvalNotes
      rejectedAt
      rejectedBy
      rejectionReason
      resume
      __typename
    }
    applicationId
    application {
      id
      candidateId
      jobId
      appliedAt
      currentStage
      overallStatus
      applicationStatus
      writtenTestStatus
      videoTestStatus
      interviewStatus
      feedback
      internalNotes
      createdAt
      updatedAt
      __typename
    }
    startedAt
    completedAt
    timeRemaining
    status
    answers
    score
    percentage
    passed
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteTestAttemptSubscriptionVariables,
  APITypes.OnDeleteTestAttemptSubscription
>;
export const onCreateVideoTest = /* GraphQL */ `subscription OnCreateVideoTest($filter: ModelSubscriptionVideoTestFilterInput) {
  onCreateVideoTest(filter: $filter) {
    id
    jobId
    job {
      id
      title
      department
      location
      type
      salary
      description
      requirements
      responsibilities
      benefits
      status
      companyId
      createdAt
      updatedAt
      closingDate
      __typename
    }
    title
    description
    instructions
    totalPoints
    isActive
    questions
    attempts {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateVideoTestSubscriptionVariables,
  APITypes.OnCreateVideoTestSubscription
>;
export const onUpdateVideoTest = /* GraphQL */ `subscription OnUpdateVideoTest($filter: ModelSubscriptionVideoTestFilterInput) {
  onUpdateVideoTest(filter: $filter) {
    id
    jobId
    job {
      id
      title
      department
      location
      type
      salary
      description
      requirements
      responsibilities
      benefits
      status
      companyId
      createdAt
      updatedAt
      closingDate
      __typename
    }
    title
    description
    instructions
    totalPoints
    isActive
    questions
    attempts {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateVideoTestSubscriptionVariables,
  APITypes.OnUpdateVideoTestSubscription
>;
export const onDeleteVideoTest = /* GraphQL */ `subscription OnDeleteVideoTest($filter: ModelSubscriptionVideoTestFilterInput) {
  onDeleteVideoTest(filter: $filter) {
    id
    jobId
    job {
      id
      title
      department
      location
      type
      salary
      description
      requirements
      responsibilities
      benefits
      status
      companyId
      createdAt
      updatedAt
      closingDate
      __typename
    }
    title
    description
    instructions
    totalPoints
    isActive
    questions
    attempts {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteVideoTestSubscriptionVariables,
  APITypes.OnDeleteVideoTestSubscription
>;
export const onCreateVideoTestAttempt = /* GraphQL */ `subscription OnCreateVideoTestAttempt(
  $filter: ModelSubscriptionVideoTestAttemptFilterInput
  $candidateId: String
) {
  onCreateVideoTestAttempt(filter: $filter, candidateId: $candidateId) {
    id
    videoTestId
    videoTest {
      id
      jobId
      title
      description
      instructions
      totalPoints
      isActive
      questions
      createdAt
      updatedAt
      __typename
    }
    candidateId
    candidate {
      id
      sub
      email
      firstName
      lastName
      phone
      role
      companyId
      isActive
      lastLoginAt
      createdAt
      updatedAt
      approvalStatus
      approvedAt
      approvedBy
      approvalNotes
      rejectedAt
      rejectedBy
      rejectionReason
      resume
      __typename
    }
    applicationId
    application {
      id
      candidateId
      jobId
      appliedAt
      currentStage
      overallStatus
      applicationStatus
      writtenTestStatus
      videoTestStatus
      interviewStatus
      feedback
      internalNotes
      createdAt
      updatedAt
      __typename
    }
    startedAt
    completedAt
    status
    currentQuestionIndex
    recordings
    totalScore
    feedback
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateVideoTestAttemptSubscriptionVariables,
  APITypes.OnCreateVideoTestAttemptSubscription
>;
export const onUpdateVideoTestAttempt = /* GraphQL */ `subscription OnUpdateVideoTestAttempt(
  $filter: ModelSubscriptionVideoTestAttemptFilterInput
  $candidateId: String
) {
  onUpdateVideoTestAttempt(filter: $filter, candidateId: $candidateId) {
    id
    videoTestId
    videoTest {
      id
      jobId
      title
      description
      instructions
      totalPoints
      isActive
      questions
      createdAt
      updatedAt
      __typename
    }
    candidateId
    candidate {
      id
      sub
      email
      firstName
      lastName
      phone
      role
      companyId
      isActive
      lastLoginAt
      createdAt
      updatedAt
      approvalStatus
      approvedAt
      approvedBy
      approvalNotes
      rejectedAt
      rejectedBy
      rejectionReason
      resume
      __typename
    }
    applicationId
    application {
      id
      candidateId
      jobId
      appliedAt
      currentStage
      overallStatus
      applicationStatus
      writtenTestStatus
      videoTestStatus
      interviewStatus
      feedback
      internalNotes
      createdAt
      updatedAt
      __typename
    }
    startedAt
    completedAt
    status
    currentQuestionIndex
    recordings
    totalScore
    feedback
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateVideoTestAttemptSubscriptionVariables,
  APITypes.OnUpdateVideoTestAttemptSubscription
>;
export const onDeleteVideoTestAttempt = /* GraphQL */ `subscription OnDeleteVideoTestAttempt(
  $filter: ModelSubscriptionVideoTestAttemptFilterInput
  $candidateId: String
) {
  onDeleteVideoTestAttempt(filter: $filter, candidateId: $candidateId) {
    id
    videoTestId
    videoTest {
      id
      jobId
      title
      description
      instructions
      totalPoints
      isActive
      questions
      createdAt
      updatedAt
      __typename
    }
    candidateId
    candidate {
      id
      sub
      email
      firstName
      lastName
      phone
      role
      companyId
      isActive
      lastLoginAt
      createdAt
      updatedAt
      approvalStatus
      approvedAt
      approvedBy
      approvalNotes
      rejectedAt
      rejectedBy
      rejectionReason
      resume
      __typename
    }
    applicationId
    application {
      id
      candidateId
      jobId
      appliedAt
      currentStage
      overallStatus
      applicationStatus
      writtenTestStatus
      videoTestStatus
      interviewStatus
      feedback
      internalNotes
      createdAt
      updatedAt
      __typename
    }
    startedAt
    completedAt
    status
    currentQuestionIndex
    recordings
    totalScore
    feedback
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteVideoTestAttemptSubscriptionVariables,
  APITypes.OnDeleteVideoTestAttemptSubscription
>;
export const onCreateInterview = /* GraphQL */ `subscription OnCreateInterview(
  $filter: ModelSubscriptionInterviewFilterInput
  $candidateId: String
) {
  onCreateInterview(filter: $filter, candidateId: $candidateId) {
    id
    candidateId
    candidate {
      id
      sub
      email
      firstName
      lastName
      phone
      role
      companyId
      isActive
      lastLoginAt
      createdAt
      updatedAt
      approvalStatus
      approvedAt
      approvedBy
      approvalNotes
      rejectedAt
      rejectedBy
      rejectionReason
      resume
      __typename
    }
    applicationId
    application {
      id
      candidateId
      jobId
      appliedAt
      currentStage
      overallStatus
      applicationStatus
      writtenTestStatus
      videoTestStatus
      interviewStatus
      feedback
      internalNotes
      createdAt
      updatedAt
      __typename
    }
    scheduledAt
    duration
    type
    status
    meetingUrl
    interviewerNotes
    candidateFeedback
    finalScore
    recommendation
    interviewers
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateInterviewSubscriptionVariables,
  APITypes.OnCreateInterviewSubscription
>;
export const onUpdateInterview = /* GraphQL */ `subscription OnUpdateInterview(
  $filter: ModelSubscriptionInterviewFilterInput
  $candidateId: String
) {
  onUpdateInterview(filter: $filter, candidateId: $candidateId) {
    id
    candidateId
    candidate {
      id
      sub
      email
      firstName
      lastName
      phone
      role
      companyId
      isActive
      lastLoginAt
      createdAt
      updatedAt
      approvalStatus
      approvedAt
      approvedBy
      approvalNotes
      rejectedAt
      rejectedBy
      rejectionReason
      resume
      __typename
    }
    applicationId
    application {
      id
      candidateId
      jobId
      appliedAt
      currentStage
      overallStatus
      applicationStatus
      writtenTestStatus
      videoTestStatus
      interviewStatus
      feedback
      internalNotes
      createdAt
      updatedAt
      __typename
    }
    scheduledAt
    duration
    type
    status
    meetingUrl
    interviewerNotes
    candidateFeedback
    finalScore
    recommendation
    interviewers
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateInterviewSubscriptionVariables,
  APITypes.OnUpdateInterviewSubscription
>;
export const onDeleteInterview = /* GraphQL */ `subscription OnDeleteInterview(
  $filter: ModelSubscriptionInterviewFilterInput
  $candidateId: String
) {
  onDeleteInterview(filter: $filter, candidateId: $candidateId) {
    id
    candidateId
    candidate {
      id
      sub
      email
      firstName
      lastName
      phone
      role
      companyId
      isActive
      lastLoginAt
      createdAt
      updatedAt
      approvalStatus
      approvedAt
      approvedBy
      approvalNotes
      rejectedAt
      rejectedBy
      rejectionReason
      resume
      __typename
    }
    applicationId
    application {
      id
      candidateId
      jobId
      appliedAt
      currentStage
      overallStatus
      applicationStatus
      writtenTestStatus
      videoTestStatus
      interviewStatus
      feedback
      internalNotes
      createdAt
      updatedAt
      __typename
    }
    scheduledAt
    duration
    type
    status
    meetingUrl
    interviewerNotes
    candidateFeedback
    finalScore
    recommendation
    interviewers
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteInterviewSubscriptionVariables,
  APITypes.OnDeleteInterviewSubscription
>;
