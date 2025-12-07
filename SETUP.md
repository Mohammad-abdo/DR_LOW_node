# Setup Instructions

## Prerequisites
- Node.js (v18 or higher)
- XAMPP (MySQL)
- npm or yarn

## Step-by-Step Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Database
1. Start XAMPP
2. Start MySQL service
3. Open phpMyAdmin (http://localhost/phpmyadmin)
4. Create a new database named `lms_db`

### 3. Configure Environment
1. Copy `.env.example` to `.env` (already created)
2. Update `DATABASE_URL` if your MySQL credentials are different:
   ```
   DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/lms_db"
   ```

### 4. Run Database Migrations
```bash
npm run prisma:generate
npm run prisma:migrate
```

When prompted, name your migration: `init`

### 5. Seed Database
```bash
npm run prisma:seed
```

This will create:
- Super Admin (admin@lms.edu.kw / admin123)
- Sample Teacher (teacher@lms.edu.kw / teacher123)
- Sample Student (student@lms.edu.kw / student123)
- Default Categories

### 6. Start Development Server
```bash
npm run dev
```

Server will run on `http://localhost:5005`

### 7. Access API Documentation
Open browser: `http://localhost:5005/api-docs`

## Testing the API

### Login as Admin
```bash
POST http://localhost:5005/api/auth/login
Content-Type: application/json

{
  "email": "admin@lms.edu.kw",
  "password": "admin123",
  "role": "ADMIN"
}
```

### Login as Teacher
```bash
POST http://localhost:5005/api/auth/login
Content-Type: application/json

{
  "email": "teacher@lms.edu.kw",
  "password": "teacher123",
  "role": "TEACHER"
}
```

### Login as Student
```bash
POST http://localhost:5005/api/auth/login
Content-Type: application/json

{
  "email": "student@lms.edu.kw",
  "password": "student123",
  "role": "STUDENT"
}
```

## Troubleshooting

### Database Connection Error
- Ensure MySQL is running in XAMPP
- Check database name matches in `.env`
- Verify MySQL credentials

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using port 5005

### Prisma Errors
- Run `npm run prisma:generate` again
- Check `DATABASE_URL` in `.env`
- Ensure database exists

## Next Steps

1. Update the dashboard frontend to connect to these APIs
2. Configure payment gateway credentials (Stripe/PayPal) if needed
3. Set up production environment variables
4. Configure file upload storage (consider cloud storage for production)



