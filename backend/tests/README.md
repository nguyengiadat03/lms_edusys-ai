# Backend Tests

This directory contains all test files organized by type and domain.

## Directory Structure

### Integration Tests (`integration/`)

Domain-specific integration tests that test API endpoints and services:

- `auth/` - Authentication and authorization tests
- `curriculum/` - Curriculum framework and course tests
- `documents/` - Document management and OCR tests
- `assignments/` - Assignment and practice session tests
- `games/` - Gamification tests
- `system/` - System management and security tests
- `ai/` - AI service integration tests

### End-to-End Tests (`e2e/`)

Full system tests that test multiple domains together:

- API validation tests
- Frontend-backend integration tests
- CORS and endpoint tests

### Fixtures (`fixtures/`)

Test data and sample files:

- Sample PDFs and text files
- Audio files for Whisper testing
- Mock data

## Running Tests

```bash
# Run all tests
npm test

# Run specific domain tests
node tests/integration/auth/test-login-api.js
node tests/integration/curriculum/test-course-api.js

# Run E2E tests
node tests/e2e/test-comprehensive-api-validation.js
```

## Test Organization

Tests are organized by domain to match the application architecture. Each test file should:

- Test a specific feature or API endpoint
- Be independent and not rely on other tests
- Clean up after itself
- Use descriptive names

## Adding New Tests

When adding new tests:

1. Place in the appropriate domain directory
2. Follow naming convention: `test-{feature}-{type}.js`
3. Include clear test descriptions
4. Document any setup requirements
