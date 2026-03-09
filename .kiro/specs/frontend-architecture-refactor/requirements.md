# Frontend Architecture Refactor - Requirements

## Overview

Improve the frontend architecture to be more production-ready, secure, and maintainable by addressing authentication weaknesses, removing mock code, and implementing proper state management.

## User Stories

### 1. As a developer, I want secure authentication state management

**Acceptance Criteria:**

- Centralized auth context with React Context API
- No manual JWT token parsing in components
- Proper user state management
- Automatic token refresh handling
- Secure logout flow

### 2. As a developer, I want proper route protection

**Acceptance Criteria:**

- Centralized route guard components
- Role-based access control without manual token decoding
- Redirect to login on authentication failure
- Preserve intended destination after login

### 3. As a developer, I want clean API client architecture

**Acceptance Criteria:**

- Consistent error handling
- Proper TypeScript types for all API responses
- No hardcoded fallback URLs in production
- Centralized API configuration

### 4. As a developer, I want production-ready code

**Acceptance Criteria:**

- No mock save functions in production code
- No hardcoded user IDs or test credentials
- No hardcoded user names in UI
- Proper loading and error states

### 5. As a developer, I want better React Query usage

**Acceptance Criteria:**

- Consistent query key patterns
- Proper cache invalidation
- Loading and error states handled consistently
- Optimistic updates where appropriate

### 6. As a user, I want to see my actual profile information

**Acceptance Criteria:**

- Header shows logged-in user's name and role
- Sidebar shows logged-in user's information
- User can access their profile settings
- User information updates across the app

## Technical Requirements

### Authentication & Authorization

- Implement AuthContext with React Context API
- Store user information in context, not just tokens
- Implement useAuth hook for easy access
- Remove manual JWT decoding from components
- Implement proper role checking

### Route Protection

- Create ProtectedRoute component using AuthContext
- Create RoleBasedRoute component using AuthContext
- Implement redirect after login
- Handle unauthorized access gracefully

### API Client Improvements

- Remove hardcoded API fallback URLs
- Implement proper error boundaries
- Add request/response interceptors
- Improve TypeScript types

### Code Cleanup

- Remove mockSaveCurriculum function
- Remove hardcoded user ID (163)
- Remove hardcoded user names ("Sarah Johnson")
- Remove test credentials from production code
- Move test utilities to separate test files

### State Management

- Implement user profile fetching on app load
- Cache user information properly
- Implement logout with state cleanup
- Handle token expiration gracefully

## Out of Scope

- Complete UI redesign
- Backend API changes
- Database schema changes
- Performance optimization (separate task)

## Success Metrics

- Zero hardcoded user data in production code
- Zero mock functions in production code
- Centralized authentication state
- Proper role-based access control
- User sees their actual profile information
