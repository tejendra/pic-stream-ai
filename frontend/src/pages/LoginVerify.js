import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const LoginVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyLoginToken } = useAuth();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [error, setError] = useState('');

  useEffect(() => {
    const handleVerification = async () => {
      try {
        const token = searchParams.get('token');
        const returnTo = searchParams.get('returnTo');

        if (!token) {
          setStatus('error');
          setError('Invalid verification link');
          return;
        }

        console.log('Verifying token:', token, 'returnTo:', returnTo);

        const result = await verifyLoginToken(token);
        
        if (result.success) {
          setStatus('success');
          
          // Redirect after a short delay
          setTimeout(() => {
            if (returnTo) {
              // Decode the returnTo URL and navigate there
              const decodedReturnTo = decodeURIComponent(returnTo);
              console.log('Redirecting to:', decodedReturnTo);
              navigate(decodedReturnTo);
            } else {
              // Default redirect to dashboard
              navigate('/dashboard');
            }
          }, 2000);
        } else {
          setStatus('error');
          setError(result.error || 'Verification failed');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setError(error.message || 'Verification failed');
      }
    };

    handleVerification();
  }, [searchParams, navigate, verifyLoginToken]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <Loader className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Verifying your login
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please wait while we verify your login link...
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
              Login successful!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Redirecting you to your destination...
            </p>
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
            Verification failed
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {error}
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginVerify; 