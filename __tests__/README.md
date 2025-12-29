# Backend Tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
```

## Test Structure

- `__tests__/setup.js` - Test configuration and setup
- `__tests__/auth.test.js` - Authentication API tests
- `__tests__/courses.test.js` - Courses API tests
- `__tests__/mobile/student.test.js` - Mobile student API tests
- `__tests__/middlewares/auth.test.js` - Auth middleware tests
- `__tests__/utils/jwt.test.js` - JWT utility tests
- `__tests__/utils/password.test.js` - Password utility tests
- `__tests__/integration/api.test.js` - Integration tests

## Test Database

Tests use the same database as development. Make sure:
1. Database is running
2. DATABASE_URL is set in .env
3. Test data is cleaned up after tests

## Notes

- Tests create and clean up test data automatically
- Use unique emails (with timestamps) to avoid conflicts
- All passwords in tests use 'password123'
- Tokens expire after 30 days (as configured)















