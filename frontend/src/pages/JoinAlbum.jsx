// AI Generated - Needs Review
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAlbum } from '../contexts/AlbumContext';
import { CheckCircle, XCircle, Loader, Users, Calendar } from 'lucide-react';
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
    console.log('JoinAlbum useEffect - user:', user, 'loading:', loading, 'shareToken:', shareToken);
    
    if (loading) {
      // Still determining auth state, do nothing yet
      return;
    }

    if (!user) {
      console.log('User not logged in, redirecting to home');
      // If not logged in, redirect to home page with return URL
      navigate(`/?returnTo=/join/${shareToken}`);
      return;
    }

    const handleJoinAlbum = async () => {
      try {
        console.log('Attempting to join album with token:', shareToken);
        console.log('User token available:', !!user.token);
        
        const result = await joinAlbum(shareToken);
        console.log('Join album result:', result);
        
        setAlbum(result.album);
        setStatus('success');
        
        // Redirect to album after a short delay
        setTimeout(() => {
          navigate(`/album/${result.albumId}`);
        }, 2000);
      } catch (error) {
        console.error('Join album error:', error);
        console.error('Error response:', error.response);
        
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
            {album && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 'medium', color: 'text.primary', mb: 1 }}>
                  {album.title}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Users size={16} style={{ color: theme.palette.text.secondary, marginRight: 4 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {album.memberCount} members
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Calendar size={16} style={{ color: theme.palette.text.secondary, marginRight: 4 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Expires {album.expirationDate ? (() => {
                        let expiryDate;
                        if (typeof album.expirationDate.toDate === 'function') {
                          expiryDate = album.expirationDate.toDate();
                        } else if (album.expirationDate._seconds) {
                          expiryDate = new Date(album.expirationDate._seconds * 1000);
                        } else if (album.expirationDate instanceof Date) {
                          expiryDate = album.expirationDate;
                        } else {
                          return 'Invalid Date';
                        }
                        return expiryDate.toLocaleDateString();
                      })() : 'Invalid Date'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
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