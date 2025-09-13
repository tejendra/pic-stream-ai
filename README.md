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
- **Axios** - HTTP client for API calls
- **React Hot Toast** - Toast notifications
- **Lucide React** - Beautiful icons
- **Context API** - State management for auth and albums

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

# Or install manually:
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

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

## 📁 Project Structure

```
pic-stream-ai/
├── frontend/                 # React frontend application
│   ├── public/              # Static files
│   │   ├── components/      # Reusable components
│   │   │   ├── common/      # Common UI components
│   │   │   └── layout/      # Layout components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   ├── App.js           # Main App component
│   │   └── index.js         # Entry point
│   ├── package.json
│   └── tailwind.config.js
├── backend/                  # Node.js/Express backend
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   └── server.js        # Main server file
│   ├── uploads/             # Local file storage (dev)
│   └── package.json
├── package.json             # Root package.json
└── README.md
```

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
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Media Management
- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files
- `GET /api/media/my` - Get user's media
- `GET /api/media/public` - Get public media
- `GET /api/media/:id` - Get specific media
- `PUT /api/media/:id` - Update media
- `DELETE /api/media/:id` - Delete media
- `GET /api/media/:id/download` - Download media

### Sharing
- `POST /api/share/generate` - Generate share link
- `GET /api/share/:token` - Get shared content
- `GET /api/share/:token/download` - Download shared content
- `GET /api/share/my/shares` - Get user's shares
- `PUT /api/share/:id` - Update share settings
- `DELETE /api/share/:id` - Delete share

### AI Features
- `POST /api/ai/enhance/:id` - Enhance image
- `POST /api/ai/resize/:id` - Generate resized versions
- `POST /api/ai/auto-tag/:id` - Auto-tag image
- `POST /api/ai/collage` - Create image collage
- `GET /api/ai/status/:id` - Get AI processing status

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
1. Build the frontend: `cd frontend && npm run build`
2. Deploy the `build` folder to your hosting platform
3. Set environment variables in your hosting platform

### Backend Deployment (Heroku/Railway)
1. Set up your deployment platform
2. Configure environment variables
3. Deploy the backend directory
4. Update frontend API URL to production backend URL

### Firebase Deployment
1. Configure Firebase Hosting for frontend
2. Set up Firebase Functions for backend (optional)
3. Configure Firebase Storage rules
4. Set up Firestore security rules

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

## 🙏 Acknowledgments

- Firebase for the amazing backend services
- Tailwind CSS for the beautiful styling framework
- React community for the excellent ecosystem
- All contributors who help make this project better
