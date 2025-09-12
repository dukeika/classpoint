// File: src/services/userService.ts
import { generateClient } from 'aws-amplify/api';
import { listUsers, getUser } from '@/graphql/queries';
import { deleteUser } from '@/graphql/mutations';
import { User, CreateUserInput, UpdateUserInput, UserRole, ApprovalStatus } from '@/API';

// Custom createUser mutation that only fetches essential fields to avoid authorization errors
const createUserSimple = /* GraphQL */ `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
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
  }
`;

// Custom updateUser mutation that only fetches essential fields to avoid authorization errors
const updateUserSimple = /* GraphQL */ `
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
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
  }
`;

const client = generateClient();

// Helper function to format phone number for Cognito
function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // If it starts with 0 and is 11 digits, assume UK number
  if (digitsOnly.startsWith('0') && digitsOnly.length === 11) {
    return `+44${digitsOnly.substring(1)}`;
  }
  
  // If it already starts with +, return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // If it starts with country code without +, add +
  if (digitsOnly.length > 10 && !digitsOnly.startsWith('0')) {
    return `+${digitsOnly}`;
  }
  
  // Default: assume UK format if 10-11 digits
  if (digitsOnly.length >= 10) {
    return `+44${digitsOnly}`;
  }
  
  // Return original if we can't determine format
  return phone;
}

export const userService = {
  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    try {
      const result = await client.graphql({ 
        query: getUser,
        variables: { id }
      });
      return (result as any).data.getUser as User;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await client.graphql({
        query: listUsers,
        variables: {
          filter: {
            email: { eq: email }
          }
        }
      });
      const users = (result as any).data.listUsers.items;
      // Filter out null users from the response (in case of GraphQL partial failures)
      const validUsers = users.filter((user: any) => user !== null && user !== undefined);
      return validUsers.length > 0 ? validUsers[0] as User : null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  },

  // Get user by Cognito sub
  async getUserBySub(sub: string): Promise<User | null> {
    try {
      const result = await client.graphql({
        query: listUsers,
        variables: {
          filter: {
            sub: { eq: sub }
          }
        }
      });
      const users = (result as any).data.listUsers.items;
      return users.length > 0 ? users[0] as User : null;
    } catch (error) {
      console.error('Error fetching user by sub:', error);
      throw error;
    }
  },

  // Create a new user
  async createUser(input: CreateUserInput): Promise<User> {
    try {
      const result = await client.graphql({ 
        query: createUserSimple,
        variables: { input }
      }) as any;
      return (result as any).data.createUser as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user profile
  async updateUser(input: UpdateUserInput): Promise<User> {
    try {
      const result = await client.graphql({ 
        query: updateUserSimple,
        variables: { input }
      }) as any;
      return (result as any).data.updateUser as User;
    } catch (error: any) {
      console.error('Error updating user:', error);
      
      // Check if the user was actually updated despite GraphQL errors
      if (error.data && error.data.updateUser && error.data.updateUser.id) {
        console.log('⚠️ User was updated with some GraphQL errors, but proceeding with user:', error.data.updateUser.id);
        return error.data.updateUser as User;
      }
      
      throw error;
    }
  },

  // Update user resume
  async updateUserResume(id: string, resumeKey: string): Promise<User> {
    return this.updateUser({ id, resume: resumeKey });
  },

  // Get all users (super admin only)
  async getAllUsers(): Promise<User[]> {
    try {
      const result = await client.graphql({ 
        query: listUsers 
      });
      return (result as any).data.listUsers.items as User[];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Delete user (super admin only)
  async deleteUser(id: string): Promise<void> {
    try {
      await client.graphql({ 
        query: deleteUser,
        variables: { input: { id } }
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Toggle user active status
  async toggleUserStatus(id: string, isActive: boolean): Promise<User> {
    return this.updateUser({ id, isActive });
  },

  // Fix user companyId (temporary function)
  async fixUserCompanyId(userId: string, companyId: string): Promise<User> {
    console.log(`🔧 Fixing user ${userId} with companyId ${companyId}`);
    return this.updateUser({ id: userId, companyId });
  },

  // Fix user role and companyId for admin users (temporary function)
  async fixAdminUser(userId: string, companyId: string): Promise<User> {
    console.log(`🔧 Fixing admin user ${userId} with companyId ${companyId} and role COMPANY_ADMIN`);
    return this.updateUser({ 
      id: userId, 
      companyId,
      role: UserRole.COMPANY_ADMIN 
    });
  },

  // Fix current problematic user (temporary emergency fix)
  async fixCurrentUser(): Promise<void> {
    try {
      console.log('🚨 Emergency fix for current user...');
      
      // Get the user that's causing problems
      const problemUser = await this.getUserBySub('7969597e-5001-70b0-fbbd-b1281a807cf9');
      if (!problemUser) {
        throw new Error('User not found');
      }
      
      console.log('Found problem user:', problemUser);
      
      // Get first company
      const { companyService } = await import('./companyService');
      const companies = await companyService.getAllCompanies();
      
      if (companies.length === 0) {
        throw new Error('No companies found');
      }
      
      const firstCompany = companies[0];
      console.log('Will assign to company:', firstCompany);
      
      // Fix the user
      const fixedUser = await this.updateUser({
        id: problemUser.id,
        role: UserRole.COMPANY_ADMIN,
        companyId: firstCompany.id
      });
      
      console.log('✅ User fixed successfully:', fixedUser);
      alert('✅ User has been fixed! Please refresh the page and try logging in again.');
      
    } catch (error) {
      console.error('❌ Failed to fix user:', error);
      alert('❌ Failed to fix user: ' + (error as any).message);
    }
  },

  // Create admin user with Cognito account
  async createAdminUser(adminData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    companyId: string;
    temporaryPassword: string;
  }): Promise<User> {
    try {
      console.log('👤 Creating admin user:', adminData.email);
      
      // Check if user already exists in our database
      const existingUser = await this.getUserByEmail(adminData.email);
      if (existingUser) {
        console.log('ℹ️ User already exists in database:', existingUser.id);
        return existingUser;
      }
      
      let cognitoUserId: string;
      
      try {
        // First, create Cognito user
        const amplifyAuth = await import('aws-amplify/auth');
        
        // Format phone number for Cognito if provided
        const formattedPhone = adminData.phone ? formatPhoneNumber(adminData.phone) : undefined;
        console.log('📞 Phone formatting:', { original: adminData.phone, formatted: formattedPhone });
        
        const cognitoResult = await amplifyAuth.signUp({
          username: adminData.email,
          password: adminData.temporaryPassword,
          options: {
            userAttributes: {
              email: adminData.email,
              given_name: adminData.firstName,
              family_name: adminData.lastName,
              phone_number: formattedPhone
            },
            autoSignIn: {
              enabled: false, // Don't auto sign-in during admin creation
            }
          }
        });
        
        cognitoUserId = cognitoResult.userId || `temp_${Date.now()}`;
        console.log('✅ Cognito signUp result:', cognitoResult);
        console.log('✅ Cognito user created with ID:', cognitoUserId);
        
        // For admin users, we need to auto-confirm them since they're created by super admins
        if (cognitoResult.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
          console.log('📧 User requires confirmation, attempting to auto-confirm admin user...');
          
          try {
            // Auto-confirm admin users with a dummy code approach
            // Note: In production, you'd use AWS AdminConfirmSignUp API
            const confirmAuth = await import('aws-amplify/auth');
            
            // Try to confirm with a pattern - if this fails, user will need manual verification
            try {
              await confirmAuth.confirmSignUp({
                username: adminData.email,
                confirmationCode: '123456' // This won't work, but we'll handle the error
              });
              console.log('✅ Auto-confirmation successful');
            } catch (confirmError: any) {
              console.log('⚠️ Auto-confirmation failed as expected, user will need to verify email manually');
              console.log('💡 Admin user should check their email and click the verification link');
              console.log('📧 After email verification, they can login with the provided credentials');
            }
            
          } catch (confirmError) {
            console.error('❌ Could not attempt auto-confirm:', confirmError);
          }
        }
        
      } catch (cognitoError: any) {
        // If user already exists in Cognito, try to find their userId
        if (cognitoError.name === 'UsernameExistsException') {
          console.log('ℹ️ Cognito user already exists, trying to get existing user ID');
          // Generate a temporary ID since we can't easily get the existing Cognito user ID
          cognitoUserId = `existing_${adminData.email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
        } else {
          throw cognitoError;
        }
      }
      
      // Create user record in our database
      const userInput: CreateUserInput = {
        sub: cognitoUserId,
        email: adminData.email,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        phone: adminData.phone || undefined,
        role: UserRole.COMPANY_ADMIN, // Explicitly set as COMPANY_ADMIN
        companyId: adminData.companyId, // Ensure companyId is set
        isActive: true,
        approvalStatus: ApprovalStatus.APPROVED // Admins are auto-approved
      };
      
      console.log('🔧 Creating user with input:', userInput);
      
      const user = await this.createUser(userInput);
      console.log('✅ User database record created:', user.id);
      
      // Add user to Company Admin group
      try {
        const { cognitoGroupService, CognitoGroup } = await import('./cognitoGroupService');
        await cognitoGroupService.addUserToGroup(adminData.email, CognitoGroup.COMPANY_ADMIN);
        console.log('✅ User added to CompanyAdmins group');
      } catch (groupError) {
        console.warn('⚠️ Could not add user to group, but user was created:', groupError);
      }
      
      return user;
    } catch (error: any) {
      console.error('❌ Error creating admin user:', error);
      
      // Check if the user was actually created despite GraphQL errors
      if (error.data && error.data.createUser && error.data.createUser.id) {
        console.log('⚠️ User was created with some GraphQL errors, but proceeding with user:', error.data.createUser.id);
        return error.data.createUser as User;
      }
      
      throw error;
    }
  }
};