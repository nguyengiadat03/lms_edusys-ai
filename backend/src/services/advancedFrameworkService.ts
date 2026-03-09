import { PrismaClient } from '@prisma/client';
import { AIService } from './aiService';
import { emailService } from './emailService';

const prisma = new PrismaClient();

export class AdvancedFrameworkService {
  /**
   * Clone framework với options
   */
  static async cloneFramework(params: {
    sourceId: bigint;
    name: string;
    code: string;
    description?: string;
    copyOptions: {
      courses: boolean;
      units: boolean;
      resources: boolean;
    };
    tenantId: bigint;
    userId: bigint;
  }) {
    try {
      const { sourceId, name, code, description, copyOptions, tenantId, userId } = params;

      // Get source framework with related data
      const sourceFramework = await prisma.curriculum_frameworks.findUnique({
        where: { id: sourceId },
        include: {
          curriculum_framework_versions: {
            where: { state: 'published' },
            include: {
              course_blueprints: copyOptions.courses ? {
                include: {
                  unit_blueprints: copyOptions.units ? true : false
                }
              } : false
            },
            orderBy: { created_at: 'desc' },
            take: 1
          }
        }
      });

      if (!sourceFramework) {
        throw new Error('Source framework not found');
      }

      // Create new framework
      const clonedFramework = await prisma.curriculum_frameworks.create({
        data: {
          tenant_id: tenantId,
          code,
          name,
          description: description || `Cloned from ${sourceFramework.name}`,
          language: sourceFramework.language,
          target_level: sourceFramework.target_level,
          age_group: sourceFramework.age_group,
          total_hours: sourceFramework.total_hours,
          status: 'draft',
          owner_user_id: userId,
          learning_objectives: sourceFramework.learning_objectives,
          prerequisites: sourceFramework.prerequisites,
          assessment_strategy: sourceFramework.assessment_strategy,
          created_by: userId,
          updated_by: userId
        }
      });

      // Create initial version
      const clonedVersion = await prisma.curriculum_framework_versions.create({
        data: {
          framework_id: clonedFramework.id,
          version_no: '1.0.0',
          state: 'draft',
          changelog: `Cloned from ${sourceFramework.name}`,
          created_by: userId,
          updated_by: userId
        }
      });

      // Clone courses if requested
      if (copyOptions.courses && sourceFramework.curriculum_framework_versions[0]?.course_blueprints) {
        for (const sourceCourse of sourceFramework.curriculum_framework_versions[0].course_blueprints) {
          const clonedCourse = await prisma.course_blueprints.create({
            data: {
              version_id: clonedVersion.id,
              code: sourceCourse.code,
              title: sourceCourse.title,
              subtitle: sourceCourse.subtitle,
              level: sourceCourse.level,
              hours: sourceCourse.hours,
              order_index: sourceCourse.order_index,
              summary: sourceCourse.summary,
              learning_outcomes: sourceCourse.learning_outcomes,
              assessment_types: sourceCourse.assessment_types,
              prerequisites: sourceCourse.prerequisites,
              created_by: userId,
              updated_by: userId
            }
          });

          // Clone units if requested
          if (copyOptions.units && sourceCourse.unit_blueprints) {
            for (const sourceUnit of sourceCourse.unit_blueprints) {
              await prisma.unit_blueprints.create({
                data: {
                  course_blueprint_id: clonedCourse.id,
                  code: sourceUnit.code,
                  title: sourceUnit.title,
                  order_index: sourceUnit.order_index,
                  hours: sourceUnit.hours,
                  objectives: sourceUnit.objectives,
                  content_outline: sourceUnit.content_outline,
                  activities: sourceUnit.activities,
                  resources: copyOptions.resources ? sourceUnit.resources : null,
                  assessment: sourceUnit.assessment,
                  homework: sourceUnit.homework,
                  created_by: userId,
                  updated_by: userId
                }
              });
            }
          }
        }
      }

      return {
        framework: clonedFramework,
        version: clonedVersion,
        cloned_courses: copyOptions.courses ? sourceFramework.curriculum_framework_versions[0]?.course_blueprints?.length || 0 : 0,
        cloned_units: copyOptions.units ? 'calculated_based_on_courses' : 0
      };
    } catch (error) {
      throw new Error(`Lỗi khi clone framework: ${error.message}`);
    }
  }

  /**
   * Create export job
   */
  static async createExportJob(params: {
    frameworkId: bigint;
    format: string;
    options: {
      includeCourses: boolean;
      includeUnits: boolean;
      includeResources: boolean;
      template?: string;
    };
    userId: bigint;
  }) {
    try {
      const { frameworkId, format, options, userId } = params;

      // Create export job record
      const exportJob = {
        id: Date.now(), // Mock ID
        framework_id: frameworkId,
        format,
        options,
        status: 'queued',
        created_by: userId,
        created_at: new Date(),
        estimated_completion: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      };

      // In real implementation, queue the export job
      this.processExportJob(exportJob).catch(console.error);

      return exportJob;
    } catch (error) {
      throw new Error(`Lỗi khi tạo export job: ${error.message}`);
    }
  }

  /**
   * Create import job
   */
  static async createImportJob(params: {
    mergeStrategy: string;
    validateOnly: boolean;
    tenantId: bigint;
    userId: bigint;
  }) {
    try {
      const { mergeStrategy, validateOnly, tenantId, userId } = params;

      // Create import job record
      const importJob = {
        id: Date.now(), // Mock ID
        merge_strategy: mergeStrategy,
        validate_only: validateOnly,
        tenant_id: tenantId,
        status: 'queued',
        validation_results: {
          valid: true,
          warnings: [],
          errors: []
        },
        created_by: userId,
        created_at: new Date()
      };

      // In real implementation, process the import
      if (!validateOnly) {
        this.processImportJob(importJob).catch(console.error);
      }

      return importJob;
    } catch (error) {
      throw new Error(`Lỗi khi tạo import job: ${error.message}`);
    }
  }

  /**
   * Compare two frameworks
   */
  static async compareFrameworks(frameworkId1: bigint, frameworkId2: bigint) {
    try {
      // Get both frameworks with their latest versions
      const [framework1, framework2] = await Promise.all([
        prisma.curriculum_frameworks.findUnique({
          where: { id: frameworkId1 },
          include: {
            curriculum_framework_versions: {
              where: { state: 'published' },
              include: {
                course_blueprints: {
                  include: {
                    unit_blueprints: true
                  }
                }
              },
              orderBy: { created_at: 'desc' },
              take: 1
            }
          }
        }),
        prisma.curriculum_frameworks.findUnique({
          where: { id: frameworkId2 },
          include: {
            curriculum_framework_versions: {
              where: { state: 'published' },
              include: {
                course_blueprints: {
                  include: {
                    unit_blueprints: true
                  }
                }
              },
              orderBy: { created_at: 'desc' },
              take: 1
            }
          }
        })
      ]);

      if (!framework1 || !framework2) {
        throw new Error('One or both frameworks not found');
      }

      const version1 = framework1.curriculum_framework_versions[0];
      const version2 = framework2.curriculum_framework_versions[0];

      // Compare basic info
      const basicComparison = {
        name: {
          framework1: framework1.name,
          framework2: framework2.name,
          different: framework1.name !== framework2.name
        },
        language: {
          framework1: framework1.language,
          framework2: framework2.language,
          different: framework1.language !== framework2.language
        },
        target_level: {
          framework1: framework1.target_level,
          framework2: framework2.target_level,
          different: framework1.target_level !== framework2.target_level
        },
        total_hours: {
          framework1: framework1.total_hours,
          framework2: framework2.total_hours,
          different: framework1.total_hours !== framework2.total_hours
        }
      };

      // Compare courses
      const courses1 = version1?.course_blueprints || [];
      const courses2 = version2?.course_blueprints || [];

      const courseComparison = {
        count: {
          framework1: courses1.length,
          framework2: courses2.length,
          different: courses1.length !== courses2.length
        },
        courses: this.compareCourses(courses1, courses2)
      };

      // Calculate similarity score
      const similarityScore = this.calculateSimilarityScore(framework1, framework2);

      return {
        basic: basicComparison,
        courses: courseComparison,
        similarity_score: similarityScore,
        summary: {
          total_differences: this.countDifferences(basicComparison, courseComparison),
          recommendation: similarityScore > 0.8 ? 'high_similarity' : similarityScore > 0.5 ? 'moderate_similarity' : 'low_similarity'
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi compare frameworks: ${error.message}`);
    }
  }  /**

   * Merge frameworks
   */
  static async mergeFrameworks(params: {
    targetId: bigint;
    sourceId: bigint;
    conflictResolution: string;
    options: {
      mergeCourses: boolean;
      mergeUnits: boolean;
    };
    userId: bigint;
  }) {
    try {
      const { targetId, sourceId, conflictResolution, options, userId } = params;

      // Get both frameworks
      const [targetFramework, sourceFramework] = await Promise.all([
        prisma.curriculum_frameworks.findUnique({
          where: { id: targetId },
          include: {
            curriculum_framework_versions: {
              where: { state: 'draft' },
              include: {
                course_blueprints: {
                  include: {
                    unit_blueprints: true
                  }
                }
              },
              orderBy: { created_at: 'desc' },
              take: 1
            }
          }
        }),
        prisma.curriculum_frameworks.findUnique({
          where: { id: sourceId },
          include: {
            curriculum_framework_versions: {
              where: { state: 'published' },
              include: {
                course_blueprints: {
                  include: {
                    unit_blueprints: true
                  }
                }
              },
              orderBy: { created_at: 'desc' },
              take: 1
            }
          }
        })
      ]);

      if (!targetFramework || !sourceFramework) {
        throw new Error('Target or source framework not found');
      }

      const targetVersion = targetFramework.curriculum_framework_versions[0];
      const sourceVersion = sourceFramework.curriculum_framework_versions[0];

      if (!targetVersion) {
        throw new Error('No draft version found for target framework');
      }

      // Merge courses if requested
      let mergedCourses = 0;
      let mergedUnits = 0;
      const conflicts = [];

      if (options.mergeCourses && sourceVersion?.course_blueprints) {
        for (const sourceCourse of sourceVersion.course_blueprints) {
          // Check for existing course with same code
          const existingCourse = await prisma.course_blueprints.findFirst({
            where: {
              version_id: targetVersion.id,
              code: sourceCourse.code
            }
          });

          if (existingCourse) {
            conflicts.push({
              type: 'course',
              code: sourceCourse.code,
              title: sourceCourse.title,
              resolution: conflictResolution
            });

            if (conflictResolution === 'source') {
              // Update existing course with source data
              await prisma.course_blueprints.update({
                where: { id: existingCourse.id },
                data: {
                  title: sourceCourse.title,
                  subtitle: sourceCourse.subtitle,
                  level: sourceCourse.level,
                  hours: sourceCourse.hours,
                  summary: sourceCourse.summary,
                  learning_outcomes: sourceCourse.learning_outcomes,
                  assessment_types: sourceCourse.assessment_types,
                  prerequisites: sourceCourse.prerequisites,
                  updated_by: userId,
                  updated_at: new Date()
                }
              });
              mergedCourses++;
            }
          } else {
            // Create new course
            const newCourse = await prisma.course_blueprints.create({
              data: {
                version_id: targetVersion.id,
                code: sourceCourse.code,
                title: sourceCourse.title,
                subtitle: sourceCourse.subtitle,
                level: sourceCourse.level,
                hours: sourceCourse.hours,
                order_index: sourceCourse.order_index,
                summary: sourceCourse.summary,
                learning_outcomes: sourceCourse.learning_outcomes,
                assessment_types: sourceCourse.assessment_types,
                prerequisites: sourceCourse.prerequisites,
                created_by: userId,
                updated_by: userId
              }
            });
            mergedCourses++;

            // Merge units if requested
            if (options.mergeUnits && sourceCourse.unit_blueprints) {
              for (const sourceUnit of sourceCourse.unit_blueprints) {
                await prisma.unit_blueprints.create({
                  data: {
                    course_blueprint_id: newCourse.id,
                    code: sourceUnit.code,
                    title: sourceUnit.title,
                    order_index: sourceUnit.order_index,
                    hours: sourceUnit.hours,
                    objectives: sourceUnit.objectives,
                    content_outline: sourceUnit.content_outline,
                    activities: sourceUnit.activities,
                    resources: sourceUnit.resources,
                    assessment: sourceUnit.assessment,
                    homework: sourceUnit.homework,
                    created_by: userId,
                    updated_by: userId
                  }
                });
                mergedUnits++;
              }
            }
          }
        }
      }

      return {
        merged_courses: mergedCourses,
        merged_units: mergedUnits,
        conflicts: conflicts,
        summary: {
          total_merged: mergedCourses + mergedUnits,
          conflicts_count: conflicts.length,
          status: 'completed'
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi merge frameworks: ${error.message}`);
    }
  }

  /**
   * Get framework dependencies
   */
  static async getFrameworkDependencies(frameworkId: bigint) {
    try {
      // Get classes using this framework
      const classes = await prisma.classes.findMany({
        where: {
          course_blueprint_id: {
            in: await prisma.course_blueprints.findMany({
              where: {
                curriculum_framework_versions: {
                  framework_id: frameworkId
                }
              },
              select: { id: true }
            }).then(courses => courses.map(c => c.id))
          }
        },
        select: {
          id: true,
          name: true,
          status: true,
          start_date: true,
          end_date: true
        }
      });

      // Get assignments linked to this framework
      const assignments = await prisma.assignments.count({
        where: {
          // This would need proper linking in the schema
          // For now, return mock data
        }
      });

      return {
        classes: {
          total: classes.length,
          active: classes.filter(c => c.status === 'active').length,
          list: classes
        },
        assignments: {
          total: assignments
        },
        can_delete: classes.length === 0 && assignments === 0,
        warnings: classes.length > 0 ? ['Framework is being used by active classes'] : []
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy dependencies: ${error.message}`);
    }
  }

  /**
   * Validate framework structure
   */
  static async validateFramework(frameworkId: bigint) {
    try {
      const framework = await prisma.curriculum_frameworks.findUnique({
        where: { id: frameworkId },
        include: {
          curriculum_framework_versions: {
            where: { state: { in: ['draft', 'published'] } },
            include: {
              course_blueprints: {
                include: {
                  unit_blueprints: true
                }
              }
            },
            orderBy: { created_at: 'desc' },
            take: 1
          }
        }
      });

      if (!framework) {
        throw new Error('Framework not found');
      }

      const version = framework.curriculum_framework_versions[0];
      const errors = [];
      const warnings = [];
      const suggestions = [];

      // Basic validation
      if (!framework.name || framework.name.trim().length === 0) {
        errors.push('Framework name is required');
      }

      if (!framework.language) {
        errors.push('Language is required');
      }

      if (!framework.target_level) {
        warnings.push('Target level is not specified');
      }

      // Version validation
      if (!version) {
        errors.push('No version found');
        return { valid: false, errors, warnings, suggestions };
      }

      // Course validation
      const courses = version.course_blueprints || [];
      if (courses.length === 0) {
        warnings.push('No courses defined');
      }

      let totalHours = 0;
      for (const course of courses) {
        if (!course.title || course.title.trim().length === 0) {
          errors.push(`Course ${course.code} is missing title`);
        }

        if (!course.learning_outcomes) {
          warnings.push(`Course ${course.code} has no learning outcomes`);
        }

        totalHours += course.hours;

        // Unit validation
        const units = course.unit_blueprints || [];
        if (units.length === 0) {
          warnings.push(`Course ${course.code} has no units`);
        }

        for (const unit of units) {
          if (!unit.title || unit.title.trim().length === 0) {
            errors.push(`Unit ${unit.code} in course ${course.code} is missing title`);
          }

          if (!unit.objectives) {
            warnings.push(`Unit ${unit.code} has no objectives`);
          }
        }
      }

      // Hour validation
      if (framework.total_hours !== totalHours) {
        warnings.push(`Total hours mismatch: framework (${framework.total_hours}) vs calculated (${totalHours})`);
        suggestions.push('Update framework total hours to match course hours');
      }

      // CEFR alignment check
      if (framework.language === 'English' && !framework.target_level) {
        suggestions.push('Consider adding CEFR level alignment for English curriculum');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        suggestions,
        statistics: {
          courses: courses.length,
          units: courses.reduce((sum, c) => sum + (c.unit_blueprints?.length || 0), 0),
          total_hours: totalHours,
          completeness_score: this.calculateCompletenessScore(framework, version)
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi validate framework: ${error.message}`);
    }
  }

  /**
   * Get CEFR mapping
   */
  static async getCEFRMapping(frameworkId: bigint) {
    try {
      // Get KCT mappings
      const mappings = await prisma.kct_mappings.findMany({
        where: {
          curriculum_framework_id: frameworkId
        },
        include: {
          course_blueprints: {
            select: {
              id: true,
              code: true,
              title: true
            }
          },
          unit_blueprints: {
            select: {
              id: true,
              code: true,
              title: true
            }
          }
        }
      });

      // Group by CEFR level
      const cefrMatrix = {
        A1: { courses: [], units: [], skills: { listening: 0, reading: 0, speaking: 0, writing: 0 } },
        A2: { courses: [], units: [], skills: { listening: 0, reading: 0, speaking: 0, writing: 0 } },
        B1: { courses: [], units: [], skills: { listening: 0, reading: 0, speaking: 0, writing: 0 } },
        B2: { courses: [], units: [], skills: { listening: 0, reading: 0, speaking: 0, writing: 0 } },
        C1: { courses: [], units: [], skills: { listening: 0, reading: 0, speaking: 0, writing: 0 } },
        C2: { courses: [], units: [], skills: { listening: 0, reading: 0, speaking: 0, writing: 0 } }
      };

      for (const mapping of mappings) {
        const level = mapping.cefr_level;
        if (cefrMatrix[level]) {
          if (mapping.course_blueprints) {
            cefrMatrix[level].courses.push(mapping.course_blueprints);
          }
          if (mapping.unit_blueprints) {
            cefrMatrix[level].units.push(mapping.unit_blueprints);
          }
          
          // Count skills
          const skills = mapping.skills as string[] || [];
          skills.forEach(skill => {
            if (cefrMatrix[level].skills[skill] !== undefined) {
              cefrMatrix[level].skills[skill]++;
            }
          });
        }
      }

      return {
        matrix: cefrMatrix,
        statistics: {
          total_mappings: mappings.length,
          mapped_courses: new Set(mappings.filter(m => m.course_blueprint_id).map(m => m.course_blueprint_id)).size,
          mapped_units: new Set(mappings.filter(m => m.unit_blueprint_id).map(m => m.unit_blueprint_id)).size,
          coverage_by_level: Object.keys(cefrMatrix).reduce((acc, level) => {
            acc[level] = cefrMatrix[level].courses.length + cefrMatrix[level].units.length;
            return acc;
          }, {})
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy CEFR mapping: ${error.message}`);
    }
  }

  /**
   * Update CEFR mapping
   */
  static async updateCEFRMapping(frameworkId: bigint, mappings: any[], userId: bigint) {
    try {
      // Delete existing mappings
      await prisma.kct_mappings.deleteMany({
        where: { curriculum_framework_id: frameworkId }
      });

      // Create new mappings
      const createdMappings = [];
      for (const mapping of mappings) {
        const created = await prisma.kct_mappings.create({
          data: {
            curriculum_framework_id: frameworkId,
            course_blueprint_id: mapping.course_id,
            unit_blueprint_id: mapping.unit_id,
            cefr_level: mapping.cefr_level,
            skills: mapping.skills,
            confidence_score: mapping.confidence,
            created_by: userId,
            updated_by: userId
          }
        });
        createdMappings.push(created);
      }

      return {
        updated_mappings: createdMappings.length,
        mappings: createdMappings
      };
    } catch (error) {
      throw new Error(`Lỗi khi update CEFR mapping: ${error.message}`);
    }
  }

  /**
   * Get coverage analysis
   */
  static async getCoverageAnalysis(frameworkId: bigint) {
    try {
      const framework = await prisma.curriculum_frameworks.findUnique({
        where: { id: frameworkId },
        include: {
          curriculum_framework_versions: {
            where: { state: { in: ['draft', 'published'] } },
            include: {
              course_blueprints: {
                include: {
                  unit_blueprints: true
                }
              }
            },
            orderBy: { created_at: 'desc' },
            take: 1
          }
        }
      });

      if (!framework || !framework.curriculum_framework_versions[0]) {
        throw new Error('Framework or version not found');
      }

      const version = framework.curriculum_framework_versions[0];
      const courses = version.course_blueprints || [];

      // Calculate coverage metrics
      const totalCourses = courses.length;
      const totalUnits = courses.reduce((sum, c) => sum + (c.unit_blueprints?.length || 0), 0);
      
      // Course completeness
      const coursesWithObjectives = courses.filter(c => c.learning_outcomes).length;
      const coursesWithAssessment = courses.filter(c => c.assessment_types).length;
      
      // Unit completeness
      let unitsWithObjectives = 0;
      let unitsWithContent = 0;
      let unitsWithActivities = 0;
      let unitsWithAssessment = 0;
      
      courses.forEach(course => {
        (course.unit_blueprints || []).forEach(unit => {
          if (unit.objectives) unitsWithObjectives++;
          if (unit.content_outline) unitsWithContent++;
          if (unit.activities) unitsWithActivities++;
          if (unit.assessment) unitsWithAssessment++;
        });
      });

      // CEFR coverage
      const cefrMappings = await prisma.kct_mappings.count({
        where: { curriculum_framework_id: frameworkId }
      });

      const coverageScore = this.calculateCoverageScore({
        totalCourses,
        totalUnits,
        coursesWithObjectives,
        coursesWithAssessment,
        unitsWithObjectives,
        unitsWithContent,
        unitsWithActivities,
        unitsWithAssessment,
        cefrMappings
      });

      return {
        overall_score: coverageScore,
        courses: {
          total: totalCourses,
          with_objectives: coursesWithObjectives,
          with_assessment: coursesWithAssessment,
          completeness: totalCourses > 0 ? (coursesWithObjectives / totalCourses) * 100 : 0
        },
        units: {
          total: totalUnits,
          with_objectives: unitsWithObjectives,
          with_content: unitsWithContent,
          with_activities: unitsWithActivities,
          with_assessment: unitsWithAssessment,
          completeness: totalUnits > 0 ? (unitsWithObjectives / totalUnits) * 100 : 0
        },
        cefr: {
          mapped_items: cefrMappings,
          coverage: cefrMappings > 0 ? 'partial' : 'none'
        },
        recommendations: this.generateCoverageRecommendations({
          totalCourses,
          totalUnits,
          coursesWithObjectives,
          unitsWithObjectives,
          cefrMappings
        })
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy coverage analysis: ${error.message}`);
    }
  }

  /**
   * Get AI suggestions
   */
  static async getAISuggestions(params: {
    frameworkId: bigint;
    focusAreas?: string[];
    targetLevel?: string;
    language?: string;
  }) {
    try {
      const { frameworkId, focusAreas, targetLevel, language } = params;

      // Get framework data for analysis
      const framework = await prisma.curriculum_frameworks.findUnique({
        where: { id: frameworkId },
        include: {
          curriculum_framework_versions: {
            where: { state: { in: ['draft', 'published'] } },
            include: {
              course_blueprints: {
                include: {
                  unit_blueprints: true
                }
              }
            },
            orderBy: { created_at: 'desc' },
            take: 1
          }
        }
      });

      if (!framework) {
        throw new Error('Framework not found');
      }

      // Mock AI suggestions - in real implementation, use AI service
      const suggestions = {
        structure: [
          {
            type: 'course_organization',
            priority: 'high',
            suggestion: 'Consider reorganizing courses by difficulty progression',
            details: 'Current course sequence may benefit from clearer skill building progression',
            confidence: 0.85
          },
          {
            type: 'unit_balance',
            priority: 'medium',
            suggestion: 'Some courses have uneven unit distribution',
            details: 'Course 2 has significantly more units than others, consider balancing',
            confidence: 0.72
          }
        ],
        content: [
          {
            type: 'learning_outcomes',
            priority: 'high',
            suggestion: 'Add more specific, measurable learning outcomes',
            details: 'Current outcomes could be more action-oriented and measurable',
            confidence: 0.90
          },
          {
            type: 'content_gaps',
            priority: 'medium',
            suggestion: 'Consider adding practical application activities',
            details: 'More hands-on activities would enhance learning engagement',
            confidence: 0.78
          }
        ],
        cefr_alignment: targetLevel ? [
          {
            type: 'level_alignment',
            priority: 'high',
            suggestion: `Align content with ${targetLevel} level requirements`,
            details: `Some units may be too advanced/basic for ${targetLevel} level`,
            confidence: 0.88
          }
        ] : [],
        assessment: [
          {
            type: 'assessment_variety',
            priority: 'medium',
            suggestion: 'Diversify assessment methods',
            details: 'Include more formative assessment opportunities',
            confidence: 0.75
          }
        ],
        resources: [
          {
            type: 'resource_enhancement',
            priority: 'low',
            suggestion: 'Add multimedia resources',
            details: 'Consider adding video and interactive content',
            confidence: 0.65
          }
        ]
      };

      // Filter by focus areas if specified
      const filteredSuggestions = {};
      if (focusAreas && focusAreas.length > 0) {
        focusAreas.forEach(area => {
          if (suggestions[area]) {
            filteredSuggestions[area] = suggestions[area];
          }
        });
      } else {
        Object.assign(filteredSuggestions, suggestions);
      }

      return {
        suggestions: filteredSuggestions,
        summary: {
          total_suggestions: Object.values(filteredSuggestions).flat().length,
          high_priority: Object.values(filteredSuggestions).flat().filter(s => s.priority === 'high').length,
          average_confidence: Object.values(filteredSuggestions).flat().reduce((sum, s) => sum + s.confidence, 0) / Object.values(filteredSuggestions).flat().length
        },
        generated_at: new Date(),
        parameters: {
          focus_areas: focusAreas,
          target_level: targetLevel,
          language: language || framework.language
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy AI suggestions: ${error.message}`);
    }
  }

  // Helper methods
  private static compareCourses(courses1: any[], courses2: any[]) {
    const comparison = {
      only_in_framework1: [],
      only_in_framework2: [],
      common: [],
      different: []
    };

    const codes1 = new Set(courses1.map(c => c.code));
    const codes2 = new Set(courses2.map(c => c.code));

    // Find courses only in framework1
    courses1.forEach(course => {
      if (!codes2.has(course.code)) {
        comparison.only_in_framework1.push(course);
      }
    });

    // Find courses only in framework2
    courses2.forEach(course => {
      if (!codes1.has(course.code)) {
        comparison.only_in_framework2.push(course);
      }
    });

    // Find common and different courses
    courses1.forEach(course1 => {
      const course2 = courses2.find(c => c.code === course1.code);
      if (course2) {
        if (course1.title === course2.title && course1.hours === course2.hours) {
          comparison.common.push({ course1, course2, identical: true });
        } else {
          comparison.different.push({ course1, course2, differences: this.findCourseDifferences(course1, course2) });
        }
      }
    });

    return comparison;
  }

  private static findCourseDifferences(course1: any, course2: any) {
    const differences = [];
    if (course1.title !== course2.title) differences.push('title');
    if (course1.hours !== course2.hours) differences.push('hours');
    if (course1.level !== course2.level) differences.push('level');
    return differences;
  }

  private static calculateSimilarityScore(framework1: any, framework2: any) {
    let score = 0;
    let factors = 0;

    // Language similarity
    if (framework1.language === framework2.language) score += 0.2;
    factors++;

    // Level similarity
    if (framework1.target_level === framework2.target_level) score += 0.2;
    factors++;

    // Hours similarity
    const hoursDiff = Math.abs(framework1.total_hours - framework2.total_hours);
    const hoursScore = Math.max(0, 1 - (hoursDiff / Math.max(framework1.total_hours, framework2.total_hours)));
    score += hoursScore * 0.3;
    factors++;

    // Age group similarity
    if (framework1.age_group === framework2.age_group) score += 0.3;
    factors++;

    return score / factors;
  }

  private static countDifferences(basicComparison: any, courseComparison: any) {
    let count = 0;
    Object.values(basicComparison).forEach((item: any) => {
      if (item.different) count++;
    });
    count += courseComparison.courses.only_in_framework1.length;
    count += courseComparison.courses.only_in_framework2.length;
    count += courseComparison.courses.different.length;
    return count;
  }

  private static calculateCompletenessScore(framework: any, version: any) {
    let score = 0;
    let maxScore = 0;

    // Basic info completeness
    if (framework.name) score += 10;
    if (framework.description) score += 5;
    if (framework.language) score += 10;
    if (framework.target_level) score += 10;
    if (framework.learning_objectives) score += 15;
    maxScore += 50;

    // Course completeness
    const courses = version.course_blueprints || [];
    if (courses.length > 0) {
      score += 20;
      const courseScore = courses.reduce((sum, course) => {
        let cScore = 0;
        if (course.title) cScore += 2;
        if (course.learning_outcomes) cScore += 3;
        if (course.assessment_types) cScore += 2;
        if (course.unit_blueprints && course.unit_blueprints.length > 0) cScore += 3;
        return sum + cScore;
      }, 0);
      score += Math.min(30, courseScore);
    }
    maxScore += 50;

    return Math.round((score / maxScore) * 100);
  }

  private static calculateCoverageScore(metrics: any) {
    const weights = {
      courseObjectives: 0.2,
      courseAssessment: 0.15,
      unitObjectives: 0.25,
      unitContent: 0.2,
      unitActivities: 0.1,
      unitAssessment: 0.1
    };

    let score = 0;
    if (metrics.totalCourses > 0) {
      score += (metrics.coursesWithObjectives / metrics.totalCourses) * weights.courseObjectives;
      score += (metrics.coursesWithAssessment / metrics.totalCourses) * weights.courseAssessment;
    }

    if (metrics.totalUnits > 0) {
      score += (metrics.unitsWithObjectives / metrics.totalUnits) * weights.unitObjectives;
      score += (metrics.unitsWithContent / metrics.totalUnits) * weights.unitContent;
      score += (metrics.unitsWithActivities / metrics.totalUnits) * weights.unitActivities;
      score += (metrics.unitsWithAssessment / metrics.totalUnits) * weights.unitAssessment;
    }

    return Math.round(score * 100);
  }

  private static generateCoverageRecommendations(metrics: any) {
    const recommendations = [];

    if (metrics.totalCourses === 0) {
      recommendations.push('Add courses to the curriculum framework');
    } else {
      if (metrics.coursesWithObjectives < metrics.totalCourses) {
        recommendations.push('Add learning outcomes to all courses');
      }
    }

    if (metrics.totalUnits === 0) {
      recommendations.push('Add units to courses');
    } else {
      if (metrics.unitsWithObjectives < metrics.totalUnits) {
        recommendations.push('Define objectives for all units');
      }
    }

    if (metrics.cefrMappings === 0) {
      recommendations.push('Add CEFR level mappings for better alignment');
    }

    return recommendations;
  }

  // Background processing methods
  private static async processExportJob(job: any) {
    // Mock export processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`Export job ${job.id} completed`);
  }

  private static async processImportJob(job: any) {
    // Mock import processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log(`Import job ${job.id} completed`);
  }

  // Additional methods for version control, deployment, etc.
  static async publishVersion(params: {
    versionId: bigint;
    userId: bigint;
    publishNotes?: string;
  }) {
    try {
      const { versionId, userId, publishNotes } = params;

      // Update version state to published
      const publishedVersion = await prisma.curriculum_framework_versions.update({
        where: { id: versionId },
        data: {
          state: 'published',
          published_at: new Date(),
          published_by: userId,
          updated_by: userId,
          changelog: publishNotes || 'Version published'
        }
      });

      return {
        status: 'published',
        published_at: publishedVersion.published_at,
        version: publishedVersion
      };
    } catch (error) {
      throw new Error(`Lỗi khi publish version: ${error.message}`);
    }
  }

  static async archiveVersion(versionId: bigint, reason: string, userId: bigint) {
    try {
      const archivedVersion = await prisma.curriculum_framework_versions.update({
        where: { id: versionId },
        data: {
          state: 'archived',
          archived_at: new Date(),
          archived_by: userId,
          updated_by: userId,
          changelog: `Archived: ${reason}`
        }
      });

      return {
        status: 'archived',
        archived_at: archivedVersion.archived_at,
        reason,
        version: archivedVersion
      };
    } catch (error) {
      throw new Error(`Lỗi khi archive version: ${error.message}`);
    }
  }

  static async rollbackToVersion(versionId: bigint, userId: bigint) {
    try {
      // Get the version to rollback to
      const targetVersion = await prisma.curriculum_framework_versions.findUnique({
        where: { id: versionId },
        include: {
          course_blueprints: {
            include: {
              unit_blueprints: true
            }
          }
        }
      });

      if (!targetVersion) {
        throw new Error('Target version not found');
      }

      // Create new version based on target version
      const newVersion = await prisma.curriculum_framework_versions.create({
        data: {
          framework_id: targetVersion.framework_id,
          version_no: `${targetVersion.version_no}-rollback-${Date.now()}`,
          state: 'draft',
          changelog: `Rolled back to version ${targetVersion.version_no}`,
          created_by: userId,
          updated_by: userId
        }
      });

      // Copy courses and units
      for (const course of targetVersion.course_blueprints) {
        const newCourse = await prisma.course_blueprints.create({
          data: {
            version_id: newVersion.id,
            code: course.code,
            title: course.title,
            subtitle: course.subtitle,
            level: course.level,
            hours: course.hours,
            order_index: course.order_index,
            summary: course.summary,
            learning_outcomes: course.learning_outcomes,
            assessment_types: course.assessment_types,
            prerequisites: course.prerequisites,
            created_by: userId,
            updated_by: userId
          }
        });

        for (const unit of course.unit_blueprints) {
          await prisma.unit_blueprints.create({
            data: {
              course_blueprint_id: newCourse.id,
              code: unit.code,
              title: unit.title,
              order_index: unit.order_index,
              hours: unit.hours,
              objectives: unit.objectives,
              content_outline: unit.content_outline,
              activities: unit.activities,
              resources: unit.resources,
              assessment: unit.assessment,
              homework: unit.homework,
              created_by: userId,
              updated_by: userId
            }
          });
        }
      }

      return {
        status: 'rolled_back',
        rolled_back_at: new Date(),
        new_version: newVersion,
        source_version: targetVersion
      };
    } catch (error) {
      throw new Error(`Lỗi khi rollback version: ${error.message}`);
    }
  }

  static async getVersionDiff(versionId1: bigint, versionId2: bigint) {
    try {
      const [version1, version2] = await Promise.all([
        prisma.curriculum_framework_versions.findUnique({
          where: { id: versionId1 },
          include: {
            course_blueprints: {
              include: {
                unit_blueprints: true
              }
            }
          }
        }),
        prisma.curriculum_framework_versions.findUnique({
          where: { id: versionId2 },
          include: {
            course_blueprints: {
              include: {
                unit_blueprints: true
              }
            }
          }
        })
      ]);

      if (!version1 || !version2) {
        throw new Error('One or both versions not found');
      }

      const differences = [];

      // Compare courses
      const courses1 = version1.course_blueprints || [];
      const courses2 = version2.course_blueprints || [];

      const courseComparison = this.compareCourses(courses1, courses2);
      
      if (courseComparison.only_in_framework1.length > 0) {
        differences.push({
          type: 'courses_removed',
          count: courseComparison.only_in_framework1.length,
          items: courseComparison.only_in_framework1.map(c => ({ code: c.code, title: c.title }))
        });
      }

      if (courseComparison.only_in_framework2.length > 0) {
        differences.push({
          type: 'courses_added',
          count: courseComparison.only_in_framework2.length,
          items: courseComparison.only_in_framework2.map(c => ({ code: c.code, title: c.title }))
        });
      }

      if (courseComparison.different.length > 0) {
        differences.push({
          type: 'courses_modified',
          count: courseComparison.different.length,
          items: courseComparison.different.map(d => ({
            code: d.course1.code,
            title: d.course1.title,
            changes: d.differences
          }))
        });
      }

      return {
        differences,
        summary: differences.length === 0 ? 'No differences found' : `Found ${differences.length} types of changes`,
        version1: {
          id: version1.id,
          version_no: version1.version_no,
          courses: courses1.length
        },
        version2: {
          id: version2.id,
          version_no: version2.version_no,
          courses: courses2.length
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi compare versions: ${error.message}`);
    }
  }

  static async createBranch(params: {
    frameworkId: bigint;
    branchName: string;
    sourceVersionId?: bigint;
    userId: bigint;
  }) {
    try {
      const { frameworkId, branchName, sourceVersionId, userId } = params;

      // Get source version (latest published if not specified)
      const sourceVersion = sourceVersionId 
        ? await prisma.curriculum_framework_versions.findUnique({
            where: { id: sourceVersionId },
            include: {
              course_blueprints: {
                include: {
                  unit_blueprints: true
                }
              }
            }
          })
        : await prisma.curriculum_framework_versions.findFirst({
            where: {
              framework_id: frameworkId,
              state: 'published'
            },
            include: {
              course_blueprints: {
                include: {
                  unit_blueprints: true
                }
              }
            },
            orderBy: { created_at: 'desc' }
          });

      if (!sourceVersion) {
        throw new Error('Source version not found');
      }

      // Create branch version
      const branchVersion = await prisma.curriculum_framework_versions.create({
        data: {
          framework_id: frameworkId,
          version_no: `${branchName}-${Date.now()}`,
          state: 'draft',
          changelog: `Branch created from version ${sourceVersion.version_no}`,
          created_by: userId,
          updated_by: userId
        }
      });

      // Copy courses and units
      for (const course of sourceVersion.course_blueprints) {
        const newCourse = await prisma.course_blueprints.create({
          data: {
            version_id: branchVersion.id,
            code: course.code,
            title: course.title,
            subtitle: course.subtitle,
            level: course.level,
            hours: course.hours,
            order_index: course.order_index,
            summary: course.summary,
            learning_outcomes: course.learning_outcomes,
            assessment_types: course.assessment_types,
            prerequisites: course.prerequisites,
            created_by: userId,
            updated_by: userId
          }
        });

        for (const unit of course.unit_blueprints) {
          await prisma.unit_blueprints.create({
            data: {
              course_blueprint_id: newCourse.id,
              code: unit.code,
              title: unit.title,
              order_index: unit.order_index,
              hours: unit.hours,
              objectives: unit.objectives,
              content_outline: unit.content_outline,
              activities: unit.activities,
              resources: unit.resources,
              assessment: unit.assessment,
              homework: unit.homework,
              created_by: userId,
              updated_by: userId
            }
          });
        }
      }

      return {
        id: branchVersion.id,
        name: branchName,
        version_no: branchVersion.version_no,
        created_at: branchVersion.created_at,
        source_version: sourceVersion.version_no,
        courses_copied: sourceVersion.course_blueprints.length
      };
    } catch (error) {
      throw new Error(`Lỗi khi tạo branch: ${error.message}`);
    }
  }

  static async getDeployments(frameworkId: bigint) {
    try {
      // Mock deployment data - in real implementation, get from deployment service
      const deployments = [
        {
          id: 1,
          framework_id: frameworkId,
          version_no: '1.0.0',
          environment: 'production',
          status: 'active',
          deployed_at: new Date('2024-01-15'),
          deployed_by: 1n,
          rollback_available: true
        },
        {
          id: 2,
          framework_id: frameworkId,
          version_no: '1.1.0',
          environment: 'staging',
          status: 'testing',
          deployed_at: new Date('2024-02-01'),
          deployed_by: 1n,
          rollback_available: false
        }
      ];

      return {
        deployments,
        summary: {
          total: deployments.length,
          active: deployments.filter(d => d.status === 'active').length,
          environments: [...new Set(deployments.map(d => d.environment))]
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy deployments: ${error.message}`);
    }
  }
}