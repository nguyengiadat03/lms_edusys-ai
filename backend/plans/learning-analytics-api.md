Tạo REST API cho Learning Analytics, Reports, Custom Dashboards, và Data Export trong Node.js với:

**Endpoints:**

* **Learning Analytics:**
  * GET /api/v1/analytics/learning — bảng điều khiển phân tích học tập
  * GET /api/v1/analytics/progress — phân tích tiến độ
  * GET /api/v1/analytics/engagement — chỉ số tương tác
  * GET /api/v1/analytics/performance — phân tích hiệu suất

* **Reports:**
  * GET /api/v1/reports — danh sách báo cáo có sẵn
  * POST /api/v1/reports/generate — tạo báo cáo
  * GET /api/v1/reports/:id — chi tiết báo cáo
  * POST /api/v1/reports/:id/export — xuất báo cáo
  * GET /api/v1/reports/templates — mẫu báo cáo

* **Custom Dashboards:**
  * GET /api/v1/dashboards — bảng điều khiển của người dùng
  * POST /api/v1/dashboards — tạo bảng điều khiển
  * GET /api/v1/dashboards/:id — chi tiết bảng điều khiển
  * PATCH /api/v1/dashboards/:id — cập nhật bảng điều khiển
  * DELETE /api/v1/dashboards/:id — xóa bảng điều khiển

* **Data Export:**
  * POST /api/v1/exports/data — xuất dữ liệu
  * GET /api/v1/exports/jobs — danh sách công việc xuất dữ liệu
  * GET /api/v1/exports/jobs/:id — trạng thái công việc xuất dữ liệu

**Tính năng:**

* Auth (JWT, OAuth, MFA)
* DB + ORM (Prisma)
* Validation + Global Error Handling (Joi, custom middleware)

**Yêu cầu kỹ thuật:**

* Async/await
* Test cơ bản (unit/integration với Jest)
* OpenAPI/Swagger (auto-generated docs)