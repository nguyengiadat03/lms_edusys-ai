Tạo REST API cho System Management, Tenant Management, Settings, Audit Logs, Notifications, và Support trong Node.js với:

**Endpoints:**

* **System Management:**
  * GET /api/v1/system/info — thông tin hệ thống
  * GET /api/v1/system/stats — thống kê hệ thống
  * POST /api/v1/system/maintenance — chế độ bảo trì
  * GET /api/v1/system/logs — nhật ký hệ thống

* **Tenant Management:**
  * GET /api/v1/tenants — danh sách tenant (super admin)
  * POST /api/v1/tenants — tạo tenant
  * GET /api/v1/tenants/:id — chi tiết tenant
  * PATCH /api/v1/tenants/:id — cập nhật tenant
  * DELETE /api/v1/tenants/:id — xóa tenant

* **Settings:**
  * GET /api/v1/settings — cài đặt hệ thống
  * PATCH /api/v1/settings — cập nhật cài đặt
  * GET /api/v1/settings/tenant — cài đặt tenant
  * PATCH /api/v1/settings/tenant — cập nhật cài đặt tenant

* **Audit Logs:**
  * GET /api/v1/audit-logs — nhật ký kiểm tra
  * GET /api/v1/audit-logs/:id — chi tiết nhật ký kiểm tra

* **Notifications:**
  * GET /api/v1/notifications — thông báo người dùng
  * PATCH /api/v1/notifications/:id/read — đánh dấu đã đọc
  * POST /api/v1/notifications/bulk-read — đánh dấu tất cả đã đọc

* **Support:**
  * GET /api/v1/support/tickets — danh sách yêu cầu hỗ trợ
  * POST /api/v1/support/tickets — tạo yêu cầu hỗ trợ
  * GET /api/v1/support/tickets/:id — chi tiết yêu cầu hỗ trợ
  * PATCH /api/v1/support/tickets/:id — cập nhật yêu cầu hỗ trợ

**Tính năng:**

* Auth (JWT, OAuth, MFA)
* DB + ORM (Prisma)
* Validation + Global Error Handling (Joi, custom middleware)

**Yêu cầu kỹ thuật:**

* Async/await
* Test cơ bản (unit/integration với Jest)
* OpenAPI/Swagger (auto-generated docs)