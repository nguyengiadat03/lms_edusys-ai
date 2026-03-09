# Frontend Architecture Refactor - Design Document

## Executive Summary

The frontend has several production-readiness issues:

- **Manual JWT token parsing** in route guards (unsafe, error-prone)
- **Hardcoded user data** ("Sarah Johnson", user ID 163)
- **Mock save functions** in production code
- **No centralized auth state** - components access localStorage directly
- **Weak route protection** - token decoding in App.tsx
- **No user profile management** - user info not fetched or displayed

This refactor will implement proper authentication state management, remove all mock/hardcoded data, and create a production-ready architecture.

## Current State Analysis

### Critical Issues Found

#### 1. Unsafe JWT Token Parsing in Route Guards (CRITICAL)

**Location:** `src/App.tsx:60-75`

```typescript
const RoleBasedRoute = ({ children, allowedRoles }) => {
  const accessToken = authService.getAccessToken();
  if (accessToken) {
    try {
      // Decode token to get user role (simplified - in real app use proper JWT library)
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      const userRole = payload.role;

      if (!allowedRoles.includes(userRole)) {
        return <div>Access Denied</div>;
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      return <LoginPage />;
    }
  }
  return <>{children}</>;
};
```

**Issues:**

- Manual base64 decoding is unsafe and error-prone
- No validation of token signature
- Token parsing repeated in every route guard
- Error handling redirects to login (loses context)
- No centralized user state

**Impact:** HIGH - Security risk, poor UX, maintenance nightmare

#### 2. Hardcoded User Data (CRITICAL)

**Locations:**

- `src/components/layout/Header.tsx:73` - "Sarah Johnson"
- `src/components/layout/Sidebar.tsx:167,199` - "Sarah Johnson"
- `src/services/curriculumService.ts:189` - `owner_user_id: 163`
- `src/components/auth/Login.tsx:18,20` - Test credentials pre-filled

**Issues:**

- All users see "Sarah Johnson" regardless of who logged in
- Mock user ID 163 used in curriculum creation
- Test credentials exposed in production code

**Impact:** HIGH - Confusing UX, data integrity issues

#### 3. Mock Save Function in Production (CRITICAL)

**Location:** `src/services/curriculumService.ts:164-202`

```typescript
async mockSaveCurriculum(curriculumData: any): Promise<...> {
  console.log('🧪 MOCK SAVE: Curriculum data to be saved:', curriculumData);
  await new Promise(resolve => setTimeout(resolve, 1000));
  const mockId = Date.now();
  const mockSavedRecord = {
    id: mockId,
    ...curriculumData,
    owner_user_id: 163, // Mock user
    tenant_id: 1
  };
  return { success: true, message: '...', data: mockSavedRecord };
}
```

**Issues:**

- Mock function in production service
- Doesn't actually save to database
- Uses hardcoded user ID
- Could be called accidentally

**Impact:** HIGH - Data loss risk, confusion

#### 4. No Centralized Auth State (HIGH)

**Location:** Throughout the app

**Current Pattern:**

```typescript
// In App.tsx
const isAuthenticated = authService.isAuthenticated();

// In Header.tsx
await authService.logout();

// In Login.tsx
const response = await authService.login({ email, password });
```

**Issues:**

- No React context for auth state
- Components access localStorage directly
- No centralized user information
- No automatic re-renders on auth state change
- Logout doesn't update UI automatically

**Impact:** HIGH - Poor UX, state management issues

#### 5. Weak API Client Error Handling (MEDIUM)

**Location:** `src/lib/api.ts`

**Issues:**

- Shows toast for all errors (even expected ones)
- No way to suppress error toasts
- No error boundaries
- Inconsistent error response types

**Impact:** MEDIUM - Poor error UX

#### 6. No User Profile Fetching (MEDIUM)

**Location:** App initialization

**Issues:**

- User information not fetched on app load
- Only token stored, no user data
- Can't display user name, role, or avatar
- Can't implement proper role-based UI

**Impact:** MEDIUM - Limited functionality

## Proposed Solution

### 1. Authentication Context Architecture

#### Create AuthContext (`src/contexts/AuthContext.tsx`)

```typescript
interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  tenant_id: number;
  campus_id?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getAccessToken();
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          // Token invalid, clear it
          authService.logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const hasRole = (roles: string[]) => {
    return user ? roles.includes(user.role) : false;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 2. Improved Route Guards

#### ProtectedRoute Component

```typescript
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>; // Or a proper loading component
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

#### RoleBasedRoute Component

```typescript
const RoleBasedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasRole(allowedRoles)) {
    return <AccessDenied requiredRoles={allowedRoles} />;
  }

  return <>{children}</>;
};
```

### 3. Updated Login Flow

#### Login Component

```typescript
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);

      // Redirect to intended destination or default
      const from = location.state?.from?.pathname || "/curriculum-management";
      navigate(from, { replace: true });

      toast({ title: "Login successful" });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ... form JSX (without pre-filled test credentials)
  );
};
```

### 4. Updated Header with Real User Data

#### Header Component

```typescript
const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      showSuccess('Logged out successfully');
    } catch (error) {
      showError('Logout failed');
    }
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header>
      {/* ... other header content */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Avatar>
              <AvatarFallback>{user ? getInitials(user.full_name) : 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <span>{user?.full_name || 'User'}</span>
              <span>{user?.role || 'Role'}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        {/* ... dropdown content */}
      </DropdownMenu>
    </header>
  );
};
```

### 5. Remove Mock Functions

#### Updated curriculumService.ts

```typescript
export const curriculumService = {
  // ... other methods
  // REMOVE mockSaveCurriculum entirely
  // Use createCurriculum instead
};
```

### 6. API Client Improvements

#### Updated api.ts

```typescript
class ApiClient {
  // ... existing code

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    suppressErrorToast = false, // Add option to suppress toast
  ): Promise<T> {
    // ... existing code

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: ApiError = {
        message: errorData.message || "An error occurred",
        code: errorData.code || "UNKNOWN_ERROR",
        details: errorData.details,
      };

      // Only show toast if not suppressed
      if (!suppressErrorToast) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }

      throw error;
    }

    // ... rest of code
  }
}
```

### 7. Folder Structure

```
src/
├── contexts/                 # NEW: React contexts
│   └── AuthContext.tsx      # Authentication context
├── components/
│   ├── auth/
│   │   ├── Login.tsx        # Updated: use AuthContext
│   │   ├── ProtectedRoute.tsx    # NEW: Route guard
│   │   ├── RoleBasedRoute.tsx    # NEW: Role guard
│   │   └── AccessDenied.tsx      # NEW: Access denied page
│   ├── layout/
│   │   ├── Header.tsx       # Updated: show real user
│   │   ├── Sidebar.tsx      # Updated: show real user
│   │   └── MainLayout.tsx
│   └── ui/                  # shadcn/ui components
├── hooks/
│   ├── useAuth.ts           # NEW: Auth hook (re-export from context)
│   └── use-toast.ts
├── lib/
│   ├── api.ts               # Updated: better error handling
│   └── utils.ts
├── pages/
│   ├── LoginPage.tsx        # Updated: use AuthContext
│   └── ...
├── services/
│   ├── authService.ts       # Keep as is (API calls only)
│   ├── curriculumService.ts # Updated: remove mock
│   └── ...
├── App.tsx                  # Updated: wrap with AuthProvider
└── main.tsx
```

## Implementation Plan

### Phase 1: Create Auth Context (2 hours) - SAFE

1. Create `src/contexts/AuthContext.tsx`
2. Create `src/hooks/useAuth.ts` (re-export)
3. Wrap App with AuthProvider in `main.tsx`
4. Test that app still works

### Phase 2: Update Route Guards (1 hour) - SAFE

1. Create `src/components/auth/ProtectedRoute.tsx`
2. Create `src/components/auth/RoleBasedRoute.tsx`
3. Create `src/components/auth/AccessDenied.tsx`
4. Update `App.tsx` to use new components
5. Test route protection

### Phase 3: Update Login Flow (1 hour) - SAFE

1. Update `src/components/auth/Login.tsx` to use useAuth
2. Remove pre-filled test credentials
3. Implement redirect after login
4. Test login/logout flow

### Phase 4: Update UI with Real User Data (1 hour) - SAFE

1. Update `src/components/layout/Header.tsx` to use useAuth
2. Update `src/components/layout/Sidebar.tsx` to use useAuth
3. Test that user info displays correctly

### Phase 5: Remove Mock Code (30 minutes) - SAFE

1. Remove `mockSaveCurriculum` from `curriculumService.ts`
2. Remove hardcoded user ID 163
3. Search and remove any other mock code
4. Test that curriculum creation still works

### Phase 6: API Client Improvements (1 hour) - SAFE

1. Add `suppressErrorToast` option to API client
2. Improve error types
3. Add error boundary component
4. Test error handling

**Total Time: 6.5 hours**

## Risk Assessment

### Low Risk

- All changes are additive or improve existing code
- No breaking changes to API contracts
- Backward compatible during migration
- Can be tested incrementally

### Mitigation

- Keep old code until new code is tested
- Test each phase independently
- Use feature flags if needed
- Comprehensive manual testing

## Success Criteria

- [ ] AuthContext implemented and working
- [ ] Route guards use AuthContext (no manual JWT parsing)
- [ ] Login flow uses AuthContext
- [ ] Header shows logged-in user's name and role
- [ ] Sidebar shows logged-in user's information
- [ ] No hardcoded user data in code
- [ ] No mock functions in production code
- [ ] Logout clears state and redirects
- [ ] Role-based access control works
- [ ] All existing functionality still works
