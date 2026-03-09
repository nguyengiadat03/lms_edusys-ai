/*
  Run all SQL migrations in this folder in ascending filename order.
  After each file, perform lightweight FK and index checks and collect a JSON report.
*/
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const migrationsDir = __dirname;
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.toLowerCase().endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
    database: process.env.DB_DATABASE,
    multipleStatements: true,
    connectTimeout: 15000,
  };

  const out = { files: [], summary: '' };
  let hadError = false;

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    // Ensure current schema for info_schema queries
    await conn.query('SET NAMES utf8mb4');
  } catch (e) {
    out.summary = `Không kết nối được DB: ${e.message}`;
    console.log(JSON.stringify(out, null, 2));
    process.exit(1);
  }

  for (const fname of files) {
    const filePath = path.join(migrationsDir, fname);
    const sql = fs.readFileSync(filePath, 'utf8');
    const rec = { filename: fname, status: 'success', error: null, fk_index_checks: [] };

    // Extract tables created in this file for focused checks
    const createdTables = [];
    const ctRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?\s*\(/gi;
    let m;
    while ((m = ctRegex.exec(sql)) !== null) {
      createdTables.push(m[1]);
    }

    try {
      await conn.query(sql);
    } catch (e) {
      rec.status = 'failure';
      rec.error = (e && e.message ? e.message : String(e)).substring(0, 500);
      hadError = true;
    }

    // FK check: confirm information_schema query works and list FK counts for created tables
    try {
      if (createdTables.length > 0) {
        const [fkRows] = await conn.query(
          `SELECT TABLE_NAME, COUNT(*) AS fk_count
           FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = DATABASE()
             AND CONSTRAINT_TYPE = 'FOREIGN KEY'
             AND TABLE_NAME IN (${createdTables.map(() => '?').join(',')})
           GROUP BY TABLE_NAME`,
          createdTables
        );
        const totalFk = fkRows.reduce((s, r) => s + Number(r.fk_count || 0), 0);
        rec.fk_index_checks.push({ type: 'FK', result: `OK (${totalFk} constraints)` });
      } else {
        rec.fk_index_checks.push({ type: 'FK', result: 'OK (no new tables)' });
      }
    } catch (e) {
      rec.fk_index_checks.push({ type: 'FK', result: `Lỗi: ${e.message.substring(0, 300)}` });
      hadError = true;
    }

    // INDEX check: attempt SHOW INDEX for each created table
    try {
      if (createdTables.length > 0) {
        let idxIssues = 0;
        for (const t of createdTables) {
          try {
            const [idx] = await conn.query(`SHOW INDEX FROM \`${t}\``);
            // Presence of any index (incl. PRIMARY) counts as OK per table
            if (!Array.isArray(idx)) idxIssues++;
          } catch (inner) {
            idxIssues++;
          }
        }
        rec.fk_index_checks.push({
          type: 'INDEX',
          result: idxIssues === 0 ? 'OK' : `Có lỗi khi kiểm tra ${idxIssues} bảng`,
        });
        if (idxIssues > 0) hadError = true;
      } else {
        rec.fk_index_checks.push({ type: 'INDEX', result: 'OK (no new tables)' });
      }
    } catch (e) {
      rec.fk_index_checks.push({ type: 'INDEX', result: `Lỗi: ${e.message.substring(0, 300)}` });
      hadError = true;
    }

    out.files.push(rec);
  }

  out.summary = hadError ? 'Có lỗi trong quá trình apply/kiểm tra một số file' : 'OK';
  console.log(JSON.stringify(out, null, 2));
  await conn.end();
}

main().catch((e) => {
  const out = { files: [], summary: `Lỗi không mong muốn: ${e.message}` };
  console.log(JSON.stringify(out, null, 2));
  process.exit(1);
});

