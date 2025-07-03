import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AlbumProvider } from './contexts/AlbumContext';

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
  
  console.log('ProtectedRoute state:', { user: !!user, loading, userUid: user?.uid });
  
  // Wait for both loading to be false AND user to be available
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
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
  
  console.log('AppContent render:', { pathname: location.pathname });
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Only show Navbar if not on Home page */}
      {location.pathname !== '/' && <Navbar />}
      <main className="flex-1">
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
      </main>
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
    </div>
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
      <AuthProvider>
        <AlbumProvider>
          <Router>
            <AppContent />
          </Router>
        </AlbumProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App; 