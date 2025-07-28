import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAlbum } from '../contexts/AlbumContext';
import { CheckCircle, XCircle, Loader, Users, Calendar } from 'lucide-react';

const JoinAlbum = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { joinAlbum } = useAlbum();
  const [status, setStatus] = useState('loading'); // loading, success, error, expired
  const [album, setAlbum] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('JoinAlbum useEffect - user:', user, 'loading:', loading, 'shareToken:', shareToken);
    
    if (loading) {
      // Still determining auth state, do nothing yet
      return;
    }

    if (!user) {
      console.log('User not logged in, redirecting to home');
      // If not logged in, redirect to home page with return URL
      navigate(`/?returnTo=/join/${shareToken}`);
      return;
    }

    const handleJoinAlbum = async () => {
      try {
        console.log('Attempting to join album with token:', shareToken);
        console.log('User token available:', !!user.token);
        
        const result = await joinAlbum(shareToken);
        console.log('Join album result:', result);
        
        setAlbum(result.album);
        setStatus('success');
        
        // Redirect to album after a short delay
        setTimeout(() => {
          navigate(`/album/${result.albumId}`);
        }, 2000);
      } catch (error) {
        console.error('Join album error:', error);
        console.error('Error response:', error.response);
        
        if (error.message?.includes('expired')) {
          setStatus('expired');
          setError('This album has expired and its contents are no longer available.');
        } else {
          setStatus('error');
          setError(error.message || 'Failed to join album');
        }
      }
    };

    handleJoinAlbum();
  }, [shareToken, user, loading, navigate, joinAlbum]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <Loader className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Joining album
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please wait while we add you to the album...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Welcome to the album!
            </h2>
            {album && (
              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium text-gray-900">{album.title}</h3>
                <div className="mt-2 flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {album.memberCount} members
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Expires {album.expirationDate ? (() => {
                      let expiryDate;
                      if (typeof album.expirationDate.toDate === 'function') {
                        expiryDate = album.expirationDate.toDate();
                      } else if (album.expirationDate._seconds) {
                        expiryDate = new Date(album.expirationDate._seconds * 1000);
                      } else if (album.expirationDate instanceof Date) {
                        expiryDate = album.expirationDate;
                      } else {
                        return 'Invalid Date';
                      }
                      return expiryDate.toLocaleDateString();
                    })() : 'Invalid Date'}
                  </div>
                </div>
              </div>
            )}
            <p className="mt-4 text-center text-sm text-gray-600">
              Redirecting you to the album...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Album Expired
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {error}
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join Failed
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {error}
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinAlbum; 