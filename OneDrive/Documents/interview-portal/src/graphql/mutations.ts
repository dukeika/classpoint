/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createUser = /* GraphQL */ `mutation CreateUser(
  $input: CreateUserInput!
  $condition: ModelUserConditionInput
) {
  createUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateUserMutationVariables,
  APITypes.CreateUserMutation
>;
export const updateUser = /* GraphQL */ `mutation UpdateUser(
  $input: UpdateUserInput!
  $condition: ModelUserConditionInput
) {
  updateUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateUserMutationVariables,
  APITypes.UpdateUserMutation
>;
export const deleteUser = /* GraphQL */ `mutation DeleteUser(
  $input: DeleteUserInput!
  $condition: ModelUserConditionInput
) {
  deleteUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteUserMutationVariables,
  APITypes.DeleteUserMutation
>;
export const createCompany = /* GraphQL */ `mutation CreateCompany(
  $input: CreateCompanyInput!
  $condition: ModelCompanyConditionInput
) {
  createCompany(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateCompanyMutationVariables,
  APITypes.CreateCompanyMutation
>;
export const updateCompany = /* GraphQL */ `mutation UpdateCompany(
  $input: UpdateCompanyInput!
  $condition: ModelCompanyConditionInput
) {
  updateCompany(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateCompanyMutationVariables,
  APITypes.UpdateCompanyMutation
>;
export const deleteCompany = /* GraphQL */ `mutation DeleteCompany(
  $input: DeleteCompanyInput!
  $condition: ModelCompanyConditionInput
) {
  deleteCompany(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteCompanyMutationVariables,
  APITypes.DeleteCompanyMutation
>;
export const createJob = /* GraphQL */ `mutation CreateJob(
  $input: CreateJobInput!
  $condition: ModelJobConditionInput
) {
  createJob(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateJobMutationVariables,
  APITypes.CreateJobMutation
>;
export const updateJob = /* GraphQL */ `mutation UpdateJob(
  $input: UpdateJobInput!
  $condition: ModelJobConditionInput
) {
  updateJob(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateJobMutationVariables,
  APITypes.UpdateJobMutation
>;
export const deleteJob = /* GraphQL */ `mutation DeleteJob(
  $input: DeleteJobInput!
  $condition: ModelJobConditionInput
) {
  deleteJob(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteJobMutationVariables,
  APITypes.DeleteJobMutation
>;
export const createApplication = /* GraphQL */ `mutation CreateApplication(
  $input: CreateApplicationInput!
  $condition: ModelApplicationConditionInput
) {
  createApplication(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateApplicationMutationVariables,
  APITypes.CreateApplicationMutation
>;
export const updateApplication = /* GraphQL */ `mutation UpdateApplication(
  $input: UpdateApplicationInput!
  $condition: ModelApplicationConditionInput
) {
  updateApplication(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateApplicationMutationVariables,
  APITypes.UpdateApplicationMutation
>;
export const deleteApplication = /* GraphQL */ `mutation DeleteApplication(
  $input: DeleteApplicationInput!
  $condition: ModelApplicationConditionInput
) {
  deleteApplication(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteApplicationMutationVariables,
  APITypes.DeleteApplicationMutation
>;
export const createTest = /* GraphQL */ `mutation CreateTest(
  $input: CreateTestInput!
  $condition: ModelTestConditionInput
) {
  createTest(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateTestMutationVariables,
  APITypes.CreateTestMutation
>;
export const updateTest = /* GraphQL */ `mutation UpdateTest(
  $input: UpdateTestInput!
  $condition: ModelTestConditionInput
) {
  updateTest(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateTestMutationVariables,
  APITypes.UpdateTestMutation
>;
export const deleteTest = /* GraphQL */ `mutation DeleteTest(
  $input: DeleteTestInput!
  $condition: ModelTestConditionInput
) {
  deleteTest(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteTestMutationVariables,
  APITypes.DeleteTestMutation
>;
export const createTestAttempt = /* GraphQL */ `mutation CreateTestAttempt(
  $input: CreateTestAttemptInput!
  $condition: ModelTestAttemptConditionInput
) {
  createTestAttempt(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateTestAttemptMutationVariables,
  APITypes.CreateTestAttemptMutation
>;
export const updateTestAttempt = /* GraphQL */ `mutation UpdateTestAttempt(
  $input: UpdateTestAttemptInput!
  $condition: ModelTestAttemptConditionInput
) {
  updateTestAttempt(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateTestAttemptMutationVariables,
  APITypes.UpdateTestAttemptMutation
>;
export const deleteTestAttempt = /* GraphQL */ `mutation DeleteTestAttempt(
  $input: DeleteTestAttemptInput!
  $condition: ModelTestAttemptConditionInput
) {
  deleteTestAttempt(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteTestAttemptMutationVariables,
  APITypes.DeleteTestAttemptMutation
>;
export const createVideoTest = /* GraphQL */ `mutation CreateVideoTest(
  $input: CreateVideoTestInput!
  $condition: ModelVideoTestConditionInput
) {
  createVideoTest(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateVideoTestMutationVariables,
  APITypes.CreateVideoTestMutation
>;
export const updateVideoTest = /* GraphQL */ `mutation UpdateVideoTest(
  $input: UpdateVideoTestInput!
  $condition: ModelVideoTestConditionInput
) {
  updateVideoTest(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateVideoTestMutationVariables,
  APITypes.UpdateVideoTestMutation
>;
export const deleteVideoTest = /* GraphQL */ `mutation DeleteVideoTest(
  $input: DeleteVideoTestInput!
  $condition: ModelVideoTestConditionInput
) {
  deleteVideoTest(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteVideoTestMutationVariables,
  APITypes.DeleteVideoTestMutation
>;
export const createVideoTestAttempt = /* GraphQL */ `mutation CreateVideoTestAttempt(
  $input: CreateVideoTestAttemptInput!
  $condition: ModelVideoTestAttemptConditionInput
) {
  createVideoTestAttempt(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateVideoTestAttemptMutationVariables,
  APITypes.CreateVideoTestAttemptMutation
>;
export const updateVideoTestAttempt = /* GraphQL */ `mutation UpdateVideoTestAttempt(
  $input: UpdateVideoTestAttemptInput!
  $condition: ModelVideoTestAttemptConditionInput
) {
  updateVideoTestAttempt(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateVideoTestAttemptMutationVariables,
  APITypes.UpdateVideoTestAttemptMutation
>;
export const deleteVideoTestAttempt = /* GraphQL */ `mutation DeleteVideoTestAttempt(
  $input: DeleteVideoTestAttemptInput!
  $condition: ModelVideoTestAttemptConditionInput
) {
  deleteVideoTestAttempt(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteVideoTestAttemptMutationVariables,
  APITypes.DeleteVideoTestAttemptMutation
>;
export const createInterview = /* GraphQL */ `mutation CreateInterview(
  $input: CreateInterviewInput!
  $condition: ModelInterviewConditionInput
) {
  createInterview(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateInterviewMutationVariables,
  APITypes.CreateInterviewMutation
>;
export const updateInterview = /* GraphQL */ `mutation UpdateInterview(
  $input: UpdateInterviewInput!
  $condition: ModelInterviewConditionInput
) {
  updateInterview(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateInterviewMutationVariables,
  APITypes.UpdateInterviewMutation
>;
export const deleteInterview = /* GraphQL */ `mutation DeleteInterview(
  $input: DeleteInterviewInput!
  $condition: ModelInterviewConditionInput
) {
  deleteInterview(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteInterviewMutationVariables,
  APITypes.DeleteInterviewMutation
>;
