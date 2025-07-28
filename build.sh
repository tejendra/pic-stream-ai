# #!/bin/bash

# # Exit on any error
# set -e

# echo "🚀 Starting build process..."
# echo "📋 Environment info:"
# echo "  Node version: $(node --version)"
# echo "  Yarn version: $(yarn --version)"

# echo "📦 Installing all workspace dependencies"
# NODE_ENV=development yarn install --frozen-lockfile

# # Install backend dependencies explicitly
# echo "📦 Installing backend dependencies..."
# echo "🔍 Current directory: $(pwd)"
# echo "🔍 Directory contents: $(ls -la)"
# echo "🔍 Checking root package.json:"
# cat package.json | head -25
# echo "🔍 Checking if frontend directory exists: $(ls -la frontend/ 2>/dev/null || echo 'frontend directory not found')"
# echo "🔍 Checking if backend directory exists: $(ls -la backend/ 2>/dev/null || echo 'backend directory not found')"
# echo "🔍 Checking frontend package.json name: $(cat frontend/package.json | grep '"name"' 2>/dev/null || echo 'frontend package.json not found')"
# echo "🔍 Checking backend package.json name: $(cat backend/package.json | grep '"name"' 2>/dev/null || echo 'backend package.json not found')"
# echo "🔍 Running yarn workspaces info:"
# yarn workspaces info
# yarn workspace backend add sharp --force

# echo "🔧 Building frontend"
# yarn workspace frontend build

# # Create backend public directory and copy frontend build
# echo "📁 Setting up backend public directory..."
# rm -rf backend/src/public
# mkdir -p backend/src/public

# # Copy Vite build output (includes index.html and assets)
# echo "📁 Copying Vite build output..."
# cp -r frontend/build/* backend/src/public/

# echo "✅ Build completed successfully!" 


#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting build process..."
echo "📋 Environment info:"
echo "  Node version: $(node --version)"
echo "  Yarn version: $(yarn --version)"

# Install frontend dependencies explicitly
echo "📦 Installing frontend dependencies..."
cd frontend
NODE_ENV=development yarn install --frozen-lockfile # Adding NODE_ENV=development to install dev dependencies such as vite
cd ..

# Install backend dependencies explicitly
echo "📦 Installing backend dependencies..."
cd backend
yarn install --frozen-lockfile
yarn add sharp --force
cd ..

# Build frontend
echo "🏗️ Building frontend with Vite..."
cd frontend
yarn build
cd ..

# Create backend public directory and copy frontend build
echo "📁 Setting up backend public directory..."
rm -rf backend/src/public
mkdir -p backend/src/public

# Copy Vite build output (includes index.html and assets)
echo "📁 Copying Vite build output..."
cp -r frontend/build/* backend/src/public/

echo "✅ Build completed successfully!" 