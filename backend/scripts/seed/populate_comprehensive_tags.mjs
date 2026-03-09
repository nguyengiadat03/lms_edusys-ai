import mysql from "mysql2/promise";

const connectionConfig = {
  host: "45.32.100.86",
  port: 3306,
  user: "edu",
  password: "EduStrongPass!2025",
  database: "edusys_ai_2025_v1",
  multipleStatements: true,
};

const tagsData = [
  // Topic/Audience tags
  { name: "Business", category: "topic", color: "#3B82F6" },
  { name: "Academic", category: "topic", color: "#8B5CF6" },
  { name: "Kids", category: "audience", color: "#F59E0B" },
  { name: "Professional", category: "audience", color: "#6366F1" },
  { name: "Language Learning", category: "purpose", color: "#06B6D4" },

  // Skill tags
  { name: "Communication", category: "skill", color: "#10B981" },
  { name: "Foundation", category: "skill", color: "#F97316" },
  { name: "Beginner", category: "skill", color: "#06B6D4" },
  { name: "Conversation", category: "skill", color: "#84CC16" },
  { name: "Presentation", category: "skill", color: "#EC4899" },

  // Language tags
  { name: "English", category: "language", color: "#000000" },
  { name: "Japanese", category: "language", color: "#EF4444" },

  // Preparation tags
  { name: "IELTS", category: "certificate", color: "#14B8A6" },
  { name: "TOEFL", category: "certificate", color: "#A855F7" },
  { name: "Exam Preparation", category: "purpose", color: "#EF4444" },

  // Subject tags
  { name: "Culture", category: "topic", color: "#A855F7" },
  { name: "Technology", category: "topic", color: "#10B981" },
  { name: "Grammar", category: "skill", color: "#8B5CF6" },
  { name: "Vocabulary", category: "skill", color: "#3B82F6" },
];

const frameworkTagMappings = {
  // English frameworks
  "EN-BASIC-A1": ["Kids", "Foundation", "Beginner", "English"],
  "EN-GEN-A2": ["Communication", "Conversation", "English", "Foundation"],
  "EN-KIDS-A0": ["Kids", "Foundation", "Beginner", "Language Learning"],
  "BUSINESS-EN-B1": [
    "Business",
    "Professional",
    "Communication",
    "English",
    "Presentation",
  ],
  "EN-CONV-B2": ["Conversation", "Communication", "Professional", "English"],

  // Japanese frameworks
  "JP-CONV-N5": ["Japanese", "Communication", "Culture", "Beginner"],
  "JP-BUSINESS-N4": ["Japanese", "Business", "Professional", "Communication"],

  // Exam/frameworks
  "IELTS-PRE-B2": ["IELTS", "Exam Preparation", "Academic", "English"],
  "EN-ACADEMIC-C1": ["Academic", "Professional", "English", "Communication"],

  // Vietnamese frameworks
  "VI-INT-A1": ["Language Learning", "Communication", "Culture"],
};

async function populateComprehensiveTags() {
  let connection;

  try {
    console.log(
      "🌟 Populating comprehensive tags for curriculum frameworks..."
    );
    connection = await mysql.createConnection(connectionConfig);

    // Get tenant that has frameworks
    const [tenantResult] = await connection.execute(`
      SELECT DISTINCT cf.tenant_id, COUNT(*) as count
      FROM curriculum_frameworks cf
      WHERE cf.deleted_at IS NULL
      GROUP BY cf.tenant_id
      ORDER BY count DESC
      LIMIT 1
    `);

    if (tenantResult.length === 0) {
      console.log("❌ No frameworks found in database");
      return;
    }

    const tenantId = tenantResult[0].tenant_id;
    console.log(
      `📋 Working with tenant ${tenantId} (${tenantResult[0].count} frameworks)`
    );

    // 1. Insert all tags for this tenant
    console.log("🏷️ Inserting sample tags...");
    for (const tag of tagsData) {
      await connection.execute(
        "INSERT IGNORE INTO tags (tenant_id, name, category, color, is_system) VALUES (?, ?, ?, ?, ?)",
        [tenantId, tag.name, tag.category, tag.color, 1]
      );
    }
    console.log(`✅ Inserted ${tagsData.length} tags`);

    // 2. Get all frameworks for this tenant
    const [frameworks] = await connection.execute(
      `
      SELECT id, code, name
      FROM curriculum_frameworks
      WHERE tenant_id = ? AND deleted_at IS NULL
      ORDER BY code
    `,
      [tenantId]
    );

    console.log(`📚 Found ${frameworks.length} frameworks to tag`);

    // 3. Assign tags to each framework based on code
    let totalAssignments = 0;

    for (const fw of frameworks) {
      const tagNames = frameworkTagMappings[fw.code];

      if (!tagNames) {
        console.log(`⚠️ No tags defined for ${fw.code}`);
        continue;
      }

      console.log(`🏷️ Tagging ${fw.code} with: ${tagNames.join(", ")}`);

      for (const tagName of tagNames) {
        // Find tag ID
        const [tagResult] = await connection.execute(
          "SELECT id FROM tags WHERE tenant_id = ? AND name = ?",
          [tenantId, tagName]
        );

        if (tagResult.length > 0) {
          const tagId = tagResult[0].id;

          // Insert relationship
          await connection.execute(
            "INSERT IGNORE INTO curriculum_framework_tags (framework_id, tag_id) VALUES (?, ?)",
            [fw.id, tagId]
          );
          totalAssignments++;
        } else {
          console.log(`   ❌ Tag "${tagName}" not found`);
        }
      }
    }

    console.log(`\n✅ Summary:`);
    console.log(`   - Tags created: ${tagsData.length}`);
    console.log(
      `   - Frameworks tagged: ${
        frameworks.filter((f) => frameworkTagMappings[f.code]).length
      }`
    );
    console.log(`   - Total assignments: ${totalAssignments}`);

    // 4. Verification query
    console.log("\n📊 Verification - Frameworks with tags:");
    const [verification] = await connection.execute(
      `
      SELECT
        cf.code,
        GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ', ') as tags
      FROM curriculum_frameworks cf
      LEFT JOIN curriculum_framework_tags cft ON cf.id = cft.framework_id
      LEFT JOIN tags t ON cft.tag_id = t.id
      WHERE cf.tenant_id = ?
      GROUP BY cf.id
      ORDER BY cf.code
    `,
      [tenantId]
    );

    verification.forEach((row) => {
      console.log(`  ${row.code}: ${row.tags || "No tags"}`);
    });

    console.log("\n🎉 Comprehensive tagging completed!");
    console.log("🔄 Restart backend server to see tagged frameworks");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the comprehensive tagging
console.log("=========================================");
console.log("COMPREHENSIVE TAG POPULATION");
console.log("For curriculum frameworks");
console.log("=========================================\n");

populateComprehensiveTags()
  .then(() => {
    console.log("\n✅ Comprehensive tag population completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Comprehensive tag population failed:", error);
    process.exit(1);
  });
