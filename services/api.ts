import { User, UserRole } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

export const apiService = {
  // User management
  async createUser(userData: {
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    firebaseUid?: string;
  }): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Failed to create user');
    }

    return response.json();
  },

  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  },

  async getUserById(id: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  },

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    return response.json();
  },

  async deleteUser(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
  },

  async getUsersByRole(role: UserRole): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users/role/${role}`);
    if (!response.ok) {
      throw new Error('Failed to fetch users by role');
    }
    return response.json();
  },
};
