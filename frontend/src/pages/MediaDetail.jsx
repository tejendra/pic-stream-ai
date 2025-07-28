import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  Download, 
  Calendar, 
  User, 
  ArrowLeft
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const MediaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const { data: media, isLoading: loading, error } = useQuery({
    queryKey: ['media', id],
    queryFn: async () => {
      const response = await axios.get(`/api/media/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      return response.data;
    },
    enabled: !!user && !!user.token && !!id && !authLoading
  });

  const download = async () => {
    try {
      // Download the original file directly from the API
      const response = await axios.get(`/api/media/${id}/download`, {
        headers: { Authorization: `Bearer ${user.token}` },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', media.originalName || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
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
    if (!date) {
      return 'Invalid Date';
    }
    
    let dateObj;
    if (typeof date.toDate === 'function') {
      // Firestore Timestamp object
      dateObj = date.toDate();
    } else if (date._seconds) {
      // Plain object with _seconds and _nanoseconds
      dateObj = new Date(date._seconds * 1000);
    } else if (date instanceof Date) {
      // JavaScript Date object
      dateObj = date;
    } else {
      console.error('Invalid date format:', date);
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = async () => {
    try {
      await download();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !media) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Media Not Found</h2>
          <p className="text-gray-600 mb-4">
            {error ? (error.message || 'An error occurred while loading the media.') : 'The requested media could not be found.'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Album
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{media.originalName || 'Untitled'}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Media Display */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {media.mimeType?.startsWith('image/') ? (
                <img
                  src={media.previewUrl || media.publicUrl}
                  alt={media.originalName || 'Image'}
                  className="w-full h-auto max-h-96 object-contain"
                />
              ) : (
                <video
                  src={media.previewUrl || media.publicUrl}
                  controls
                  className="w-full h-auto max-h-96"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>

          {/* Media Info */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Original
                </button>
              </div>
            </div>

            {/* File Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">File Information</h3>
              <dl className="space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Uploaded by
                  </dt>
                  <dd className="text-sm text-gray-900">{media.uploadedByEmail || 'Unknown'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Uploaded
                  </dt>
                  <dd className="text-sm text-gray-900">{formatDate(media.uploadedAt)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-gray-500">
                    File Size
                  </dt>
                  <dd className="text-sm text-gray-900">{formatFileSize(media.size)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-gray-500">
                    File Type
                  </dt>
                  <dd className="text-sm text-gray-900">{media.mimeType}</dd>
                </div>
                {media.album && (
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-gray-500">
                      Album
                    </dt>
                    <dd className="text-sm text-gray-900">
                      <Link 
                        to={`/album/${media.album.id}`}
                        className="text-blue-600 hover:text-blue-500"
                      >
                        {media.album.title}
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Album Navigation */}
            {media.album && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Album Navigation</h3>
                <div className="space-y-3">
                  <Link
                    to={`/album/${media.album.id}`}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View All Photos
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaDetail;