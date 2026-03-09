# Backend Scripts

This directory contains development and maintenance scripts organized by purpose.

## Directory Structure

### Database Scripts (`db/`)

Scripts for database inspection, validation, and testing:

- `check-*.js` - Database structure and data validation scripts
- `compare-*.js` - Schema comparison scripts
- `test-db*.js` - Database connection and query tests
- `test-prisma*.js` - Prisma ORM tests

### Debug Scripts (`debug/`)

Debugging and diagnostic scripts:

- `debug-*.js` - Domain-specific debugging utilities

### Migration Scripts (`migrations/`)

Database migration and schema update scripts:

- `run-*.js` - Migration execution scripts
- `migrate-*.js` - Database migration utilities
- `expand-*.js` - Schema expansion scripts
- `update-*.js` - Schema update utilities

### Seed Scripts (`seed/`)

Database seeding and test data generation:

- `seed-*.js` - Domain-specific seed data
- `create-test-user.js` - Test user creation
- `populate_*.mjs` - Data population scripts
- `setup_*.sql` - SQL setup scripts

### Validation Scripts (`validation/`)

Implementation and data validation:

- `validate-*.js` - Feature implementation validation

### Cleanup Scripts (`cleanup/`)

Data cleanup and maintenance:

- `clear-*.js` - Data cleanup utilities

## Usage

### Database Scripts

```bash
# Check database connection
node scripts/db/test-db-connection.js

# Validate schema
node scripts/db/check-prisma-models.js

# Compare schema with database
node scripts/db/compare-schema-database.js
```

### Migration Scripts

```bash
# Run migrations
node scripts/migrations/run-migration.bat

# Expand database
node scripts/migrations/expand-database.js
```

### Seed Scripts

```bash
# Seed sample data
node scripts/seed/seed-sample-data.js

# Create test user
node scripts/seed/create-test-user.js
```

### Validation Scripts

```bash
# Validate implementation
node scripts/validation/validate-advanced-auth-implementation.js
```

## Best Practices

1. **Idempotent**: Scripts should be safe to run multiple times
2. **Documented**: Include clear comments and usage instructions
3. **Error Handling**: Handle errors gracefully
4. **Logging**: Provide clear output about what the script is doing
5. **Dry Run**: Consider adding a `--dry-run` flag for destructive operations

## Adding New Scripts

When adding new scripts:

1. Place in the appropriate category directory
2. Follow naming convention: `{action}-{feature}.js`
3. Add usage documentation at the top of the file
4. Update this README if adding a new category
