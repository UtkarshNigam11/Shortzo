# Shortzo - Short Video Reel Platform 🎬

A modern, full-stack MERN (MongoDB, Express.js, React, Node.js) application for sharing and discovering short video reels, similar to TikTok, Instagram Reels, or YouTube Shorts.

## ✨ Features

### 🎥 Core Features
- **Video Upload & Sharing** - Upload and share short video reels with the community
- **Category System** - Organize content by categories (Comedy, Music, Dance, Education, etc.)
### 🔐 Authentication & Security
- **JWT Authentication** - Secure user authentication with refresh tokens
- **Role-based Access Control** - Admin and moderator roles
- **Password Security** - Bcrypt encryption with strong password requirements
- **Account Management** - Profile editing, password changes, account deactivation

### 📱 User Experience
- **Responsive Design** - Mobile-first design that works on all devices
- **Dark/Light Theme** - Toggle between dark and light modes
- **Infinite Scroll** - Seamless browsing experience
- **Search Functionality** - Search for users, reels, and tags
- **NSFW Content Filtering** - Optional content filtering system

### ⚙️ Admin Features
- **Content Moderation** - Admin panel for content management
- **User Management** - User account management and moderation
- **Analytics Dashboard** - Insights into platform usage and engagement
- **Category Management** - Add, edit, and manage content categories

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Tokens for authentication
- **Multer** - File upload handling
- **Socket.io** - Real-time communication
- **Helmet** - Security middleware
- **Rate Limiting** - API protection

### Frontend
- **React 18** - Modern React with hooks and context
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form handling and validation
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Player** - Video player component
- **React Hot Toast** - Toast notifications
- **React Icons** - Icon library

### Development & Deployment
- **Concurrently** - Run multiple commands simultaneously
- **Nodemon** - Development server auto-restart
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/UtkarshNigam11/Shortzo.git
   cd Shortzo
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   
   Create `.env` file in the backend directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/shortzo
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_REFRESH_SECRET=your-refresh-secret-key-here
   ```

5. **Start the development servers**
   
   From the root directory:
   ```bash
   # Start both backend and frontend
   npm run dev
   
   # Or start them separately:
   # Backend (from backend directory)
   npm run dev
   
   # Frontend (from frontend directory)
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

### Demo Credentials
- **Admin:** admin@shortzo.com / admin123
- **User:** user@shortzo.com / user123

## 📁 Project Structure

```
Shortzo/
├── backend/                 # Node.js backend
│   ├── controllers/         # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── uploads/            # File upload directory
│   ├── utils/              # Utility functions
│   └── server.js           # Main server file
├── frontend/               # React frontend
│   ├── public/             # Public assets
│   └── src/
│       ├── components/     # React components
│       ├── context/        # React context providers
│       ├── pages/          # Page components
│       ├── services/       # API services
│       ├── utils/          # Utility functions
│       └── App.js          # Main App component
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh-token` - Refresh access token

### Reels
- `GET /api/reels` - Get all reels
- `POST /api/reels` - Create new reel
- `GET /api/reels/:id` - Get specific reel
- `PUT /api/reels/:id` - Update reel
- `DELETE /api/reels/:id` - Delete reel
- `POST /api/reels/:id/like` - Like/unlike reel

### Users
- `GET /api/users/profile/:username` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id/reels` - Get user's reels

### Comments
- `GET /api/comments/:reelId` - Get reel comments
- `POST /api/comments` - Add comment
- `DELETE /api/comments/:id` - Delete comment

## 🎨 Features in Detail

### Video Upload System
- Drag-and-drop interface
- Multiple format support (MP4, WebM, etc.)
- File size validation (max 50MB)
- Progress indicators
- Category selection
- Tag system

### Content Discovery
- Category-based browsing
- Tag-based filtering
- Search functionality
- Trending content
- Personalized recommendations

### User Interaction
- Like/unlike videos
- Comment system
- Share functionality
- Follow/unfollow users
- User mentions and hashtags

## � Security Features

- **Input Validation** - Server-side validation for all inputs
- **Rate Limiting** - Prevent spam and abuse
- **CORS Protection** - Cross-origin request security
- **Helmet Integration** - Security headers
- **Password Hashing** - Bcrypt with salt rounds
- **JWT Security** - Secure token implementation

## 📱 Mobile Responsiveness

- Mobile-first design approach
- Touch-friendly interface
- Responsive video player
- Mobile navigation
- Optimized for various screen sizes

## � Deployment

### Environment Setup
1. Set production environment variables
2. Configure MongoDB Atlas or production database
3. Set up file storage (AWS S3, Cloudinary, etc.)
4. Configure domain and SSL

### Deployment Options
- **Heroku** - Easy deployment with git integration
- **Vercel/Netlify** - Frontend deployment
- **DigitalOcean/AWS** - Full-stack deployment
- **Docker** - Containerized deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Utkarsh Nigam**
- GitHub: [@UtkarshNigam11](https://github.com/UtkarshNigam11)
- Email: utkarshnigam987@gmail.com

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by popular short video platforms
- Community-driven development approach

## 📞 Support

For support, email utkarshnigam987@gmail.com or create an issue on GitHub.

---

⭐ **Star this repository if you find it helpful!** ⭐
- Enhanced AI-based recommendations
