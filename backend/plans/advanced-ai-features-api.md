Tạo REST API cho Advanced AI Features, Document Processing, và Analytics trong Node.js với:

**Endpoints:**

* **Advanced AI Features:**
  * POST /api/v1/ai/analyze-text — phân tích văn bản
  * POST /api/v1/ai/grammar-check — kiểm tra ngữ pháp
  * POST /api/v1/ai/plagiarism-check — phát hiện đạo văn
  * POST /api/v1/ai/speech-assessment — đánh giá bài nói
  * POST /api/v1/ai/auto-grade — chấm điểm tự động
  * POST /api/v1/ai/learning-path — tạo lộ trình học cá nhân hóa

* **AI Document Processing:**
  * POST /api/v1/ai/ocr — xử lý OCR
  * POST /api/v1/ai/document-summary — tóm tắt tài liệu
  * POST /api/v1/ai/extract-questions — trích xuất câu hỏi từ văn bản
  * POST /api/v1/ai/translate — dịch thuật

* **AI Analytics:**
  * POST /api/v1/ai/predict-performance — dự đoán hiệu suất học tập
  * POST /api/v1/ai/recommend-content — gợi ý nội dung học tập
  * POST /api/v1/ai/identify-gaps — xác định lỗ hổng kiến thức

**Tính năng:**

* Auth (JWT, OAuth, MFA)
* DB + ORM (Prisma)
* Validation + Global Error Handling (Joi, custom middleware)

**Yêu cầu kỹ thuật:**

* Async/await
* Test cơ bản (unit/integration với Jest)
* OpenAPI/Swagger (auto-generated docs)