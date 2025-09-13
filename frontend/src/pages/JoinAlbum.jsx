import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAlbum } from '../contexts/AlbumContext';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import {
  Box,
  Container,
  Typography,
  Button,
  Avatar,
  useTheme
} from '@mui/material';

const JoinAlbum = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { joinAlbum } = useAlbum();
  const [status, setStatus] = useState('loading'); // loading, success, error, expired
  const [album, setAlbum] = useState(null);
  const [error, setError] = useState('');
  const theme = useTheme();

  useEffect(() => {    
    if (loading) {
      // Still determining auth state, do nothing yet
      return;
    }

    if (!user) {
      // If not logged in, redirect to home page with return URL
      navigate(`/?returnTo=/join/${shareToken}`);
      return;
    }

    const handleJoinAlbum = async () => {
      try {        
        const result = await joinAlbum(shareToken);
        console.log('result', result);
        setAlbum(result.album);
        setStatus('success');
        
        // Redirect to album after a short delay
        setTimeout(() => {
          navigate(`/album/${result.albumId}`);
        }, 2000);
      } catch (error) {
        console.log('error', error);
        if (error.message?.includes('expired')) {
          setStatus('expired');
          setError('This album has expired and its contents are no longer available.');
        } else {
          setStatus('error');
          setError(error.message || 'Failed to join album');
        }
      }
    };

    handleJoinAlbum();
  }, [shareToken, user, loading, navigate, joinAlbum]);

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
              Joining album
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
              Please wait while we add you to the album...
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
              Welcome to the album!
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 'medium', color: 'text.primary', mb: 1 }}>
              {album?.title}
            </Typography>

            <Typography sx={{ mt: 2, color: 'text.secondary' }}>
              Redirecting you to the album...
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  if (status === 'expired') {
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
              Album Expired
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 3 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/dashboard')}
              sx={{ fontWeight: 'medium' }}
            >
              Go to Dashboard
            </Button>
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
            Join Failed
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 3 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate('/dashboard')}
            sx={{ fontWeight: 'medium' }}
          >
            Go to Dashboard
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default JoinAlbum; 