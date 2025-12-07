# LMS Backend System

Complete Learning Management System backend for University use in Kuwait.

## Tech Stack

- **Node.js** with **Express.js**
- **Prisma ORM** with **MySQL** (XAMPP)
- **JWT** for authentication
- **Swagger** for API documentation

## Features

- ✅ Authentication & Authorization (JWT + Refresh Token)
- ✅ Role-based Access Control (Admin, Teacher, Student)
- ✅ Course Management
- ✅ Exam System (MCQ, True/False, Essay)
- ✅ Payment System (Multiple payment methods)
- ✅ Cart & Wishlist
- ✅ Notifications System
- ✅ Support Tickets
- ✅ Reports & Analytics
- ✅ Multi-language Support (Arabic + English)

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials:
   ```
   DATABASE_URL="mysql://root:@localhost:3306/lms_db"
   JWT_SECRET=your-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret-key
   ```

3. **Setup Database**
   - Start XAMPP MySQL
   - Create database: `lms_db`
   - Run migrations:
     ```bash
     npm run prisma:migrate
     ```
   - Seed database:
     ```bash
     npm run prisma:seed
     ```

4. **Start Server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register/student` - Student registration
- `POST /api/auth/register/teacher` - Teacher registration (Admin only)
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Admin API (`/api/admin/*`)
- Dashboard & Analytics
- User Management
- Course Management
- Category Management
- Banner Management
- Payment Management
- Reports (Student, Teacher, Financial)
- Notifications
- Support Tickets

### Student Mobile API (`/api/mobile/student/*`)
- Browse Courses
- Cart Management
- Wishlist
- Payments
- Learning Progress
- Exams
- Ratings

### Teacher Mobile API (`/api/mobile/teacher/*`)
- Course Management
- Course Content
- Exam Management
- Notifications

### Web Frontend API (`/api/web/*`)
- Landing Page Data
- Course Listing
- Categories

### Profile & Settings (`/api/*`)
- Profile Management
- Change Password
- Support Tickets
- Notifications

## Default Credentials

After seeding:
- **Admin**: `admin@lms.edu.kw` / `admin123`
- **Teacher**: `teacher@lms.edu.kw` / `teacher123`
- **Student**: `student@lms.edu.kw` / `student123`

## API Documentation

Swagger documentation available at:
```
http://localhost:5005/api-docs
```

## Database Schema

All models are defined in `prisma/schema.prisma`. Key models:
- Users (Admin, Teacher, Student)
- Courses & Course Content
- Exams & Exam Questions
- Payments & Purchases
- Cart & Wishlist
- Ratings
- Notifications
- Tickets
- Progress Tracking

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database & constants
│   ├── controllers/      # Route controllers
│   ├── middlewares/      # Auth, error handling, upload
│   ├── routes/           # API routes
│   ├── utils/            # JWT, password utilities
│   └── server.js         # Express app entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.js           # Database seeder
└── uploads/              # Uploaded files
```

## Notes

- All text fields support Arabic and English
- File uploads stored in `uploads/` directory
- JWT tokens expire in 15 minutes (access) and 7 days (refresh)
- Payment methods: VISA, MasterCard, KNET, Cash, Bank Transfer, Stripe, PayPal



