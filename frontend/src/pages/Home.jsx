// AI Generated - Needs Review
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Camera, ArrowRight, Mail, Send, X } from 'lucide-react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  IconButton,
  Avatar,
  useTheme,
  keyframes
} from '@mui/material';
import ThemeToggle from '../theme/ThemeToggle';

const funShapes = [
  { style: { top: '10%', left: '10%' }, size: 40, shape: '50%', opacity: 0.6, rotate: 12, color: 'warning.main' },
  { style: { bottom: '16%', right: '16%' }, size: 64, shape: '16px', opacity: 0.4, rotate: -6, color: 'secondary.main' },
  { style: { top: '50%', left: '25%' }, size: 32, shape: '50%', opacity: 0.5, rotate: 45, color: 'info.main' },
  { style: { bottom: '24%', left: '33%' }, size: 24, shape: '50%', opacity: 0.4, rotate: 12, color: 'primary.main' },
];

const bounce = keyframes`
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0,0,0);
  }
  40%, 43% {
    transform: translate3d(0, -30px, 0);
  }
  70% {
    transform: translate3d(0, -15px, 0);
  }
  90% {
    transform: translate3d(0, -4px, 0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const Home = () => {
  const { user, sendLoginLink } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
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

  // Create theme-aware gradient background
  const getGradientBackground = () => {
    if (theme.palette.mode === 'dark') {
      return `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 50%, ${theme.palette.error.dark} 100%)`;
    }
    return `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.error.main} 100%)`;
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Theme Toggle - Fixed position in top-right */}
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
        <ThemeToggle />
      </Box>
      
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: getGradientBackground(),
          overflow: 'hidden'
        }}
      >
        {/* Fun floating shapes */}
        {funShapes.map((s, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              zIndex: 0,
              ...s.style,
              width: s.size,
              height: s.size,
              borderRadius: s.shape,
              bgcolor: s.color,
              opacity: s.opacity,
              transform: `rotate(${s.rotate}deg)`,
              filter: 'blur(8px)',
              animation: `${pulse} ${2 + i}s infinite`
            }}
          />
        ))}
        
        <Box
          sx={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            px: 2,
            py: 8
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
                boxShadow: 3
              }}
            >
              <Camera size={48} color={theme.palette.primary.main} />
            </Avatar>
          </Box>
          
          {isInvitedToJoin ? (
            <>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.75rem' },
                  fontWeight: 'extrabold',
                  mb: 2,
                  color: 'white',
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  letterSpacing: 'tight'
                }}
              >
                You're invited! 🎉
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  mb: 3,
                  maxWidth: 'xl',
                  mx: 'auto',
                  fontWeight: 'medium'
                }}
              >
                Someone wants to share photos with you on PicStream
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: 'rgba(255,255,255,0.8)',
                  mb: 5,
                  maxWidth: 'lg',
                  mx: 'auto'
                }}
              >
                Sign in to join the album and start sharing memories together
              </Typography>
            </>
          ) : (
            <>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.75rem' },
                  fontWeight: 'extrabold',
                  mb: 2,
                  color: 'white',
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  letterSpacing: 'tight'
                }}
              >
                Stream Photos.{' '}
                <Box component="span" sx={{ color: theme.palette.warning.main }}>
                  Share Memories.
                </Box>
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  mb: 5,
                  maxWidth: 'xl',
                  mx: 'auto',
                  fontWeight: 'medium'
                }}
              >
                The easiest way to share photos & videos from any event 🎉
              </Typography>
            </>
          )}
          
          {/* Login Form or Button */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {!user && !showLoginForm && !linkSent && (
              <Button
                onClick={() => setShowLoginForm(true)}
                variant="contained"
                size="large"
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
                  color: theme.palette.mode === 'dark' ? 'white' : 'primary.main',
                  px: 4,
                  py: 2,
                  borderRadius: '50px',
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                  boxShadow: theme.palette.mode === 'dark' ? 4 : 3,
                  border: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : 'none',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,1)',
                    boxShadow: theme.palette.mode === 'dark' ? 6 : 4
                  }
                }}
                endIcon={<ArrowRight size={20} />}
              >
                {isInvitedToJoin ? 'Sign In to Join' : 'Login'}
              </Button>
            )}
            
            {!user && showLoginForm && !linkSent && (
              <Card
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.95)',
                  borderRadius: 4,
                  p: 4,
                  boxShadow: 6,
                  maxWidth: 400,
                  width: '100%'
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                      {isInvitedToJoin ? 'Join the Album' : 'Welcome to PicStream'}
                    </Typography>
                    <IconButton onClick={resetForm} color="inherit">
                      <X size={24} />
                    </IconButton>
                  </Box>
                  <Typography sx={{ color: 'text.secondary', mb: 3, textAlign: 'center' }}>
                    {isInvitedToJoin 
                      ? 'Enter your email to receive a secure login link and join the album'
                      : 'Enter your email to receive a secure login link'
                    }
                  </Typography>
                  <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      type="email"
                      required
                      fullWidth
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      InputProps={{
                        startAdornment: <Mail size={20} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={loading}
                      sx={{ py: 1.5, fontWeight: 'semibold' }}
                    >
                      {loading ? 'Sending...' : 'Send Login Link'}
                    </Button>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mt: 2 }}>
                    No password required. We'll send you a secure link to sign in.
                  </Typography>
                </CardContent>
              </Card>
            )}
            
            {!user && linkSent && (
              <Card
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.95)',
                  borderRadius: 4,
                  p: 4,
                  boxShadow: 6,
                  maxWidth: 400,
                  width: '100%'
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: theme.palette.success[100],
                      color: 'success.main',
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <Send size={24} />
                  </Avatar>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 1 }}>
                    Check your email
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                    We've sent a login link to <strong>{email}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    Click the link in your email to sign in to PicStream. The link will expire in 15 minutes.
                  </Typography>
                  <Button
                    onClick={resetForm}
                    sx={{ color: 'primary.main', fontWeight: 'medium' }}
                  >
                    Send another link
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {user && (
              <Button
                component={Link}
                to="/dashboard"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
                  color: theme.palette.mode === 'dark' ? 'white' : 'primary.main',
                  px: 4,
                  py: 2,
                  borderRadius: '50px',
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                  boxShadow: theme.palette.mode === 'dark' ? 4 : 3,
                  border: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : 'none',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,1)',
                    boxShadow: theme.palette.mode === 'dark' ? 6 : 4
                  }
                }}
                endIcon={<ArrowRight size={20} />}
              >
                Go to Dashboard
              </Button>
            )}
          </Box>
        </Box>
        
        {/* Subtle confetti or sparkles */}
        <Box sx={{ pointerEvents: 'none', position: 'absolute', inset: 0, zIndex: 0 }}>
          {[...Array(18)].map((_, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)',
                borderRadius: '50%',
                animation: `${bounce} ${1.5 + Math.random() * 2}s infinite`,
                animationDelay: `${Math.random() * 2}s`,
                width: `${6 + Math.random() * 10}px`,
                height: `${6 + Math.random() * 10}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default Home; 