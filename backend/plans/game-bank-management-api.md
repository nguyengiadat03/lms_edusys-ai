Tạo REST API cho Game Bank, Collections, Providers, Sessions, Analytics và Gamification trong Node.js với:

**Endpoints:**

* GET /api/v1/games/bank — game bank với advanced filters + pagination
* POST /api/v1/games/:id/clone — clone game với metadata
* POST /api/v1/games/bulk-import — import games từ file + validate
* POST /api/v1/games/bulk-export — export games sang file
* GET /api/v1/games/:id/versions — version history + diffs
* GET /api/v1/games/collections — danh sách game collections + filters
* POST /api/v1/games/collections — tạo collection mới
* GET /api/v1/games/collections/:id — chi tiết collection
* PATCH /api/v1/games/collections/:id — cập nhật collection
* DELETE /api/v1/games/collections/:id — xóa collection
* GET /api/v1/games/providers — external game providers
* POST /api/v1/games/providers — add provider mới
* GET /api/v1/games/providers/:id/games — games từ provider
* POST /api/v1/games/providers/:id/sync — sync games từ provider
* GET /api/v1/games/:id/sessions — game sessions + pagination
* POST /api/v1/games/:id/play — start game session
* PATCH /api/v1/games/sessions/:sessionId — update session progress
* POST /api/v1/games/sessions/:sessionId/complete — complete session
* GET /api/v1/games/:id/attempts — game attempts + stats
* GET /api/v1/games/:id/scores — high scores + rankings
* GET /api/v1/games/:id/analytics — game analytics + metrics
* GET /api/v1/games/:id/engagement — engagement metrics
* GET /api/v1/games/trending — trending games
* GET /api/v1/games/:id/leaderboard — game leaderboard + rankings
* POST /api/v1/games/:id/leaderboard/reset — reset leaderboard
* GET /api/v1/games/:id/achievements — game achievements
* POST /api/v1/games/:id/achievements — add achievement mới

**Tính năng:**

* Auth (JWT, OAuth, MFA)
* DB + ORM (Prisma)
* Validation + Global Error Handling (Joi, custom middleware)

**Yêu cầu kỹ thuật:**

* Async/await
* Test cơ bản (unit/integration với Jest)
* OpenAPI/Swagger (auto-generated docs)