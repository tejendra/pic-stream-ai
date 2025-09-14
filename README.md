# pic-stream-ai

Just got back from an amazing vacation with hundreds of stunning photos? Don't let WhatsApp compress your memories into pixelated mush! This is your go-to app for sharing those crystal-clear vacation pics and videos in their full, glorious original quality with friends and family.

## 🚀 Features

- **High-Quality Uploads**: Upload photos and videos in their original quality without compression
- **AI Enhancement**: Automatically enhance images with AI-powered tools and filters
- **Secure Sharing**: Generate secure share links with customizable permissions
- **Smart Organization**: AI-powered tagging and organization
- **Global Access**: Access your media from anywhere, on any device
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **Lightning Fast Development**: Vite-powered build system for instant hot reload and fast builds

## 🏗️ Tech Stack

### Package Management
- **Yarn** - Fast, reliable, and secure package manager with workspace support
- **Workspaces** - Monorepo setup for managing frontend and backend dependencies

### Frontend
- **React 18** - Modern React with hooks and functional components
- **Vite** - Fast build tool and development server
- **Material-UI (MUI)** - React component library for modern UI design
- **React Router** - Client-side routing with protected routes
- **React Query (TanStack Query)** - Data fetching and caching
- **Firebase Auth** - Passwordless email authentication
- **Custom API Client** - Centralized HTTP client with error handling
- **React Hot Toast** - Toast notifications
- **Lucide React** - Beautiful icons
- **Context API** - State management for auth and albums
- **Custom Hooks** - Reusable data fetching and mutation logic

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Firebase Admin SDK** - Backend Firebase integration
- **Firebase Firestore** - NoSQL database
- **Firebase Storage** - File storage
- **Multer** - File upload handling
- **Sharp** - Image processing
- **JWT** - Token-based authentication
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Infrastructure
- **Firebase** - Authentication, database, and storage
- **Google Cloud Storage** - Alternative file storage
- **AWS S3** - Alternative file storage option


## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- Yarn (recommended) or npm
- Firebase project
- Google Cloud project (optional)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/pic-stream-ai.git
cd pic-stream-ai
```

### 2. Install Dependencies
```bash
# Install all dependencies (recommended)
yarn install

### 3. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Set up Firebase Storage
5. Generate a service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

### 4. Environment Configuration

#### Backend (.env)
```bash
cd backend
cp env.example .env
```

Edit `.env` with your Firebase configuration:
```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

#### Frontend (.env)
```bash
cd frontend
cp env.example .env
```

Edit `.env` with your Firebase configuration:
```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

### 5. Start Development Servers

#### Option 1: Start Both Servers (Recommended)
```bash
# From root directory
yarn dev
```

#### Option 2: Start Servers Separately
```bash
# Terminal 1 - Backend
yarn dev:backend

# Terminal 2 - Frontend
yarn dev:frontend
```

### 6. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- API Health Check: http://localhost:8080/health

## 🎨 Frontend Assets & Configuration

### Favicon & Icons
The application includes a complete favicon setup for optimal browser and device support:

- **favicon.ico** - Multi-size ICO file for browser tabs (16x16, 32x32)
- **favicon-16x16.png** - Small PNG favicon for modern browsers
- **favicon-32x32.png** - Standard PNG favicon for modern browsers
- **apple-touch-icon.png** - iOS home screen icon (180x180)
- **android-chrome-192x192.png** - Android PWA icon (192x192)
- **android-chrome-512x512.png** - High-resolution PWA icon (512x512)
- **og-image.jpg** - Social media preview image (1200x630)

### Web App Manifest
The `manifest.json` provides basic web app metadata without PWA installation features (MVP-focused):

- **App metadata**: Name, description, theme colors
- **Icon references**: All favicon files properly configured
- **Browser display**: Standard web app behavior (not standalone)
- **Theme integration**: Matches brand colors (#2563eb)

### HTML Meta Tags
The `index.html` includes comprehensive meta tags for:

- **SEO optimization**: Title, description, keywords
- **Social media sharing**: Open Graph tags for Facebook/LinkedIn
- **Favicon support**: Multiple favicon formats for different browsers
- **Responsive design**: Viewport configuration for mobile devices
- **Theme integration**: Browser UI color matching

## 🎨 UI Routes & Pages

The frontend application uses React Router for client-side routing with the following page structure:

### Public Routes (No Authentication Required)

#### `/` - Home Page
- **Component**: `Home.jsx`
- **Purpose**: Landing page with login functionality
- **Features**:
  - Beautiful gradient background with animated shapes
  - Email-based passwordless authentication
  - Support for invitation links (`?returnTo=/join/:shareToken`)
  - Theme toggle (light/dark mode)
  - Responsive design with mobile optimization

#### `/login/verify` - Login Verification
- **Component**: `LoginVerify.jsx`
- **Purpose**: Handles email link verification
- **Features**:
  - Token verification from email links
  - Automatic redirect after successful verification
  - Support for `returnTo` parameter for post-login navigation
  - Loading, success, and error states

#### `/share/:shareToken` - Public Share View
- **Component**: `ShareView.jsx`
- **Purpose**: Public viewing of shared media
- **Features**:
  - Password protection support
  - Media display (images/videos)
  - Download functionality (if enabled)
  - Share and copy link features
  - File information display
  - Embed code generation

### Protected Routes (Authentication Required)

#### `/dashboard` - User Dashboard
- **Component**: `Dashboard.jsx`
- **Purpose**: Main user interface for managing albums
- **Features**:
  - Album list display
  - Create new album functionality
  - Album count and statistics
  - Responsive grid layout

#### `/album/:albumId` - Album View
- **Component**: `Album.jsx`
- **Purpose**: Detailed album view with media management
- **Features**:
  - Album information (title, member count, creation date, expiration)
  - Media grid/gallery view
  - Two view modes: Grouped by User and Grid View
  - Upload functionality (inline upload component)
  - Share album functionality
  - Delete album/media capabilities
  - Download individual or multiple media items
  - Responsive design with mobile optimization

#### `/media/:id` - Media Detail View
- **Component**: `MediaDetail.jsx`
- **Purpose**: Detailed view of individual media items
- **Features**:
  - Full-size media display (images/videos)
  - Download original file functionality
  - File information (uploader, date, size, type)
  - Album navigation
  - Responsive layout

#### `/join/:shareToken` - Join Album
- **Component**: `JoinAlbum.jsx`
- **Purpose**: Join an album via share link
- **Features**:
  - Automatic album joining process
  - Authentication redirect if not logged in
  - Success/error/expired states
  - Album information display
  - Automatic redirect to album after joining

### Error Routes

#### `/404` - Not Found Page
- **Component**: `NotFound.jsx`
- **Purpose**: 404 error page
- **Features**:
  - Clean error display
  - Navigation back to home
  - Responsive design

#### `*` - Catch-all Route
- **Purpose**: Redirects any unmatched routes to `/404`

### Route Protection

The application uses two main route protection components:

- **`ProtectedRoute`**: Wraps routes that require authentication
  - Redirects unauthenticated users to home page
  - Shows loading spinner while checking auth state
  - 5-second timeout before redirect

- **`PublicRoute`**: Wraps routes that should only be accessible to unauthenticated users
  - Redirects authenticated users to dashboard
  - Used for login and verification pages

### Navigation Structure

- **Navbar**: Present on all pages except home page (`/`)
- **Theme Toggle**: Available on home page and navbar
- **Breadcrumbs**: Contextual navigation in album and media views
- **Back Navigation**: Consistent back button patterns throughout the app

### Responsive Design

All routes are fully responsive with:
- Mobile-first design approach
- Breakpoint-specific layouts
- Touch-friendly interactions
- Optimized for various screen sizes

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Passwordless email authentication
- `GET /api/auth/verify` - Verify email token
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### Albums
- `GET /api/albums` - Get user's albums (with pagination)
- `POST /api/albums` - Create new album
- `GET /api/albums/:id` - Get specific album details
- `PUT /api/albums/:id` - Update album
- `DELETE /api/albums/:id` - Delete album
- `POST /api/albums/:id/share` - Generate album share link
- `POST /api/albums/join/:shareToken` - Join album via share token

### Media Management
- `GET /api/albums/:albumId/media` - Get album media
- `POST /api/albums/:albumId/media` - Upload media to album
- `GET /api/media/:id` - Get specific media details
- `DELETE /api/media/:id` - Delete media
- `GET /api/media/:id/download` - Download media file

### Individual File Sharing
- `POST /api/share` - Generate share link for individual file
- `GET /api/share/:shareToken` - Get shared content
- `GET /api/share/:shareToken/download` - Download shared content
- `POST /api/share/:shareToken/verify` - Verify password-protected shares

## 🏗️ Architecture & Custom Hooks

### Custom Hooks
The application uses custom hooks for centralized data management:

- **`useAuth`** - Authentication state and user management
- **`useAlbums`** - Album CRUD operations and state management
- **`useAlbumMediaQuery`** - Media operations within albums (upload, download, delete)
- **`useMediaQuery`** - Individual media item fetching and management
- **`useAlbumDetails`** - Specific album details with caching

### State Management
- **React Context API** - Global state for authentication and album management
- **React Query (TanStack Query)** - Server state management, caching, and synchronization
- **Local State** - Component-specific state using React hooks

### API Client
- **Centralized HTTP Client** - Custom API client with automatic token handling
- **Error Handling** - Consistent error handling across all API calls
- **Request/Response Interceptors** - Automatic token refresh and error management

### Utility Functions
- **`fileUtils.js`** - File-related utilities (sanitizeFilename, formatFileSize)
- **`dateUtils.js`** - Date formatting and calculation utilities
- **`apiClient.jsx`** - Centralized API client configuration

## 🚀 Firebase Deployment

### Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project created and configured
- Environment variables set up

### 1. Firebase Project Setup
```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project root
firebase init

# Select the following services:
# - Hosting (for frontend)
# - Functions (for backend)
# - Firestore (database)
# - Storage (file storage)
```

### 2. Frontend Deployment (Firebase Hosting)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
yarn install

# Build the production version
yarn build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### 3. Backend Deployment (Firebase Functions)
```bash
# Navigate to backend directory
cd backend

# Install dependencies
yarn install

# Deploy backend as Firebase Functions
firebase deploy --only functions
```

### 4. Environment Configuration
Set up environment variables in Firebase:

```bash
# Set Firebase Functions environment variables
firebase functions:config:set app.firebase_service_account_key="your-service-account-json"
firebase functions:config:set app.firebase_storage_bucket="your-project-id.appspot.com"
firebase functions:config:set app.firebase_database_url="https://your-project-id.firebaseio.com"

# Set Firebase Hosting environment variables
firebase functions:config:set app.firebase_api_key="your-api-key"
firebase functions:config:set app.firebase_auth_domain="your-project-id.firebaseapp.com"
firebase functions:config:set app.firebase_project_id="your-project-id"
```

### 5. Firebase Configuration Files

#### `firebase.json` (Root directory)
```json
{
  "hosting": {
    "public": "frontend/build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "backend",
    "runtime": "nodejs18"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

#### `firestore.rules`
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Albums collection
    match /albums/{albumId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid in resource.data.members || 
         request.auth.uid == resource.data.createdBy);
    }
    
    // Media collection
    match /media/{mediaId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.uploadedBy;
    }
    
    // Shares collection
    match /shares/{shareId} {
      allow read: if resource.data.isActive == true;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.uploadedBy;
    }
  }
}
```

#### `storage.rules`
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    match /thumbnails/{allPaths=**} {
      allow read: if true; // Public read for thumbnails
      allow write: if request.auth != null;
    }
  }
}
```

### 6. Deploy Everything
```bash
# Deploy all services at once
firebase deploy

# Or deploy specific services
firebase deploy --only hosting,functions,firestore,storage
```

### 7. Post-Deployment
1. **Update CORS settings** in Firebase Functions for your domain
2. **Configure custom domain** in Firebase Hosting (optional)
3. **Set up SSL certificates** (automatic with Firebase)
4. **Monitor usage** in Firebase Console

### 8. Environment Variables for Production
Update your frontend environment variables to point to Firebase Functions:

```env
# Frontend .env.production
REACT_APP_API_URL=https://your-region-your-project-id.cloudfunctions.net
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

### 9. Monitoring & Maintenance
- **Firebase Console**: Monitor functions, hosting, and database usage
- **Logs**: View function logs with `firebase functions:log`
- **Performance**: Monitor with Firebase Performance Monitoring
- **Analytics**: Track usage with Firebase Analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Documentation: [docs.picstream.ai](https://docs.picstream.ai)
- Issues: [GitHub Issues](https://github.com/yourusername/pic-stream-ai/issues)
- Email: contact@picstream.ai
