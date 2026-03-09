Tạo REST API cho KCT Management, CEFR Mapping, Version Control và Deployment trong Node.js với:

**Endpoints:**

* POST /api/v1/kct/:id/clone — clone KCT với metadata
* POST /api/v1/kct/:id/export — export KCT sang PDF/DOCX/SCORM
* POST /api/v1/kct/import — import KCT từ file upload
* GET /api/v1/kct/:id/compare/:otherId — so sánh 2 KCT + diff
* POST /api/v1/kct/:id/merge — merge KCT với conflict resolution
* GET /api/v1/kct/:id/dependencies — danh sách dependencies
* POST /api/v1/kct/:id/validate — validate structure + return errors
* GET /api/v1/kct/:id/cefr-mapping — CEFR mapping matrix
* POST /api/v1/kct/:id/cefr-mapping — cập nhật CEFR mapping
* GET /api/v1/kct/:id/coverage — coverage analysis report
* POST /api/v1/kct/:id/ai-suggestions — AI suggestions cho improvement
* POST /api/v1/versions/:id/publish — publish version + notifications
* POST /api/v1/versions/:id/archive — archive version
* POST /api/v1/versions/:id/rollback — rollback to version
* GET /api/v1/versions/:id/diff/:otherId — diff between versions
* POST /api/v1/versions/:id/branch — tạo branch từ version
* GET /api/v1/kct/:id/deployments — danh sách deployments + status
* POST /api/v1/kct/:id/deploy — deploy to classes + scheduling
* GET /api/v1/kct/:id/usage-stats — usage statistics + analytics
* GET /api/v1/kct/:id/feedback — feedback từ teachers + ratings

**Tính năng:**

* Auth (JWT, OAuth, MFA)
* DB + ORM (Prisma)
* Validation + Global Error Handling (Joi, custom middleware)

**Yêu cầu kỹ thuật:**

* Async/await
* Test cơ bản (unit/integration với Jest)
* OpenAPI/Swagger (auto-generated docs)