import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  IconButton
} from '@mui/material';
import { Copy } from 'lucide-react';
import createApiClient from '../utils/apiClient';

const ShareAlbumDialog = ({open, onClose, albumId}) => {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShareAlbum = useCallback(async (albumId) => {
    if (!albumId) return;
    
    try {
      const api = createApiClient();
      const response = await api.get(`/albums/${albumId}/share`);
      
      setShareUrl(response.data.shareUrl);
    } catch (error) {
      console.error('Error getting share link:', error);
      alert('Failed to get share link');
    }
  }, []);

  useEffect(() => {
    if (open && albumId) {
      handleShareAlbum(albumId);
    }
  }, [open, albumId, handleShareAlbum]);

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
            Share Album
          </Typography>
          <IconButton onClick={onClose}>
            <Typography variant="h6">×</Typography>
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1, color: 'text.primary' }}>
            Share Link
          </Typography>
          <Box sx={{ display: 'flex' }}>
            <TextField
              value={shareUrl}
              fullWidth
              InputProps={{ readOnly: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderTopRightRadius: 0, borderBottomRightRadius: 0 } }}
            />
            <Button
              onClick={() => copyToClipboard(shareUrl)}
              variant="outlined"
              sx={{ 
                borderTopLeftRadius: 0, 
                borderBottomLeftRadius: 0,
                borderLeft: 'none'
              }}
            >
              <Copy size={16} />
            </Button>
          </Box>
          {copied && (
            <Alert severity="success" sx={{ mt: 1 }}>
              Link copied to clipboard!
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareAlbumDialog;