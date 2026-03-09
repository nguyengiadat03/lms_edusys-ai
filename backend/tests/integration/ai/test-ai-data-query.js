const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAIDocumentQuery() {
  try {
    console.log('🧪 TESTING AI DOCUMENT DATA QUERY');
    console.log('=====================================\n');

    // Test specific document ID 157
    console.log('🎯 Checking AI tasks for document ID: 157');
    const documentId = BigInt(157);

    // First check if document exists
    const document = await prisma.documents.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        name: true,
        ocr_text: true,
        summary: true,
        ai_tags: true,
        created_at: true
      }
    });

    if (!document) {
      console.log('❌ Document 157 does not exist\n');
      return;
    }

    console.log('📄 Document exists:');
    console.log(`   Name: ${document.name}`);
    console.log(`   Created: ${document.created_at}`);
    console.log(`   Has OCR text: ${!!document.ocr_text}`);
    console.log(`   Has summary: ${!!document.summary}`);
    console.log(`   Has AI tags: ${!!document.ai_tags}`);
    console.log('');

    // Now check AI tasks
    const docTasks = await prisma.document_ai_tasks.findMany({
      where: { document_id: documentId },
      orderBy: { created_at: 'desc' }
    });

    console.log(`Found ${docTasks.length} AI tasks for document 157:\n`);

    if (docTasks.length === 0) {
      console.log('❌ No AI tasks found for document 157\n');

      // Check if there are any AI tasks at all
      const totalTasks = await prisma.document_ai_tasks.count();
      console.log(`Total AI tasks in database: ${totalTasks}\n`);

      // Check recent tasks
      const recentTasks = await prisma.document_ai_tasks.findMany({
        take: 3,
        orderBy: { created_at: 'desc' },
        include: {
          documents: {
            select: { id: true, name: true }
          }
        }
      });

      console.log('Recent AI tasks:');
      recentTasks.forEach((task, index) => {
        console.log(`${index + 1}. Doc ${task.documents?.id} (${task.documents?.name}): ${task.task_type} - ${task.status}`);
      });
      console.log('');

    } else {
      docTasks.forEach((task, index) => {
        console.log(`${index + 1}. Task ID: ${task.id}`);
        console.log(`   Task Type: ${task.task_type}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Created: ${task.created_at}`);
        console.log(`   Finished: ${task.finished_at || 'Not finished'}`);
        console.log(`   Output JSON:`);
        console.log(`   ${JSON.stringify(task.output_json, null, 2)}`);
        console.log('');
      });
    }

    // Test 1: Get all AI tasks
    console.log('1️⃣ Getting all AI tasks...');
    const allTasks = await prisma.document_ai_tasks.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        documents: {
          select: {
            id: true,
            name: true,
            ocr_text: true
          }
        }
      }
    });

    console.log(`Found ${allTasks.length} AI tasks:\n`);
    allTasks.forEach((task, index) => {
      console.log(`${index + 1}. Task ID: ${task.id}`);
      console.log(`   Document: ${task.documents?.name || 'Unknown'}`);
      console.log(`   Task Type: ${task.task_type}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Created: ${task.created_at}`);
      console.log(`   Output JSON (first 200 chars): ${JSON.stringify(task.output_json).substring(0, 200)}...`);
      console.log('');
    });

    // Test 2: Get specific task types
    console.log('2️⃣ Getting summarize tasks...');
    const summarizeTasks = await prisma.document_ai_tasks.findMany({
      where: { task_type: 'summarize' },
      take: 3,
      orderBy: { created_at: 'desc' }
    });

    console.log(`Found ${summarizeTasks.length} summarize tasks:\n`);
    summarizeTasks.forEach((task, index) => {
      console.log(`${index + 1}. Task ID: ${task.id}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Output: ${JSON.stringify(task.output_json, null, 2)}`);
      console.log('');
    });

    // Test 3: Get tasks for a specific document
    console.log('3️⃣ Getting tasks for first document...');
    if (allTasks.length > 0) {
      const documentId = allTasks[0].document_id;
      const docTasks = await prisma.document_ai_tasks.findMany({
        where: { document_id: documentId },
        orderBy: { created_at: 'desc' }
      });

      console.log(`Document ${documentId} has ${docTasks.length} AI tasks:\n`);
      docTasks.forEach((task, index) => {
        console.log(`${index + 1}. ${task.task_type}: ${task.status}`);
        console.log(`   Output: ${JSON.stringify(task.output_json)}`);
        console.log('');
      });
    }

    // Test 4: Check output_json structure
    console.log('4️⃣ Analyzing output_json structure...');
    const completedTasks = await prisma.document_ai_tasks.findMany({
      where: { status: 'completed' },
      take: 10
    });

    console.log(`Analyzing ${completedTasks.length} completed tasks:\n`);
    completedTasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.task_type}:`);
      try {
        const output = task.output_json;
        if (typeof output === 'object') {
          console.log(`   Keys: ${Object.keys(output).join(', ')}`);
          if (output.result) {
            console.log(`   Result: ${typeof output.result === 'string' ? output.result.substring(0, 100) + '...' : JSON.stringify(output.result)}`);
          }
        } else {
          console.log(`   Raw output: ${JSON.stringify(output).substring(0, 100)}...`);
        }
      } catch (e) {
        console.log(`   Error parsing: ${e.message}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error testing AI document query:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAIDocumentQuery();