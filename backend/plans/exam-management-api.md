Tạo REST API cho Exam Blueprints, Events, Registration, Attempts, Rooms, Proctoring, Grading, và Certificates trong Node.js với:

**Endpoints:**

* **Exam Blueprints:**
  * GET /api/v1/exams/blueprints — danh sách exam blueprints
  * POST /api/v1/exams/blueprints — tạo blueprint mới
  * GET /api/v1/exams/blueprints/:id — chi tiết blueprint
  * PATCH /api/v1/exams/blueprints/:id — cập nhật blueprint
  * DELETE /api/v1/exams/blueprints/:id — xóa blueprint

* **Exam Events:**
  * GET /api/v1/exams/events — danh sách scheduled exams
  * POST /api/v1/exams/events — schedule exam mới
  * GET /api/v1/exams/events/:id — chi tiết exam event
  * PATCH /api/v1/exams/events/:id — cập nhật exam event
  * DELETE /api/v1/exams/events/:id — hủy exam event

* **Exam Registration:**
  * GET /api/v1/exams/events/:id/registrations — danh sách registrations
  * POST /api/v1/exams/events/:id/register — đăng ký exam
  * DELETE /api/v1/exams/events/:id/registrations/:regId — hủy registration

* **Exam Attempts:**
  * GET /api/v1/exams/events/:id/attempts — danh sách exam attempts
  * POST /api/v1/exams/events/:id/start — bắt đầu exam attempt
  * PATCH /api/v1/exams/attempts/:attemptId — cập nhật attempt
  * POST /api/v1/exams/attempts/:attemptId/submit — nộp bài exam

* **Exam Rooms:**
  * GET /api/v1/exams/rooms — danh sách exam rooms
  * POST /api/v1/exams/rooms — tạo exam room mới
  * GET /api/v1/exams/rooms/:id — chi tiết room
  * PATCH /api/v1/exams/rooms/:id — cập nhật room
  * DELETE /api/v1/exams/rooms/:id — xóa room

* **Proctoring:**
  * GET /api/v1/exams/proctoring/sessions — danh sách proctoring sessions
  * POST /api/v1/exams/proctoring/start — bắt đầu proctoring session
  * POST /api/v1/exams/proctoring/events — log proctoring event
  * GET /api/v1/exams/proctoring/:sessionId/snapshots — danh sách proctoring snapshots

* **Exam Grading:**
  * GET /api/v1/exams/attempts/:id/grading — giao diện grading
  * POST /api/v1/exams/attempts/:id/grade — chấm điểm exam
  * GET /api/v1/exams/events/:id/results — kết quả exam

* **Certificates:**
  * GET /api/v1/certificates/templates — danh sách certificate templates
  * POST /api/v1/certificates/templates — tạo template mới
  * POST /api/v1/certificates/issue — cấp certificate
  * GET /api/v1/certificates/:id/verify — verify certificate

**Tính năng:**

* Auth (JWT, OAuth, MFA)
* DB + ORM (Prisma)
* Validation + Global Error Handling (Joi, custom middleware)

**Yêu cầu kỹ thuật:**

* Async/await
* Test cơ bản (unit/integration với Jest)
* OpenAPI/Swagger (auto-generated docs)