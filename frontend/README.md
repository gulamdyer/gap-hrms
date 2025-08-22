# GAP HRMS Frontend

A modern React frontend for the GAP HRMS (Human Resource Management System) with authentication and dashboard functionality.

## 🚀 Features

- **Modern React 18** with functional components and hooks
- **TailwindCSS** for beautiful, responsive design
- **JWT Authentication** with persistent login state
- **Protected Routes** with role-based access control
- **Responsive Dashboard** with statistics and activities
- **Toast Notifications** for user feedback
- **Mobile-First Design** with responsive sidebar
- **State Management** with Zustand

## 📋 Prerequisites

- Node.js 18+ or 20 LTS
- Backend API running on `http://localhost:5000`
- Modern web browser

## 🛠 Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm start
```

The application will open at `http://localhost:3000`

## 🎯 What's Included

### ✅ Authentication System
- **Login Page** with form validation
- **Registration Page** with comprehensive validation
- **JWT Token Management** with automatic token refresh
- **Persistent Login State** using localStorage
- **Protected Route Guards**

### ✅ Dashboard Features
- **Welcome Section** with personalized greeting
- **Statistics Cards** showing key metrics
- **Recent Activities** feed
- **Quick Actions** for common tasks
- **System Status** indicators
- **Responsive Layout** for all devices

### ✅ UI Components
- **Modern Design** with TailwindCSS
- **Loading Spinners** for better UX
- **Toast Notifications** for feedback
- **Responsive Sidebar** with mobile support
- **User Dropdown** with profile options
- **Form Validation** with error messages

### ✅ State Management
- **Zustand Store** for authentication state
- **Persistent Storage** for user sessions
- **API Integration** with axios interceptors
- **Error Handling** with user-friendly messages

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html              # Main HTML file
├── src/
│   ├── components/
│   │   ├── LoadingSpinner.jsx  # Reusable loading component
│   │   ├── ProtectedRoute.jsx  # Route protection
│   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   └── Header.jsx          # Top header bar
│   ├── layouts/
│   │   └── DashboardLayout.jsx # Dashboard layout wrapper
│   ├── pages/
│   │   ├── Login.jsx           # Login page
│   │   ├── Register.jsx        # Registration page
│   │   └── Dashboard.jsx       # Main dashboard
│   ├── services/
│   │   └── api.js              # API service layer
│   ├── store/
│   │   └── authStore.js        # Authentication state
│   ├── App.jsx                 # Main app component
│   ├── index.js                # App entry point
│   └── index.css               # Global styles
├── package.json                # Dependencies
├── tailwind.config.js          # TailwindCSS config
└── postcss.config.js           # PostCSS config
```

## 🔐 Authentication Flow

1. **Login**: User enters credentials → API call → JWT token stored → Redirect to dashboard
2. **Registration**: User fills form → API call → Auto-login → Redirect to dashboard
3. **Protected Routes**: Check authentication → Redirect to login if not authenticated
4. **Token Management**: Automatic token inclusion in API requests
5. **Logout**: Clear stored data → Redirect to login

## 🎨 Design System

### Colors
- **Primary**: Blue shades for main actions
- **Success**: Green for positive actions
- **Warning**: Yellow for caution
- **Danger**: Red for errors/destructive actions
- **Secondary**: Gray shades for neutral elements

### Components
- **Cards**: White background with subtle shadows
- **Buttons**: Primary, secondary, and danger variants
- **Inputs**: Consistent styling with focus states
- **Sidebar**: Dark navigation with active states

## 📱 Responsive Design

- **Mobile**: Collapsible sidebar, stacked layouts
- **Tablet**: Sidebar overlay, responsive grids
- **Desktop**: Full sidebar, multi-column layouts

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:5000
```

### API Configuration
The frontend is configured to proxy requests to the backend:
- Development: `http://localhost:5000` (via proxy)
- Production: Set `REACT_APP_API_URL` environment variable

## 🧪 Testing

### Manual Testing
1. **Login Flow**: Test with valid/invalid credentials
2. **Registration**: Test form validation and submission
3. **Dashboard**: Verify all components render correctly
4. **Responsive**: Test on different screen sizes
5. **Navigation**: Test sidebar and routing

### Demo Credentials
Use these credentials for testing:
- **Username**: `test_user`
- **Password**: `TestPass123!`

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy Options
- **Netlify**: Drag and drop `build` folder
- **Vercel**: Connect GitHub repository
- **AWS S3**: Upload `build` folder to S3 bucket
- **Docker**: Use nginx to serve static files

## 🔧 Development

### Available Scripts
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Code Style
- Use functional components with hooks
- Follow React best practices
- Use TailwindCSS utility classes
- Implement proper error handling

## 🐛 Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Ensure backend is running on port 5000
   - Check CORS configuration
   - Verify API endpoints

2. **Authentication Issues**
   - Clear browser localStorage
   - Check JWT token expiration
   - Verify API responses

3. **Styling Issues**
   - Ensure TailwindCSS is properly configured
   - Check PostCSS configuration
   - Verify CSS imports

4. **Build Errors**
   - Clear node_modules and reinstall
   - Check for missing dependencies
   - Verify environment variables

## 📚 Next Steps

1. **Add More Pages**: Employee management, leave requests, etc.
2. **Implement Real-time**: WebSocket connections for live updates
3. **Add Charts**: Data visualization with Chart.js or Recharts
4. **File Upload**: Document management functionality
5. **Advanced Features**: Workflow approvals, reporting, etc.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**🎉 Your GAP HRMS frontend is ready! Start the development server and begin building amazing HR features.** 