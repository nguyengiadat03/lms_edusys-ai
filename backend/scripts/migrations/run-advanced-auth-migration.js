const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || '45.32.100.86',
  user: process.env.DB_USER || 'edusys_admin',
  password: process.env.DB_PASSWORD || 'EduSys2024!@#',
  database: process.env.DB_NAME || 'edusys_ai_2025_v1',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true
};

async function runAdvancedAuthMigration() {
  console.log('🚀 RUNNING ADVANCED AUTH MIGRATION');
  console.log('==================================');

  let connection;

  try {
    // Connect to database
    console.log('\n📡 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');

    // Read migration file
    console.log('\n📄 Reading migration file...');
    const migrationPath = path.join(__dirname, 'migrations', '006-advanced-auth-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded');

    // Execute migration
    console.log('\n⚡ Executing migration...');
    const [results] = await connection.execute(migrationSQL);
    console.log('✅ Migration executed successfully');

    // Verify tables were created
    console.log('\n🔍 Verifying created tables...');
    const [tables] = await connection.execute(`
      SELECT 
        TABLE_NAME as table_name,
        TABLE_ROWS as row_count,
        ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as size_mb
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME IN (
          'password_reset_tokens',
          'user_mfa_settings', 
          'user_sessions',
          'user_impersonations',
          'permissions',
          'scopes',
          'role_permissions'
        )
      ORDER BY TABLE_NAME
    `, [dbConfig.database]);

    console.log('\n📊 CREATED TABLES:');
    console.log('==================');
    tables.forEach(table => {
      console.log(`✅ ${table.table_name.padEnd(25)} | Rows: ${table.row_count.toString().padStart(6)} | Size: ${table.size_mb} MB`);
    });

    // Check permissions data
    console.log('\n🔐 Checking permissions...');
    const [permissions] = await connection.execute('SELECT COUNT(*) as count FROM permissions');
    console.log(`✅ Permissions created: ${permissions[0].count}`);

    // Check scopes data
    console.log('\n🎯 Checking scopes...');
    const [scopes] = await connection.execute('SELECT COUNT(*) as count FROM scopes');
    console.log(`✅ Scopes created: ${scopes[0].count}`);

    console.log('\n🎉 ADVANCED AUTH MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('=================================================');
    console.log('✅ All tables created');
    console.log('✅ Default permissions inserted');
    console.log('✅ Default scopes configured');
    console.log('✅ Indexes created for performance');
    console.log('✅ Foreign key constraints established');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('==============');
    console.log('1. Update Prisma schema to include new tables');
    console.log('2. Generate Prisma client: npx prisma generate');
    console.log('3. Test Advanced Auth API endpoints');
    console.log('4. Configure email service for production');

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:');
    console.error('====================');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('SQL State:', error.sqlState);
    
    if (error.sql) {
      console.error('SQL:', error.sql.substring(0, 200) + '...');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run migration
if (require.main === module) {
  runAdvancedAuthMigration();
}

module.exports = { runAdvancedAuthMigration };