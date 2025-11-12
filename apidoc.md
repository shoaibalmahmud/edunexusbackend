# EduNexus Backend API Documentation

This document highlights the newly added teacher review feature and related endpoints. All routes are prefixed from the Express configuration shown in `app.js`. The relevant base path is `/api/teachers`.

## Teacher Statistics

- **Endpoint**: `GET /api/teachers/:teacherId/stats`
- **Description**: Returns summary information for a specific teacher, including profile details, total students, number of active courses, and aggregated rating statistics.
- **Path Parameters**:
  - `teacherId` (string, ObjectId): The teacher’s MongoDB identifier.
- **Success Response** (`200 OK`):
  ```json
  {
    "teacher": {
      "id": "657d4f...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "profileImage": "https://...",
      "bio": "...",
      "subjects": ["Mathematics"],
      "experience": 5
    },
    "stats": {
      "totalStudents": 120,
      "activeCourses": 4,
      "averageRating": 4.62,
      "reviewCount": 21
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request` if `teacherId` is not a valid ObjectId.
  - `404 Not Found` when the teacher does not exist or is not a teacher role.

## Teacher Reviews – List

- **Endpoint**: `GET /api/teachers/:teacherId/reviews`
- **Description**: Fetches all reviews left for the specified teacher along with the current rating summary.
- **Success Response** (`200 OK`):
  ```json
  {
    "rating": {
      "average": 4.5,
      "count": 10
    },
    "reviews": [
      {
        "_id": "6580f2...",
        "student": {
          "_id": "657f1a...",
          "name": "John Smith",
          "profileImage": "https://..."
        },
        "course": {
          "_id": "657e9b...",
          "title": "Algebra Foundations"
        },
        "rating": 5,
        "comment": "Great teacher!",
        "createdAt": "2025-11-11T09:15:30.000Z"
      }
    ]
  }
  ```
- **Error Responses**:
  - `400 Bad Request` for invalid `teacherId`.
  - `404 Not Found` if the teacher is missing or not a teacher role.

## Teacher Reviews – Create / Update

- **Endpoint**: `POST /api/teachers/:teacherId/reviews`
- **Description**: Allows a student to submit or update a review for a teacher’s course. Each student may have at most one review per teacher; submitting again replaces the existing review.
- **Request Body** (`application/json`):
  ```json
  {
    "studentId": "657f1a...",
    "courseId": "657e9b...",
    "rating": 4,
    "comment": "Engaging sessions with clear explanations."
  }
  ```
- **Validation Rules**:
  - `studentId`, `courseId`, and `teacherId` must be valid ObjectIds.
  - `rating` is required and must be between 1 and 5.
  - The referenced course must belong to the teacher.
  - The student must have the `student` role and be enrolled in the course.
- **Success Response** (`201 Created`):
  ```json
  {
    "message": "Review submitted successfully",
    "rating": {
      "average": 4.4,
      "count": 12
    },
    "reviews": [
      {
        "_id": "6580f2...",
        "student": {
          "_id": "657f1a...",
          "name": "John Smith",
          "profileImage": "https://..."
        },
        "course": {
          "_id": "657e9b...",
          "title": "Algebra Foundations"
        },
        "rating": 4,
        "comment": "Engaging sessions with clear explanations.",
        "createdAt": "2025-11-12T07:45:12.000Z"
      }
      // ... existing code ...
    ]
  }
  ```
- **Error Responses**:
  - `400 Bad Request` for invalid identifiers or rating.
  - `403 Forbidden` if the student is not of role `student` or not enrolled in the course.
  - `404 Not Found` if the teacher or course does not exist or they do not match.

## Courses With Ratings

- **Endpoint**: `GET /api/courses`
- **Description**: Returns a paginated list of all published and active courses. Each course document already contains its rating summary directly on the `rating` property (average and review count).
- **Query Parameters** (optional):
  - `subject`, `level`, `teacherId`, `minPrice`, `maxPrice` – filters for courses.
  - `search` – full-text search keyword.
  - `page`, `limit` – pagination controls (defaults: `page=1`, `limit=10`).
- **Success Response** (`200 OK`):
  ```json
  {
    "courses": [
      {
        "_id": "657e9b...",
        "title": "Algebra Foundations",
        "description": "...",
        "teacher": {
          "_id": "657d4f...",
          "name": "Jane Doe",
          "email": "jane@example.com",
          "profileImage": "https://...",
          "bio": "...",
          "subjects": ["Mathematics"],
          "experience": 5
        },
        "price": 199,
        "duration": 30,
        "rating": {
          "average": 4.5,
          "count": 12
        },
        "tags": ["math", "algebra"],
        "isPublished": true,
        "isActive": true
        // ... other course fields ...
      }
    ],
    "pagination": {
      "current": 1,
      "total": 4,
      "hasNext": true,
      "hasPrev": false
    }
  }
  ```
- **Notes**:
  - Other course endpoints in `routes/courses.js` (e.g. `GET /api/courses/:id`, `/api/courses/search/*`, `/api/courses/student/:studentId`) also return the `rating` object for each course.
  - The rating structure mirrors the schema: `rating.average` (0–5) and `rating.count` (number of reviews). Update logic lives in `course.addReview`.

## Notes

- All teacher review data persists on the `User` model inside `teacherReviews` and `teacherRating`.
- Re-submitting a review from the same student overrides their previous rating and comment, ensuring the average stays in sync.
- Use standard authentication/authorization middleware as required by your deployment; the endpoints above assume role validation happens prior to or within these handlers.


