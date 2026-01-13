# DigiCampus AI LMS - Reference Document

## Project Overview

DigiCampus AI LMS is a comprehensive Learning Management System (LMS) powered by artificial intelligence. It provides role-based access for students, teachers, administrators, and accountants, featuring AI-driven tools for content summarization, quiz generation, intelligent chat assistance, and seamless video conferencing integration.

### Key Features

- **Role-Based Dashboards**: Separate interfaces for Students, Teachers, Admins, and Accountants
- **AI-Powered Tools**: Document analysis, quiz generation, content summarization using Google Gemini AI
- **Live Video Classes**: Integrated Jitsi Meet for real-time video conferencing
- **Course Management**: Complete course lifecycle management with assignments, attendance, and grading
- **Authentication**: Firebase-based authentication with Google sign-in support
- **Real-time Notifications**: System-wide notification system
- **Fee Management**: Comprehensive fee tracking and payment management
- **Exam System**: Online exam creation, submission, and grading
- **Attendance Tracking**: Automated and manual attendance recording

## Tech Stack

### Frontend
- **React 19.2.3**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Recharts**: Data visualization library

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **Firebase Admin**: Authentication and user management

### AI & External Services
- **Google Gemini AI**: AI-powered content analysis and generation
- **Jitsi Meet**: Video conferencing platform
- **Firebase**: Authentication and real-time features

### Development Tools
- **ESLint**: Code linting
- **TypeScript Compiler**: Type checking
- **Vite Dev Server**: Development environment

## Architecture

The application follows a modern full-stack architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React + TS)  │◄──►│   (Express)     │◄──►│   (MongoDB)     │
│                 │    │                 │    │                 │
│ - Components    │    │ - Routes        │    │ - Models        │
│ - Services      │    │ - Controllers   │    │ - Schemas       │
│ - Types         │    │ - Middleware    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ External APIs   │
                    │ - Gemini AI     │
                    │ - Firebase Auth │
                    │ - Jitsi Meet    │
                    └─────────────────┘
```

## Project Structure

```
digicampus-ai-lms/
├── public/                          # Static assets
├── src/
│   ├── components/                  # React components
│   │   ├── Layout.tsx              # Main layout component
│   │   ├── StudentDashboard.tsx    # Student dashboard
│   │   ├── TeacherDashboard.tsx    # Teacher dashboard
│   │   ├── AdminDashboard.tsx      # Admin dashboard
│   │   ├── AccountantDashboard.tsx # Accountant dashboard
│   │   ├── AISidebar.tsx           # AI chat sidebar
│   │   ├── ToolsModal.tsx          # AI tools modal
│   │   ├── JitsiMeet.tsx           # Video conferencing
│   │   └── ...
│   ├── services/                   # Business logic services
│   │   ├── auth.ts                 # Authentication service
│   │   ├── api.ts                  # API client
│   │   ├── firebase.ts             # Firebase integration
│   │   ├── storage.ts              # Local storage management
│   │   ├── geminiService.ts        # Gemini AI service
│   │   └── ...
│   ├── types.ts                    # TypeScript type definitions
│   ├── App.tsx                     # Main application component
│   ├── index.tsx                   # Application entry point
│   └── ...
├── backend/                        # Backend API server
│   ├── config/
│   │   └── database.js             # MongoDB connection
│   ├── models/                     # Mongoose models
│   │   ├── User.js                 # User model
│   │   ├── Course.js               # Course model
│   │   ├── Assignment.js           # Assignment model
│   │   ├── Notification.js         # Notification model
│   │   ├── Attendance.js           # Attendance model
│   │   ├── LiveSession.js          # Live session model
│   │   └── ...
│   ├── routes/                     # API routes
│   │   └── users.js                # User-related routes
│   ├── server.js                   # Express server setup
│   └── package.json                # Backend dependencies
├── package.json                    # Frontend dependencies
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite configuration
├── README.md                       # Project documentation
└── REFERENCE.md                    # This reference document
```

## Frontend Components

### Core Components

#### App.tsx
Main application component handling:
- User authentication state
- Role-based routing
- Dark mode toggle
- Welcome screen and login modal

#### Layout.tsx
Application layout wrapper providing:
- Navigation sidebar
- Header with user info
- Page routing
- Theme management

### Dashboard Components

#### StudentDashboard.tsx
Student interface featuring:
- Course enrollment and progress
- Assignment submissions
- Exam participation
- Fee payment tracking
- Attendance records

#### TeacherDashboard.tsx
Teacher interface including:
- Course management
- Assignment creation and grading
- Student performance analytics
- Live class scheduling
- Attendance monitoring

#### AdminDashboard.tsx
Administrative interface for:
- User management
- System-wide notifications
- Course and curriculum oversight
- System analytics

#### AccountantDashboard.tsx
Financial management interface with:
- Fee collection tracking
- Payment processing
- Financial reporting
- Student fee management

### Utility Components

#### AISidebar.tsx
AI-powered chat interface providing:
- Contextual assistance
- Document analysis
- Study help

#### ToolsModal.tsx
AI tools modal offering:
- Document summarization
- Quiz generation
- Date extraction from content

#### JitsiMeet.tsx
Video conferencing component for:
- Live classes
- Virtual meetings
- Interactive sessions

## Backend Models

All models use Mongoose for MongoDB integration with proper validation and indexing.

### User Model
```javascript
{
  firebaseUid: String (required, unique),
  email: String (required, unique),
  name: String (required),
  role: Enum ['Student', 'Teacher', 'Admin', 'Accountant'],
  avatar: String,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Course Model
Represents academic courses with enrollment and progress tracking.

### Assignment Model
Manages assignment creation, submission, and grading.

### Notification Model
Handles system-wide and user-specific notifications.

### Attendance Model
Tracks student attendance across courses and sessions.

### LiveSession Model
Manages live video sessions and recordings.

## Services

### Authentication Service (auth.ts)
Handles user authentication via Firebase:
- Google sign-in integration
- Mock authentication for development
- User session management
- Role-based access control

### API Service (api.ts)
Centralized API client for backend communication:
- RESTful API calls
- Error handling
- Request/response interceptors

### Firebase Service (firebase.ts)
Firebase integration for:
- Real-time database operations
- File storage
- Push notifications

### Storage Service (storage.ts)
Local storage management:
- User preferences
- Cached data
- Offline functionality

### Gemini AI Service (geminiService.ts)
AI-powered features:
- Document summarization
- Quiz generation
- Date extraction
- Intelligent chat assistance
- Content analysis

## API Endpoints

### User Routes (/api/users)
- `GET /api/users` - Get all users (admin only)
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Health Check
- `GET /api/health` - Server health status

## Type Definitions

### User Roles
```typescript
enum UserRole {
  STUDENT = 'Student',
  TEACHER = 'Teacher',
  ADMIN = 'Admin',
  ACCOUNTANT = 'Accountant'
}
```

### Key Interfaces
- `User`: User profile information
- `Course`: Course details and metadata
- `Assignment`: Assignment structure
- `AttendanceRecord`: Attendance tracking
- `ExamSession`: Exam management
- `FeeRecord`: Financial transactions
- `ChatMessage`: AI chat interactions

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Firebase project with authentication enabled
- Google Gemini API key

### Frontend Setup
```bash
# Install dependencies
npm install

# Set environment variables
# Create .env.local with:
# GEMINI_API_KEY=your_gemini_api_key
# VITE_FIREBASE_API_KEY=your_firebase_key
# VITE_FIREBASE_AUTH_DOMAIN=your_domain
# etc.

# Start development server
npm run dev
```

### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Set environment variables
# Create .env with:
# PORT=5000
# MONGODB_URI=your_mongodb_connection_string
# FIREBASE_PROJECT_ID=your_project_id
# etc.

# Start development server
npm run dev
```

### Production Build
```bash
# Build frontend
npm run build

# Start backend
cd backend && npm start
```

## Usage Guide

### For Students
1. Login with student credentials or Google account
2. View enrolled courses and progress
3. Submit assignments and participate in exams
4. Join live classes via integrated video
5. Access AI tools for study assistance
6. Track fees and attendance

### For Teachers
1. Login with teacher credentials
2. Create and manage courses
3. Assign homework and grade submissions
4. Schedule live classes
5. Monitor student performance
6. Use AI tools for content creation

### For Administrators
1. Login with admin credentials
2. Manage users and roles
3. Oversee system operations
4. Send notifications
5. View analytics and reports

### For Accountants
1. Login with accountant credentials
2. Track fee payments
3. Generate financial reports
4. Manage payment records
5. Monitor outstanding balances

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Maintain consistent naming conventions
- Write descriptive commit messages

### Testing
- Unit tests for utilities and services
- Integration tests for API endpoints
- E2E tests for critical user flows

### Deployment
- Frontend: Deploy to Vercel/Netlify/CDN
- Backend: Deploy to Heroku/Railway/AWS
- Database: MongoDB Atlas for production
- Environment variables: Secure key management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper TypeScript types
4. Test thoroughly
5. Submit a pull request with description

## Support

For issues and questions:
- Check existing GitHub issues
- Create new issue with detailed description
- Include environment details and error logs

## License

This project is licensed under the ISC License.
