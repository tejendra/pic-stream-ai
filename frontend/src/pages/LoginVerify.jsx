// AI Generated - Needs Review
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import {
  Box,
  Container,
  Typography,
  Button,
  Avatar,
  useTheme
} from '@mui/material';

const LoginVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyLoginToken } = useAuth();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [error, setError] = useState('');
  const theme = useTheme();

  useEffect(() => {
    const handleVerification = async () => {
      try {
        const token = searchParams.get('token');
        const returnTo = searchParams.get('returnTo');

        if (!token) {
          setStatus('error');
          setError('Invalid verification link');
          return;
        }

        const result = await verifyLoginToken(token);
        
        if (result.success) {
          setStatus('success');
          
          // Redirect after a short delay
          setTimeout(() => {
            if (result.returnTo) {
              // Decode the returnTo URL and navigate there
              const decodedReturnTo = decodeURIComponent(result.returnTo);
              navigate(decodedReturnTo);
            } else if (returnTo) {
              // Fallback to URL parameter if not in result
              const decodedReturnTo = decodeURIComponent(returnTo);
              navigate(decodedReturnTo);
            } else {
              // Default redirect to dashboard
              navigate('/dashboard');
            }
          }, 2000);
        } else {
          setStatus('error');
          setError(result.error || 'Verification failed');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setError(error.message || 'Verification failed');
      }
    };

    handleVerification();
  }, [searchParams, navigate, verifyLoginToken]);

  if (status === 'loading') {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 6,
        px: { xs: 2, sm: 3, lg: 4 }
      }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: theme.palette.primary[100],
                color: 'primary.main',
                mx: 'auto',
                mb: 2
              }}
            >
              <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
            </Avatar>
            <Typography variant="h3" sx={{ fontWeight: 'extrabold', color: 'text.primary', mb: 2 }}>
              Verifying your login
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
              Please wait while we verify your login link...
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  if (status === 'success') {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 6,
        px: { xs: 2, sm: 3, lg: 4 }
      }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center' }}>
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
              <CheckCircle size={24} />
            </Avatar>
            <Typography variant="h3" sx={{ fontWeight: 'extrabold', color: 'text.primary', mb: 2 }}>
              Login successful!
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
              Redirecting you to your destination...
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: 'background.default',
      py: 6,
      px: { xs: 2, sm: 3, lg: 4 }
    }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center' }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: theme.palette.error[100],
              color: 'error.main',
              mx: 'auto',
              mb: 2
            }}
          >
            <XCircle size={24} />
          </Avatar>
          <Typography variant="h3" sx={{ fontWeight: 'extrabold', color: 'text.primary', mb: 2 }}>
            Verification failed
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 3 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate('/')}
            sx={{ fontWeight: 'medium' }}
          >
            Go to Home
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginVerify; 