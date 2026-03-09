# Development Guide

Guide for developers working on the EduSys AI platform.

## Development Workflow

### Daily Development

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install any new dependencies
npm install
cd backend && npm install && cd ..

# 3. Start backend (terminal 1)
cd backend
npm run dev

# 4. Start frontend (terminal 2)
npm run dev

# 5. Make your changes
# 6. Test your changes
# 7. Commit and push
```

### Starting Services

**Recommended startup order:**

1. **MySQL** (should already be running)
2. **Redis** (optional, for background jobs)
3. **Backend** (`cd backend && npm run dev`)
4. **Frontend** (`npm run dev`)
5. **OCR Service** (optional, `cd backend && python ocr_service.py`)

### Hot Reload

Both frontend and backend support hot reload:

- **Frontend:** Vite HMR - changes reflect immediately
- **Backend:** ts-node-dev - server restarts on file changes

## Project Structure

### Frontend Structure

```
src/
├── components/          # Reusable components
│   ├── ui/             # Base UI (shadcn/ui)
│   ├── auth/           # Auth components
│   ├── layout/         # Layout (Header, Sidebar)
│   └── curriculum/     # Domain components
├── pages/              # Page components
├── services/           # API clients
├── lib/                # Utilities
├── hooks/              # Custom hooks
└── types/              # TypeScript types
```

### Backend Structure

```
backend/src/
├── config/             # Configuration
├── middleware/         # Express middleware
├── routes/             # API routes
├── services/           # Business logic
├── utils/              # Utilities
└── server.ts           # Entry point
```

## Coding Standards

### TypeScript

**Use strict TypeScript:**

```typescript
// ✅ Good - explicit types
interface User {
  id: number;
  email: string;
  role: string;
}

function getUser(id: number): Promise<User> {
  // ...
}

// ❌ Bad - implicit any
function getUser(id) {
  // ...
}
```

**Avoid any:**

```typescript
// ✅ Good
const data: unknown = JSON.parse(response);
if (isUser(data)) {
  // Type guard
}

// ❌ Bad
const data: any = JSON.parse(response);
```

### React Components

**Use functional components:**

```typescript
// ✅ Good
export function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);
  // ...
}

// ❌ Bad - class components
export class UserProfile extends React.Component {
  // ...
}
```

**Use hooks properly:**

```typescript
// ✅ Good
function useUser(userId: number) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => userService.getUser(userId),
  });
}

// ❌ Bad - hooks in conditions
if (condition) {
  const user = useUser(userId); // Error!
}
```

### API Routes

**Follow RESTful conventions:**

```typescript
// ✅ Good
GET    /api/v1/users           // List users
POST   /api/v1/users           // Create user
GET    /api/v1/users/:id       // Get user
PATCH  /api/v1/users/:id       // Update user
DELETE /api/v1/users/:id       // Delete user

// ❌ Bad
GET    /api/v1/getUsers
POST   /api/v1/createUser
```

**Use proper HTTP status codes:**

```typescript
// ✅ Good
res.status(200).json({ data: users }); // Success
res.status(201).json({ data: newUser }); // Created
res.status(400).json({ error: "Invalid" }); // Bad request
res.status(401).json({ error: "Unauthorized" }); // Auth required
res.status(404).json({ error: "Not found" }); // Not found
res.status(500).json({ error: "Server error" }); // Server error

// ❌ Bad
res.json({ success: false, error: "Not found" }); // Always 200
```

### Error Handling

**Backend:**

```typescript
// ✅ Good - use error handler
import { createError } from "../middleware/errorHandler";

throw createError("User not found", "USER_NOT_FOUND", 404);

// ❌ Bad - throw raw errors
throw new Error("User not found");
```

**Frontend:**

```typescript
// ✅ Good - handle errors
try {
  const user = await userService.getUser(id);
  setUser(user);
} catch (error) {
  toast.error("Failed to load user");
  console.error(error);
}

// ❌ Bad - ignore errors
const user = await userService.getUser(id);
setUser(user);
```

## Database Development

### Prisma Workflow

**Making schema changes:**

```bash
# 1. Edit prisma/schema.prisma
# 2. Generate migration
npx prisma migrate dev --name add_user_avatar

# 3. Migration is created and applied
# 4. Prisma client is regenerated
```

**Resetting database (development only):**

```bash
npx prisma migrate reset
```

**Viewing database:**

```bash
npx prisma studio
```

### Writing Queries

**Use Prisma's type-safe queries:**

```typescript
// ✅ Good - type-safe
const user = await prisma.users.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    full_name: true,
  },
});

// ❌ Bad - raw SQL (unless necessary)
const user = await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`;
```

**Avoid N+1 queries:**

```typescript
// ✅ Good - single query with include
const frameworks = await prisma.curriculum_frameworks.findMany({
  include: {
    courses: {
      include: {
        units: true,
      },
    },
  },
});

// ❌ Bad - N+1 queries
const frameworks = await prisma.curriculum_frameworks.findMany();
for (const framework of frameworks) {
  framework.courses = await prisma.courses.findMany({
    where: { framework_id: framework.id },
  });
}
```

## Testing

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
npm test

# Specific test file
npm test -- UserService.test.ts
```

### Writing Tests

**Backend (Jest):**

```typescript
describe("UserService", () => {
  it("should create a user", async () => {
    const userData = {
      email: "test@example.com",
      password: "password123",
    };

    const user = await userService.createUser(userData);

    expect(user.email).toBe(userData.email);
    expect(user.id).toBeDefined();
  });
});
```

**Frontend (React Testing Library):**

```typescript
import { render, screen } from '@testing-library/react';
import { UserProfile } from './UserProfile';

test('renders user profile', () => {
  render(<UserProfile userId={1} />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

## Debugging

### Backend Debugging

**Using console.log:**

```typescript
console.log("User data:", user);
console.error("Error:", error);
```

**Using Winston logger:**

```typescript
import { logger } from "./utils/logger";

logger.info("User logged in", { userId: user.id });
logger.error("Failed to create user", { error: error.message });
logger.debug("Request body", { body: req.body });
```

**VS Code debugging:**

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/backend",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Frontend Debugging

**React DevTools:**

- Install React DevTools browser extension
- Inspect component props and state
- Profile component performance

**Browser DevTools:**

- Console: View logs and errors
- Network: Inspect API requests
- Sources: Set breakpoints

**TanStack Query DevTools:**

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

## Common Tasks

### Adding a New API Endpoint

1. **Create route handler:**

```typescript
// backend/src/routes/users.ts
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const user = await userService.getUser(req.params.id);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
});
```

2. **Create service method:**

```typescript
// backend/src/services/userService.ts
export async function getUser(id: string) {
  const user = await prisma.users.findUnique({
    where: { id: BigInt(id) },
  });
  if (!user) {
    throw createError("User not found", "USER_NOT_FOUND", 404);
  }
  return user;
}
```

3. **Add frontend service:**

```typescript
// src/services/userService.ts
export const userService = {
  async getUser(id: number) {
    return apiClient.get<User>(`/users/${id}`);
  },
};
```

4. **Use in component:**

```typescript
// src/components/UserProfile.tsx
const { data: user, isLoading } = useQuery({
  queryKey: ["user", userId],
  queryFn: () => userService.getUser(userId),
});
```

### Adding a Database Table

1. **Update Prisma schema:**

```prisma
// backend/prisma/schema.prisma
model user_preferences {
  id         BigInt   @id @default(autoincrement())
  user_id    BigInt
  theme      String   @default("light")
  language   String   @default("en")
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  user       users    @relation(fields: [user_id], references: [id])

  @@index([user_id])
}
```

2. **Create migration:**

```bash
npx prisma migrate dev --name add_user_preferences
```

3. **Use in code:**

```typescript
const preferences = await prisma.user_preferences.findUnique({
  where: { user_id: userId },
});
```

### Adding a New Page

1. **Create page component:**

```typescript
// src/pages/SettingsPage.tsx
export function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      {/* ... */}
    </div>
  );
}
```

2. **Add route:**

```typescript
// src/App.tsx
<Route path="/settings" element={<SettingsPage />} />
```

3. **Add navigation:**

```typescript
// src/components/layout/Sidebar.tsx
<Link to="/settings">Settings</Link>
```

## Performance Optimization

### Frontend

**Code splitting:**

```typescript
// ✅ Good - lazy load pages
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

<Suspense fallback={<Loading />}>
  <Route path="/settings" element={<SettingsPage />} />
</Suspense>
```

**Memoization:**

```typescript
// ✅ Good - memoize expensive calculations
const sortedUsers = useMemo(() => {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}, [users]);
```

**Debouncing:**

```typescript
// ✅ Good - debounce search input
const debouncedSearch = useDebouncedValue(searchTerm, 300);
```

### Backend

**Database queries:**

```typescript
// ✅ Good - select only needed fields
const users = await prisma.users.findMany({
  select: {
    id: true,
    email: true,
    full_name: true,
  },
});

// ❌ Bad - select all fields
const users = await prisma.users.findMany();
```

**Caching:**

```typescript
// ✅ Good - cache frequently accessed data
const cachedUser = await redis.get(`user:${userId}`);
if (cachedUser) {
  return JSON.parse(cachedUser);
}
const user = await prisma.users.findUnique({ where: { id: userId } });
await redis.set(`user:${userId}`, JSON.stringify(user), "EX", 3600);
return user;
```

## Git Workflow

### Branch Naming

```bash
feature/add-user-preferences
bugfix/fix-login-error
hotfix/security-patch
refactor/improve-auth-service
```

### Commit Messages

```bash
# ✅ Good
feat: add user preferences page
fix: resolve login redirect issue
refactor: improve error handling in auth service
docs: update API documentation

# ❌ Bad
update
fix bug
changes
```

### Pull Request Process

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Create pull request
5. Code review
6. Address feedback
7. Merge to main

## Useful Commands

### Backend

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm start                # Start production server

# Database
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Create and apply migration
npx prisma migrate reset # Reset database (dev only)
npx prisma studio        # Open Prisma Studio

# Testing
npm test                 # Run tests
npm run lint             # Run ESLint
```

### Frontend

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm test                 # Run tests
npm run lint             # Run ESLint
```

## Resources

### Documentation

- [React Docs](https://react.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Express Docs](https://expressjs.com/)
- [Vite Docs](https://vitejs.dev/)

### Tools

- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [Postman](https://www.postman.com/) - API testing
- [React DevTools](https://react.dev/learn/react-developer-tools) - React debugging

---

**Last Updated:** March 9, 2026
