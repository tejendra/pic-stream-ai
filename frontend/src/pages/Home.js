import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Camera, ArrowRight, Mail, Send, X } from 'lucide-react';

const funShapes = [
  { style: 'absolute top-10 left-10 bg-yellow-300', size: 'w-10 h-10', shape: 'rounded-full', opacity: 'opacity-60', rotate: 'rotate-12' },
  { style: 'absolute bottom-16 right-16 bg-pink-400', size: 'w-16 h-16', shape: 'rounded-2xl', opacity: 'opacity-40', rotate: '-rotate-6' },
  { style: 'absolute top-1/2 left-1/4 bg-blue-400', size: 'w-8 h-8', shape: 'rounded-full', opacity: 'opacity-50', rotate: 'rotate-45' },
  { style: 'absolute bottom-24 left-1/3 bg-purple-400', size: 'w-6 h-6', shape: 'rounded-full', opacity: 'opacity-40', rotate: 'rotate-12' },
];

const Home = () => {
  const { user, sendLoginLink } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  // Check if user is being invited to join an album
  const params = new URLSearchParams(location.search);
  const returnTo = params.get('returnTo');
  const isInvitedToJoin = returnTo && returnTo.startsWith('/join/');

  // Handle returnTo parameter after login
  useEffect(() => {
    if (user) {
      if (returnTo) {
        navigate(returnTo);
      }
    }
  }, [user, returnTo, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get returnTo parameter from URL
      const params = new URLSearchParams(location.search);
      const returnTo = params.get('returnTo');
      
      const result = await sendLoginLink(email, returnTo);
      if (result.success) {
        setLinkSent(true);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowLoginForm(false);
    setEmail('');
    setLinkSent(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-400 overflow-hidden">
        {/* Fun floating shapes */}
        {funShapes.map((s, i) => (
          <div
            key={i}
            className={`z-0 ${s.style} ${s.size} ${s.shape} ${s.opacity} ${s.rotate} blur-2xl animate-pulse`}
            style={{ animationDuration: `${2 + i}s` }}
          />
        ))}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-32">
          <div className="flex items-center justify-center mb-6">
            <span className="inline-flex items-center justify-center bg-white bg-opacity-80 rounded-full p-4 shadow-lg">
              <Camera className="h-12 w-12 text-blue-600" />
            </span>
          </div>
          
          {isInvitedToJoin ? (
            <>
              <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-white drop-shadow-lg tracking-tight">
                You're invited! 🎉
              </h1>
              <p className="text-lg md:text-2xl text-white/90 mb-6 max-w-xl mx-auto font-medium">
                Someone wants to share photos with you on PicStream
              </p>
              <p className="text-lg text-white/80 mb-10 max-w-lg mx-auto">
                Sign in to join the album and start sharing memories together
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-white drop-shadow-lg tracking-tight">
                Stream Photos. <span className="text-yellow-300">Share Memories.</span>
              </h1>
              <p className="text-lg md:text-2xl text-white/90 mb-10 max-w-xl mx-auto font-medium">
                The easiest way to share photos & videos from any event 🎉
              </p>
            </>
          )}
          
          {/* Login Form or Button */}
          <div className="flex flex-col items-center justify-center">
            {!user && !showLoginForm && !linkSent && (
              <button
                onClick={() => setShowLoginForm(true)}
                className="bg-white bg-opacity-80 text-blue-700 px-8 py-4 rounded-full font-bold text-lg shadow hover:bg-opacity-100 transition-colors duration-200 flex items-center justify-center"
              >
                {isInvitedToJoin ? 'Sign In to Join' : 'Login'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            )}
            
            {!user && showLoginForm && !linkSent && (
              <div className="bg-white bg-opacity-95 rounded-2xl p-8 shadow-xl max-w-md w-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isInvitedToJoin ? 'Join the Album' : 'Welcome to PicStream'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <p className="text-gray-600 mb-6 text-center">
                  {isInvitedToJoin 
                    ? 'Enter your email to receive a secure login link and join the album'
                    : 'Enter your email to receive a secure login link'
                  }
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Sending...' : 'Send Login Link'}
                  </button>
                </form>
                <p className="text-sm text-gray-500 text-center mt-4">
                  No password required. We'll send you a secure link to sign in.
                </p>
              </div>
            )}
            
            {!user && linkSent && (
              <div className="bg-white bg-opacity-95 rounded-2xl p-8 shadow-xl max-w-md w-full">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <Send className="h-6 w-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Check your email
                  </h2>
                  <p className="text-gray-600 mb-4">
                    We've sent a login link to <strong>{email}</strong>
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Click the link in your email to sign in to PicStream. The link will expire in 15 minutes.
                  </p>
                  <button
                    onClick={resetForm}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Send another link
                  </button>
                </div>
              </div>
            )}
            
            {user && (
              <Link
                to="/dashboard"
                className="bg-white bg-opacity-80 text-blue-700 px-8 py-4 rounded-full font-bold text-lg shadow hover:bg-opacity-100 transition-colors duration-200 flex items-center justify-center"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
        {/* Subtle confetti or sparkles (optional, for fun) */}
        <div className="pointer-events-none absolute inset-0 z-0">
          {[...Array(18)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white/60 rounded-full animate-bounce"
              style={{
                width: `${6 + Math.random() * 10}px`,
                height: `${6 + Math.random() * 10}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home; 