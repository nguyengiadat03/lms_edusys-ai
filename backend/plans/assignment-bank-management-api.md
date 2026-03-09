Tạo REST API cho Assignment Bank, Questions, Collections, Permissions, Analytics, Practice Sessions và AI Features trong Node.js với:

**Endpoints:**

* GET /api/v1/assignments/bank — assignment bank với advanced filters + pagination
* POST /api/v1/assignments/:id/clone — clone assignment với metadata
* POST /api/v1/assignments/bulk-import — import assignments từ Excel/CSV + validate
* POST /api/v1/assignments/bulk-export — export assignments sang file
* GET /api/v1/assignments/:id/versions — version history + diffs
* POST /api/v1/assignments/:id/version — tạo version mới
* GET /api/v1/assignments/:id/questions — questions trong assignment
* POST /api/v1/assignments/:id/questions — thêm question mới
* PATCH /api/v1/assignments/:id/questions/:qId — cập nhật question
* DELETE /api/v1/assignments/:id/questions/:qId — xóa question
* POST /api/v1/assignments/:id/questions/reorder — reorder questions
* GET /api/v1/assignments/collections — danh sách collections + filters
* POST /api/v1/assignments/collections — tạo collection mới
* GET /api/v1/assignments/collections/:id — chi tiết collection
* PATCH /api/v1/assignments/collections/:id — cập nhật collection
* DELETE /api/v1/assignments/collections/:id — xóa collection
* POST /api/v1/assignments/collections/:id/items — thêm assignment vào collection
* GET /api/v1/assignments/:id/permissions — permissions của assignment
* POST /api/v1/assignments/:id/permissions — cập nhật permissions
* POST /api/v1/assignments/:id/share — share assignment với users/groups
* GET /api/v1/assignments/:id/analytics — usage analytics + metrics
* GET /api/v1/assignments/:id/performance — performance metrics
* GET /api/v1/assignments/trending — trending assignments
* GET /api/v1/assignments/:id/practice-sessions — practice sessions
* POST /api/v1/assignments/:id/practice — start practice session
* PATCH /api/v1/assignments/practice/:sessionId — update practice session
* POST /api/v1/assignments/practice/:sessionId/complete — complete session
* POST /api/v1/assignments/ai-generate — AI generate assignment từ prompt
* POST /api/v1/assignments/:id/ai-enhance — AI enhance assignment
* POST /api/v1/assignments/:id/ai-feedback — AI feedback suggestions

**Tính năng:**

* Auth (JWT, OAuth, MFA)
* DB + ORM (Prisma)
* Validation + Global Error Handling (Joi, custom middleware)

**Yêu cầu kỹ thuật:**

* Async/await
* Test cơ bản (unit/integration với Jest)
* OpenAPI/Swagger (auto-generated docs)