Tạo REST API cho Authentication, Permissions, Scopes và User Management trong FastAPI với:

**Endpoints:**

* POST /api/v1/auth/forgot-password — gửi email quên mật khẩu
* POST /api/v1/auth/reset-password — reset mật khẩu với token
* POST /api/v1/auth/change-password — đổi mật khẩu hiện tại
* POST /api/v1/auth/mfa/setup — thiết lập MFA (TOTP)
* POST /api/v1/auth/mfa/disable — tắt MFA
* GET /api/v1/auth/sessions — danh sách sessions hoạt động
* DELETE /api/v1/auth/sessions/:id — xóa session cụ thể
* GET /api/v1/permissions — danh sách permissions + filters
* POST /api/v1/permissions — tạo permission mới + validate
* GET /api/v1/permissions/:id — chi tiết permission
* PATCH /api/v1/permissions/:id — cập nhật permission
* DELETE /api/v1/permissions/:id — xóa permission
* GET /api/v1/scopes — danh sách scopes + filters
* POST /api/v1/scopes — tạo scope mới + validate
* GET /api/v1/scopes/:id — chi tiết scope
* PATCH /api/v1/scopes/:id — cập nhật scope
* DELETE /api/v1/scopes/:id — xóa scope
* GET /api/v1/users/:id/permissions — permissions của user
* GET /api/v1/users/:id/roles — roles của user
* POST /api/v1/users/:id/impersonate — impersonate user (admin only)
* POST /api/v1/users/bulk-import — import users từ CSV + validate
* POST /api/v1/users/bulk-update — cập nhật hàng loạt users
* GET /api/v1/users/:id/audit-logs — audit logs của user + pagination

**Tính năng:**

* Auth (JWT, OAuth, MFA)
* DB + ORM (Prisma)
* Validation + Global Error Handling (Pydantic, custom exceptions)

**Yêu cầu kỹ thuật:**

* Async/await
* Test cơ bản (unit/integration)
* OpenAPI/Swagger