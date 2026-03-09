# Frontend Architecture Refactor - Executive Summary

## Problem Statement

The frontend has critical production-readiness issues:

1. **Unsafe JWT token parsing** - Manual base64 decoding in route guards (security risk)
2. **Hardcoded user data** - "Sarah Johnson" shown to all users, user ID 163 hardcoded
3. **Mock save function** - `mockSaveCurriculum` in production code (data loss risk)
4. **No centralized auth state** - Components access localStorage directly
5. **Weak route protection** - Token decoding repeated in every guard
6. **No user profile** - User information not fetched or displayed

## Impact

- **Security**: Manual JWT parsing is unsafe and error-prone
- **UX**: All users see "Sarah Johnson" regardless of who logged in
- **Data Integrity**: Mock save function doesn't actually save data
- **Maintainability**: Auth logic scattered across components
- **Functionality**: Can't implement proper role-based UI

## Proposed Solution

### 1. Authentication Context (Core Fix)

Implement React Context for centralized auth state:

- Store user information (not just tokens)
- Provide `useAuth()` hook for easy access
- Automatic user profile fetching on app load
- Centralized login/logout logic

### 2. Improved Route Guards

Replace unsafe token parsing with context-based guards:

- `ProtectedRoute` - checks authentication
- `RoleBasedRoute` - checks roles via context
- No manual JWT decoding
- Proper loading states

### 3. Real User Data in UI

Update Header and Sidebar to show actual user:

- Display logged-in user's name
- Display logged-in user's role
- Show user initials in avatar
- Update on login/logout

### 4. Remove Mock Code

Clean up production code:

- Delete `mockSaveCurriculum` function
- Remove hardcoded user ID 163
- Remove pre-filled test credentials
- Remove hardcoded "Sarah Johnson"

### 5. Better Error Handling

Improve API client:

- Option to suppress error toasts
- Better TypeScript types
- Error boundary component
- Consistent error states

## Implementation Timeline

| Phase               | Duration      | Risk | Description                 |
| ------------------- | ------------- | ---- | --------------------------- |
| 1. Auth Context     | 2 hours       | LOW  | Create context and provider |
| 2. Route Guards     | 1 hour        | LOW  | New guard components        |
| 3. Login Flow       | 1 hour        | LOW  | Update login to use context |
| 4. UI Updates       | 1 hour        | LOW  | Show real user data         |
| 5. Remove Mocks     | 30 min        | LOW  | Delete mock code            |
| 6. API Improvements | 1 hour        | LOW  | Better error handling       |
| **Total**           | **6.5 hours** |      |                             |

## Benefits

### Immediate Benefits

- Secure authentication (no manual JWT parsing)
- Users see their actual name and role
- No risk of mock save function being called
- Centralized auth logic

### Long-term Benefits

- Easier to add new auth features
- Better developer experience
- Proper role-based UI
- Maintainable codebase
- Production-ready code

## Before & After

### Before: Unsafe Route Guard

```typescript
// App.tsx - UNSAFE!
const RoleBasedRoute = ({ children, allowedRoles }) => {
  const accessToken = authService.getAccessToken();
  try {
    // Manual JWT parsing - UNSAFE!
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    const userRole = payload.role;
    if (!allowedRoles.includes(userRole)) {
      return <div>Access Denied</div>;
    }
  } catch (error) {
    return <LoginPage />;
  }
  return <>{children}</>;
};
```

### After: Safe Route Guard

```typescript
// Uses AuthContext - SAFE!
const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!hasRole(allowedRoles)) return <AccessDenied />;

  return <>{children}</>;
};
```

### Before: Hardcoded User

```typescript
// Header.tsx - WRONG!
<span>Sarah Johnson</span>
<span>Academic Director</span>
```

### After: Real User

```typescript
// Header.tsx - CORRECT!
const { user } = useAuth();
<span>{user?.full_name}</span>
<span>{user?.role}</span>
```

### Before: Mock Save

```typescript
// curriculumService.ts - DANGEROUS!
async mockSaveCurriculum(data: any) {
  console.log('🧪 MOCK SAVE');
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, data: { id: Date.now(), owner_user_id: 163 } };
}
```

### After: Real Save

```typescript
// curriculumService.ts - CORRECT!
async createCurriculum(data: CreateCurriculumRequest) {
  return apiClient.post<CurriculumFramework>('/kct', data);
}
// Mock function deleted entirely
```

## Risk Assessment

### Low Risk (All Phases)

- Changes are additive and improve existing code
- No breaking changes to API contracts
- Can be tested incrementally
- Easy to rollback if needed

### Mitigation Strategy

1. Test each phase independently
2. Keep old code until new code is validated
3. Comprehensive manual testing
4. Use feature flags if needed

## Recommended Approach

**Start with Phase 1 (Auth Context)** - This is the foundation for all other improvements.

Once Auth Context is working:

- Phase 2-4 can be done in any order
- Phase 5-6 are quick wins

**All phases are low risk and can be done incrementally.**

## Next Steps

1. **Review this spec** - Ensure approach aligns with team goals
2. **Start Phase 1** - Create AuthContext (2 hours, safe)
3. **Test thoroughly** - Verify login/logout works
4. **Continue phases 2-6** - Each phase builds on the previous
5. **Deploy** - All changes are production-ready

## Files to Create/Modify

### New Files (3)

- `src/contexts/AuthContext.tsx` - Auth context and provider
- `src/components/auth/ProtectedRoute.tsx` - Route guard
- `src/components/auth/RoleBasedRoute.tsx` - Role guard
- `src/components/auth/AccessDenied.tsx` - Access denied page

### Modified Files (6)

- `src/App.tsx` - Use new route guards
- `src/main.tsx` - Wrap with AuthProvider
- `src/components/auth/Login.tsx` - Use useAuth hook
- `src/components/layout/Header.tsx` - Show real user
- `src/components/layout/Sidebar.tsx` - Show real user
- `src/services/curriculumService.ts` - Remove mock function

### Deleted Code

- `mockSaveCurriculum` function (40 lines)
- Manual JWT parsing code (15 lines)
- Hardcoded user data (multiple locations)
- Pre-filled test credentials

## Success Metrics

- [ ] Zero manual JWT parsing in code
- [ ] Zero hardcoded user data
- [ ] Zero mock functions in production
- [ ] User sees their actual name and role
- [ ] Login/logout works correctly
- [ ] Route protection works correctly
- [ ] Role-based access control works
- [ ] All existing functionality preserved

## Questions?

**Q: Will this break existing functionality?**
A: No, all changes are improvements to existing code. API contracts remain the same.

**Q: Can we do this incrementally?**
A: Yes, each phase is independent and can be tested separately.

**Q: What if something goes wrong?**
A: Easy to rollback - just revert the commits. No database changes involved.

**Q: How do we test?**
A: Manual testing after each phase: login, logout, navigate, check user display.

## Recommendation

**Start with Phase 1 (Auth Context) immediately.** This is:

- **Safe** (low risk, additive change)
- **Quick** (2 hours)
- **High value** (foundation for all other improvements)
- **Non-breaking** (existing code continues to work)

After Phase 1 success, proceed with remaining phases. Total time investment is only 6.5 hours for a significantly more production-ready frontend.
