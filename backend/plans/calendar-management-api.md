Tạo REST API cho Calendar Management, Attendance, QR Code Attendance, và Meeting Integration trong Node.js với:

**Endpoints:**

* **Calendar Management:**
  * GET /api/v1/calendar/events — danh sách calendar events
  * POST /api/v1/calendar/events — tạo event mới
  * GET /api/v1/calendar/events/:id — chi tiết event
  * PATCH /api/v1/calendar/events/:id — cập nhật event
  * DELETE /api/v1/calendar/events/:id — xóa event
  * POST /api/v1/calendar/events/:id/recurrence — set recurrence cho event
  * GET /api/v1/calendar/events/:id/instances — danh sách recurring instances
  * PATCH /api/v1/calendar/events/instances/:instanceId — cập nhật instance

* **External Calendar Integration:**
  * GET /api/v1/calendar/integrations — danh sách external calendars
  * POST /api/v1/calendar/integrations — thêm integration mới
  * POST /api/v1/calendar/sync — đồng bộ với external calendar

* **Attendance Management:**
  * GET /api/v1/attendance/records — danh sách attendance records
  * POST /api/v1/attendance/checkin — check-in
  * POST /api/v1/attendance/checkout — check-out
  * GET /api/v1/attendance/sessions/:sessionId — attendance của session
  * POST /api/v1/attendance/sessions/:sessionId/bulk — bulk attendance

* **QR Code Attendance:**
  * POST /api/v1/attendance/qr/generate — generate QR token
  * POST /api/v1/attendance/qr/checkin — QR check-in
  * GET /api/v1/attendance/qr/tokens — danh sách active QR tokens

* **Attendance Analytics:**
  * GET /api/v1/attendance/summary — attendance summary
  * GET /api/v1/attendance/reports — attendance reports
  * GET /api/v1/attendance/trends — attendance trends

* **Meeting Integration:**
  * GET /api/v1/meetings/integrations — danh sách meeting integrations
  * POST /api/v1/meetings/create — tạo meeting mới
  * GET /api/v1/meetings/:id/attendance — meeting attendance logs

**Tính năng:**

* Auth (JWT, OAuth, MFA)
* DB + ORM (Prisma)
* Validation + Global Error Handling (Joi, custom middleware)

**Yêu cầu kỹ thuật:**

* Async/await
* Test cơ bản (unit/integration với Jest)
* OpenAPI/Swagger (auto-generated docs)