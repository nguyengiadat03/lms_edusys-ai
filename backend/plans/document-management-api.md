Tạo REST API cho Document Management, Processing, Collections, Sharing, Search, và Analytics trong Node.js với:

**Endpoints:**

* **Document Management:**
  * GET /api/v1/documents — danh sách tài liệu trong library
  * POST /api/v1/documents — upload tài liệu mới
  * GET /api/v1/documents/:id — chi tiết tài liệu
  * PATCH /api/v1/documents/:id — cập nhật tài liệu
  * DELETE /api/v1/documents/:id — xóa tài liệu

* **Document Processing:**
  * POST /api/v1/documents/:id/ocr — xử lý OCR cho tài liệu
  * POST /api/v1/documents/:id/ai-tag — AI tagging cho tài liệu
  * GET /api/v1/documents/:id/preview — xem trước tài liệu
  * POST /api/v1/documents/:id/convert — chuyển đổi định dạng tài liệu

* **Document Collections:**
  * GET /api/v1/documents/collections — danh sách collections
  * POST /api/v1/documents/collections — tạo collection mới
  * GET /api/v1/documents/collections/:id — chi tiết collection
  * PATCH /api/v1/documents/collections/:id — cập nhật collection
  * DELETE /api/v1/documents/collections/:id — xóa collection

* **Document Sharing:**
  * GET /api/v1/documents/:id/shares — danh sách shares của tài liệu
  * POST /api/v1/documents/:id/share — chia sẻ tài liệu
  * DELETE /api/v1/documents/:id/shares/:shareId — xóa share

* **Document Search:**
  * GET /api/v1/documents/search — tìm kiếm tài liệu
  * GET /api/v1/documents/tags — danh sách tags có sẵn
  * POST /api/v1/documents/:id/tags — gắn tag cho tài liệu

* **Document Analytics:**
  * GET /api/v1/documents/:id/analytics — phân tích sử dụng tài liệu
  * GET /api/v1/documents/trending — tài liệu phổ biến

**Tính năng:**

* Auth (JWT, OAuth, MFA)
* DB + ORM (Prisma)
* Validation + Global Error Handling (Joi, custom middleware)

**Yêu cầu kỹ thuật:**

* Async/await
* Test cơ bản (unit/integration với Jest)
* OpenAPI/Swagger (auto-generated docs)