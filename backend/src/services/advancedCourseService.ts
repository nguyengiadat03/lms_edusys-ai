import { PrismaClient } from '@prisma/client';
import { AIService } from './aiService';
import { emailService } from './emailService';

const prisma = new PrismaClient();

export class AdvancedCourseService {
  /**
   * Create course template
   */
  static async createCourseTemplate(params: {
    name: string;
    description: string;
    category: string;
    difficulty_level: string;
    estimated_hours: number;
    template_data: any;
    tags: string[];
    is_public: boolean;
    tenantId: bigint;
    userId: bigint;
  }) {
    try {
      const { name, description, category, difficulty_level, estimated_hours, template_data, tags, is_public, tenantId, userId } = params;

      const template = await prisma.course_templates.create({
        data: {
          tenant_id: tenantId,
          name,
          description,
          category,
          difficulty_level,
          estimated_hours,
          template_data,
          tags,
          is_public,
          usage_count: 0,
          rating: 0,
          created_by: userId,
          updated_by: userId
        }
      });

      return template;
    } catch (error: any) {
      throw new Error(`Lỗi khi tạo course template: ${error.message}`);
    }
  }

  /**
   * Get course templates with filters
   */
  static async getCourseTemplates(params: {
    category?: string;
    difficulty_level?: string;
    tags?: string[];
    is_public?: boolean;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    tenantId: bigint;
  }) {
    try {
      const { 
        category, difficulty_level, tags, is_public, search, 
        sort_by = 'created_at', sort_order = 'desc', 
        page = 1, limit = 20, tenantId 
      } = params;

      const where: any = {
        OR: [
          { tenant_id: tenantId },
          { is_public: true }
        ]
      };

      if (category) where.category = category;
      if (difficulty_level) where.difficulty_level = difficulty_level;
      if (is_public !== undefined) where.is_public = is_public;
      if (tags && tags.length > 0) {
        where.tags = { hasSome: tags };
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [templates, total] = await Promise.all([
        prisma.course_templates.findMany({
          where,
          orderBy: { [sort_by]: sort_order },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            users_course_templates_created_byTousers: {
              select: { full_name: true, email: true }
            }
          }
        }),
        prisma.course_templates.count({ where })
      ]);

      return {
        templates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      throw new Error(`Lỗi khi lấy course templates: ${error.message}`);
    }
  }

  /**
   * Use template to create course
   */
  static async createCourseFromTemplate(params: {
    templateId: bigint;
    courseName: string;
    customizations?: any;
    frameworkVersionId: bigint;
    tenantId: bigint;
    userId: bigint;
  }) {
    try {
      const { templateId, courseName, customizations, frameworkVersionId, tenantId, userId } = params;

      // Get template
      const template = await prisma.course_templates.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new Error('Template not found');
      }

      // Check access
      if (!template.is_public && template.tenant_id !== tenantId) {
        throw new Error('Access denied to template');
      }

      // Create course from template
      const templateData = template.template_data as any;
      const mergedData = customizations ? { ...templateData, ...customizations } : templateData;

      const course = await prisma.course_blueprints.create({
        data: {
          version_id: frameworkVersionId,
          code: `COURSE_${Date.now()}`,
          title: courseName,
          subtitle: mergedData.subtitle || template.description,
          level: template.difficulty_level,
          hours: template.estimated_hours,
          order_index: mergedData.order_index || 1,
          summary: mergedData.summary || template.description,
          learning_outcomes: mergedData.learning_outcomes || [],
          assessment_types: mergedData.assessment_types || [],
          prerequisites: mergedData.prerequisites || [],
          created_by: userId,
          updated_by: userId
        }
      });

      // Update template usage count
      await prisma.course_templates.update({
        where: { id: templateId },
        data: { usage_count: { increment: 1 } }
      });

      // Create units from template if available
      if (mergedData.units && Array.isArray(mergedData.units)) {
        for (let i = 0; i < mergedData.units.length; i++) {
          const unitData = mergedData.units[i];
          await prisma.unit_blueprints.create({
            data: {
              course_blueprint_id: course.id,
              code: `UNIT_${i + 1}`,
              title: unitData.title,
              order_index: i + 1,
              hours: unitData.hours || 1,
              objectives: unitData.objectives || [],
              content_outline: unitData.content_outline || '',
              activities: unitData.activities || [],
              resources: unitData.resources || [],
              assessment: unitData.assessment || {},
              homework: unitData.homework || '',
              created_by: userId,
              updated_by: userId
            }
          });
        }
      }

      return {
        course,
        template_used: template.name,
        units_created: mergedData.units?.length || 0
      };
    } catch (error: any) {
      throw new Error(`Lỗi khi tạo course từ template: ${error.message}`);
    }
  }

  /**
   * Create advanced assessment
   */
  static async createAdvancedAssessment(params: {
    courseId: bigint;
    name: string;
    type: string;
    config: any;
    rubric: any;
    adaptive_settings?: any;
    tenantId: bigint;
    userId: bigint;
  }) {
    try {
      const { courseId, name, type, config, rubric, adaptive_settings, tenantId, userId } = params;

      const assessment = await prisma.advanced_assessments.create({
        data: {
          tenant_id: tenantId,
          course_id: courseId,
          name,
          type,
          config,
          rubric,
          adaptive_settings,
          status: 'draft',
          created_by: userId,
          updated_by: userId
        }
      });

      return assessment;
    } catch (error: any) {
      throw new Error(`Lỗi khi tạo advanced assessment: ${error.message}`);
    }
  }

  /**
   * Generate adaptive assessment
   */
  static async generateAdaptiveAssessment(params: {
    assessmentId: bigint;
    studentId: bigint;
    difficulty_level?: string;
    focus_areas?: string[];
  }) {
    try {
      const { assessmentId, studentId, difficulty_level, focus_areas } = params;

      // Get assessment config
      const assessment = await prisma.advanced_assessments.findUnique({
        where: { id: assessmentId }
      });

      if (!assessment) {
        throw new Error('Assessment not found');
      }

      // Get student performance history
      const studentHistory = await this.getStudentPerformanceHistory(studentId);

      // Generate adaptive questions based on student level and history
      const adaptiveConfig = assessment.adaptive_settings as any;
      const questions = await this.generateAdaptiveQuestions({
        baseConfig: assessment.config,
        adaptiveConfig,
        studentHistory,
        difficulty_level,
        focus_areas
      });

      // Create assessment instance
      const instance = await prisma.assessment_instances.create({
        data: {
          assessment_id: assessmentId,
          student_id: studentId,
          questions,
          status: 'generated',
          difficulty_level: difficulty_level || 'medium',
          focus_areas: focus_areas || [],
          generated_at: new Date()
        }
      });

      return {
        instance,
        questions_count: questions.length,
        estimated_time: this.calculateEstimatedTime(questions),
        difficulty_distribution: this.analyzeDifficultyDistribution(questions)
      };
    } catch (error: any) {
      throw new Error(`Lỗi khi tạo adaptive assessment: ${error.message}`);
    }
  }

  /**
   * Analyze course performance
   */
  static async analyzeCoursePerformance(params: {
    courseId: bigint;
    timeframe?: string;
    metrics?: string[];
  }) {
    try {
      const { courseId, timeframe = '30d', metrics = ['completion', 'engagement', 'assessment'] } = params;

      const analysis: any = {
        course_id: courseId,
        timeframe,
        generated_at: new Date()
      };

      // Get course basic info
      const course = await prisma.course_blueprints.findUnique({
        where: { id: courseId },
        include: {
          unit_blueprints: true
        }
      });

      if (!course) {
        throw new Error('Course not found');
      }

      analysis.course_info = {
        title: course.title,
        total_units: course.unit_blueprints.length,
        total_hours: course.hours
      };

      // Completion metrics
      if (metrics.includes('completion')) {
        analysis.completion = await this.getCourseCompletionMetrics(courseId, timeframe);
      }

      // Engagement metrics
      if (metrics.includes('engagement')) {
        analysis.engagement = await this.getCourseEngagementMetrics(courseId, timeframe);
      }

      // Assessment metrics
      if (metrics.includes('assessment')) {
        analysis.assessment = await this.getCourseAssessmentMetrics(courseId, timeframe);
      }

      // Learning outcomes analysis
      if (metrics.includes('outcomes')) {
        analysis.learning_outcomes = await this.analyzeLearningOutcomes(courseId, timeframe);
      }

      // Recommendations
      analysis.recommendations = await this.generateCourseRecommendations(analysis);

      return analysis;
    } catch (error: any) {
      throw new Error(`Lỗi khi phân tích course performance: ${error.message}`);
    }
  }

  /**
   * Create course collaboration space
   */
  static async createCollaborationSpace(params: {
    courseId: bigint;
    name: string;
    type: string;
    settings: any;
    participants: bigint[];
    tenantId: bigint;
    userId: bigint;
  }) {
    try {
      const { courseId, name, type, settings, participants, tenantId, userId } = params;

      const collaboration = await prisma.course_collaborations.create({
        data: {
          tenant_id: tenantId,
          course_id: courseId,
          name,
          type,
          settings,
          status: 'active',
          created_by: userId,
          updated_by: userId
        }
      });

      // Add participants
      for (const participantId of participants) {
        await prisma.collaboration_participants.create({
          data: {
            collaboration_id: collaboration.id,
            user_id: participantId,
            role: 'participant',
            joined_at: new Date()
          }
        });
      }

      return {
        collaboration,
        participants_added: participants.length
      };
    } catch (error: any) {
      throw new Error(`Lỗi khi tạo collaboration space: ${error.message}`);
    }
  }

  /**
   * Generate course insights using AI
   */
  static async generateCourseInsights(params: {
    courseId: bigint;
    insight_types: string[];
    context?: any;
  }) {
    try {
      const { courseId, insight_types, context } = params;

      // Get course data
      const course = await prisma.course_blueprints.findUnique({
        where: { id: courseId },
        include: {
          unit_blueprints: true,
          curriculum_framework_versions: {
            include: {
              curriculum_frameworks: true
            }
          }
        }
      });

      if (!course) {
        throw new Error('Course not found');
      }

      const insights: any = {
        course_id: courseId,
        generated_at: new Date(),
        insights: {}
      };

      // Content analysis
      if (insight_types.includes('content')) {
        insights.insights.content = await this.analyzeContentQuality(course);
      }

      // Structure analysis
      if (insight_types.includes('structure')) {
        insights.insights.structure = await this.analyzeCourseStructure(course);
      }

      // Difficulty progression
      if (insight_types.includes('difficulty')) {
        insights.insights.difficulty = await this.analyzeDifficultyProgression(course);
      }

      // Learning path optimization
      if (insight_types.includes('learning_path')) {
        insights.insights.learning_path = await this.optimizeLearningPath(course);
      }

      // Engagement predictions
      if (insight_types.includes('engagement')) {
        insights.insights.engagement = await this.predictEngagement(course, context);
      }

      return insights;
    } catch (error: any) {
      throw new Error(`Lỗi khi tạo course insights: ${error.message}`);
    }
  }

  /**
   * Create personalized learning path
   */
  static async createPersonalizedLearningPath(params: {
    courseId: bigint;
    studentId: bigint;
    learning_style?: string;
    goals?: string[];
    constraints?: any;
  }) {
    try {
      const { courseId, studentId, learning_style, goals, constraints } = params;

      // Get student profile and history
      const studentProfile = await this.getStudentLearningProfile(studentId);
      
      // Get course structure
      const course = await prisma.course_blueprints.findUnique({
        where: { id: courseId },
        include: {
          unit_blueprints: {
            orderBy: { order_index: 'asc' }
          }
        }
      });

      if (!course) {
        throw new Error('Course not found');
      }

      // Generate personalized path
      const learningPath = await this.generateLearningPath({
        course,
        studentProfile,
        learning_style,
        goals,
        constraints
      });

      // Save learning path
      const pathRecord = await prisma.learning_paths.create({
        data: {
          course_id: courseId,
          student_id: studentId,
          path_data: learningPath,
          learning_style,
          goals: goals || [],
          constraints,
          status: 'active',
          created_at: new Date()
        }
      });

      return {
        learning_path: pathRecord,
        estimated_completion_time: learningPath.estimated_time,
        milestones: learningPath.milestones,
        adaptive_checkpoints: learningPath.checkpoints
      };
    } catch (error: any) {
      throw new Error(`Lỗi khi tạo personalized learning path: ${error.message}`);
    }
  }

  // Helper methods
  private static async getStudentPerformanceHistory(studentId: bigint) {
    // Mock implementation - in real app, get from database
    return {
      average_score: 75,
      strong_areas: ['grammar', 'vocabulary'],
      weak_areas: ['listening', 'speaking'],
      learning_pace: 'medium',
      preferred_question_types: ['multiple_choice', 'fill_blank']
    };
  }

  private static async generateAdaptiveQuestions(params: any) {
    // Mock implementation - in real app, use AI to generate questions
    const { baseConfig, studentHistory } = params;
    
    const questions = [];
    const questionCount = baseConfig.question_count || 20;
    
    for (let i = 0; i < questionCount; i++) {
      questions.push({
        id: i + 1,
        type: 'multiple_choice',
        difficulty: this.adaptDifficulty(studentHistory, i),
        content: `Generated question ${i + 1}`,
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
        points: 1,
        estimated_time: 60
      });
    }
    
    return questions;
  }

  private static adaptDifficulty(studentHistory: any, questionIndex: number) {
    const { average_score } = studentHistory;
    
    if (average_score >= 80) {
      return questionIndex < 5 ? 'medium' : 'hard';
    } else if (average_score >= 60) {
      return 'medium';
    } else {
      return questionIndex < 10 ? 'easy' : 'medium';
    }
  }

  private static calculateEstimatedTime(questions: any[]) {
    return questions.reduce((total, q) => total + (q.estimated_time || 60), 0);
  }

  private static analyzeDifficultyDistribution(questions: any[]) {
    const distribution = { easy: 0, medium: 0, hard: 0 };
    questions.forEach(q => {
      distribution[q.difficulty as keyof typeof distribution]++;
    });
    return distribution;
  }

  private static async getCourseCompletionMetrics(courseId: bigint, timeframe: string) {
    // Mock implementation
    return {
      total_enrollments: 150,
      completed: 120,
      in_progress: 25,
      dropped: 5,
      completion_rate: 80,
      average_completion_time: 45, // days
      completion_trend: 'increasing'
    };
  }

  private static async getCourseEngagementMetrics(courseId: bigint, timeframe: string) {
    // Mock implementation
    return {
      average_session_duration: 35, // minutes
      sessions_per_week: 3.2,
      interaction_rate: 0.75,
      resource_usage: 0.68,
      discussion_participation: 0.45,
      engagement_score: 7.2
    };
  }

  private static async getCourseAssessmentMetrics(courseId: bigint, timeframe: string) {
    // Mock implementation
    return {
      average_score: 78.5,
      pass_rate: 0.85,
      attempts_per_assessment: 1.3,
      time_per_assessment: 25, // minutes
      score_distribution: {
        '90-100': 0.25,
        '80-89': 0.35,
        '70-79': 0.25,
        '60-69': 0.10,
        'below_60': 0.05
      }
    };
  }

  private static async analyzeLearningOutcomes(courseId: bigint, timeframe: string) {
    // Mock implementation
    return {
      outcomes_achieved: 0.82,
      skill_improvements: {
        'communication': 0.78,
        'problem_solving': 0.85,
        'critical_thinking': 0.72
      },
      knowledge_retention: 0.75,
      application_success: 0.68
    };
  }

  private static async generateCourseRecommendations(analysis: any) {
    const recommendations = [];

    if (analysis.completion?.completion_rate < 70) {
      recommendations.push({
        type: 'completion',
        priority: 'high',
        suggestion: 'Improve course completion rate',
        details: 'Consider reducing course length or adding more engaging content',
        impact: 'high'
      });
    }

    if (analysis.engagement?.engagement_score < 6) {
      recommendations.push({
        type: 'engagement',
        priority: 'medium',
        suggestion: 'Increase student engagement',
        details: 'Add more interactive elements and multimedia content',
        impact: 'medium'
      });
    }

    if (analysis.assessment?.average_score < 70) {
      recommendations.push({
        type: 'assessment',
        priority: 'high',
        suggestion: 'Review assessment difficulty',
        details: 'Assessments may be too difficult or content needs improvement',
        impact: 'high'
      });
    }

    return recommendations;
  }

  private static async analyzeContentQuality(course: any) {
    // Mock AI analysis
    return {
      readability_score: 7.5,
      content_depth: 'appropriate',
      multimedia_balance: 0.65,
      interactivity_level: 'medium',
      accessibility_score: 8.2,
      suggestions: [
        'Add more visual elements to Unit 3',
        'Simplify language in Unit 1 introduction',
        'Include more practice exercises in Unit 5'
      ]
    };
  }

  private static async analyzeCourseStructure(course: any) {
    // Mock analysis
    return {
      logical_flow: 8.5,
      unit_balance: 7.8,
      prerequisite_alignment: 9.0,
      learning_progression: 8.2,
      recommendations: [
        'Consider splitting Unit 4 into two smaller units',
        'Add transition activities between units',
        'Strengthen prerequisites for Unit 6'
      ]
    };
  }

  private static async analyzeDifficultyProgression(course: any) {
    // Mock analysis
    return {
      progression_smoothness: 7.5,
      difficulty_spikes: ['Unit 3', 'Unit 7'],
      recommended_adjustments: [
        'Add preparatory content before Unit 3',
        'Provide additional support materials for Unit 7'
      ],
      optimal_pacing: 'current pacing is appropriate'
    };
  }

  private static async optimizeLearningPath(course: any) {
    // Mock optimization
    return {
      current_efficiency: 0.75,
      optimized_sequence: [1, 2, 4, 3, 5, 6, 7, 8],
      time_savings: '15%',
      learning_improvement: '12%',
      rationale: 'Moving practical Unit 4 before theoretical Unit 3 improves understanding'
    };
  }

  private static async predictEngagement(course: any, context: any) {
    // Mock prediction
    return {
      predicted_engagement: 7.8,
      risk_factors: ['long video content', 'limited interactivity'],
      success_factors: ['clear objectives', 'practical examples'],
      recommendations: [
        'Break long videos into shorter segments',
        'Add interactive quizzes every 10 minutes',
        'Include peer discussion opportunities'
      ]
    };
  }

  private static async getStudentLearningProfile(studentId: bigint) {
    // Mock profile
    return {
      learning_style: 'visual',
      pace_preference: 'self_paced',
      difficulty_preference: 'gradual',
      interaction_preference: 'moderate',
      time_availability: 'flexible',
      previous_performance: 'good',
      interests: ['technology', 'business'],
      challenges: ['time_management', 'motivation']
    };
  }

  private static async generateLearningPath(params: any) {
    const { course, studentProfile } = params;
    
    // Mock personalized path generation
    return {
      path_id: Date.now(),
      units: course.unit_blueprints.map((unit: any, index: number) => ({
        unit_id: unit.id,
        order: index + 1,
        estimated_time: unit.hours * 60, // minutes
        difficulty_adjustment: studentProfile.pace_preference === 'fast' ? 0.8 : 1.2,
        recommended_activities: this.getRecommendedActivities(unit, studentProfile),
        checkpoints: this.generateCheckpoints(unit, studentProfile)
      })),
      estimated_time: course.hours * (studentProfile.pace_preference === 'fast' ? 0.8 : 1.2),
      milestones: this.generateMilestones(course),
      checkpoints: this.generateAdaptiveCheckpoints(course, studentProfile)
    };
  }

  private static getRecommendedActivities(unit: any, profile: any) {
    const activities = [];
    
    if (profile.learning_style === 'visual') {
      activities.push('video_content', 'infographics', 'mind_maps');
    } else if (profile.learning_style === 'auditory') {
      activities.push('audio_content', 'discussions', 'verbal_explanations');
    } else {
      activities.push('hands_on_exercises', 'simulations', 'practice_labs');
    }
    
    return activities;
  }

  private static generateCheckpoints(unit: any, profile: any) {
    return [
      {
        type: 'knowledge_check',
        timing: '25%',
        format: profile.learning_style === 'visual' ? 'visual_quiz' : 'text_quiz'
      },
      {
        type: 'skill_practice',
        timing: '50%',
        format: 'interactive_exercise'
      },
      {
        type: 'comprehension_check',
        timing: '75%',
        format: 'reflection_questions'
      }
    ];
  }

  private static generateMilestones(course: any) {
    const totalUnits = course.unit_blueprints.length;
    return [
      { unit: Math.floor(totalUnits * 0.25), title: 'Foundation Complete' },
      { unit: Math.floor(totalUnits * 0.5), title: 'Midpoint Achieved' },
      { unit: Math.floor(totalUnits * 0.75), title: 'Advanced Level' },
      { unit: totalUnits, title: 'Course Mastery' }
    ];
  }

  private static generateAdaptiveCheckpoints(course: any, profile: any) {
    return course.unit_blueprints.map((unit: any, index: number) => ({
      unit_id: unit.id,
      checkpoint_type: 'adaptive_assessment',
      trigger_conditions: ['completion', 'time_spent', 'performance'],
      adaptation_rules: {
        high_performance: 'skip_review',
        low_performance: 'additional_practice',
        time_constraint: 'condensed_content'
      }
    }));
  }
}