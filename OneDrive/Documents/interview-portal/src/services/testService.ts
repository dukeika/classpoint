// File: src/services/testService.ts
import { generateClient } from 'aws-amplify/api';
import { listTests, getTest, listVideoTests, getVideoTest, testsByJobId, videoTestsByJobId } from '@/graphql/queries';
import { createTest, updateTest, deleteTest, createVideoTest, updateVideoTest, deleteVideoTest } from '@/graphql/mutations';

// Simplified createTest mutation that doesn't fetch the job relation
const createTestSimplified = /* GraphQL */ `mutation CreateTest(
  $input: CreateTestInput!
  $condition: ModelTestConditionInput
) {
  createTest(input: $input, condition: $condition) {
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
}`;

// Simplified createVideoTest mutation that doesn't fetch the job relation
const createVideoTestSimplified = /* GraphQL */ `mutation CreateVideoTest(
  $input: CreateVideoTestInput!
  $condition: ModelVideoTestConditionInput
) {
  createVideoTest(input: $input, condition: $condition) {
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
}`;

import { Test, VideoTest, CreateTestInput, UpdateTestInput, CreateVideoTestInput, UpdateVideoTestInput } from '@/API';

const client = generateClient({
  authMode: 'userPool'
});

export interface TestQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[]; // For multiple choice questions
  correctAnswer?: string | number; // For multiple choice (index) or exact answer
  points: number;
  timeLimit?: number; // Optional time limit per question in seconds
}

export interface VideoTestQuestion {
  id: string;
  question: string;
  description?: string;
  timeLimit: number; // Time limit in seconds for recording
  points: number;
  preparationTime?: number; // Optional preparation time before recording
}

export const testService = {
  // Written Tests
  async getTestsByJob(jobId: string): Promise<Test[]> {
    try {
      const result = await client.graphql({
        query: testsByJobId,
        variables: { jobId }
      });
      return (result as any).data.testsByJobId.items as Test[];
    } catch (error) {
      console.error('Error fetching tests by job:', error);
      throw error;
    }
  },

  async getTest(id: string): Promise<Test | null> {
    try {
      const result = await client.graphql({
        query: getTest,
        variables: { id }
      });
      return (result as any).data.getTest as Test;
    } catch (error) {
      console.error('Error fetching test:', error);
      throw error;
    }
  },

  async createTest(input: {
    jobId: string;
    title: string;
    description: string;
    instructions: string;
    timeLimit: number;
    totalPoints: number;
    passingScore: number;
    isActive: boolean;
    questions: TestQuestion[];
  }): Promise<Test> {
    try {
      console.log('🔍 Creating test with input:', input);
      
      const testInput: CreateTestInput = {
        jobId: input.jobId,
        title: input.title,
        description: input.description,
        instructions: input.instructions,
        timeLimit: input.timeLimit,
        totalPoints: input.totalPoints,
        passingScore: input.passingScore,
        isActive: input.isActive,
        questions: JSON.stringify(input.questions)
      };

      const result = await client.graphql({
        query: createTestSimplified,
        variables: { input: testInput }
      });
      
      console.log('✅ Test creation result:', result);
      return (result as any).data.createTest as Test;
    } catch (error: any) {
      console.error('❌ Error creating test:', error);
      console.error('❌ Error details:', {
        message: error.message,
        errors: error.errors,
        data: error.data,
        stack: error.stack
      });
      
      // Log individual GraphQL errors for debugging
      if (error.errors && Array.isArray(error.errors)) {
        console.error('🔍 GraphQL errors breakdown:');
        error.errors.forEach((err: any, index: number) => {
          console.error(`  Error ${index + 1}:`, {
            message: err.message,
            errorType: err.errorType,
            errorInfo: err.errorInfo,
            locations: err.locations,
            path: err.path
          });
        });
      }
      
      throw error;
    }
  },

  async updateTest(input: {
    id: string;
    title?: string;
    description?: string;
    instructions?: string;
    timeLimit?: number;
    totalPoints?: number;
    passingScore?: number;
    isActive?: boolean;
    questions?: TestQuestion[];
  }): Promise<Test> {
    try {
      const updateInput: UpdateTestInput = {
        id: input.id,
        ...(input.title && { title: input.title }),
        ...(input.description && { description: input.description }),
        ...(input.instructions && { instructions: input.instructions }),
        ...(input.timeLimit !== undefined && { timeLimit: input.timeLimit }),
        ...(input.totalPoints !== undefined && { totalPoints: input.totalPoints }),
        ...(input.passingScore !== undefined && { passingScore: input.passingScore }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.questions && { questions: JSON.stringify(input.questions) })
      };

      const result = await client.graphql({
        query: updateTest,
        variables: { input: updateInput }
      });
      
      return (result as any).data.updateTest as Test;
    } catch (error) {
      console.error('Error updating test:', error);
      throw error;
    }
  },

  async deleteTest(id: string): Promise<void> {
    try {
      await client.graphql({
        query: deleteTest,
        variables: { input: { id } }
      });
    } catch (error) {
      console.error('Error deleting test:', error);
      throw error;
    }
  },

  // Video Tests
  async getVideoTestsByJob(jobId: string): Promise<VideoTest[]> {
    try {
      const result = await client.graphql({
        query: videoTestsByJobId,
        variables: { jobId }
      });
      return (result as any).data.videoTestsByJobId.items as VideoTest[];
    } catch (error) {
      console.error('Error fetching video tests by job:', error);
      throw error;
    }
  },

  async getVideoTest(id: string): Promise<VideoTest | null> {
    try {
      const result = await client.graphql({
        query: getVideoTest,
        variables: { id }
      });
      return (result as any).data.getVideoTest as VideoTest;
    } catch (error) {
      console.error('Error fetching video test:', error);
      throw error;
    }
  },

  async createVideoTest(input: {
    jobId: string;
    title: string;
    description: string;
    instructions: string;
    totalPoints: number;
    isActive: boolean;
    questions: VideoTestQuestion[];
  }): Promise<VideoTest> {
    try {
      console.log('🔍 Creating video test with input:', input);
      
      const videoTestInput: CreateVideoTestInput = {
        jobId: input.jobId,
        title: input.title,
        description: input.description,
        instructions: input.instructions,
        totalPoints: input.totalPoints,
        isActive: input.isActive,
        questions: JSON.stringify(input.questions)
      };

      const result = await client.graphql({
        query: createVideoTestSimplified,
        variables: { input: videoTestInput }
      });
      
      console.log('✅ Video test creation result:', result);
      return (result as any).data.createVideoTest as VideoTest;
    } catch (error: any) {
      console.error('❌ Error creating video test:', error);
      throw error;
    }
  },

  async updateVideoTest(input: {
    id: string;
    title?: string;
    description?: string;
    instructions?: string;
    totalPoints?: number;
    isActive?: boolean;
    questions?: VideoTestQuestion[];
  }): Promise<VideoTest> {
    try {
      const updateInput: UpdateVideoTestInput = {
        id: input.id,
        ...(input.title && { title: input.title }),
        ...(input.description && { description: input.description }),
        ...(input.instructions && { instructions: input.instructions }),
        ...(input.totalPoints !== undefined && { totalPoints: input.totalPoints }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.questions && { questions: JSON.stringify(input.questions) })
      };

      const result = await client.graphql({
        query: updateVideoTest,
        variables: { input: updateInput }
      });
      
      return (result as any).data.updateVideoTest as VideoTest;
    } catch (error) {
      console.error('Error updating video test:', error);
      throw error;
    }
  },

  async deleteVideoTest(id: string): Promise<void> {
    try {
      await client.graphql({
        query: deleteVideoTest,
        variables: { input: { id } }
      });
    } catch (error) {
      console.error('Error deleting video test:', error);
      throw error;
    }
  }
};