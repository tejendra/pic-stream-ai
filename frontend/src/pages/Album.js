import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAlbumMedia } from '../hooks';
import { 
  ArrowLeft,
  Plus,
  Download,
  Share2,
  Calendar,
  Users,
  Image as ImageIcon,
  Trash2,
  Eye,
  Clock
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import InlineUpload from '../components/InlineUpload';

const Album = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { media, loading, error, deleteMedia, fetchAlbumMedia } = useAlbumMedia(albumId);
  const [album, setAlbum] = useState(null);
  const [albumLoading, setAlbumLoading] = useState(true);
  const [albumError, setAlbumError] = useState(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const response = await fetch(`/api/albums/${albumId}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch album');
        }
        
        const data = await response.json();
        setAlbum(data.album);
      } catch (error) {
        console.error('Error fetching album:', error);
        setAlbumError(error.message);
      } finally {
        setAlbumLoading(false);
      }
    };

    if (user && albumId) {
      fetchAlbum();
    }
  }, [albumId, user]);

  const formatDate = (date) => {
    if (!date || typeof date.toDate !== 'function') {
      console.error('Invalid Firestore Timestamp:', date);
      return 'Invalid Date';
    }
    return date.toDate().toLocaleDateString();
  };

  const getDaysUntilExpiry = (expirationDate) => {
    if (!expirationDate || typeof expirationDate.toDate !== 'function') {
      console.error('Invalid Firestore Timestamp for expiration:', expirationDate);
      return -1; // Treat as expired
    }
    const now = new Date();
    const expiry = expirationDate.toDate();
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleDeleteMedia = async (mediaId, mediaName) => {
    if (window.confirm(`Are you sure you want to delete "${mediaName}"? This action cannot be undone.`)) {
      try {
        await deleteMedia(mediaId);
      } catch (error) {
        console.error('Failed to delete media:', error);
      }
    }
  };

  const handleUploadComplete = () => {
    // Refresh the media list after upload
    if (fetchAlbumMedia) {
      fetchAlbumMedia(albumId);
    }
  };

  if (albumLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (albumError || error || !album) {
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
              <InlineUpload albumId={album.id} onUploadComplete={handleUploadComplete} />
            </div>
          </div>
        </div>

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
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-gray-400 mb-2">📹</div>
                          <div className="text-xs text-gray-500">Video</div>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
                
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.originalName}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {item.views || 0}
                        </span>
                        <span className="flex items-center">
                          <Download className="h-3 w-3 mr-1" />
                          {item.downloads || 0}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteMedia(item.id, item.originalName)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete media"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Album; 