import { useState, useEffect } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/utils/firebase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      return userCredential.user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
      setError(errorMessage);
      console.error('Login error:', errorMessage);
      throw err;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      return userCredential.user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during signup';
      setError(errorMessage);
      console.error('Signup error:', errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during logout';
      setError(errorMessage);
      console.error('Logout error:', errorMessage);
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    isAuthenticated: !!user
  };
}; 