import React, { useState, useRef } from 'react';
import { useMedia } from '../contexts/MediaContext';
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

const InlineUpload = ({ albumId, onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef(null);
  const { uploadMultipleFiles } = useMedia();

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
    if (type.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
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
      await uploadMultipleFiles(files.map(f => f.file), albumId);

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
          <div className="flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Uploading...
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            Uploaded
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            Failed
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Photos
      </button>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Add Photos to Album</h3>
        <button
          onClick={() => {
            setIsOpen(false);
            setFiles([]);
            setUploadProgress({});
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Upload Area */}
        <div>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Drag and drop files here, or{' '}
                <span className="text-blue-600 hover:text-blue-500 font-medium">
                  click to browse
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports: JPG, PNG, GIF, MP4, MOV, AVI (Max: 250MB per file)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Files ({files.length})</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {files.map((fileData) => (
                <div key={fileData.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center flex-1 min-w-0">
                    {fileData.preview ? (
                      <img
                        src={fileData.preview}
                        alt={fileData.name}
                        className="h-8 w-8 object-cover rounded mr-2"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-gray-200 rounded mr-2 flex items-center justify-center">
                        {getFileIcon(fileData.type)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{fileData.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(fileData.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getProgressStatus(fileData.id)}
                    <button
                      type="button"
                      onClick={() => removeFile(fileData.id)}
                      className="text-gray-400 hover:text-red-500"
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setFiles([]);
                setUploadProgress({});
              }}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || files.length === 0}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default InlineUpload; 