// AI Generated - Needs Review
import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  Upload as UploadIcon, 
  X, 
  Image, 
  Video, 
  File, 
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  Paper,
  LinearProgress,
  Avatar,
  useTheme
} from '@mui/material';

const InlineUpload = ({ albumId, onUploadComplete }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 250 * 1024 * 1024; // 250MB limit
      return isValidType && isValidSize;
    });

    const newFiles = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image size={20} style={{ color: theme.palette.primary.main }} />;
    if (type.startsWith('video/')) return <Video size={20} style={{ color: theme.palette.error.main }} />;
    return <File size={20} style={{ color: theme.palette.text.secondary }} />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress({});

    try {
      // Set all files to uploading status
      files.forEach(fileData => {
        setUploadProgress(prev => ({
          ...prev,
          [fileData.id]: { status: 'uploading', progress: 0 }
        }));
      });

      // Upload all files at once
      const formData = new FormData();
      formData.append('albumId', albumId);
      
      files.forEach((fileData, index) => {
        formData.append('files', fileData.file);
      });

      await axios.post('/api/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${user.token}`
        }
      });

      // Mark all files as completed
      files.forEach(fileData => {
        setUploadProgress(prev => ({
          ...prev,
          [fileData.id]: { status: 'completed', progress: 100 }
        }));
      });

      // Clear files and close upload area
      setTimeout(() => {
        setFiles([]);
        setUploadProgress({});
        setIsOpen(false);
        if (onUploadComplete) {
          onUploadComplete();
        }
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      // Mark all files as error
      files.forEach(fileData => {
        setUploadProgress(prev => ({
          ...prev,
          [fileData.id]: { status: 'error', progress: 0, error: error.message }
        }));
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const event = { target: { files: droppedFiles } };
    handleFileSelect(event);
  };

  const getProgressStatus = (fileId) => {
    const progress = uploadProgress[fileId];
    if (!progress) return null;

    switch (progress.status) {
      case 'uploading':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                border: `2px solid ${theme.palette.primary.main}`,
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                mr: 1
              }}
            />
            <Typography variant="body2">Uploading...</Typography>
          </Box>
        );
      case 'completed':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
            <CheckCircle size={16} style={{ marginRight: 4 }} />
            <Typography variant="body2">Uploaded</Typography>
          </Box>
        );
      case 'error':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
            <AlertCircle size={16} style={{ marginRight: 4 }} />
            <Typography variant="body2">Failed</Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setFiles([]);
    setUploadProgress({});
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<Plus size={20} />}
        onClick={() => setIsOpen(true)}
        sx={{ fontWeight: 'medium' }}
      >
        Add Photos
      </Button>

      <Dialog 
        open={isOpen} 
        onClose={closeModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
              Add Photos to Album
            </Typography>
            <IconButton onClick={closeModal}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* File Upload Area */}
            <Paper
              sx={{
                border: `2px dashed ${theme.palette.divider}`,
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: theme.palette.text.secondary
                },
                transition: 'border-color 0.2s ease-in-out'
              }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon size={48} style={{ color: theme.palette.text.secondary, margin: '0 auto 16px' }} />
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Drag and drop files here, or{' '}
                <Box component="span" sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                  click to browse
                </Box>
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Supports: JPG, PNG, GIF, MP4, MOV, AVI (Max: 250MB per file)
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </Paper>

            {/* Selected Files */}
            {files.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'medium', mb: 1 }}>
                  Selected Files ({files.length})
                </Typography>
                <Box sx={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {files.map((fileData) => (
                    <Paper key={fileData.id} sx={{ p: 1, bgcolor: 'grey.50' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                          {fileData.preview ? (
                            <Avatar
                              src={fileData.preview}
                              alt={fileData.name}
                              sx={{ width: 32, height: 32, mr: 1 }}
                            />
                          ) : (
                            <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: theme.palette.grey[200] }}>
                              {getFileIcon(fileData.type)}
                            </Avatar>
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {fileData.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {formatFileSize(fileData.size)}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getProgressStatus(fileData.id)}
                          <IconButton
                            size="small"
                            onClick={() => removeFile(fileData.id)}
                            disabled={uploading}
                            sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                          >
                            <X size={16} />
                          </IconButton>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}

            {/* Upload Button */}
            {files.length > 0 && (
              <DialogActions sx={{ px: 0 }}>
                <Button
                  onClick={closeModal}
                  disabled={uploading}
                  sx={{ flex: { xs: 1, sm: 'none' } }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={uploading || files.length === 0}
                  sx={{ flex: { xs: 1, sm: 'none' } }}
                >
                  {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
                </Button>
              </DialogActions>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InlineUpload; 