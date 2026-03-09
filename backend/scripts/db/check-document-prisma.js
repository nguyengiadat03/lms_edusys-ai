const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDocumentWithPrisma() {
  try {
    console.log('🔍 Checking document with Prisma...');
    console.log('=====================================\n');

    // Lấy thông tin document cơ bản
    const document = await prisma.documents.findUnique({
      where: { id: BigInt(211) },
      include: {
        users_documents_created_byTousers: {
          select: {
            full_name: true,
            email: true
          }
        },
        document_ai_tasks: {
          orderBy: { created_at: 'desc' }
        },
        document_tags: {
          include: { tags: true }
        }
      }
    });

    if (!document) {
      console.log('❌ Document not found, creating sample document...\n');

      // Create sample document: Speaking 2_2025 (May-August).docx
      const sampleDoc = await prisma.documents.create({
        data: {
          name: "Speaking 2_2025 (May-August).docx",
          mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          file_size: BigInt(2097152), // 2.0 MB in bytes
          level: "B1",
          skill: "IELTS, Speaking Practice",
          topic: "Daily Habits",
          created_at: new Date("2025-11-04T00:00:00.000Z"),
          updated_at: new Date("2025-11-04T00:00:00.000Z"),
          created_by: BigInt(1),
          updated_by: BigInt(1)
        },
        include: {
          users_documents_created_byTousers: {
            select: {
              full_name: true,
              email: true
            }
          },
          document_ai_tasks: {
            orderBy: { created_at: 'desc' }
          },
          document_tags: {
            include: { tags: true }
          }
        }
      });

      console.log('✅ Sample document created successfully!\n');
      return checkDocumentWithPrisma(); // Recursively check the created document
    }

    // Tính file size
    const fileSizeMB = document.file_size ? (Number(document.file_size) / (1024 * 1024)).toFixed(1) + ' MB' : 'Unknown';

    // Check OCR status dựa trên AI tasks - chỉ xét status = completed
    const hasCompletedOCR = document.document_ai_tasks.some(
      task => task.status === 'completed'
    );

    // Parse AI analysis results
    const aiTasks = document.document_ai_tasks;
    const summary = aiTasks.find(t => t.task_type === 'summarize')?.output_json?.result || '';
    const segments = aiTasks.find(t => t.task_type === 'segment')?.output_json?.result || [];
    const level = aiTasks.find(t => t.task_type === 'level_suggestion')?.output_json?.result || '';
    const topic = aiTasks.find(t => t.task_type === 'topic_suggestion')?.output_json?.result || '';
    const tagSuggestions = aiTasks.find(t => t.task_type === 'tag_suggestion')?.output_json?.suggested_tags || [];

    // Hiển thị theo format yêu cầu
    console.log('Document details, metadata, and AI analysis results\n');
    console.log('Thông tin cơ bản');
    console.log(`Kích thước: ${fileSizeMB}`);
    console.log(`Upload: ${document.created_at}`);
    console.log(`Người upload: ${document.users_documents_created_byTousers?.full_name || 'Current User'}`);
    console.log(`OCR: ${hasCompletedOCR ? '✅ Đã xử lý' : '❌ Chưa xử lý'}`);
    console.log('');

    console.log('Thông tin phân loại');
    console.log(`${level}`);
    console.log(`${tagSuggestions.slice(0, 2).map(t => typeof t === 'string' ? t : t.tag_label).join(', ')}`);
    console.log(`Chủ đề: ${topic}`);
    console.log('');

    // Hiển thị tags
    const allTags = [
      ...tagSuggestions.map(t => typeof t === 'string' ? t : t.tag_label),
      ...document.document_tags.map(dt => dt.tags.name)
    ];
    allTags.forEach(tag => console.log(tag));

    console.log('');
    console.log(`Kết quả phân tích AI (${aiTasks.length} tác vụ)`);
    console.log('📝 Tóm tắt AI');
    console.log(summary);
    console.log('');

    console.log('📚 Phân đoạn tự động (AI)');
    console.log(`${segments.length} phần`);
    segments.forEach((segment, index) => {
      console.log(`${index + 1}.`);
      console.log(segment);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocumentWithPrisma();
