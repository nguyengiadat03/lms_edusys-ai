const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

async function testGeminiTask(taskName, taskType, content, fileName = 'test_document.pdf', fileType = 'pdf') {
  console.log(`\n🧪 Testing ${taskName} (${taskType})`);
  console.log('='.repeat(50));

  try {
    // Create a test document first
    const testData = {
      task: taskType,
      content: content,
      file_name: fileName,
      file_type: fileType
    };

    console.log('📤 Sending to Gemini AI...');
    console.log('Content preview:', content.substring(0, 100) + '...');

    // This would normally be called internally, but let's simulate the AI analysis
    const response = await axios.post(`${BASE_URL}/ai/analyze`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ AI Analysis Result:');
      console.log('   - Task:', response.data.task);
      console.log('   - Analysis:', response.data.analysis);
    } else {
      console.log('❌ AI Analysis failed:', response.data.error);
    }

  } catch (error) {
    console.log(`❌ Error testing ${taskName}:`, error.response?.data || error.message);
  }
}

async function runGeminiTests() {
  console.log('🚀 TESTING 4 GEMINI AI TASKS DIRECTLY');
  console.log('=====================================');

  const testContent = `This is a sample English learning document. It contains grammar rules, vocabulary words, and reading comprehension exercises. The document is designed for intermediate level students who want to improve their English skills. It includes various topics such as daily routines, family relationships, and travel vocabulary. The exercises help students practice listening, speaking, reading, and writing skills.`;

  // Test each of the 4 main AI tasks
  await testGeminiTask('AUTO-SUMMARIZE', 'summarize', testContent);
  await testGeminiTask('AUTO-SEGMENT', 'segment', testContent);
  await testGeminiTask('LEVEL SUGGESTION', 'level', testContent);
  await testGeminiTask('TOPIC SUGGESTION', 'topic', testContent);

  console.log('\n🎉 Gemini AI Tasks Testing Complete!');
}

// Test with actual document reprocessing
async function testWithRealDocument() {
  console.log('\n🔄 Testing with REAL DOCUMENT (ID: 17 - Image)');
  console.log('================================================');

  try {
    // Get document info
    const docResponse = await axios.get(`${BASE_URL}/documents/17`);
    const document = docResponse.data.data;

    console.log('📄 Document:', document.original_name);
    console.log('📊 Current AI Analysis:');
    console.log('   - Summary:', document.ai_summary?.substring(0, 100) + '...');
    console.log('   - Segments:', document.ai_segments);
    console.log('   - Level:', document.level);
    console.log('   - Topic:', document.topic);
    console.log('   - Skill:', document.skill);

    // Test reprocessing
    console.log('\n🔄 Reprocessing document...');
    const reprocessResponse = await axios.post(`${BASE_URL}/documents/17/reprocess`);

    if (reprocessResponse.data.success) {
      console.log('✅ Reprocessing successful');
      console.log('📊 New AI Analysis:');
      console.log('   - Summary:', reprocessResponse.data.analysis.summary);
      console.log('   - Segments:', reprocessResponse.data.analysis.segments);
      console.log('   - Level:', reprocessResponse.data.analysis.suggestedLevel);
      console.log('   - Topic:', reprocessResponse.data.analysis.suggestedTopic);
    }

  } catch (error) {
    console.log('❌ Error testing real document:', error.response?.data || error.message);
  }
}

async function main() {
  await runGeminiTests();
  await testWithRealDocument();
}

main().catch(console.error);