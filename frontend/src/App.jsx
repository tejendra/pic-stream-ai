// AI Generated - Needs Review
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Box, Container } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AlbumProvider } from './contexts/AlbumContext';
import AppThemeProvider from './theme/ThemeProvider';

// Components
import Navbar from './components/layout/Navbar';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import Home from './pages/Home';
import LoginVerify from './pages/LoginVerify';
import Dashboard from './pages/Dashboard';
import Album from './pages/Album';
import MediaDetail from './pages/MediaDetail';
import ShareView from './pages/ShareView';
import JoinAlbum from './pages/JoinAlbum';
import NotFound from './pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
    
  // Add timeout to redirect to home if not authenticated after 5 seconds
  React.useEffect(() => {
    if (!loading && !user) {
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [loading, user, navigate]);
  
  // Wait for both loading to be false AND user to be available
  if (loading || !user) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <LoadingSpinner />
      </Box>
    );
  }
  
  return children;
};

// Public Route Component (redirects if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? <Navigate to="/dashboard" replace /> : children;
};

function AppContent() {
  const location = useLocation();
  
  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="app-content"
    >
      {/* Only show Navbar if not on Home page */}
      {location.pathname !== '/' && <Navbar />}
      <Box component="main" sx={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={
            <PublicRoute>
              <Home />
            </PublicRoute>
          } />
          <Route path="/login/verify" element={
            <PublicRoute>
              <LoginVerify />
            </PublicRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/album/:albumId" element={
            <ProtectedRoute>
              <Album />
            </ProtectedRoute>
          } />
          <Route path="/media/:id" element={
            <ProtectedRoute>
              <MediaDetail />
            </ProtectedRoute>
          } />
          <Route path="/share/:shareToken" element={<ShareView />} />
          <Route path="/join/:shareToken" element={<JoinAlbum />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Box>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </Box>
  );
}

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <AuthProvider>
          <AlbumProvider>
            <Router>
              <AppContent />
            </Router>
          </AlbumProvider>
        </AuthProvider>
      </AppThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 