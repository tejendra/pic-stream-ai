import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MediaProvider } from './contexts/MediaContext';
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
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? children : <Navigate to="/" replace />;
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
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Only show Navbar if not on Home page */}
        {window.location.pathname !== '/' && <Navbar />}
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
            <Route path="/media/:id" element={<MediaDetail />} />
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
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AlbumProvider>
        <MediaProvider>
          <AppContent />
        </MediaProvider>
      </AlbumProvider>
    </AuthProvider>
  );
}

export default App; 