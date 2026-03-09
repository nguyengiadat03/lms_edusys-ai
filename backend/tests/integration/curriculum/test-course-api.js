const axios = require("axios");

// Test Course Creation API
async function testCourseCreationAPI() {
  const BASE_URL = "http://localhost:3001/api/v1";
  const TEST_TOKEN = "your_jwt_token_here"; // Replace with actual JWT token

  console.log("🚀 Testing Course Creation API");
  console.log(
    "===============================================================\n"
  );

  // API Endpoint: POST /api/v1/versions/{versionId}/courses
  // Required: title (string)
  // Optional: code, level, hours, order_index, summary, learning_method, state, learning_outcomes, assessment_types

  const requestData = {
    // Required field
    title: "English Conversation B1-B2",

    // Optional fields
    code: "ENG_CONV_B12",
    level: "B1-B2",
    hours: 40,
    order_index: 1,
    summary:
      "Intermediate to upper-intermediate English conversation course focusing on everyday communication skills",

    // Learning method options: 'online', 'offline', 'hybrid', 'blended'
    learning_method: "online",

    // State options: 'draft', 'review', 'approved', 'published', 'archived'
    state: "draft",

    // Arrays of learning outcomes and assessment types
    learning_outcomes: [
      "Can understand main points of clear standard input on familiar matters regularly encountered in work, school, leisure, etc.",
      "Can deal with most situations while travelling in an area where the language is spoken",
      "Can produce simple connected text on topics which are familiar or of personal interest",
      "Can describe experiences and events, dreams, hopes and ambitions",
      "Can briefly give reasons and explanations for opinions and plans",
    ],

    // Assessment types for the course
    assessment_types: [
      "speaking_assessment",
      "conversation_roleplay",
      "presentation",
      "oral_exam",
    ],
  };

  try {
    console.log("📝 API Endpoint: POST /api/v1/versions/{versionId}/courses");
    console.log(
      "🎯 Version ID needed: Get this from curriculum framework versions"
    );
    console.log();

    console.log("📋 Required Request Headers:");
    console.log("   Authorization: Bearer <JWT_TOKEN>");
    console.log("   Content-Type: application/json");
    console.log();

    console.log("📋 Required Input Parameters:");
    console.log(
      "   URL Parameter: versionId (integer) - Curriculum framework version ID"
    );
    console.log();

    console.log("📋 Request Body Fields:");
    console.log("   REQUIRED:");
    console.log("     • title: string (1-255 chars) - Course title");
    console.log();
    console.log("   OPTIONAL:");
    console.log(
      "     • code: string (1-64 chars, uppercase, numbers, hyphen) - Unique course code"
    );
    console.log("     • level: string - Course difficulty level");
    console.log(
      "     • hours: integer (>=0) - Total course hours (default: 0)"
    );
    console.log(
      "     • order_index: integer (>=0) - Display order within version (default: 0)"
    );
    console.log("     • summary: string (<=1000 chars) - Course description");
    console.log(
      '     • learning_method: enum ["online", "offline", "hybrid", "blended"] (default: "online")'
    );
    console.log(
      '     • state: enum ["draft", "review", "approved", "published", "archived"] (default: "draft")'
    );
    console.log(
      "     • learning_outcomes: array of strings - Learning objectives"
    );
    console.log(
      "     • assessment_types: array of strings - Assessment methods"
    );
    console.log();

    console.log("📋 Sample Request JSON:");
    console.log(JSON.stringify(requestData, null, 2));
    console.log();

    // Note: We can't actually call the API without proper authentication
    // and versionId, but we can show the complete request format
    console.log("⚠️  To test this API:");
    console.log("   1. Get a valid JWT token by logging in");
    console.log(
      "   2. Find a curriculum framework version ID (use GET /api/v1/curriculums)"
    );
    console.log("   3. Replace {versionId} in URL with actual version ID");
    console.log("   4. Use the sample JSON above in request body");
    console.log(
      "   5. Make POST request to: http://localhost:3001/api/v1/versions/{versionId}/courses"
    );
    console.log();

    console.log("🔍 How to find versionId for testing:");
    console.log(
      "   GET /api/v1/curriculums - to list available framework versions"
    );
    console.log();

    console.log("✅ Expected Response (201 Created):");
    console.log(`
{
  "id": 123,
  "version_id": 456,
  "code": "ENG_CONV_B12",
  "title": "English Conversation B1-B2",
  "level": "B1-B2",
  "hours": 40,
  "order_index": 1,
  "summary": "Intermediate to upper-intermediate...",
  "learning_outcomes": ["Can understand main points...", "..."],
  "assessment_types": ["speaking_assessment", "conversation_roleplay", "..."],
  "created_at": "2025-01-06T08:15:00.000Z"
}
    `);

    console.log("🎉 Course Creation API Documentation Complete!");
    console.log("📝 Input format ready for testing.");

    return requestData;
  } catch (error) {
    console.error("❌ Error in API test:", error.message);
    throw error;
  }
}

// Run the test
console.log("=========================================");
console.log("COURSE CREATION API TEST DOCUMENTATION");
console.log("=========================================\n");

testCourseCreationAPI()
  .then((sampleData) => {
    console.log("\n📋 Complete API Call Example:");
    console.log(
      `
curl -X POST http://localhost:3001/api/v1/versions/123/courses
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
  -H "Content-Type: application/json"
  -d '` +
        JSON.stringify(sampleData, null, 2) +
        `'
    `
    );
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ API test failed:", error);
    process.exit(1);
  });
