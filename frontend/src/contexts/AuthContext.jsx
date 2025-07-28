import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { 
  getAuth, 
  signInWithCustomToken,
  signOut
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { useAuthState } from 'react-firebase-hooks/auth';
import toast from 'react-hot-toast';
import createApiClient from '../utils/apiClient';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
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
        setCustomUser(prev => {
          const newUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            token
          };
          
          // Only update if the user data has actually changed
          if (!prev || 
              prev.uid !== newUser.uid || 
              prev.email !== newUser.email || 
              prev.token !== newUser.token) {
            return newUser;
          }
          return prev;
        });
      });

      // Set up token refresh listener
      const unsubscribe = auth.onIdTokenChanged(async (user) => {
        if (user) {
          try {
            const token = await user.getIdToken();
            setCustomUser(prev => ({
              ...prev,
              token
            }));
          } catch (error) {
            console.error('Token refresh error:', error);
          }
        }
      });

      return () => unsubscribe();
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

  // Set up automatic token refresh
  useEffect(() => {
    if (user) {
      // Refresh token every 50 minutes (tokens expire after 1 hour)
      const refreshInterval = setInterval(async () => {
        try {
          await user.getIdToken(true);
        } catch (error) {
          console.error('Automatic token refresh failed:', error);
        }
      }, 50 * 60 * 1000); // 50 minutes

      return () => clearInterval(refreshInterval);
    }
  }, [user]);

  const sendLoginLink = useCallback(async (email, returnTo) => {
    try {
      const api = createApiClient();
      await api.post('/auth/send-login-link', { email, returnTo });
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
  }, []);

  const verifyLoginToken = useCallback(async (token) => {
    try {
      const api = createApiClient();
      const response = await api.post('/auth/verify-token', { token });
      const { customToken, returnTo } = response.data;
      
      // Sign in with custom token
      await signInWithCustomToken(auth, customToken);
      
      toast.success('Login successful!');
      return { success: true, returnTo };
    } catch (error) {
      console.error('Verify token error:', error);
      let message = 'Login failed';
      
      if (error.response?.data?.error) {
        message = error.response.data.error;
      }
      
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
      throw error;
    }
  }, []);

  const refreshToken = useCallback(async () => {
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
      await signOut(auth);
    }
  }, []);

  const value = useMemo(() => ({
    user: customUser,
    loading,
    error,
    sendLoginLink,
    verifyLoginToken,
    logout,
    refreshToken
  }), [customUser, loading, error, sendLoginLink, verifyLoginToken, logout, refreshToken]);

  console.log('AuthContext value recreated:', { 
    customUserUid: customUser?.uid, 
    loading, 
    error: !!error,
    functionRefs: {
      sendLoginLink: typeof sendLoginLink,
      verifyLoginToken: typeof verifyLoginToken,
      logout: typeof logout,
      refreshToken: typeof refreshToken
    }
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 