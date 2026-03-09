#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function runMissingMigration() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
    database: process.env.DB_DATABASE,
    multipleStatements: true,
    connectTimeout: 30000,
  };

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection established');

    // Run the core missing tables migration
    const migrationPath = path.join(__dirname, 'migrations', '005-core-missing-tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 Running core missing tables migration...');
    await connection.query(sql);
    console.log('✅ Core missing tables migration completed');

    // Run the document sharing permissions migration
    const sharingPath = path.join(__dirname, 'migrations', '430-document-library-sharing-permissions.sql');
    const sharingSql = fs.readFileSync(sharingPath, 'utf8');
    
    console.log('🔄 Running document sharing permissions migration...');
    await connection.query(sharingSql);
    console.log('✅ Document sharing permissions migration completed');

    // Check final table count
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()');
    console.log(`📊 Final table count: ${rows[0].count}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMissingMigration();