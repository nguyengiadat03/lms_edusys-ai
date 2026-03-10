import express from "express";
import { body, param, query, validationResult } from "express-validator";
import { createError, asyncHandler } from "../middleware/errorHandler";
import { authenticate, authorize } from "../middleware/auth";
import { auditLogger } from "../utils/logger";
import { curriculumService } from "../services/curriculumService";

const router = express.Router();

// GET /api/v1/kct - List curriculum frameworks
router.get(
  "/",
  [
    authenticate,
    query("status").optional(),
    query("language").optional().isLength({ min: 2, max: 10 }),
    query("age_group").optional().isIn(["kids", "teens", "adults", "all"]),
    query("target_level").optional(),
    query("owner_user_id").optional().isInt(),
    query("campus_id").optional().isInt(),
    query("tag").optional(),
    query("q").optional(),
    query("page").optional().isInt({ min: 1 }),
    query("page_size").optional().isInt({ min: 1, max: 100 }),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(
        "Validation failed",
        "VALIDATION_ERROR",
        422,
        errors.array(),
      );
    }

    const {
      status,
      language,
      age_group,
      target_level,
      owner_user_id,
      campus_id,
      tag,
      q,
      page = 1,
      page_size = 20,
    } = req.query;

    // Parse status parameter - support single value or comma-separated list
    let statusFilter: string[] = [];
    if (status) {
      statusFilter =
        typeof status === "string"
          ? status.split(",").map((s) => s.trim())
          : [String(status)];
    }

    // Validate status values
    const validStatuses = [
      "draft",
      "pending_review",
      "approved",
      "published",
      "archived",
    ];
    for (const s of statusFilter) {
      if (!validStatuses.includes(s)) {
        throw createError(
          `Invalid status value: ${s}`,
          "VALIDATION_ERROR",
          422,
        );
      }
    }

    const user = req.user!;

    // Use Prisma service
    const filters = {
      status: statusFilter.length > 0 ? statusFilter : undefined,
      language: language as string,
      age_group: age_group as string,
      target_level: target_level as string,
      owner_user_id: owner_user_id ? Number(owner_user_id) : undefined,
      campus_id: campus_id ? Number(campus_id) : undefined,
      tag: tag as string,
      q: q as string,
      page: Number(page),
      page_size: Number(page_size),
    };

    const result = await curriculumService.list(
      filters,
      BigInt(user.tenant_id),
    );

    // Language display mapping
    const languageMap: { [key: string]: string } = {
      en: "English",
      jp: "Japanese",
      vi: "Vietnamese",
      zh: "Chinese",
      ko: "Korean",
      fr: "French",
      de: "German",
      es: "Spanish",
    };

    // Add display language to each framework
    const enhancedData = result.data.map((framework) => ({
      ...framework,
      displayLanguage: languageMap[framework.language] || framework.language,
    }));

    res.json({
      data: enhancedData,
      ...result.pagination,
    });
  }),
);

// GET /api/v1/kct/:id - Get curriculum framework details
router.get(
  "/:id",
  [authenticate, param("id").isInt()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(
        "Validation failed",
        "VALIDATION_ERROR",
        422,
        errors.array(),
      );
    }

    const { id } = req.params;
    const user = req.user!;

    const framework = await curriculumService.get(id, BigInt(user.tenant_id));

    res.json({ data: framework });
  }),
);

// POST /api/v1/kct - Create curriculum framework
router.post(
  "/",
  [
    authenticate,
    authorize("curriculum_designer", "program_owner", "admin"),
    body("code")
      .isLength({ min: 1, max: 64 })
      .matches(/^[A-Z0-9-_]+$/),
    body("name").isLength({ min: 1, max: 255 }),
    body("language").isLength({ min: 2, max: 10 }),
    body("target_level").optional(),
    body("age_group").optional().isIn(["kids", "teens", "adults", "all"]),
    body("campus_id").optional().isInt(),
    body("description").optional().isLength({ max: 2000 }),
    body("learning_objectives").optional().isArray(),
    body("prerequisites").optional().isArray(),
    body("assessment_strategy").optional().isLength({ max: 2000 }),
    body("tags").optional().isArray(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(
        "Validation failed",
        "VALIDATION_ERROR",
        422,
        errors.array(),
      );
    }

    const user = req.user!;
    const frameworkData = req.body;

    const framework = await curriculumService.create(
      frameworkData,
      BigInt(user.id),
      BigInt(user.tenant_id),
    );

    // Log audit
    auditLogger.create(
      user.id.toString(),
      "curriculum_framework",
      framework.id.toString(),
      frameworkData,
    );

    res.status(201).json({
      data: {
        id: framework.id.toString(),
        code: framework.code,
        name: framework.name,
        language: framework.language,
        status: framework.status,
        created_at: framework.created_at,
      },
    });
  }),
);

// PATCH /api/v1/kct/:id - Update curriculum framework
router.patch(
  "/:id",
  [
    authenticate,
    authorize("curriculum_designer", "program_owner", "admin"),
    param("id").isInt(),
    body("name").optional().isLength({ min: 1, max: 255 }),
    body("target_level").optional(),
    body("age_group").optional().isIn(["kids", "teens", "adults", "all"]),
    body("campus_id").optional().isInt(),
    body("description").optional().isLength({ max: 2000 }),
    body("learning_objectives").optional().isArray(),
    body("prerequisites").optional().isArray(),
    body("assessment_strategy").optional().isLength({ max: 2000 }),
    body("tags").optional().isArray(),
    body("status")
      .optional()
      .isIn(["draft", "pending_review", "approved", "published", "archived"]),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(
        "Validation failed",
        "VALIDATION_ERROR",
        422,
        errors.array(),
      );
    }

    const { id } = req.params;
    const user = req.user!;
    const updateData = req.body;

    await curriculumService.update(
      id,
      updateData,
      BigInt(user.id),
      BigInt(user.tenant_id),
    );

    // Log audit
    auditLogger.update(
      user.id.toString(),
      "curriculum_framework",
      id,
      updateData,
    );

    res.json({ message: "Curriculum framework updated successfully" });
  }),
);

// DELETE /api/v1/kct/:id - Delete curriculum framework
router.delete(
  "/:id",
  [
    authenticate,
    authorize("curriculum_designer", "program_owner", "admin"),
    param("id").isInt(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(
        "Validation failed",
        "VALIDATION_ERROR",
        422,
        errors.array(),
      );
    }

    const { id } = req.params;
    const user = req.user!;

    await curriculumService.delete(id, BigInt(user.id), BigInt(user.tenant_id));

    // Log audit
    auditLogger.delete(user.id.toString(), "curriculum_framework", id);

    res.json({ message: "Curriculum framework deleted successfully" });
  }),
);

export default router;
