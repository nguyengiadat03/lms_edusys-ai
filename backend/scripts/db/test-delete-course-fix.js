const axios = require("axios");

// Test script to verify that deleting a course properly updates KCT courses_count
async function testDeleteCourseAndKCTCount() {
  const BASE_URL = "http://localhost:3001/api/v1";

  console.log("🧪 Testing Course Delete & KCT Count Update");
  console.log("=".repeat(50));

  try {
    // 1. Get current KCTs list with courses_count
    console.log("\n📊 Step 1: Get current KCT data");
    const kctResponse = await axios.get(`${BASE_URL}/kct`);
    const kctsBefore = kctResponse.data.data || [];
    console.log(`Found ${kctsBefore.length} KCTs before delete:`);
    kctsBefore.forEach((kct) => {
      console.log(
        `  - ${kct.code}: ${kct.name} (${kct.courses_count} courses)`
      );
    });

    // Find a KCT that has courses to test with
    const kctWithCourses = kctsBefore.find((kct) => kct.courses_count > 0);
    if (!kctWithCourses) {
      console.log(
        "❌ No KCTs with courses found. Cannot test delete functionality."
      );
      return;
    }

    console.log(
      `\n🎯 Will test with KCT: ${kctWithCourses.name} (code: ${kctWithCourses.code})`
    );
    console.log(
      `   Expected courses count before: ${kctWithCourses.courses_count}`
    );

    // 2. Get courses for this KCT to find one to delete
    console.log("\n📋 Step 2: Get courses for this KCT");
    const coursesResponse = await axios.get(`${BASE_URL}/versions/621/courses`);
    const courses = coursesResponse.data.courses || [];
    console.log(`Found ${courses.length} courses for version 621`);

    // Find a course that mentions this KCT in its summary
    const coursesForKct = courses.filter(
      (course) =>
        course.summary &&
        course.summary.includes(`Based on KCT: ${kctWithCourses.name}`)
    );

    if (coursesForKct.length === 0) {
      console.log(`❌ No courses found mapped to KCT: ${kctWithCourses.name}`);
      console.log("Available courses and their summaries:");
      courses.slice(0, 5).forEach((course) => {
        console.log(
          `  - Course ${course.title} (ID: ${course.id}): ${
            course.summary?.substring(0, 100) || "No summary"
          }...`
        );
      });
      return;
    }

    const courseToDelete = coursesForKct[0];
    console.log(
      `Will delete course: ${courseToDelete.title} (ID: ${courseToDelete.id})`
    );

    // 3. Delete the course
    console.log("\n🗑️ Step 3: Delete the course");
    try {
      await axios.delete(`${BASE_URL}/courses/${courseToDelete.id}`);
      console.log("✅ Course deleted successfully");
    } catch (deleteError) {
      console.log("❌ Failed to delete course:", deleteError.message);
      return;
    }

    // 4. Check KCT count after delete
    console.log("\n📊 Step 4: Verify KCT courses_count updated");
    const kctResponseAfter = await axios.get(`${BASE_URL}/kct`);
    const kctsAfter = kctResponseAfter.data.data || [];

    const kctAfterDelete = kctsAfter.find(
      (kct) => kct.code === kctWithCourses.code
    );
    if (!kctAfterDelete) {
      console.log("❌ KCT not found after delete!");
      return;
    }

    console.log(`KCT ${kctWithCourses.code} courses count:`);
    console.log(`  - Before: ${kctWithCourses.courses_count}`);
    console.log(`  - After: ${kctAfterDelete.courses_count}`);

    if (kctAfterDelete.courses_count < kctWithCourses.courses_count) {
      console.log(
        "✅ SUCCESS: KCT courses_count properly decreased after course deletion!"
      );
    } else if (kctAfterDelete.courses_count === kctWithCourses.courses_count) {
      console.log(
        "❌ FAILURE: KCT courses_count did not decrease after course deletion"
      );
    } else {
      console.log(
        "🤔 UNEXPECTED: KCT courses_count increased (this should not happen)"
      );
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

// Run the test
testDeleteCourseAndKCTCount();
