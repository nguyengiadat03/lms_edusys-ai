Tạo REST API cho Unit Management, Resources, Activities và Assessment trong Node.js với:

**Endpoints:**

* POST /api/v1/units/:id/clone — clone unit với metadata
* POST /api/v1/units/:id/merge — merge units với conflict resolution
* GET /api/v1/units/:id/completeness — completeness score + details
* POST /api/v1/units/:id/ai-generate — AI generate content cho unit
* GET /api/v1/units/:id/resources — danh sách resources trong unit
* POST /api/v1/units/:id/resources — thêm resource mới
* PATCH /api/v1/units/:id/resources/:resourceId — cập nhật resource
* DELETE /api/v1/units/:id/resources/:resourceId — xóa resource
* GET /api/v1/units/:id/activities — activities trong unit
* POST /api/v1/units/:id/activities — link activity to unit
* DELETE /api/v1/units/:id/activities/:activityId — unlink activity
* GET /api/v1/units/:id/learning-outcomes — learning outcomes
* POST /api/v1/units/:id/learning-outcomes — cập nhật learning outcomes
* GET /api/v1/units/:id/rubric — unit rubric
* POST /api/v1/units/:id/rubric — cập nhật rubric

**Tính năng:**

* Auth (JWT, OAuth, MFA)
* DB + ORM (Prisma)
* Validation + Global Error Handling (Joi, custom middleware)

**Yêu cầu kỹ thuật:**

* Async/await
* Test cơ bản (unit/integration với Jest)
* OpenAPI/Swagger (auto-generated docs)