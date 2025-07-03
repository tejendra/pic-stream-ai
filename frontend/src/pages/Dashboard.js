import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAlbums } from '../hooks';
import { 
  Image, 
  Calendar,
  Plus,
  Users,
  Clock,
  Trash2,
  Share2,
  Copy
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import createApiClient from '../utils/apiClient';

const Dashboard = () => {
  const { albums, loading, error, createAlbum, deleteAlbum } = useAlbums();
  const [shareUrl, setShareUrl] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [albumTitle, setAlbumTitle] = useState('');
  const [expirationDays, setExpirationDays] = useState('30');
  const [isCreating, setIsCreating] = useState(false);



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

  const handleCreateAlbum = () => {
    setShowCreateModal(true);
  };

  const handleCreateAlbumSubmit = async (e) => {
    e.preventDefault();
    
    if (!albumTitle.trim()) {
      return;
    }

    const days = parseInt(expirationDays);
    if (![14, 30, 60].includes(days)) {
      return;
    }

    setIsCreating(true);
    try {
      await createAlbum(albumTitle.trim(), days);
      setShowCreateModal(false);
      setAlbumTitle('');
      setExpirationDays('30');
    } catch (error) {
      console.error('Failed to create album:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setAlbumTitle('');
    setExpirationDays('30');
    setIsCreating(false);
  };

  const handleDeleteAlbum = async (albumId, albumTitle) => {
    if (window.confirm(`Are you sure you want to delete "${albumTitle}"? This action cannot be undone.`)) {
      try {
        await deleteAlbum(albumId);
      } catch (error) {
        console.error('Failed to delete album:', error);
      }
    }
  };

  const handleShareAlbum = async (albumId) => {
    try {
      const api = createApiClient();
      const response = await api.get(`/albums/${albumId}/share`);
      
      setShareUrl(response.data.shareUrl);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Albums</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to PicStream!
          </h1>
          <p className="mt-2 text-gray-600">
            Create and manage your temporary photo sharing albums
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleCreateAlbum}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Album
            </button>
          </div>
        </div>



        {/* Albums List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Your Albums
            </h3>
            
            {albums.length === 0 ? (
              <div className="text-center py-12">
                <Image className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No albums yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first album to share photos with friends and family.
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleCreateAlbum}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Album
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {albums.map((album) => {
                  const daysUntilExpiry = getDaysUntilExpiry(album.expirationDate);
                  const isExpired = daysUntilExpiry <= 0;
                  
                  return (
                    <div key={album.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-lg font-medium text-gray-900 truncate">
                          {album.title}
                        </h4>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleShareAlbum(album.id)}
                            className="text-gray-400 hover:text-blue-500 transition-colors"
                            title="Share album"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAlbum(album.id, album.title)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete album"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          {album.memberCount} members
                        </div>
                        <div className="flex items-center">
                          <Image className="h-4 w-4 mr-2" />
                          {album.mediaCount} photos/videos
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Created {formatDate(album.createdAt)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {isExpired ? (
                            <span className="text-red-600">Expired</span>
                          ) : (
                            <span className={daysUntilExpiry <= 7 ? 'text-orange-600' : 'text-gray-600'}>
                              Expires in {daysUntilExpiry} days
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Link
                          to={`/album/${album.id}`}
                          className="w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Album
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
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

      {/* Create Album Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Album</h3>
                <button
                  onClick={closeCreateModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCreateAlbumSubmit} className="space-y-4">
                <div>
                  <label htmlFor="albumTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Album Title
                  </label>
                  <input
                    type="text"
                    id="albumTitle"
                    value={albumTitle}
                    onChange={(e) => setAlbumTitle(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter album title"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="expirationDays" className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Days
                  </label>
                  <select
                    id="expirationDays"
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !albumTitle.trim()}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? 'Creating...' : 'Create Album'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 