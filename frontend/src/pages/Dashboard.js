import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAlbums } from '../hooks';
import { 
  Image, 
  Share2, 
  Calendar,
  HardDrive,
  Plus,
  Users,
  Clock,
  Trash2
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const { albums, loading, error, createAlbum, deleteAlbum } = useAlbums();



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

  const handleCreateAlbum = async () => {
    const title = prompt('Enter album title:');
    if (title) {
      const expirationDays = prompt('Enter expiration days (14, 30, or 60):', '30');
      const days = parseInt(expirationDays);
      if ([14, 30, 60].includes(days)) {
        try {
          await createAlbum(title, days);
        } catch (error) {
          console.error('Failed to create album:', error);
        }
      } else {
        alert('Please enter 14, 30, or 60 days');
      }
    }
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
            Welcome to MomentDrop, {user?.displayName || 'User'}!
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <HardDrive className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Albums
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {albums.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Image className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Albums
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {albums.filter(album => getDaysUntilExpiry(album.expirationDate) > 0).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Members
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {albums.reduce((sum, album) => sum + (album.memberCount || 0), 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Share2 className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Media
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {albums.reduce((sum, album) => sum + (album.mediaCount || 0), 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
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
                        <button
                          onClick={() => handleDeleteAlbum(album.id, album.title)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete album"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
                      
                      <div className="mt-4 flex gap-2">
                        <Link
                          to={`/album/${album.id}`}
                          className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Album
                        </Link>
                        <Link
                          to={`/upload?albumId=${album.id}`}
                          className="inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Plus className="h-4 w-4" />
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
    </div>
  );
};

export default Dashboard; 