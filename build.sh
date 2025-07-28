#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting build process..."
echo "📋 Environment info:"
echo "  Node version: $(node --version)"
echo "  Yarn version: $(yarn --version)"
echo "  Current directory: $(pwd)"
echo "  Directory contents: $(ls -la)"

# Install dependencies
echo "📦 Installing dependencies..."
yarn install --frozen-lockfile

# Install frontend dependencies explicitly
echo "📦 Installing frontend dependencies..."
cd frontend
yarn install --frozen-lockfile
cd ..

# Install backend dependencies explicitly
echo "📦 Installing backend dependencies..."
cd backend
yarn install --frozen-lockfile
yarn add sharp --force
cd ..

# Build frontend
echo "🏗️ Building frontend..."
cd frontend
yarn build
cd ..

# Create backend public directory and copy frontend build
echo "📁 Setting up backend public directory..."
rm -rf backend/src/public
mkdir -p backend/src/public
cp -r frontend/build/* backend/src/public/

echo "✅ Build completed successfully!" 