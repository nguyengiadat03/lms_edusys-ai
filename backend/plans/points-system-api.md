Tạo REST API cho Points System, Badges, Leaderboards, Quests, Streaks, và Store trong Node.js với:

**Endpoints:**

* **Points System:**
  * GET /api/v1/points/types — danh sách point types
  * POST /api/v1/points/types — tạo point type mới
  * GET /api/v1/points/rules — danh sách point earning rules
  * POST /api/v1/points/rules — tạo point earning rule
  * GET /api/v1/points/balances — user point balances
  * GET /api/v1/points/ledger — point transaction ledger
  * POST /api/v1/points/award — award points cho user
  * POST /api/v1/points/deduct — deduct points từ user

* **Badges & Achievements:**
  * GET /api/v1/badges — danh sách badges
  * POST /api/v1/badges — tạo badge mới
  * GET /api/v1/badges/:id — chi tiết badge
  * PATCH /api/v1/badges/:id — cập nhật badge
  * DELETE /api/v1/badges/:id — xóa badge
  * GET /api/v1/users/:id/badges — danh sách badges của user
  * POST /api/v1/users/:id/badges — award badge cho user

* **Leaderboards:**
  * GET /api/v1/leaderboards — danh sách leaderboards
  * POST /api/v1/leaderboards — tạo leaderboard mới
  * GET /api/v1/leaderboards/:id — leaderboard entries
  * POST /api/v1/leaderboards/:id/reset — reset leaderboard

* **Quests:**
  * GET /api/v1/quests — danh sách quests
  * POST /api/v1/quests — tạo quest mới
  * GET /api/v1/quests/:id — chi tiết quest
  * PATCH /api/v1/quests/:id — cập nhật quest
  * DELETE /api/v1/quests/:id — xóa quest
  * GET /api/v1/users/:id/quests — user quest progress
  * POST /api/v1/users/:id/quests/:questId/complete — complete quest

* **Streaks:**
  * GET /api/v1/users/:id/streaks — user streaks
  * POST /api/v1/streaks/update — cập nhật streak
  * GET /api/v1/streaks/leaderboard — streak leaderboard

* **Store & Rewards:**
  * GET /api/v1/store/items — danh sách store items
  * POST /api/v1/store/items — tạo store item mới
  * GET /api/v1/store/items/:id — chi tiết store item
  * POST /api/v1/store/redeem — redeem store item
  * GET /api/v1/users/:id/redemptions — user redemption history

**Tính năng:**

* Auth (JWT, OAuth, MFA)
* DB + ORM (Prisma)
* Validation + Global Error Handling (Joi, custom middleware)

**Yêu cầu kỹ thuật:**

* Async/await
* Test cơ bản (unit/integration với Jest)
* OpenAPI/Swagger (auto-generated docs)