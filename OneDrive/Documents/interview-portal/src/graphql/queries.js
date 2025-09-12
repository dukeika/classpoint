/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getUser = /* GraphQL */ `
  query GetUser($id: ID!) {
    getUser(id: $id) {
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
`;
export const listUsers = /* GraphQL */ `
  query ListUsers(
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getCompany = /* GraphQL */ `
  query GetCompany($id: ID!) {
    getCompany(id: $id) {
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
`;
export const listCompanies = /* GraphQL */ `
  query ListCompanies(
    $filter: ModelCompanyFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listCompanies(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getJob = /* GraphQL */ `
  query GetJob($id: ID!) {
    getJob(id: $id) {
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
`;
export const listJobs = /* GraphQL */ `
  query ListJobs(
    $filter: ModelJobFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listJobs(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getApplication = /* GraphQL */ `
  query GetApplication($id: ID!) {
    getApplication(id: $id) {
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
`;
export const listApplications = /* GraphQL */ `
  query ListApplications(
    $filter: ModelApplicationFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listApplications(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const usersBySub = /* GraphQL */ `
  query UsersBySub(
    $sub: String!
    $sortDirection: ModelSortDirection
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    usersBySub(
      sub: $sub
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const usersByEmail = /* GraphQL */ `
  query UsersByEmail(
    $email: String!
    $sortDirection: ModelSortDirection
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    usersByEmail(
      email: $email
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const usersByCompanyId = /* GraphQL */ `
  query UsersByCompanyId(
    $companyId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    usersByCompanyId(
      companyId: $companyId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const usersByApprovalStatus = /* GraphQL */ `
  query UsersByApprovalStatus(
    $approvalStatus: ApprovalStatus!
    $sortDirection: ModelSortDirection
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    usersByApprovalStatus(
      approvalStatus: $approvalStatus
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const companiesByEmail = /* GraphQL */ `
  query CompaniesByEmail(
    $email: String!
    $sortDirection: ModelSortDirection
    $filter: ModelCompanyFilterInput
    $limit: Int
    $nextToken: String
  ) {
    companiesByEmail(
      email: $email
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const jobsByCompanyId = /* GraphQL */ `
  query JobsByCompanyId(
    $companyId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelJobFilterInput
    $limit: Int
    $nextToken: String
  ) {
    jobsByCompanyId(
      companyId: $companyId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const applicationsByCandidateId = /* GraphQL */ `
  query ApplicationsByCandidateId(
    $candidateId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelApplicationFilterInput
    $limit: Int
    $nextToken: String
  ) {
    applicationsByCandidateId(
      candidateId: $candidateId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const applicationsByJobId = /* GraphQL */ `
  query ApplicationsByJobId(
    $jobId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelApplicationFilterInput
    $limit: Int
    $nextToken: String
  ) {
    applicationsByJobId(
      jobId: $jobId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getTest = /* GraphQL */ `
  query GetTest($id: ID!) {
    getTest(id: $id) {
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
`;
export const listTests = /* GraphQL */ `
  query ListTests(
    $filter: ModelTestFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTests(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const testsByJobId = /* GraphQL */ `
  query TestsByJobId(
    $jobId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelTestFilterInput
    $limit: Int
    $nextToken: String
  ) {
    testsByJobId(
      jobId: $jobId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getTestAttempt = /* GraphQL */ `
  query GetTestAttempt($id: ID!) {
    getTestAttempt(id: $id) {
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
`;
export const listTestAttempts = /* GraphQL */ `
  query ListTestAttempts(
    $filter: ModelTestAttemptFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTestAttempts(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        testId
        candidateId
        applicationId
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
      nextToken
      __typename
    }
  }
`;
export const testAttemptsByTestId = /* GraphQL */ `
  query TestAttemptsByTestId(
    $testId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelTestAttemptFilterInput
    $limit: Int
    $nextToken: String
  ) {
    testAttemptsByTestId(
      testId: $testId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        testId
        candidateId
        applicationId
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
      nextToken
      __typename
    }
  }
`;
export const testAttemptsByCandidateId = /* GraphQL */ `
  query TestAttemptsByCandidateId(
    $candidateId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelTestAttemptFilterInput
    $limit: Int
    $nextToken: String
  ) {
    testAttemptsByCandidateId(
      candidateId: $candidateId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        testId
        candidateId
        applicationId
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
      nextToken
      __typename
    }
  }
`;
export const testAttemptsByApplicationId = /* GraphQL */ `
  query TestAttemptsByApplicationId(
    $applicationId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelTestAttemptFilterInput
    $limit: Int
    $nextToken: String
  ) {
    testAttemptsByApplicationId(
      applicationId: $applicationId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        testId
        candidateId
        applicationId
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
      nextToken
      __typename
    }
  }
`;
export const getVideoTest = /* GraphQL */ `
  query GetVideoTest($id: ID!) {
    getVideoTest(id: $id) {
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
`;
export const listVideoTests = /* GraphQL */ `
  query ListVideoTests(
    $filter: ModelVideoTestFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listVideoTests(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const videoTestsByJobId = /* GraphQL */ `
  query VideoTestsByJobId(
    $jobId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelVideoTestFilterInput
    $limit: Int
    $nextToken: String
  ) {
    videoTestsByJobId(
      jobId: $jobId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getVideoTestAttempt = /* GraphQL */ `
  query GetVideoTestAttempt($id: ID!) {
    getVideoTestAttempt(id: $id) {
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
`;
export const listVideoTestAttempts = /* GraphQL */ `
  query ListVideoTestAttempts(
    $filter: ModelVideoTestAttemptFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listVideoTestAttempts(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        videoTestId
        candidateId
        applicationId
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
      nextToken
      __typename
    }
  }
`;
export const videoTestAttemptsByVideoTestId = /* GraphQL */ `
  query VideoTestAttemptsByVideoTestId(
    $videoTestId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelVideoTestAttemptFilterInput
    $limit: Int
    $nextToken: String
  ) {
    videoTestAttemptsByVideoTestId(
      videoTestId: $videoTestId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        videoTestId
        candidateId
        applicationId
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
      nextToken
      __typename
    }
  }
`;
export const videoTestAttemptsByCandidateId = /* GraphQL */ `
  query VideoTestAttemptsByCandidateId(
    $candidateId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelVideoTestAttemptFilterInput
    $limit: Int
    $nextToken: String
  ) {
    videoTestAttemptsByCandidateId(
      candidateId: $candidateId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        videoTestId
        candidateId
        applicationId
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
      nextToken
      __typename
    }
  }
`;
export const videoTestAttemptsByApplicationId = /* GraphQL */ `
  query VideoTestAttemptsByApplicationId(
    $applicationId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelVideoTestAttemptFilterInput
    $limit: Int
    $nextToken: String
  ) {
    videoTestAttemptsByApplicationId(
      applicationId: $applicationId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        videoTestId
        candidateId
        applicationId
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
      nextToken
      __typename
    }
  }
`;
export const getInterview = /* GraphQL */ `
  query GetInterview($id: ID!) {
    getInterview(id: $id) {
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
`;
export const listInterviews = /* GraphQL */ `
  query ListInterviews(
    $filter: ModelInterviewFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listInterviews(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        candidateId
        applicationId
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
      nextToken
      __typename
    }
  }
`;
export const interviewsByCandidateId = /* GraphQL */ `
  query InterviewsByCandidateId(
    $candidateId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelInterviewFilterInput
    $limit: Int
    $nextToken: String
  ) {
    interviewsByCandidateId(
      candidateId: $candidateId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        candidateId
        applicationId
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
      nextToken
      __typename
    }
  }
`;
export const interviewsByApplicationId = /* GraphQL */ `
  query InterviewsByApplicationId(
    $applicationId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelInterviewFilterInput
    $limit: Int
    $nextToken: String
  ) {
    interviewsByApplicationId(
      applicationId: $applicationId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        candidateId
        applicationId
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
      nextToken
      __typename
    }
  }
`;
