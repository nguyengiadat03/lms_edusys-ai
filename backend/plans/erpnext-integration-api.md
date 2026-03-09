Tạo REST API cho ERPNext Integration trong Node.js với:

**Endpoints:**

* **ERPNext Integration:**
  * GET /api/v1/erp/sync-status — trạng thái đồng bộ
  * POST /api/v1/erp/sync — đồng bộ thủ công
  * GET /api/v1/erp/customers — dữ liệu khách hàng
  * GET /api/v1/erp/students — dữ liệu học sinh
  * GET /api/v1/erp/invoices — dữ liệu hóa đơn
  * GET /api/v1/erp/payments — dữ liệu thanh toán

* **Master Data Sync:**
  * POST /api/v1/erp/sync/customers — đồng bộ khách hàng
  * POST /api/v1/erp/sync/students — đồng bộ học sinh
  * POST /api/v1/erp/sync/staff — đồng bộ nhân viên
  * POST /api/v1/erp/sync/products — đồng bộ sản phẩm

* **Transaction Data:**
  * POST /api/v1/erp/orders — tạo đơn hàng
  * POST /api/v1/erp/invoices — tạo hóa đơn
  * POST /api/v1/erp/payments — ghi nhận thanh toán
  * POST /api/v1/erp/contracts — tạo hợp đồng

* **Webhooks:**
  * POST /api/v1/erp/webhooks/invoice-paid — webhook hóa đơn đã thanh toán
  * POST /api/v1/erp/webhooks/enrollment — webhook ghi danh
  * POST /api/v1/erp/webhooks/completion — webhook hoàn thành khóa học

**Tính năng:**

* Auth (JWT, OAuth, MFA)
* DB + ORM (Prisma)
* Validation + Global Error Handling (Joi, custom middleware)

**Yêu cầu kỹ thuật:**

* Async/await
* Test cơ bản (unit/integration với Jest)
* OpenAPI/Swagger (auto-generated docs)