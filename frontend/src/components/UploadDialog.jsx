import React, { useState, useRef } from 'react';
import { useAlbumMediaQuery } from '../hooks/useAlbumMediaQuery';
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
  Avatar,
  useTheme
} from '@mui/material';
import { formatFileSize } from '../utils/fileUtils';

const UploadDialog = ({ open, onClose, albumId, onUploadComplete }) => {
  const theme = useTheme();
  const { uploadFileAsync, uploadFileDirectToStorageAsync } = useAlbumMediaQuery(albumId);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  const closeModal = () => {
    setFiles([]);
    setUploadProgress({});
    onClose();
  };

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
      // Initialize all files to uploading status
      const initialProgress = {};
      files.forEach(fileData => {
        initialProgress[fileData.id] = { status: 'uploading', progress: 0 };
      });
      setUploadProgress(initialProgress);

      // Upload each file individually
      const uploadPromises = files.map(async (fileData) => {
        try {
          // Mark file as uploading
          setUploadProgress(prev => ({
            ...prev,
            [fileData.id]: { status: 'uploading', progress: 0 }
          }));

          // Upload single file using the async hook
          let result
          if (fileData.file.size > 50 * 1024 * 1024) {
            result = await uploadFileDirectToStorageAsync({ file: fileData.file });
          } else {
            result = await uploadFileAsync({ file: fileData.file });
          }
          
          // Mark file as completed
          setUploadProgress(prev => ({
            ...prev,
            [fileData.id]: { status: 'completed', progress: 100 }
          }));
          
          return result;
        } catch (error) {
          console.error(`Upload error for file ${fileData.name}:`, error);
          
          // Mark file as error
          setUploadProgress(prev => ({
            ...prev,
            [fileData.id]: { 
              status: 'error', 
              progress: 0, 
              error: error.message || 'Upload failed' 
            }
          }));
          
          throw error; // Re-throw to be caught by Promise.allSettled
        }
      });

      // Wait for all uploads to complete
      const results = await Promise.allSettled(uploadPromises);
      
      // Check if all uploads were successful
      const allSuccessful = results.every(result => result.status === 'fulfilled');
      
      if (allSuccessful) {
        // Wait a bit for final state updates, then close
        setTimeout(() => {
          if (onUploadComplete) {
            onUploadComplete();
          }
          closeModal();
        }, 1000);
      }

    } catch (error) {
      console.error('Upload process error:', error);
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

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Add Photos to Album
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
                Uploading Files ({files.length})
              </Typography>
              <Box sx={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
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
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={closeModal}
          disabled={uploading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={uploading || files.length === 0}
        >
          {uploading ? 'Uploading...' : 'Upload Files'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadDialog;