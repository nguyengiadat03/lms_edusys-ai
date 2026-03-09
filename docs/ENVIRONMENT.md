# Environment Variables Reference

Complete reference for all environment variables used in the EduSys AI platform.

## Backend Environment Variables

Location: `backend/.env`

### Required Variables

#### Database Configuration

```bash
# MySQL connection details
DB_HOST=localhost                    # Database host
DB_PORT=3306                        # Database port
DB_USERNAME=root                    # Database user
DB_PASSWORD=your_password           # Database password
DB_DATABASE=edusys_ai_2025_v1      # Database name

# Prisma database URL (auto-constructed from above)
DATABASE_URL="mysql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}"
```

#### JWT Configuration

```bash
# JWT secrets for authentication
JWT_SECRET=your_64_char_secret_here              # Access token secret
JWT_REFRESH_SECRET=your_64_char_refresh_secret   # Refresh token secret
JWT_EXPIRES_IN=24h                               # Token expiration time
```

**Generate strong secrets:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Server Configuration

```bash
NODE_ENV=development                 # Environment: development | production | test
PORT=3001                           # Backend server port
FRONTEND_URL=http://localhost:8080  # Frontend URL (for CORS)
```

### Optional Variables

#### CORS Configuration

```bash
# Additional CORS origins (comma-separated)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080,https://yourdomain.com
```

#### Database Options

```bash
DB_CONNECTION_LIMIT=10              # MySQL connection pool size
DB_TIMEZONE=+00:00                  # Database timezone (UTC recommended)
TENANT_ID=1                         # Default tenant ID
SKIP_DB_TEST=false                  # Skip database connection test on startup
```

#### Redis Configuration

```bash
# Redis for background jobs (optional)
REDIS_URL=redis://localhost:6379
```

#### Email Configuration

```bash
# SMTP settings for email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false                   # true for 465, false for other ports
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=EduSys AI <noreply@edusys.ai>
```

#### AI Services

```bash
# Google Gemini API for AI features
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_AI_API_KEY=your_gemini_api_key_here  # Alternative name

# OpenAI API (if using)
AI_SERVICE_URL=https://api.openai.com/v1
AI_SERVICE_KEY=your_openai_key
```

#### Google Drive Integration

```bash
# Google Drive API credentials
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### File Upload Configuration

```bash
UPLOAD_PATH=./uploads               # File upload directory
MAX_FILE_SIZE=10485760             # Max file size in bytes (10MB)
```

#### Logging

```bash
LOG_LEVEL=info                      # Logging level: error | warn | info | debug
```

#### Development/Testing

```bash
SKIP_AUTH=false                     # Skip authentication (NEVER in production!)
APP_VERSION=1.0.0                   # Application version
```

## Frontend Environment Variables

Location: `.env` (project root)

### Required Variables

```bash
# Backend API URL
VITE_API_URL=http://localhost:3001
```

### Optional Variables

```bash
# Additional frontend configuration
VITE_APP_NAME=EduSys AI
VITE_APP_VERSION=1.0.0
```

## OCR Service Environment Variables

Location: `backend/.env.ocr` or `backend/.env`

### Required Variables

```bash
# OCR service configuration
OCR_PORT=8000
OCR_HOST=localhost
GEMINI_API_KEY=your_gemini_api_key_here
```

### Optional Variables

```bash
# FFmpeg path for video/audio processing
FFMPEG_PATH=./ffmpeg/bin            # Relative or absolute path

# Whisper configuration
WHISPER_ENABLED=false               # Enable Whisper for audio transcription
```

## Environment-Specific Configurations

### Development (.env)

```bash
NODE_ENV=development
LOG_LEVEL=debug
SKIP_DB_TEST=false
SKIP_AUTH=false
FRONTEND_URL=http://localhost:8080
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080
```

### Production (.env.production)

```bash
NODE_ENV=production
LOG_LEVEL=warn
SKIP_DB_TEST=true
SKIP_AUTH=false                     # MUST be false!
FRONTEND_URL=https://yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
DB_CONNECTION_LIMIT=20
```

### Testing (.env.test)

```bash
NODE_ENV=test
LOG_LEVEL=error
SKIP_DB_TEST=false
DB_DATABASE=edusys_ai_test
```

## Security Best Practices

### DO ✅

1. **Use strong secrets**

   ```bash
   # Generate with:
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Keep .env out of version control**

   ```bash
   # Ensure .gitignore includes:
   .env
   .env.local
   .env.*.local
   ```

3. **Use different secrets per environment**
   - Development: One set of secrets
   - Staging: Different set
   - Production: Completely different set

4. **Rotate secrets regularly**
   - JWT secrets: Every 90 days
   - Database passwords: Every 90 days
   - API keys: When compromised

5. **Use environment-specific files**

   ```bash
   .env.development
   .env.staging
   .env.production
   ```

6. **Store production secrets securely**
   - Use secret management services:
     - AWS Secrets Manager
     - Azure Key Vault
     - Google Secret Manager
     - HashiCorp Vault

### DON'T ❌

1. **Never commit .env files**

   ```bash
   # Bad!
   git add .env
   ```

2. **Never use default/example secrets in production**

   ```bash
   # Bad!
   JWT_SECRET=default-secret-change-in-production
   ```

3. **Never share secrets in plain text**
   - Don't send via email
   - Don't post in chat
   - Don't commit to Git

4. **Never use weak secrets**

   ```bash
   # Bad!
   JWT_SECRET=secret123
   DB_PASSWORD=password
   ```

5. **Never enable SKIP_AUTH in production**
   ```bash
   # Bad!
   SKIP_AUTH=true  # NEVER in production!
   ```

## Validation

### Backend Validation

The backend validates environment variables on startup:

```typescript
// backend/src/config/env.ts
export const validateEnv = (): void => {
  // Checks for required variables
  // Prevents unsafe configurations in production
  // Throws error if validation fails
};
```

**Validation Rules:**

- `SKIP_AUTH` must be false in production
- `DB_PASSWORD` must be set in production
- `JWT_SECRET` must be set
- `DATABASE_URL` must be valid

### Manual Validation

```bash
# Check if all required variables are set
cd backend
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL ? '✅ DATABASE_URL set' : '❌ DATABASE_URL missing')"
```

## Troubleshooting

### Variable Not Loading

**Problem:** Environment variable not being read

**Solutions:**

```bash
# 1. Check file exists
ls -la .env

# 2. Check file format (no spaces around =)
# Good: KEY=value
# Bad:  KEY = value

# 3. Restart server after changing .env
npm run dev

# 4. Check for typos in variable name
grep JWT_SECRET .env
```

### Database Connection Failed

**Problem:** `ER_ACCESS_DENIED_ERROR` or `ECONNREFUSED`

**Solutions:**

```bash
# 1. Verify DATABASE_URL format
echo $DATABASE_URL
# Should be: mysql://user:password@host:port/database

# 2. Test MySQL connection
mysql -h localhost -u root -p

# 3. Check credentials match
mysql -u root -p -e "SELECT USER();"
```

### CORS Errors

**Problem:** Frontend can't connect to backend

**Solutions:**

```bash
# 1. Check FRONTEND_URL in backend .env
grep FRONTEND_URL backend/.env

# 2. Check CORS_ALLOWED_ORIGINS
grep CORS_ALLOWED_ORIGINS backend/.env

# 3. Ensure frontend URL matches
echo $VITE_API_URL
```

## Example Files

### backend/.env.example

```bash
# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:8080

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password_here
DB_DATABASE=edusys_ai_2025_v1
DATABASE_URL="mysql://root:your_password_here@localhost:3306/edusys_ai_2025_v1"

# JWT Configuration
JWT_SECRET=generate_with_crypto_randomBytes_64_hex
JWT_REFRESH_SECRET=generate_with_crypto_randomBytes_64_hex
JWT_EXPIRES_IN=24h

# Optional Services
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_gemini_api_key_here
```

### .env.example (Frontend)

```bash
# Backend API URL
VITE_API_URL=http://localhost:3001
```

## Quick Reference

| Variable         | Required | Default       | Description                |
| ---------------- | -------- | ------------- | -------------------------- |
| `NODE_ENV`       | No       | `development` | Environment mode           |
| `PORT`           | No       | `3001`        | Backend port               |
| `DATABASE_URL`   | Yes      | -             | MySQL connection string    |
| `JWT_SECRET`     | Yes      | -             | JWT signing secret         |
| `FRONTEND_URL`   | Yes      | -             | Frontend URL for CORS      |
| `REDIS_URL`      | No       | -             | Redis connection string    |
| `GEMINI_API_KEY` | No       | -             | Google Gemini API key      |
| `VITE_API_URL`   | Yes      | -             | Backend API URL (frontend) |

---

**Last Updated:** March 9, 2026  
**See Also:** [Security Guide](../backend/.env.security-guide.md)
