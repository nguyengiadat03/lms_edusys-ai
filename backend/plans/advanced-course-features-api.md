Tạo REST API cho Course Management, Templates, Sequencing và Assessment trong Node.js với:

**Endpoints:**

* POST /api/v1/courses/:id/clone — clone course với metadata
* GET /api/v1/courses/:id/preview — preview course structure + content
* POST /api/v1/courses/:id/validate — validate course completeness + return issues
* GET /api/v1/courses/:id/analytics — course analytics + metrics
* POST /api/v1/courses/:id/ai-enhance — AI enhancement suggestions
* GET /api/v1/courses/templates — danh sách course templates + filters
* POST /api/v1/courses/templates — tạo template từ existing course
* POST /api/v1/courses/from-template — tạo course từ template + customization
* POST /api/v1/courses/reorder — reorder courses trong version
* GET /api/v1/courses/:id/prerequisites — danh sách prerequisites
* POST /api/v1/courses/:id/prerequisites — cập nhật prerequisites
* GET /api/v1/courses/:id/assessments — assessments trong course
* POST /api/v1/courses/:id/assessments — thêm assessment mới
* GET /api/v1/courses/:id/rubrics — rubrics cho course
* POST /api/v1/courses/:id/rubrics — tạo rubric cho course

**Tính năng:**

* Auth (JWT, OAuth, MFA)
* DB + ORM (Prisma)
* Validation + Global Error Handling (Joi, custom middleware)

**Yêu cầu kỹ thuật:**

* Async/await
* Test cơ bản (unit/integration với Jest)
* OpenAPI/Swagger (auto-generated docs)