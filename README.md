# EduNexus Backend - Peer-to-Peer Tutoring Platform

A comprehensive backend API for a peer-to-peer tutoring platform where teachers can upload courses and students can purchase and enroll in them.

## Features

- **User Management**: Three user roles (Admin, Teacher, Student)
- **Course Management**: Teachers can create, update, and publish courses
- **Enrollment System**: Students can browse and enroll in courses
- **Order Management**: Complete order and payment tracking
- **Review System**: Students can rate and review courses
- **Progress Tracking**: Track student progress through courses
- **Admin Dashboard**: Platform analytics and management

## Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up MongoDB:
   - Install MongoDB locally or use MongoDB Atlas
   - Set environment variable `MONGODB_URI` or use default local connection

4. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication (`/api/auth`)

#### Register User
```
POST /api/auth/register
```
Body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student",
  "phone": "+1234567890",
  "address": "123 Main St",
  "bio": "Student bio"
}
```

#### Login User
```
POST /api/auth/login
```
Body:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get User Profile
```
GET /api/auth/profile/:id
```

#### Update User Profile
```
PUT /api/auth/profile/:id
```

#### Update Teacher Profile
```
PUT /api/auth/teacher-profile/:id
```
Body:
```json
{
  "subjects": ["Math", "Physics"],
  "experience": 5,
  "education": "PhD in Mathematics",
  "hourlyRate": 50
}
```

#### Update Student Profile
```
PUT /api/auth/student-profile/:id
```
Body:
```json
{
  "grade": "12th Grade",
  "interests": ["Science", "Technology"]
}
```

#### Get All Teachers
```
GET /api/auth/teachers
```

#### Get All Students
```
GET /api/auth/students
```

### Courses (`/api/courses`)

#### Create Course (Teacher only)
```
POST /api/courses
```
Body:
```json
{
  "title": "Advanced Mathematics",
  "description": "Comprehensive course on advanced mathematics",
  "subject": "Mathematics",
  "level": "advanced",
  "price": 99.99,
  "duration": 20,
  "requirements": ["Basic algebra"],
  "learningOutcomes": ["Master calculus", "Understand linear algebra"],
  "maxStudents": 30,
  "tags": ["math", "calculus"],
  "teacherId": "teacher_id_here"
}
```

#### Get All Published Courses
```
GET /api/courses?subject=Mathematics&level=beginner&minPrice=10&maxPrice=100&page=1&limit=10
```

#### Get Course by ID
```
GET /api/courses/:id
```

#### Update Course (Teacher only)
```
PUT /api/courses/:id
```

#### Publish/Unpublish Course (Teacher only)
```
PATCH /api/courses/:id/publish
```
Body:
```json
{
  "teacherId": "teacher_id_here",
  "isPublished": true
}
```

#### Delete Course (Teacher only)
```
DELETE /api/courses/:id
```

#### Enroll in Course (Student only)
```
POST /api/courses/:id/enroll
```
Body:
```json
{
  "studentId": "student_id_here",
  "paymentMethod": "stripe"
}
```

#### Add Review (Student only)
```
POST /api/courses/:id/review
```
Body:
```json
{
  "studentId": "student_id_here",
  "rating": 5,
  "comment": "Excellent course!"
}
```

#### Update Progress (Student only)
```
PATCH /api/courses/:id/progress
```
Body:
```json
{
  "studentId": "student_id_here",
  "progress": 75
}
```

#### Get Teacher's Courses
```
GET /api/courses/teacher/:teacherId
```

#### Get Student's Enrolled Courses
```
GET /api/courses/student/:studentId
```

### Orders (`/api/orders`)

#### Get All Orders (Admin only)
```
GET /api/orders?status=completed&paymentStatus=paid&page=1&limit=10
```

#### Get Order by ID
```
GET /api/orders/:id
```

#### Get Student's Orders
```
GET /api/orders/student/:studentId
```

#### Get Teacher's Orders
```
GET /api/orders/teacher/:teacherId
```

#### Create Order
```
POST /api/orders
```
Body:
```json
{
  "studentId": "student_id_here",
  "courseId": "course_id_here",
  "paymentMethod": "stripe"
}
```

#### Complete Order
```
PATCH /api/orders/:id/complete
```
Body:
```json
{
  "transactionId": "txn_123456"
}
```

#### Cancel Order
```
PATCH /api/orders/:id/cancel
```
Body:
```json
{
  "reason": "Student requested cancellation"
}
```

#### Refund Order
```
PATCH /api/orders/:id/refund
```
Body:
```json
{
  "reason": "Course quality issues"
}
```

#### Get Order Statistics
```
GET /api/orders/stats/overview
```

### Admin (`/api/admin`)

#### Get Platform Statistics
```
GET /api/admin/stats
```

#### Get All Users (Admin only)
```
GET /api/admin/users?role=teacher&isActive=true&page=1&limit=10
```

#### Update User Status (Admin only)
```
PATCH /api/admin/users/:id/status
```
Body:
```json
{
  "isActive": true,
  "isVerified": true
}
```

#### Get All Courses (Admin only)
```
GET /api/admin/courses?isPublished=true&isActive=true&page=1&limit=10
```

#### Update Course Status (Admin only)
```
PATCH /api/admin/courses/:id/status
```
Body:
```json
{
  "isActive": true
}
```

#### Get Revenue Analytics
```
GET /api/admin/analytics/revenue?period=monthly
```

#### Get Top Performing Teachers
```
GET /api/admin/analytics/top-teachers
```

#### Get Popular Courses
```
GET /api/admin/analytics/popular-courses
```

## Data Models

### User Model
- Basic info: name, email, password, role, profileImage, bio, phone, address
- Teacher specific: subjects, experience, education, hourlyRate
- Student specific: grade, interests
- Common: isActive, isVerified, timestamps

### Course Model
- Basic info: title, description, teacher, subject, level, price, duration
- Content: materials, syllabus, requirements, learningOutcomes
- Enrollment: maxStudents, enrolledStudents with progress tracking
- Reviews: rating system with comments
- Status: isPublished, isActive, tags

### Order Model
- Transaction: student, course, teacher, amount, paymentMethod
- Status: pending, completed, cancelled, refunded
- Payment: paymentStatus, transactionId, notes
- Timestamps and refund tracking

## Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/edunexus
PORT=3000
NODE_ENV=development
```

## Database Setup

The application uses MongoDB with the following collections:
- `users` - User accounts and profiles
- `courses` - Course information and content
- `orders` - Purchase transactions and payments

## Security Features

- Password hashing with bcryptjs
- Input validation and sanitization
- Role-based access control
- CORS configuration for cross-origin requests

## Error Handling

All endpoints include comprehensive error handling with appropriate HTTP status codes and descriptive error messages.

## Development

To run in development mode with auto-restart:
```bash
npm install nodemon -g
nodemon app.js
```

## Testing

The API can be tested using tools like Postman, Insomnia, or curl commands.

## License

This project is licensed under the MIT License.
