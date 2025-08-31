// AI Generated - Needs Review
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Download,
  Share2, 
  Calendar, 
  User, 
  Tag, 
  Copy,
  Lock,
  Globe,
  ArrowLeft
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Chip,
  Alert,
  useTheme
} from '@mui/material';

const ShareView = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState(null);
  const [password, setPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSharedMedia = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/share/${shareId}`);
        if (response.data.success) {
          setMedia(response.data.data);
          if (response.data.data.isPasswordProtected) {
            setShowPasswordForm(true);
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching shared media:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedMedia();
  }, [shareId, navigate]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    try {
      const response = await axios.post(`/api/share/${shareId}`, { password });
      if (response.data.success) {
        setMedia(response.data.data);
        setShowPasswordForm(false);
      } else {
        setPasswordError('Incorrect password');
      }
    } catch (error) {
      setPasswordError('An error occurred');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareMedia = () => {
    if (navigator.share) {
      navigator.share({
        title: media.title,
        text: media.description,
        url: window.location.href
      });
    } else {
      copyToClipboard(window.location.href);
    }
  };

  const downloadMedia = () => {
    const link = document.createElement('a');
    link.href = media.url;
    link.download = media.title || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner />
      </Box>
    );
  }

  if (showPasswordForm) {
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
            <Typography variant="h3" sx={{ fontWeight: 'extrabold', color: 'text.primary', mb: 2 }}>
              Password Protected
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 4 }}>
              This file is password protected
            </Typography>
            <Box component="form" onSubmit={handlePasswordSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                fullWidth
                error={!!passwordError}
                helperText={passwordError}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ fontWeight: 'medium' }}
              >
                Access File
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    );
  }

  if (!media) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 1 }}>
            File Not Found
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            The file you're looking for doesn't exist or has been removed.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowLeft size={16} />}
            onClick={() => navigate('/')}
            sx={{ 
              color: 'text.secondary', 
              mb: 2,
              '&:hover': { color: 'text.primary' }
            }}
          >
            Back to Home
          </Button>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            {media.title}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Media Display */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ overflow: 'hidden', boxShadow: 2 }}>
              {media.mimeType?.startsWith('image/') ? (
                <Box
                  component="img"
                  src={media.url}
                  alt={media.title}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 400,
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <Box
                  component="video"
                  src={media.url}
                  controls
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 400
                  }}
                >
                  Your browser does not support the video tag.
                </Box>
              )}
            </Card>
          </Grid>

          {/* Media Info */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Actions */}
              <Card sx={{ boxShadow: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.primary', mb: 2 }}>
                    Actions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {media.allowDownload && (
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<Download size={16} />}
                        onClick={downloadMedia}
                        sx={{ fontWeight: 'medium' }}
                      >
                        Download
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Share2 size={16} />}
                      onClick={shareMedia}
                      sx={{ fontWeight: 'medium' }}
                    >
                      Share
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Copy size={16} />}
                      onClick={() => copyToClipboard(window.location.href)}
                      sx={{ fontWeight: 'medium' }}
                    >
                      {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* File Information */}
              <Card sx={{ boxShadow: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.primary', mb: 2 }}>
                    File Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <User size={16} style={{ color: theme.palette.text.secondary }} />
                        <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                          Shared by
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {media.uploadedBy?.displayName || 'Unknown'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Calendar size={16} style={{ color: theme.palette.text.secondary }} />
                        <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                          Uploaded
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {formatDate(media.uploadedAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        File size
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {formatFileSize(media.size)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        File type
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {media.mimeType}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {media.isPublic ? (
                          <Globe size={16} style={{ color: theme.palette.success.main }} />
                        ) : (
                          <Lock size={16} style={{ color: theme.palette.error.main }} />
                        )}
                        <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                          Visibility
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {media.isPublic ? 'Public' : 'Private'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Description */}
              {media.description && (
                <Card sx={{ boxShadow: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.primary', mb: 2 }}>
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                      {media.description}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              {media.tags && media.tags.length > 0 && (
                <Card sx={{ boxShadow: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Tag size={20} style={{ color: theme.palette.text.secondary, marginRight: 8 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                        Tags
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {media.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          sx={{
                            bgcolor: theme.palette.primary[100],
                            color: theme.palette.primary[800],
                            fontWeight: 'medium'
                          }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Share Information */}
              <Card sx={{ boxShadow: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.primary', mb: 2 }}>
                    Share
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary', mb: 1 }}>
                        Direct Link
                      </Typography>
                      <Box sx={{ display: 'flex' }}>
                        <TextField
                          type="text"
                          value={window.location.href}
                          InputProps={{ readOnly: true }}
                          sx={{ 
                            flex: 1,
                            '& .MuiOutlinedInput-root': { 
                              borderTopRightRadius: 0, 
                              borderBottomRightRadius: 0 
                            } 
                          }}
                        />
                        <Button
                          variant="outlined"
                          onClick={() => copyToClipboard(window.location.href)}
                          sx={{ 
                            borderTopLeftRadius: 0, 
                            borderBottomLeftRadius: 0,
                            borderLeft: 'none'
                          }}
                        >
                          <Copy size={16} />
                        </Button>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary', mb: 1 }}>
                        Embed Code
                      </Typography>
                      <Box sx={{ display: 'flex' }}>
                        <TextField
                          type="text"
                          value={`<img src="${media.url}" alt="${media.title}" />`}
                          InputProps={{ readOnly: true }}
                          sx={{ 
                            flex: 1,
                            '& .MuiOutlinedInput-root': { 
                              borderTopRightRadius: 0, 
                              borderBottomRightRadius: 0 
                            } 
                          }}
                        />
                        <Button
                          variant="outlined"
                          onClick={() => copyToClipboard(`<img src="${media.url}" alt="${media.title}" />`)}
                          sx={{ 
                            borderTopLeftRadius: 0, 
                            borderBottomLeftRadius: 0,
                            borderLeft: 'none'
                          }}
                        >
                          <Copy size={16} />
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ShareView; 