Tạo REST API cho Class Management, Enrollment, Teachers, Sessions, Plans và Analytics trong Node.js với:

**Endpoints:**

* GET /api/v1/classes — danh sách classes với filters + pagination
* GET /api/v1/classes/:id — chi tiết class + metadata
* POST /api/v1/classes — tạo class mới + validate
* PATCH /api/v1/classes/:id — cập nhật class
* DELETE /api/v1/classes/:id — xóa class (soft delete)
* GET /api/v1/classes/:id/enrollments — danh sách enrollments + status
* POST /api/v1/classes/:id/enrollments — enroll student
* PATCH /api/v1/classes/:id/enrollments/:enrollmentId — cập nhật enrollment
* DELETE /api/v1/classes/:id/enrollments/:enrollmentId — unenroll student
* POST /api/v1/classes/:id/bulk-enroll — bulk enroll students + validate
* GET /api/v1/classes/:id/teachers — teachers của class
* POST /api/v1/classes/:id/teachers — assign teacher to class
* DELETE /api/v1/classes/:id/teachers/:teacherId — unassign teacher
* GET /api/v1/classes/:id/sessions — sessions của class + scheduling
* POST /api/v1/classes/:id/sessions — tạo session mới
* GET /api/v1/classes/sessions/:sessionId — chi tiết session
* PATCH /api/v1/classes/sessions/:sessionId — cập nhật session
* DELETE /api/v1/classes/sessions/:sessionId — xóa session
* GET /api/v1/classes/sessions/:sessionId/plan — session plan
* POST /api/v1/classes/sessions/:sessionId/plan — tạo/cập nhật plan
* GET /api/v1/classes/sessions/:sessionId/materials — session materials
* POST /api/v1/classes/sessions/:sessionId/materials — add material
* GET /api/v1/classes/:id/assignments — assignments của class
* POST /api/v1/classes/:id/assignments — assign assignment to class
* PATCH /api/v1/classes/:id/assignments/:assignmentId — override assignment
* DELETE /api/v1/classes/:id/assignments/:assignmentId — remove assignment
* GET /api/v1/classes/:id/policies — class policies
* POST /api/v1/classes/:id/policies — cập nhật policies
* GET /api/v1/classes/:id/analytics — class analytics + metrics
* GET /api/v1/classes/:id/progress — class progress tracking
* GET /api/v1/classes/:id/performance — class performance metrics

**Tính năng:**

* Auth (JWT, OAuth, MFA)
* DB + ORM (Prisma)
* Validation + Global Error Handling (Joi, custom middleware)

**Yêu cầu kỹ thuật:**

* Async/await
* Test cơ bản (unit/integration với Jest)
* OpenAPI/Swagger (auto-generated docs)