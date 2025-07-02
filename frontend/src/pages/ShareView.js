import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMedia } from '../contexts/MediaContext';
import { 
  Download, 
  Share2, 
  Eye, 
  Calendar, 
  User, 
  Tag, 
  Copy,
  Lock,
  Globe,
  ArrowLeft
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ShareView = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { getSharedMedia, loading } = useMedia();
  const [media, setMedia] = useState(null);
  const [password, setPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSharedMedia = async () => {
      try {
        const result = await getSharedMedia(shareId);
        if (result.success) {
          setMedia(result.data);
          if (result.data.isPasswordProtected) {
            setShowPasswordForm(true);
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching shared media:', error);
        navigate('/');
      }
    };

    fetchSharedMedia();
  }, [shareId, getSharedMedia, navigate]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    try {
      const result = await getSharedMedia(shareId, password);
      if (result.success) {
        setMedia(result.data);
        setShowPasswordForm(false);
      } else {
        setPasswordError('Incorrect password');
      }
    } catch (error) {
      setPasswordError('An error occurred');
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
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const shareMedia = () => {
    if (navigator.share) {
      navigator.share({
        title: media.title,
        text: media.description,
        url: window.location.href
      });
    } else {
      copyToClipboard(window.location.href);
    }
  };

  const downloadMedia = () => {
    const link = document.createElement('a');
    link.href = media.url;
    link.download = media.title || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (showPasswordForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Password Protected
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              This file is password protected
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handlePasswordSubmit}>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter password"
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-600">{passwordError}</p>
              )}
            </div>
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Access File
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">File Not Found</h2>
          <p className="mt-2 text-gray-600">The file you're looking for doesn't exist or has been removed.</p>
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
            onClick={() => navigate('/')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{media.title}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Media Display */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {media.mimeType?.startsWith('image/') ? (
                <img
                  src={media.url}
                  alt={media.title}
                  className="w-full h-auto max-h-96 object-contain"
                />
              ) : (
                <video
                  src={media.url}
                  controls
                  className="w-full h-auto max-h-96"
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
                {media.allowDownload && (
                  <button
                    onClick={downloadMedia}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </button>
                )}
                <button
                  onClick={shareMedia}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </button>
                <button
                  onClick={() => copyToClipboard(window.location.href)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy Link'}
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
                    Shared by
                  </dt>
                  <dd className="text-sm text-gray-900">{media.uploadedBy?.displayName || 'Unknown'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Uploaded
                  </dt>
                  <dd className="text-sm text-gray-900">{formatDate(media.uploadedAt)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Views
                  </dt>
                  <dd className="text-sm text-gray-900">{media.views || 0}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    Downloads
                  </dt>
                  <dd className="text-sm text-gray-900">{media.downloads || 0}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-gray-500">File size</dt>
                  <dd className="text-sm text-gray-900">{formatFileSize(media.size)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-gray-500">File type</dt>
                  <dd className="text-sm text-gray-900">{media.mimeType}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    {media.isPublic ? (
                      <Globe className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <Lock className="h-4 w-4 mr-2 text-red-500" />
                    )}
                    Visibility
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {media.isPublic ? 'Public' : 'Private'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Description */}
            {media.description && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{media.description}</p>
              </div>
            )}

            {/* Tags */}
            {media.tags && media.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Tag className="h-5 w-5 mr-2" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {media.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Share</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Direct Link
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={window.location.href}
                      readOnly
                      className="flex-1 block w-full border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(window.location.href)}
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Embed Code
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={`<img src="${media.url}" alt="${media.title}" />`}
                      readOnly
                      className="flex-1 block w-full border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(`<img src="${media.url}" alt="${media.title}" />`)}
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareView; 