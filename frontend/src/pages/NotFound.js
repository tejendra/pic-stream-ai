import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-blue-600">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">Sorry, the page you are looking for does not exist.</p>
        <Link to="/" className="text-blue-600 hover:text-blue-500 font-medium">Go Home</Link>
      </div>
    </div>
  );
};

export default NotFound; 