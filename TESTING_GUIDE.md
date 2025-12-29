# Testing Guide

## Backend Tests

### Setup
1. Install dependencies:
```bash
cd Backend
npm install
```

2. Create test database (optional, can use same DB):
```bash
# Create .env.test file
cp .env.test.example .env.test
# Edit .env.test with test database credentials
```

3. Run tests:
```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Test Structure
```
Backend/
├── __tests__/
│   ├── setup.js              # Test setup and configuration
│   ├── auth.test.js          # Authentication tests
│   ├── courses.test.js       # Courses API tests
│   ├── mobile/
│   │   └── student.test.js  # Mobile student API tests
│   ├── middlewares/
│   │   └── auth.test.js      # Auth middleware tests
│   └── utils/
│       ├── jwt.test.js       # JWT utility tests
│       └── password.test.js  # Password utility tests
```

### Writing Tests

**Example Test:**
```javascript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/server.js';

describe('Feature Name', () => {
  beforeAll(async () => {
    // Setup test data
  });

  afterAll(async () => {
    // Cleanup test data
  });

  it('should do something', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .set('Authorization', 'Bearer token');
    
    expect(response.status).toBe(200);
  });
});
```

## Frontend Tests

### Setup
1. Install dependencies:
```bash
cd Frontend
npm install
```

2. Run tests:
```bash
npm test              # Run all tests
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage
```

### Test Structure
```
Frontend/
├── src/
│   └── __tests__/
│       ├── setup.js              # Test setup
│       ├── App.test.jsx          # App component tests
│       ├── components/
│       │   └── Button.test.jsx   # Button component tests
│       └── lib/
│           └── api.test.js       # API configuration tests
```

### Writing Tests

**Example Test:**
```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Component from '../Component';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Test Coverage Goals

- **Backend:** 80%+ coverage
- **Frontend:** 70%+ coverage
- **Critical paths:** 100% coverage

## Running Specific Tests

```bash
# Backend - Run specific test file
npm test -- auth.test.js

# Frontend - Run specific test file
npm test -- Button.test.jsx

# Backend - Run tests matching pattern
npm test -- --testNamePattern="login"

# Frontend - Run tests matching pattern
npm test -- -t "button"
```

## Continuous Integration

Tests should be run:
- Before committing code
- In CI/CD pipeline
- Before deploying to production

## Common Issues

1. **Database connection errors:**
   - Ensure test database exists
   - Check DATABASE_URL in .env.test

2. **Token expiration:**
   - Use test tokens with longer expiration
   - Or mock token verification

3. **Async operations:**
   - Always use `await` in tests
   - Use `beforeAll`/`afterAll` for setup/cleanup

4. **Mocking:**
   - Mock external services
   - Mock database operations if needed
   - Mock API calls in frontend tests















