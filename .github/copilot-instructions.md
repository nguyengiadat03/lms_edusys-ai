✅ **AI AGENT INSTRUCTIONS — FORMAT RESPONSE ENGINE (V4)**

# 🧠 Mục tiêu

Phiên bản này đảm bảo AI agent **trả lời đúng 100% theo format của từng Kỹ Thuật (#1–#7 hoặc Combination)** — không phân tích tự do, không viết mô tả dài — mà **trả về câu trả lời định dạng sẵn theo mẫu chuẩn** tương ứng với kỹ thuật được chọn.

---

## ⚙️ I. QUY TẮC HOẠT ĐỘNG

### 1️⃣ Khi người dùng nhập yêu cầu

AI phải:

1. Nhận diện yêu cầu thuộc **kỹ thuật nào** trong 7 kỹ thuật (hoặc Combination).
2. Đọc cấu trúc dự án (nếu có) để hiểu stack, framework, ORM, DB.
3. Trả về **kết quả đúng định dạng mẫu** của kỹ thuật tương ứng.

> ❗Không được tự sáng tạo format mới.
> ❗Mọi câu trả lời phải có **tiêu đề, phần mục, cấu trúc, ngắt dòng và đánh dấu** giống 100% mẫu kỹ thuật gốc.

---

## 🧱 III. MẪU TRẢ LỜI THEO TỪNG KỸ THUẬT

### 🔹 Kỹ Thuật #1: Công Thức Prompt Cho Thành Phần (The Component Prompt Formula)

**Tiết kiệm thời gian:** 45–60 phút mỗi thành phần

**Cách hoạt động:**
Tạo một thành phần [ComponentName] trong [Framework] với [Language] sao cho:

**Chức năng:**

* [Tính năng cốt lõi 1]
* [Tính năng cốt lõi 2]
* [Tương tác người dùng]

**Yêu cầu UI:**

* Thiết kế theo [Design framework]
* Hành vi responsive
* Quản lý trạng thái

**Yêu cầu kỹ thuật:**

* Yêu cầu an toàn kiểu dữ liệu
* Nhu cầu hiệu suất
* Cách tiếp cận kiểm thử
* Làm cho nó sẵn sàng sản xuất với [yêu cầu cụ thể]

**Ví dụ:**

```
Create a [ComponentName] in [Framework] with [Language]
Functionality:
- ...
UI Requirements:
- ...
Technical:
- ...
```

**Mẹo hay:**

* Định nghĩa interface sớm
* Responsive + error boundary
* Dùng try/catch + validation

---

### 🔹 Kỹ Thuật #2: Mẫu API Tức Thì (The Instant API Pattern)

**Tiết kiệm thời gian:** 3–6 giờ mỗi API

**Cách hoạt động:**
Tạo REST API cho [resource] trong [Framework] với:

**Endpoints:**

* GET /[resource]
* GET /[resource]/{id}
* POST /[resource]
* PUT /[resource]/{id}
* DELETE /[resource]/{id]

**Tính năng:**

* Auth (JWT, OAuth)
* DB + ORM
* Validation + Global Error Handling

**Yêu cầu kỹ thuật:**

* Async/await
* Test cơ bản (unit/integration)
* OpenAPI/Swagger

**Ví dụ:**

```
FastAPI Expense API
GET /expenses — list + filters
POST /expenses — validate + save
```

**Mẹo hay:**

* Dùng async ORM
* Bao gồm Swagger
* Kiểm thử CRUD tự động

---

### 🔹 Kỹ Thuật #3: Thám Tử Debug (The Debug Detective)

**Tiết kiệm thời gian:** 1–3 giờ mỗi lỗi

**Cách hoạt động:**
Cung cấp lỗi + ngữ cảnh → AI trả về:

* Nguyên nhân gốc rễ
* Fix nhanh
* Giải pháp dài hạn
* Cách phòng tránh

**Ví dụ:**

```
Debug: TypeError 'map' undefined
Context: React 18 + TS
Fix: init state = []
Long-term: validate API response
```

**Mẹo hay:**

* Gửi stacktrace
* Đính code lỗi
* Yêu cầu fix bền vững

---

### 🔹 Kỹ Thuật #4: Yêu Cầu Refactor (The Refactor Request)

**Tiết kiệm thời gian:** 2–4 giờ refactor thủ công

**Cách hoạt động:**
Cung cấp code + mục tiêu + ràng buộc.
AI trả về:

* Refactor plan
* Giải thích thay đổi
* Đánh giá hiệu suất trước/sau

**Ví dụ:**

```
Refactor [Module]
Goal: clean code + optimize render
Constraint: giữ props, API không đổi
```

**Mẹo hay:**

* Nêu rõ mục tiêu refactor
* Đặt constraint an toàn

---

### 🔹 Kỹ Thuật #5: Tăng Tốc UI/UX (The UI/UX Accelerator)

**Tiết kiệm thời gian:** 2–3 giờ công việc UI

**Cách hoạt động:**
Mô tả UI mong muốn + framework + interaction.

**Ví dụ:**

```
Sidebar dashboard:
- Glass style + animation
- Collapsible mobile
- A11y, dark mode
```

**Mẹo hay:**

* Tham chiếu UI trend
* Chỉ định responsive & animation

---

### 🔹 Kỹ Thuật #6: Trình Tạo Test (The Test Generator)

**Tiết kiệm thời gian:** 2–4 giờ test

**Cách hoạt động:**
Cung cấp module cần test + loại test (unit/integration/perf)
AI sinh:

* Test đầy đủ
* Mock + Fixture + Edge case

**Ví dụ:**

```
ExpenseService CRUD Tests
Unit + Integration + Edge
Framework: Jest
```

**Mẹo hay:**

* Bao gồm edge case
* Dùng factory mock

---

### 🔹 Kỹ Thuật #7: Script Triển Khai (The Deploy Script)

**Tiết kiệm thời gian:** 2–4 giờ thiết lập triển khai

**Cách hoạt động:**
Cung cấp FE+BE+DB stack + hosting.
AI sinh config deploy.

**Ví dụ:**

```
Deploy React + FastAPI to Vercel + Render + Supabase
CI/CD: GitHub Actions
Monitor: Sentry
```

**Mẹo hay:**

* Bao gồm rollback
* Kiểm tra ENV + healthcheck

---

### 🔹 Bonus: Kỹ Thuật Kết Hợp (The Combination Technique)

**Tiết kiệm thời gian:** 1–2 ngày mỗi tính năng

**Cách hoạt động:**
Gộp nhiều kỹ thuật để tạo tính năng hoàn chỉnh.

**Ví dụ:**

```
Feature: Auth system
#2 API + #1 UI + #6 Tests + #7 Deploy
```

**Mẹo hay:**

* Xây tuần tự API → UI → Test → Deploy

---

## 🚀 IV. CHỈ DẪN CHO AI

Khi phản hồi, AI phải:

1. Nhận diện kỹ thuật phù hợp.
2. Xuất bản câu trả lời **đúng định dạng kỹ thuật tương ứng**.
3. Không thêm mô tả thừa.
4. Chỉ sinh phần **nội dung tương ứng** đúng cấu trúc kỹ thuật đó.
5. Khi người dùng “CHỐT”, lưu thành `.md` với đúng format trong thư mục ’backend/plans’.

---

✅ **Kết quả mong đợi:**
AI agent phản hồi mọi yêu cầu kỹ thuật **đúng định dạng mẫu kỹ thuật (#1–#7 hoặc Combination)**, có thể copy-paste trực tiếp vào tài liệu dự án hoặc CI/CD plan.
