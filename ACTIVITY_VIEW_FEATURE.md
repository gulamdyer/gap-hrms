# Activity View Feature Documentation

## Overview

The Activity View feature provides comprehensive audit trail analysis for the HRMS application. It allows users to view detailed changes made to records, specifically focusing on UPDATE operations that have both old and new values.

## Features

### 1. View Button in Recent Activities

- **Location**: Dashboard → Recent Activities section
- **Visibility**: Only appears for UPDATE activities that have both old and new values
- **Design**: Consistent with the Loans page styling (enhanced buttons with borders and hover effects)

### 2. Comprehensive Activity Detail Modal

The modal provides detailed analysis of activity changes with the following sections:

#### Activity Overview
- **Performed by**: User who made the change
- **Timestamp**: When the change occurred
- **Module**: Which module was affected (Employee, Leave, etc.)
- **Action**: Type of action (CREATE, UPDATE, DELETE)

#### Action Badge
- Color-coded badges for different action types
- Visual indicators for CREATE (green), UPDATE (yellow), DELETE (red)

#### Changes Analysis (UPDATE actions only)
- **Side-by-side comparison**: Old values vs New values
- **Changed fields highlighting**: Fields that were modified are clearly marked
- **Field formatting**: Proper formatting for dates, booleans, and complex objects
- **Summary**: Quick overview of how many fields were changed

#### Technical Details
- **IP Address**: Source of the change
- **User Agent**: Browser/client information
- **Activity ID**: Unique identifier
- **Entity ID**: Related record identifier

## Implementation Details

### Backend Components

#### Activity Model (`backend/models/Activity.js`)
- Enhanced `getRecentActivities()` to include OLD_VALUES and NEW_VALUES
- Updated `formatActivityForDashboard()` to include `hasOldValues` and `hasNewValues` flags
- Proper CLOB handling for Oracle database

#### Activity Controller (`backend/controllers/activityController.js`)
- `getActivityById()` endpoint for fetching detailed activity information
- Proper error handling and response formatting

#### Activity Routes (`backend/routes/activities.js`)
- GET `/api/activities/:id` - Fetch specific activity details
- Proper authentication and authorization middleware

### Frontend Components

#### ActivityDetailModal (`frontend/src/components/ActivityDetailModal.jsx`)
- Comprehensive modal with multiple sections
- Real-time parsing of JSON old/new values
- Responsive design with proper scrolling
- Loading states and error handling

#### Dashboard Integration (`frontend/src/pages/Dashboard.jsx`)
- View button only shows for UPDATE activities with old/new values
- Consistent styling with the Loans page design
- Loading states and empty states for activities

## Usage Instructions

### For End Users

1. **Navigate to Dashboard**: Go to `http://localhost:3000/dashboard`
2. **Find Recent Activities**: Look for the "Recent Activities" section
3. **Identify UPDATE Activities**: Look for activities with a "View" button
4. **Click View Button**: Click the "View" button to open the detailed modal
5. **Analyze Changes**: Review the side-by-side comparison of old vs new values

### For Developers

#### Testing the Feature

1. **Run the test script**:
   ```bash
   cd backend
   node test-activity-logging.js
   ```

2. **Start the servers**:
   ```bash
   # Backend
   cd backend && npm start
   
   # Frontend
   cd frontend && npm start
   ```

3. **Navigate to dashboard**: `http://localhost:3000/dashboard`

4. **Look for UPDATE activities** with View buttons

#### Creating Test Data

The test script creates sample activities:
- UPDATE activity with old/new values (shows View button)
- CREATE activity without old values (no View button)

## Technical Specifications

### Database Schema

```sql
CREATE TABLE HRMS_ACTIVITIES (
  ACTIVITY_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  USER_ID NUMBER NOT NULL,
  EMPLOYEE_ID NUMBER,
  MODULE VARCHAR2(50) NOT NULL,
  ACTION VARCHAR2(50) NOT NULL,
  ENTITY_TYPE VARCHAR2(50) NOT NULL,
  ENTITY_ID NUMBER,
  ENTITY_NAME VARCHAR2(200),
  DESCRIPTION VARCHAR2(500) NOT NULL,
  OLD_VALUES CLOB,
  NEW_VALUES CLOB,
  IP_ADDRESS VARCHAR2(45),
  USER_AGENT VARCHAR2(500),
  CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints

- `GET /api/activities/recent` - Get recent activities for dashboard
- `GET /api/activities/:id` - Get specific activity details

### Frontend State Management

```javascript
// Dashboard state
const [selectedActivityId, setSelectedActivityId] = useState(null);
const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

// Activity item logic
const hasUpdateDetails = activity.action === 'UPDATE' && 
                       activity.hasOldValues && 
                       activity.hasNewValues;
```

## Design Principles

### UI/UX Consistency
- Follows the "gold standard" design from the Loans page
- Consistent button styling and spacing
- Proper loading states and empty states
- Responsive design for all screen sizes

### Accessibility
- Proper ARIA labels and titles
- Keyboard navigation support
- Screen reader friendly content structure

### Performance
- Lazy loading of activity details
- Efficient JSON parsing
- Proper error boundaries

## Future Enhancements

### Planned Features
1. **Export functionality**: Export activity details to PDF/CSV
2. **Advanced filtering**: Filter activities by date range, user, module
3. **Bulk operations**: Select multiple activities for analysis
4. **Real-time updates**: WebSocket integration for live activity feeds
5. **Advanced analytics**: Charts and graphs for activity patterns

### Technical Improvements
1. **Caching**: Implement Redis caching for frequently accessed activities
2. **Pagination**: Add pagination for large activity lists
3. **Search**: Full-text search across activity descriptions
4. **Notifications**: Real-time notifications for important activities

## Troubleshooting

### Common Issues

1. **View button not appearing**:
   - Check if activity has `action: 'UPDATE'`
   - Verify `hasOldValues` and `hasNewValues` are true
   - Ensure activity has valid old/new values in database

2. **Modal not loading**:
   - Check browser console for API errors
   - Verify authentication token is valid
   - Check network connectivity

3. **JSON parsing errors**:
   - Ensure old/new values are valid JSON
   - Check CLOB handling in Oracle database
   - Verify data encoding

### Debug Steps

1. **Check browser console** for JavaScript errors
2. **Verify API responses** using browser network tab
3. **Test API endpoints** directly using Postman/curl
4. **Check database** for activity data integrity

## Security Considerations

- **Authentication**: All endpoints require valid JWT token
- **Authorization**: Role-based access control (ADMIN, HR, MANAGER)
- **Data sanitization**: Proper input validation and sanitization
- **Audit trail**: All activities are logged for security purposes

## Performance Considerations

- **Database indexing**: Proper indexes on frequently queried columns
- **Query optimization**: Efficient SQL queries with proper joins
- **Frontend optimization**: Lazy loading and efficient state management
- **Caching strategy**: Consider implementing Redis for frequently accessed data 