// Mock services for demo mode
export const isMockMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  const user = localStorage.getItem('demo_user');
  return user !== null;
};

export const setMockMode = (user: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('demo_user', JSON.stringify(user));
  }
};

export const getMockUser = () => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('demo_user');
  return user ? JSON.parse(user) : null;
};

export const clearMockMode = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('demo_user');
  }
};

// Mock user service functions
export const mockUserService = {
  async getUserBySub(sub: string) {
    console.log('🎭 Mock getUserBySub called with:', sub);
    return null; // Return null so it creates a new user record
  },

  async createUser(input: any) {
    console.log('🎭 Mock createUser called with:', input);
    return {
      id: `demo-user-${Date.now()}`,
      ...input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async getUserByEmail(email: string) {
    console.log('🎭 Mock getUserByEmail called with:', email);
    return {
      id: `demo-user-${Date.now()}`,
      email,
      firstName: email.split('@')[0],
      lastName: 'Demo',
      isActive: true,
    };
  },

  async getAllUsers() {
    console.log('🎭 Mock getAllUsers called');
    return [];
  },

  async updateUser(input: any) {
    console.log('🎭 Mock updateUser called with:', input);
    return { ...input, updatedAt: new Date().toISOString() };
  },

  async deleteUser(id: string) {
    console.log('🎭 Mock deleteUser called with:', id);
  },

  async toggleUserStatus(id: string, isActive: boolean) {
    console.log('🎭 Mock toggleUserStatus called with:', id, isActive);
    return { id, isActive, updatedAt: new Date().toISOString() };
  }
};

// Mock company service functions  
export const mockCompanyService = {
  async createCompany(input: any) {
    console.log('🎭 Mock createCompany called with:', input);
    return {
      id: `demo-company-${Date.now()}`,
      ...input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async getCompanyByEmail(email: string) {
    console.log('🎭 Mock getCompanyByEmail called with:', email);
    return null;
  }
};