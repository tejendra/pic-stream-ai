import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  getAuth, 
  signInWithCustomToken,
  signOut
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { useAuthState } from 'react-firebase-hooks/auth';
import toast from 'react-hot-toast';
import axios from 'axios';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Use react-firebase-hooks for auth state management
  const [user, loading, error] = useAuthState(auth);
  const [customUser, setCustomUser] = useState(null);

  // Update custom user state when Firebase user changes
  useEffect(() => {
    if (user) {
      // Get the ID token for API calls
      user.getIdToken().then((token) => {
        setCustomUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          token
        });
      });
    } else {
      setCustomUser(null);
    }
  }, [user]);

  // Handle auth errors
  useEffect(() => {
    if (error) {
      console.error('Auth error:', error);
      toast.error('Authentication error occurred');
    }
  }, [error]);

  const sendLoginLink = async (email) => {
    try {
      const response = await axios.post('/api/auth/send-login-link', { email });
      toast.success('Login link sent to your email!');
      return { success: true };
    } catch (error) {
      console.error('Send login link error:', error);
      let message = 'Failed to send login link';
      
      if (error.response?.data?.error) {
        message = error.response.data.error;
      }
      
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const verifyLoginToken = async (token) => {
    try {
      const response = await axios.post('/api/auth/verify-token', { token });
      const { customToken, user } = response.data;
      
      // Sign in with custom token
      const userCredential = await signInWithCustomToken(auth, customToken);
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      console.error('Verify token error:', error);
      let message = 'Login failed';
      
      if (error.response?.data?.error) {
        message = error.response.data.error;
      }
      
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const refreshToken = async () => {
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken(true);
        setCustomUser(prev => ({
          ...prev,
          token
        }));
        return token;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // If token refresh fails, user might need to re-authenticate
      logout();
    }
  };

  const value = {
    user: customUser,
    loading,
    error,
    sendLoginLink,
    verifyLoginToken,
    logout,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 