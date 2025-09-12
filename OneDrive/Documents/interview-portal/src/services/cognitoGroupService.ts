// File: src/services/cognitoGroupService.ts
import { generateClient } from 'aws-amplify/api';

const client = generateClient();

export enum CognitoGroup {
  SUPER_ADMIN = 'SuperAdmins',
  COMPANY_ADMIN = 'CompanyAdmins', 
  CANDIDATE = 'Candidates'
}

// Custom GraphQL mutations for managing Cognito groups
const addUserToGroup = /* GraphQL */ `
  mutation AddUserToGroup($username: String!, $groupName: String!) {
    addUserToGroup(username: $username, groupName: $groupName) {
      success
      message
    }
  }
`;

const removeUserFromGroup = /* GraphQL */ `
  mutation RemoveUserFromGroup($username: String!, $groupName: String!) {
    removeUserFromGroup(username: $username, groupName: $groupName) {
      success
      message
    }
  }
`;

const createCognitoGroup = /* GraphQL */ `
  mutation CreateCognitoGroup($groupName: String!, $description: String!) {
    createCognitoGroup(groupName: $groupName, description: $description) {
      success
      message
    }
  }
`;

export const cognitoGroupService = {
  // Add user to a Cognito group
  async addUserToGroup(username: string, group: CognitoGroup): Promise<void> {
    try {
      console.log(`👥 Adding user ${username} to group ${group}`);
      
      // For now, we'll use a custom attribute approach since direct Cognito group management requires backend
      // In production, this would be handled by a Lambda function or backend API
      
      // We'll store the group information in the user's custom attributes
      const { userService } = await import('./userService');
      
      // First, get the user by email/username
      const userRecord = await userService.getUserByEmail(username);
      if (userRecord) {
        // Update the user's role based on the group
        let newRole;
        switch (group) {
          case CognitoGroup.SUPER_ADMIN:
            newRole = 'SUPER_ADMIN';
            break;
          case CognitoGroup.COMPANY_ADMIN:
            newRole = 'COMPANY_ADMIN';
            break;
          case CognitoGroup.CANDIDATE:
            newRole = 'CANDIDATE';
            break;
          default:
            newRole = 'CANDIDATE';
        }
        
        await userService.updateUser({
          id: userRecord.id,
          role: newRole as any
        });
        
        console.log(`✅ Updated user ${username} role to ${newRole}`);
      }
    } catch (error) {
      console.error('❌ Error adding user to group:', error);
      throw error;
    }
  },

  // Remove user from a Cognito group
  async removeUserFromGroup(username: string, group: CognitoGroup): Promise<void> {
    try {
      console.log(`👥 Removing user ${username} from group ${group}`);
      // Implementation would go here
    } catch (error) {
      console.error('❌ Error removing user from group:', error);
      throw error;
    }
  },

  // Create a Cognito group
  async createGroup(group: CognitoGroup, description: string): Promise<void> {
    try {
      console.log(`👥 Creating Cognito group ${group}`);
      // Implementation would go here - typically done in AWS Console or backend
    } catch (error) {
      console.error('❌ Error creating group:', error);
      throw error;
    }
  },

  // Get user's groups from JWT token
  getUserGroups(user: any): CognitoGroup[] {
    try {
      // Extract groups from JWT token
      const groups = user?.signInUserSession?.accessToken?.payload?.["cognito:groups"] || [];
      return groups.filter((group: string) => Object.values(CognitoGroup).includes(group as CognitoGroup));
    } catch (error) {
      console.error('❌ Error getting user groups:', error);
      return [];
    }
  },

  // Check if user has specific group
  userHasGroup(user: any, group: CognitoGroup): boolean {
    const userGroups = this.getUserGroups(user);
    return userGroups.includes(group);
  },

  // Get user's primary role based on groups (highest priority)
  getUserRole(user: any): 'super_admin' | 'company_admin' | 'candidate' | null {
    if (this.userHasGroup(user, CognitoGroup.SUPER_ADMIN)) {
      return 'super_admin';
    }
    if (this.userHasGroup(user, CognitoGroup.COMPANY_ADMIN)) {
      return 'company_admin';
    }
    if (this.userHasGroup(user, CognitoGroup.CANDIDATE)) {
      return 'candidate';
    }
    return null;
  }
};