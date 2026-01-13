import { User as FirebaseUser, signInWithPopup, signOut, onAuthStateChanged } from './firebase';
import { googleProvider, auth } from './firebase';
import { User, UserRole } from '../types';
import { storage } from './storage';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

class AuthService {
  private currentUser: User | null = null;
  private authListeners: ((user: User | null) => void)[] = [];

  constructor() {
    // Listen to Firebase auth state changes
    onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        this.handleFirebaseUser(firebaseUser);
      } else {
        this.currentUser = null;
        this.notifyListeners(null);
      }
    });
  }

  private handleFirebaseUser(firebaseUser: FirebaseUser) {
    // Map Firebase user to our User type
    // For now, we'll assign a default role. In a real app, you'd fetch this from your backend
    const user: User = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
      email: firebaseUser.email!,
      role: UserRole.STUDENT, // Default role, should be determined by backend
      avatar: firebaseUser.photoURL || undefined
    };

    this.currentUser = user;
    this.notifyListeners(user);
  }

  private notifyListeners(user: User | null) {
    this.authListeners.forEach(listener => listener(user));
  }

  // Mock authentication methods
  async loginWithMock(email: string, password: string, role: UserRole): Promise<User | null> {
    const users = storage.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);

    if (user && (password === 'password' || password === 'admin')) {
      this.currentUser = user;
      this.notifyListeners(user);
      return user;
    }
    return null;
  }

  // Firebase authentication methods
  async loginWithGoogle(): Promise<User | null> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // The onAuthStateChanged will handle setting the user
      return this.currentUser;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
      this.notifyListeners(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.authListeners.push(callback);
    // Call immediately with current state
    callback(this.currentUser);
    // Return unsubscribe function
    return () => {
      this.authListeners = this.authListeners.filter(listener => listener !== callback);
    };
  }

  removeAuthListener(callback: (user: User | null) => void) {
    this.authListeners = this.authListeners.filter(listener => listener !== callback);
  }
}

export const authService = new AuthService();
