Tạo REST API cho Assessment Management, Grading, Rubrics, và Gradebook trong Node.js với:

**Endpoints:**

* **Assessment Management:**
  * GET /api/v1/assessments — danh sách assessments
  * POST /api/v1/assessments — tạo assessment mới
  * GET /api/v1/assessments/:id — chi tiết assessment
  * PATCH /api/v1/assessments/:id — cập nhật assessment
  * DELETE /api/v1/assessments/:id — xóa assessment

* **Assessment Items:**
  * GET /api/v1/assessments/:id/items — danh sách assessment items
  * POST /api/v1/assessments/:id/items — thêm item mới
  * PATCH /api/v1/assessments/:id/items/:itemId — cập nhật item
  * DELETE /api/v1/assessments/:id/items/:itemId — xóa item

* **Grading:**
  * GET /api/v1/assessments/:id/results — kết quả assessment
  * POST /api/v1/assessments/:id/grade — chấm điểm assessment
  * GET /api/v1/assessments/:id/submissions — danh sách submissions
  * POST /api/v1/assessments/:id/submissions/:submissionId/grade — chấm điểm submission

* **Rubrics:**
  * GET /api/v1/rubrics — danh sách rubrics
  * POST /api/v1/rubrics — tạo rubric mới
  * GET /api/v1/rubrics/:id — chi tiết rubric
  * PATCH /api/v1/rubrics/:id — cập nhật rubric
  * DELETE /api/v1/rubrics/:id — xóa rubric

* **Rubric Criteria:**
  * GET /api/v1/rubrics/:id/criteria — danh sách rubric criteria
  * POST /api/v1/rubrics/:id/criteria — thêm criterion mới
  * PATCH /api/v1/rubrics/:id/criteria/:criterionId — cập nhật criterion
  * DELETE /api/v1/rubrics/:id/criteria/:criterionId — xóa criterion

* **Gradebook:**
  * GET /api/v1/classes/:id/gradebook — gradebook của class
  * GET /api/v1/classes/:id/grades — danh sách grades của class
  * POST /api/v1/classes/:id/grades — thêm grade entry
  * PATCH /api/v1/classes/:id/grades/:gradeId — cập nhật grade
  * DELETE /api/v1/classes/:id/grades/:gradeId — xóa grade

* **Grade Analytics:**
  * GET /api/v1/classes/:id/grade-summary — tổng kết grades
  * GET /api/v1/classes/:id/grade-distribution — phân phối grades
  * GET /api/v1/students/:id/transcript — transcript của student

**Tính năng:**

* Auth (JWT, OAuth, MFA)
* DB + ORM (Prisma)
* Validation + Global Error Handling (Joi, custom middleware)

**Yêu cầu kỹ thuật:**

* Async/await
* Test cơ bản (unit/integration với Jest)
* OpenAPI/Swagger (auto-generated docs)