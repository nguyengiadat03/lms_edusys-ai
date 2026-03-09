const mysql = require('mysql2/promise');

async function checkDocument157() {
  const config = {
    host: '45.32.100.86',
    port: 3306,
    user: 'root',
    password: 'Tepa@123456',
    database: 'edusys_ai_2025_v1',
    connectTimeout: 5000,
  };

  console.log('🔍 Checking document 156 in database...');
  console.log('=====================================\n');

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database\n');

    // Check if document exists
    console.log('1️⃣ Checking if document 156 exists...');
    const [docRows] = await connection.execute(
      'SELECT id, name, ocr_text, created_at FROM documents WHERE id = ?',
      [156]
    );

    if (docRows.length === 0) {
      console.log('❌ Document 156 not found\n');
      return;
    }

    const doc = docRows[0];
    console.log('✅ Document found:');
    console.log(`   ID: ${doc.id}`);
    console.log(`   Name: ${doc.name}`);
    console.log(`   Created: ${doc.created_at}`);
    console.log(`   Has ocr_text: ${!!doc.ocr_text}`);
    console.log('');

    // Check all columns in documents table
    console.log('2️⃣ Checking all columns in documents table...');
    try {
      const [columns] = await connection.execute('DESCRIBE documents');
      console.log('Available columns:');
      columns.forEach(col => {
        console.log(`   - ${col.Field}: ${col.Type}`);
      });
      console.log('');
    } catch (e) {
      console.log('❌ Could not get table structure\n');
    }

    // Check OCR status based on AI tasks
    console.log('3️⃣ Checking OCR status...');
    const [ocrTasks] = await connection.execute(
      'SELECT COUNT(*) as ocr_tasks FROM document_ai_tasks WHERE document_id = ? AND task_type IN ("ocr", "ocr_process")',
      [156]
    );

    const totalOCRTaks = ocrTasks[0].ocr_tasks;
    const [completedOCRTaks] = await connection.execute(
      'SELECT COUNT(*) as completed_ocr_tasks FROM document_ai_tasks WHERE document_id = ? AND task_type IN ("ocr", "ocr_process") AND status = "completed"',
      [156]
    );

    const hasCompletedOCR = completedOCRTaks[0].completed_ocr_tasks > 0;
    console.log(`   Total OCR tasks: ${totalOCRTaks}`);
    console.log(`   Completed OCR tasks: ${completedOCRTaks[0].completed_ocr_tasks}`);
    console.log(`   OCR Status: ${hasCompletedOCR ? '✅ Đã xử lý' : '❌ Chưa xử lý'}`);
    console.log(`   Has OCR text: ${!!doc.ocr_text}`);
    console.log('');

    // Check OCR text
    if (doc.ocr_text) {
      console.log('4️⃣ OCR text preview...');
      console.log(`   Length: ${doc.ocr_text.length} characters`);
      console.log(`   Preview: ${doc.ocr_text.substring(0, 200)}...`);
      console.log('');
    }

    // Check AI tasks table
    console.log('5️⃣ Checking document_ai_tasks table...');
    const [taskRows] = await connection.execute(
      'SELECT COUNT(*) as total_tasks FROM document_ai_tasks'
    );

    const totalTasks = taskRows[0].total_tasks;
    console.log(`   Total AI tasks in database: ${totalTasks}`);

    if (totalTasks > 0) {
      const [docTasks] = await connection.execute(
        'SELECT id, task_type, status, output_json, created_at FROM document_ai_tasks WHERE document_id = ? ORDER BY created_at DESC',
        [156]
      );

      console.log(`   AI tasks for document 156: ${docTasks.length}`);

      if (docTasks.length > 0) {
        docTasks.forEach((task, index) => {
          console.log(`   ${index + 1}. ${task.task_type} (${task.status})`);
          console.log(`      Created: ${task.created_at}`);
          console.log(`      Output: ${JSON.stringify(task.output_json, null, 2)}`);
          console.log('');
        });
      }
    } else {
      console.log('   ❌ No AI tasks found in database');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Connection closed');
    }
  }
}

checkDocument157();