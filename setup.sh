#!/bin/bash

echo "🚀 Setting up PicStream AI project..."
echo "📦 Using Yarn for package management with workspace support"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if Yarn is installed
if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn is not installed. Please install Yarn: npm install -g yarn"
    exit 1
fi

echo "✅ Yarn version: $(yarn --version)"

# Install all dependencies using Yarn workspaces
echo "📦 Installing all dependencies with Yarn workspaces..."
yarn install

# Create environment files
echo "📝 Creating environment files..."

if [ ! -f "backend/.env" ]; then
    cp backend/env.example backend/.env
    echo "✅ Created backend/.env (please configure with your Firebase settings)"
else
    echo "⚠️  backend/.env already exists"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/env.example frontend/.env
    echo "✅ Created frontend/.env (please configure with your Firebase settings)"
else
    echo "⚠️  frontend/.env already exists"
fi

# Create upload directories
echo "📁 Creating upload directories..."
mkdir -p backend/uploads
mkdir -p backend/thumbnails
mkdir -p backend/enhanced
mkdir -p backend/resized
mkdir -p backend/collages

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure Firebase project and get your credentials"
echo "2. Update backend/.env with your Firebase service account key"
echo "3. Update frontend/.env with your Firebase config"
echo "4. Run 'yarn dev' to start both servers"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8080"
echo ""
echo "📚 For detailed setup instructions, see README.md" 