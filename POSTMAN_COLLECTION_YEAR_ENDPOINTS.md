# Postman Collection Updates - Year-Based Course Endpoints

## Overview
This document describes the new endpoints added to the Postman collection for year-based course filtering.

## New Endpoints Added

### 1. Get Basic Courses by Year
- **Method:** `GET`
- **URL:** `{{base_url}}/mobile/student/courses/basic/by-year`
- **Query Parameters:**
  - `year` (required): Academic year (1, 2, 3, 4, etc.)
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 12)
- **Description:** Returns basic courses (`isBasic: true`) filtered by `targetYear` matching the provided year.
- **Example:**
  ```
  GET /api/mobile/student/courses/basic/by-year?year=1&page=1&limit=12
  ```

### 2. Get Featured Courses by Year
- **Method:** `GET`
- **URL:** `{{base_url}}/mobile/student/courses/featured/by-year`
- **Query Parameters:**
  - `year` (required): Academic year (1, 2, 3, 4, etc.)
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 12)
- **Description:** Returns featured courses (`isFeatured: true`) filtered by `targetYear` matching the provided year.
- **Example:**
  ```
  GET /api/mobile/student/courses/featured/by-year?year=1&page=1&limit=12
  ```

### 3. Get Featured Courses by All Years
- **Method:** `GET`
- **URL:** `{{base_url}}/mobile/student/courses/featured/all-years`
- **Query Parameters:** None
- **Description:** Returns all featured courses grouped by `targetYear`. The response includes:
  - `courses`: Array of all featured courses
  - `coursesByYear`: Object with years as keys and arrays of courses as values
  - `years`: Sorted array of available years
- **Example:**
  ```
  GET /api/mobile/student/courses/featured/all-years
  ```
- **Response Structure:**
  ```json
  {
    "success": true,
    "data": {
      "courses": [...],
      "coursesByYear": {
        "1": [...],
        "2": [...],
        "3": [...],
        "general": [...]
      },
      "years": ["1", "2", "3", "general"]
    }
  }
  ```

## Authentication
All endpoints require:
- **Authentication:** Bearer token (student role)
- **Header:** `Authorization: Bearer {{auth_token}}`

## Testing
1. Import the updated Postman collection: `Backend/LMS_API.postman_collection.json`
2. Set the `base_url` variable to your API URL (e.g., `http://localhost:5005/api`)
3. Login as a student to get the `auth_token`
4. Set the `auth_token` variable
5. Test the new endpoints with different year values

## Related Files
- **Controller:** `Backend/src/controllers/mobile/student/homeController.js`
- **Routes:** `Backend/src/routes/mobile/student/index.js`
- **Postman Collection:** `Backend/LMS_API.postman_collection.json`

## Notes
- All endpoints return full image URLs (not relative paths)
- Courses are filtered by `status: PUBLISHED`
- Purchase status (`isPurchased`) is included in responses for authenticated students
- Average ratings and purchase counts are calculated and included in responses

















