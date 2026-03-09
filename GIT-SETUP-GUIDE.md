# Hướng Dẫn Kết Nối GitHub

## Bước 1: Tạo Repository trên GitHub

1. Truy cập https://github.com/nguyengiadat03
2. Click nút **"New"** hoặc **"+"** → **"New repository"**
3. Điền thông tin:
   - **Repository name:** `edusys-ai` (hoặc tên bạn muốn)
   - **Description:** "EduSys AI - Education Management Platform"
   - **Visibility:** Private (khuyến nghị) hoặc Public
   - **KHÔNG** chọn "Initialize this repository with a README"
4. Click **"Create repository"**

## Bước 2: Kết Nối Repository Local với GitHub

Sau khi tạo repository, GitHub sẽ hiển thị các lệnh. Chạy các lệnh sau trong terminal:

### Option 1: Nếu bạn muốn tên repository là "edusys-ai"

```bash
# Thêm remote repository
git remote add origin https://github.com/nguyengiadat03/edusys-ai.git

# Kiểm tra remote đã được thêm
git remote -v
```

### Option 2: Nếu bạn đã tạo repository với tên khác

```bash
# Thay YOUR_REPO_NAME bằng tên repository của bạn
git remote add origin https://github.com/nguyengiadat03/YOUR_REPO_NAME.git

# Kiểm tra remote đã được thêm
git remote -v
```

## Bước 3: Commit và Push Code

### 3.1. Thêm tất cả files vào staging

```bash
git add .
```

### 3.2. Tạo commit đầu tiên

```bash
git commit -m "Initial commit: Complete documentation rewrite and architecture improvements

- Rewrote all documentation (README, Setup, Architecture, etc.)
- Organized backend structure (tests, scripts, docs)
- Fixed security issues (removed exposed credentials)
- Created comprehensive developer guides
- Added troubleshooting documentation
- Improved developer onboarding experience"
```

### 3.3. Đổi tên branch thành main (nếu cần)

```bash
git branch -M main
```

### 3.4. Push code lên GitHub

```bash
git push -u origin main
```

**Lưu ý:** Lần đầu push, GitHub sẽ yêu cầu bạn đăng nhập:

- **Username:** nguyengiadat03
- **Password:** Sử dụng **Personal Access Token** (không phải password GitHub)

## Bước 4: Tạo Personal Access Token (nếu cần)

Nếu GitHub yêu cầu authentication:

1. Truy cập: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Điền thông tin:
   - **Note:** "EduSys AI Development"
   - **Expiration:** 90 days (hoặc No expiration)
   - **Scopes:** Chọn `repo` (full control of private repositories)
4. Click **"Generate token"**
5. **QUAN TRỌNG:** Copy token ngay (chỉ hiển thị 1 lần)
6. Sử dụng token này làm password khi push

## Bước 5: Lưu Credentials (Optional)

Để không phải nhập token mỗi lần:

```bash
# Lưu credentials trong 1 giờ
git config --global credential.helper cache

# Hoặc lưu vĩnh viễn (Windows)
git config --global credential.helper wincred

# Hoặc lưu vĩnh viễn (macOS)
git config --global credential.helper osxkeychain

# Hoặc lưu vĩnh viễn (Linux)
git config --global credential.helper store
```

## Các Lệnh Git Thường Dùng

### Kiểm tra trạng thái

```bash
git status
```

### Thêm files mới hoặc đã thay đổi

```bash
# Thêm tất cả
git add .

# Thêm file cụ thể
git add README.md

# Thêm folder cụ thể
git add docs/
```

### Commit thay đổi

```bash
git commit -m "Mô tả ngắn gọn về thay đổi"
```

### Push lên GitHub

```bash
# Push branch hiện tại
git push

# Push branch cụ thể
git push origin main
```

### Pull code mới từ GitHub

```bash
git pull origin main
```

### Xem lịch sử commit

```bash
git log

# Hoặc xem ngắn gọn
git log --oneline
```

### Xem thay đổi chưa commit

```bash
git diff
```

### Hủy thay đổi chưa commit

```bash
# Hủy thay đổi 1 file
git checkout -- filename

# Hủy tất cả thay đổi
git checkout -- .
```

## Workflow Hàng Ngày

### Khi bắt đầu làm việc

```bash
# 1. Pull code mới nhất
git pull origin main

# 2. Làm việc và thay đổi code
# ...

# 3. Kiểm tra thay đổi
git status
git diff

# 4. Thêm files đã thay đổi
git add .

# 5. Commit
git commit -m "feat: add new feature"

# 6. Push lên GitHub
git push origin main
```

## Commit Message Conventions

Sử dụng format chuẩn:

```bash
# Thêm tính năng mới
git commit -m "feat: add user authentication"

# Sửa bug
git commit -m "fix: resolve login redirect issue"

# Cập nhật documentation
git commit -m "docs: update API documentation"

# Refactor code
git commit -m "refactor: improve error handling"

# Cải thiện performance
git commit -m "perf: optimize database queries"

# Thêm tests
git commit -m "test: add unit tests for auth service"

# Thay đổi build/config
git commit -m "chore: update dependencies"
```

## Troubleshooting

### Lỗi: "remote origin already exists"

```bash
# Xóa remote cũ
git remote remove origin

# Thêm lại remote mới
git remote add origin https://github.com/nguyengiadat03/YOUR_REPO_NAME.git
```

### Lỗi: "failed to push some refs"

```bash
# Pull code mới trước
git pull origin main --rebase

# Sau đó push lại
git push origin main
```

### Lỗi: "Authentication failed"

- Đảm bảo bạn sử dụng **Personal Access Token** làm password
- Không sử dụng password GitHub thông thường
- Tạo token mới tại: https://github.com/settings/tokens

### Lỗi: "Permission denied"

- Kiểm tra bạn có quyền truy cập repository
- Kiểm tra repository name đúng chưa
- Kiểm tra username đúng chưa

## Kiểm Tra Kết Nối

Sau khi push thành công:

1. Truy cập: https://github.com/nguyengiadat03/YOUR_REPO_NAME
2. Bạn sẽ thấy tất cả code đã được upload
3. Kiểm tra README.md hiển thị đúng
4. Kiểm tra các files và folders

## Bảo Mật

### ⚠️ QUAN TRỌNG: Đảm bảo không commit các file nhạy cảm

Files đã được bảo vệ trong .gitignore:

- ✅ `.env` files (chứa credentials)
- ✅ `node_modules/` (dependencies)
- ✅ `dist/` (build output)
- ✅ `logs/` (log files)

### Kiểm tra trước khi commit:

```bash
# Xem files sẽ được commit
git status

# Xem nội dung thay đổi
git diff

# Đảm bảo không có file .env
git status | grep .env
```

## Next Steps

Sau khi push thành công:

1. **Bảo vệ branch main:**
   - Settings → Branches → Add rule
   - Require pull request reviews

2. **Thêm collaborators:**
   - Settings → Collaborators
   - Invite team members

3. **Setup GitHub Actions:**
   - Tự động test và deploy
   - CI/CD pipeline

4. **Tạo README badges:**
   - Build status
   - Code coverage
   - License

---

**Tạo bởi:** Kiro AI Assistant  
**Ngày:** March 9, 2026  
**Cho:** nguyengiadat03
