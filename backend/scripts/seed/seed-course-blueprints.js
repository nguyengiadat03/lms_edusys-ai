const mysql = require("mysql2/promise");

async function seedCourseBlueprints() {
  const config = {
    host: "45.32.100.86",
    port: 3306,
    user: "root",
    password: "Tepa@123456",
    database: "edusys_ai_2025_v1",
    connectTimeout: 5000,
  };

  let connection;

  try {
    connection = await mysql.createConnection(config);
    console.log("✅ Connected to database: edusys_ai_2025_v1");

    // First, get an existing version_id from curriculum_framework_versions
    console.log("\n🔍 Checking for available curriculum_framework_versions...");
    const [versions] = await connection.execute(
      `SELECT id, framework_id, version_no
       FROM curriculum_framework_versions
       WHERE deleted_at IS NULL
       ORDER BY id DESC
       LIMIT 1`
    );

    if (versions.length === 0) {
      throw new Error(
        "No curriculum framework versions found. Please create at least one version first."
      );
    }

    const versionId = versions[0].id;
    const frameworkId = versions[0].framework_id;
    console.log(
      `📚 Using version ID ${versionId} (version ${versions[0].version_no}) from framework ${frameworkId}`
    );

    // Delete all existing course_blueprints records
    console.log("\n🗑️ Deleting existing course_blueprints records...");
    const [deleteResult] = await connection.execute(
      "DELETE FROM course_blueprints"
    );
    console.log(`✅ Deleted ${deleteResult.affectedRows} existing records`);

    // Sample language course data
    const courseData = [
      {
        code: "ENG101",
        title: "Basic English Communication",
        level: "Foundation",
        hours: 45,
        order_index: 1,
        learning_method: "online",
        state: "published",
        summary:
          "Fundamental English communication skills for daily conversations and basic writing.",
        learning_outcomes: JSON.stringify([
          "Communicate in basic English for everyday situations",
          "Write simple sentences and paragraphs",
          "Understand basic English grammar and vocabulary",
        ]),
        assessment_types: JSON.stringify(["oral_presentation", "written_test"]),
      },
      {
        code: "ENG102",
        title: "Intermediate English for Professionals",
        level: "Intermediate",
        hours: 60,
        order_index: 2,
        learning_method: "hybrid",
        state: "approved",
        summary:
          "Advanced English communication skills for business and professional contexts.",
        learning_outcomes: JSON.stringify([
          "Conduct business meetings and negotiations in English",
          "Write professional emails and reports",
          "Present ideas and projects in academic/professional English",
        ]),
        assessment_types: JSON.stringify(["presentation", "case_study"]),
      },
      {
        code: "ENG103",
        title: "Advanced English Academic Writing",
        level: "Advanced",
        hours: 75,
        order_index: 3,
        learning_method: "blended",
        state: "draft",
        summary:
          "Master advanced English writing techniques for academic and research purposes.",
        learning_outcomes: JSON.stringify([
          "Write research papers and academic essays",
          "Critically analyze and synthesize information in English",
          "Use advanced vocabulary and complex sentence structures",
        ]),
        assessment_types: JSON.stringify(["research_paper", "peer_review"]),
      },
      {
        code: "KOR101",
        title: "Basic Korean Language",
        level: "Foundation",
        hours: 50,
        order_index: 4,
        learning_method: "offline",
        state: "published",
        summary:
          "Introduction to Korean alphabet, basic grammar, and everyday conversations.",
        learning_outcomes: JSON.stringify([
          "Read and write Hangul (Korean alphabet)",
          "Use basic Korean grammar and vocabulary",
          "Engage in simple conversations about daily life",
        ]),
        assessment_types: JSON.stringify([
          "vocabulary_test",
          "conversation_practice",
        ]),
      },
      {
        code: "KOR102",
        title: "Intermediate Korean Culture and Language",
        level: "Intermediate",
        hours: 65,
        order_index: 5,
        learning_method: "hybrid",
        state: "approved",
        summary:
          "Understanding Korean culture while advancing language proficiency.",
        learning_outcomes: JSON.stringify([
          "Discuss Korean culture and social norms",
          "Use polite speech levels appropriately",
          "Write longer compositions about cultural topics",
        ]),
        assessment_types: JSON.stringify([
          "cultural_presentation",
          "written_essay",
        ]),
      },
      {
        code: "CHI101",
        title: "Basic Mandarin Chinese",
        level: "Foundation",
        hours: 55,
        order_index: 6,
        learning_method: "online",
        state: "published",
        summary:
          "Learn Mandarin Chinese characters, pronunciation, and basic communication.",
        learning_outcomes: JSON.stringify([
          "Master basic Chinese characters and Pinyin",
          "Understand tones and pronunciation",
          "Communicate in simple Chinese conversations",
        ]),
        assessment_types: JSON.stringify([
          "character_test",
          "pronunciation_exam",
        ]),
      },
      {
        code: "CHI102",
        title: "Intermediate Chinese Business Communication",
        level: "Intermediate",
        hours: 70,
        order_index: 7,
        learning_method: "blended",
        state: "draft",
        summary:
          "Advanced Chinese language skills for business and professional communication.",
        learning_outcomes: JSON.stringify([
          "Conduct business conversations in Chinese",
          "Write Chinese business emails and documents",
          "Understand Chinese business culture and etiquette",
        ]),
        assessment_types: JSON.stringify([
          "business_case_study",
          "email_writing",
        ]),
      },
      {
        code: "JAP101",
        title: "Basic Japanese Language",
        level: "Foundation",
        hours: 50,
        order_index: 8,
        learning_method: "offline",
        state: "approved",
        summary:
          "Introduction to Hiragana, Katakana, basic Kanji, and Japanese grammar.",
        learning_outcomes: JSON.stringify([
          "Read and write Hiragana and Katakana",
          "Understand basic Japanese sentence structure",
          "Use polite greetings and basic conversations",
        ]),
        assessment_types: JSON.stringify(["kana_quiz", "situation_roleplay"]),
      },
      {
        code: "VIE101",
        title: "Vietnamese for Beginners",
        level: "Foundation",
        hours: 40,
        order_index: 9,
        learning_method: "online",
        state: "published",
        summary:
          "Basic Vietnamese language skills including pronunciation and everyday phrases.",
        learning_outcomes: JSON.stringify([
          "Master Vietnamese pronunciation and tones",
          "Use basic Vietnamese vocabulary and phrases",
          "Understand simple Vietnamese grammar structure",
        ]),
        assessment_types: JSON.stringify([
          "pronunciation_practice",
          "vocabulary_drill",
        ]),
      },
      {
        code: "VIE102",
        title: "Advanced Vietnamese Literature and Culture",
        level: "Advanced",
        hours: 80,
        order_index: 10,
        learning_method: "hybrid",
        state: "review",
        summary:
          "Deep exploration of Vietnamese literature, poetry, and cultural expressions.",
        learning_outcomes: JSON.stringify([
          "Analyze Vietnamese literature and poetry",
          "Discuss complex cultural and social topics in Vietnamese",
          "Write creative compositions in literary Vietnamese",
        ]),
        assessment_types: JSON.stringify([
          "literary_analysis",
          "creative_writing",
        ]),
      },
    ];

    // Insert the sample course blueprints
    console.log("\n📝 Inserting 10 new course_blueprints records...");

    for (let i = 0; i < courseData.length; i++) {
      const course = courseData[i];

      const [result] = await connection.execute(
        `INSERT INTO course_blueprints (
          version_id,
          code,
          title,
          level,
          hours,
          order_index,
          summary,
          learning_method,
          state,
          learning_outcomes,
          assessment_types,
          created_by,
          updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          versionId,
          course.code,
          course.title,
          course.level,
          course.hours,
          course.order_index,
          course.summary,
          course.learning_method,
          course.state,
          course.learning_outcomes,
          course.assessment_types,
          1, // created_by (assuming admin user)
          1, // updated_by (assuming admin user)
        ]
      );

      console.log(
        `✅ Inserted course "${course.title}" with ID: ${result.insertId}`
      );
    }

    // Verify the records were created
    console.log("\n🔍 Verifying course_blueprints records...");
    const [verifyResult] = await connection.execute(
      `SELECT id, code, title, level, hours
       FROM course_blueprints
       WHERE version_id = ?
       ORDER BY order_index`,
      [versionId]
    );

    console.log(`📊 Total courses created: ${verifyResult.length}`);
    console.log("\n📋 Created courses:");
    verifyResult.forEach((course, index) => {
      console.log(
        `   ${index + 1}. ${course.code} - ${course.title} (${course.hours}h, ${
          course.level
        })`
      );
    });

    console.log("\n🎉 Course blueprints seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

seedCourseBlueprints();
