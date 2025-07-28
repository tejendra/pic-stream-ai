import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAlbumMediaQuery } from '../hooks/useAlbumMediaQuery';
import { 
  ArrowLeft,
  Share2,
  Calendar,
  Users,
  Image as ImageIcon,
  Trash2,
  Clock,
  Copy
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import InlineUpload from '../components/InlineUpload';
import GroupedMediaGrid from '../components/GroupedMediaGrid';

const Album = () => {
  console.log('Album component rendered');
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  console.log('Album component state:', {
    albumId,
    userUid: user?.uid,
    userToken: !!user?.token,
    authLoading
  });
  
  // Add a useEffect to track when the component mounts
  React.useEffect(() => {
    console.log('Album component mounted with albumId:', albumId);
  }, [albumId]);
  const { 
    media, 
    loading, 
    error, 
    deleteMedia, 
    downloadSingleMedia,
    downloadMultipleMedia, 
    refetch: fetchAlbumMedia 
  } = useAlbumMediaQuery(albumId);
  const [album, setAlbum] = useState(null);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [albumError, setAlbumError] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grouped' or 'grid'
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    console.log('Album useEffect triggered:', { 
      albumId, 
      userUid: user?.uid, 
      userToken: !!user?.token, 
      authLoading, 
      albumLoading 
    });
    
    const fetchAlbum = async () => {
      try {
        console.log('Fetching album data...');
        const response = await fetch(`/api/albums/${albumId}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch album: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Album data received:', data);
        setAlbum(data.album);
        setAlbumError(null); // Clear any previous errors
      } catch (error) {
        console.error('Error fetching album:', error);
        setAlbumError(error.message);
      } finally {
        setAlbumLoading(false);
      }
    };

    if (user && albumId && !authLoading) {
      setAlbumLoading(true);
      setAlbumError(null);
      fetchAlbum();
    } else {
      console.log('Not fetching album:', { 
        hasUser: !!user, 
        hasAlbumId: !!albumId, 
        authLoading 
      });
    }
  }, [albumId, user?.uid, user?.token, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

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
    
    return dateObj.toLocaleDateString();
  };

  const getDaysUntilExpiry = (expirationDate) => {
    if (!expirationDate) {
      return -1; // Treat as expired
    }
    
    let expiryDate;
    if (typeof expirationDate.toDate === 'function') {
      // Firestore Timestamp object
      expiryDate = expirationDate.toDate();
    } else if (expirationDate._seconds) {
      // Plain object with _seconds and _nanoseconds
      expiryDate = new Date(expirationDate._seconds * 1000);
    } else if (expirationDate instanceof Date) {
      // JavaScript Date object
      expiryDate = expirationDate;
    } else {
      console.error('Invalid expiration date format:', expirationDate);
      return -1; // Treat as expired
    }
    
    const now = new Date();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleDeleteMedia = (mediaId, mediaName) => {
    setMediaToDelete({ id: mediaId, name: mediaName });
    setShowDeleteModal(true);
  };

  const confirmDeleteMedia = async () => {
    if (!mediaToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteMedia({ mediaId: mediaToDelete.id });
      setShowDeleteModal(false);
      setMediaToDelete(null);
    } catch (error) {
      console.error('Failed to delete media:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteMedia = () => {
    setShowDeleteModal(false);
    setMediaToDelete(null);
    setIsDeleting(false);
  };

  const handleUploadComplete = () => {
    // Refresh the media list after upload
    if (fetchAlbumMedia) {
      fetchAlbumMedia();
    }
  };

  const handleDownloadMedia = async (mediaItems) => {
    try {
      downloadMultipleMedia({ mediaItems });
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDownloadSingleMedia = async (mediaItem) => {
    try {
      downloadSingleMedia({ 
        mediaId: mediaItem.id, 
        fileName: mediaItem.originalName 
      });
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleShareAlbum = async () => {
    try {
      const response = await fetch(`/api/albums/${albumId}/share`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get share link');
      }
      
      const data = await response.json();
      setShareUrl(data.shareUrl);
      setShowShareModal(true);
    } catch (error) {
      console.error('Error getting share link:', error);
      alert('Failed to get share link');
    }
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

  if (albumLoading || loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (albumError || error || !album) {
    console.log('Album error condition triggered:', { 
      albumError, 
      error, 
      hasAlbum: !!album,
      albumLoading,
      authLoading 
    });
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Album Not Found</h2>
          <p className="text-gray-600 mb-4">{albumError || error || 'The requested album could not be found.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry(album.expirationDate);
  const isExpired = daysUntilExpiry <= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{album.title}</h1>
              <div className="mt-2 flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {album.memberCount} members
                </div>
                <div className="flex items-center">
                  <ImageIcon className="h-4 w-4 mr-1" />
                  {album.mediaCount} photos/videos
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Created {formatDate(album.createdAt)}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {isExpired ? (
                    <span className="text-red-600">Expired</span>
                  ) : (
                    <span className={daysUntilExpiry <= 7 ? 'text-orange-600' : 'text-gray-600'}>
                      Expires in {daysUntilExpiry} days
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleShareAlbum}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Album
              </button>
              <InlineUpload albumId={album.id} onUploadComplete={handleUploadComplete} />
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        {media.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grouped')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'grouped'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Grouped by User
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Grid View
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Media Grid */}
        {media.length === 0 ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-12 sm:px-6 lg:px-8">
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No photos yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding photos to this album.
                </p>
                <div className="mt-6">
                  <InlineUpload albumId={album.id} onUploadComplete={handleUploadComplete} />
                </div>
              </div>
            </div>
          </div>
        ) : viewMode === 'grouped' ? (
          <GroupedMediaGrid 
            media={media} 
            currentUserId={user.uid}
            onDeleteMedia={handleDeleteMedia}
            onDownloadMedia={handleDownloadMedia}
            onDownloadSingleMedia={handleDownloadSingleMedia}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {media.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
                <Link to={`/media/${item.id}`}>
                  <div className="aspect-square overflow-hidden">
                    {item.mimeType?.startsWith('image/') ? (
                      <img
                        src={item.thumbnailUrl || item.publicUrl}
                        alt={item.originalName}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="relative w-full h-full bg-gray-100">
                        <img
                          src={item.thumbnailUrl || item.publicUrl}
                          alt={item.originalName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black bg-opacity-50 rounded-full p-2">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
                
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleDownloadSingleMedia(item)}
                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                      title="Download"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    {item.uploadedBy === user.uid && (
                      <button
                        onClick={() => handleDeleteMedia(item.id, item.originalName)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete media"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Share Album</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share Link
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 block w-full border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(shareUrl)}
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                {copied && (
                  <p className="mt-2 text-sm text-green-600">Link copied to clipboard!</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Media Modal */}
      {showDeleteModal && mediaToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Media</h3>
                <button
                  onClick={cancelDeleteMedia}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                  Delete "{mediaToDelete.name}"?
                </h3>
                <p className="text-sm text-gray-500 text-center">
                  This action cannot be undone. The file will be permanently deleted from the album.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDeleteMedia}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteMedia}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Album; 