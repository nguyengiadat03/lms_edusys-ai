-- Advanced Course Features Tables
-- Migration 008: Advanced Course Management, Templates, Assessment

-- Course Templates Table
CREATE TABLE IF NOT EXISTS course_templates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
    estimated_hours INT NOT NULL DEFAULT 0,
    template_data JSON NOT NULL,
    tags JSON,
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_by BIGINT NOT NULL,
    updated_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_course_templates_tenant (tenant_id),
    INDEX idx_course_templates_category (category),
    INDEX idx_course_templates_difficulty (difficulty_level),
    INDEX idx_course_templates_public (is_public),
    INDEX idx_course_templates_usage (usage_count),
    INDEX idx_course_templates_rating (rating),
    INDEX idx_course_templates_created_by (created_by),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Advanced Assessments Table
CREATE TABLE IF NOT EXISTS advanced_assessments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('adaptive', 'competency_based', 'peer_review', 'portfolio', 'simulation') NOT NULL,
    config JSON NOT NULL,
    rubric JSON,
    adaptive_settings JSON,
    status ENUM('draft', 'active', 'archived') DEFAULT 'draft',
    created_by BIGINT NOT NULL,
    updated_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_advanced_assessments_tenant (tenant_id),
    INDEX idx_advanced_assessments_course (course_id),
    INDEX idx_advanced_assessments_type (type),
    INDEX idx_advanced_assessments_status (status),
    INDEX idx_advanced_assessments_created_by (created_by),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course_blueprints(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Assessment Instances Table (for adaptive assessments)
CREATE TABLE IF NOT EXISTS assessment_instances (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    assessment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    questions JSON NOT NULL,
    answers JSON,
    status ENUM('generated', 'in_progress', 'completed', 'expired') DEFAULT 'generated',
    difficulty_level VARCHAR(50),
    focus_areas JSON,
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    time_spent INT, -- seconds
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    
    INDEX idx_assessment_instances_assessment (assessment_id),
    INDEX idx_assessment_instances_student (student_id),
    INDEX idx_assessment_instances_status (status),
    INDEX idx_assessment_instances_generated (generated_at),
    INDEX idx_assessment_instances_completed (completed_at),
    
    FOREIGN KEY (assessment_id) REFERENCES advanced_assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Course Analytics Table
CREATE TABLE IF NOT EXISTS course_analytics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    metric_data JSON NOT NULL,
    timeframe VARCHAR(50) NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_course_analytics_course (course_id),
    INDEX idx_course_analytics_type (metric_type),
    INDEX idx_course_analytics_timeframe (timeframe),
    INDEX idx_course_analytics_calculated (calculated_at),
    
    FOREIGN KEY (course_id) REFERENCES course_blueprints(id) ON DELETE CASCADE
);

-- Course Collaborations Table
CREATE TABLE IF NOT EXISTS course_collaborations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('discussion', 'project', 'peer_review', 'study_group') NOT NULL,
    settings JSON,
    status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
    created_by BIGINT NOT NULL,
    updated_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_course_collaborations_tenant (tenant_id),
    INDEX idx_course_collaborations_course (course_id),
    INDEX idx_course_collaborations_type (type),
    INDEX idx_course_collaborations_status (status),
    INDEX idx_course_collaborations_created_by (created_by),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course_blueprints(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Collaboration Participants Table
CREATE TABLE IF NOT EXISTS collaboration_participants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    collaboration_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role ENUM('owner', 'moderator', 'participant') DEFAULT 'participant',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP NULL,
    
    INDEX idx_collaboration_participants_collaboration (collaboration_id),
    INDEX idx_collaboration_participants_user (user_id),
    INDEX idx_collaboration_participants_role (role),
    INDEX idx_collaboration_participants_joined (joined_at),
    
    UNIQUE KEY uk_collaboration_participants (collaboration_id, user_id),
    
    FOREIGN KEY (collaboration_id) REFERENCES course_collaborations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Learning Paths Table (for personalized learning)
CREATE TABLE IF NOT EXISTS learning_paths (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    path_data JSON NOT NULL,
    learning_style VARCHAR(50),
    goals JSON,
    constraints JSON,
    status ENUM('active', 'completed', 'paused', 'abandoned') DEFAULT 'active',
    progress DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_learning_paths_course (course_id),
    INDEX idx_learning_paths_student (student_id),
    INDEX idx_learning_paths_status (status),
    INDEX idx_learning_paths_created (created_at),
    
    UNIQUE KEY uk_learning_paths (course_id, student_id),
    
    FOREIGN KEY (course_id) REFERENCES course_blueprints(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Course Insights Table (AI-generated insights)
CREATE TABLE IF NOT EXISTS course_insights (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT NOT NULL,
    insight_type VARCHAR(100) NOT NULL,
    insight_data JSON NOT NULL,
    confidence_score DECIMAL(3,2),
    generated_by VARCHAR(100), -- AI model or system
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    
    INDEX idx_course_insights_course (course_id),
    INDEX idx_course_insights_type (insight_type),
    INDEX idx_course_insights_generated (generated_at),
    INDEX idx_course_insights_confidence (confidence_score),
    
    FOREIGN KEY (course_id) REFERENCES course_blueprints(id) ON DELETE CASCADE
);

-- Student Learning Profiles Table
CREATE TABLE IF NOT EXISTS student_learning_profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    learning_style VARCHAR(50),
    pace_preference VARCHAR(50),
    difficulty_preference VARCHAR(50),
    interaction_preference VARCHAR(50),
    time_availability VARCHAR(50),
    interests JSON,
    challenges JSON,
    performance_history JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_student_learning_profiles_student (student_id),
    INDEX idx_student_learning_profiles_style (learning_style),
    INDEX idx_student_learning_profiles_pace (pace_preference),
    
    UNIQUE KEY uk_student_learning_profiles (student_id),
    
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Course Template Reviews Table
CREATE TABLE IF NOT EXISTS course_template_reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    template_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    helpful_votes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_course_template_reviews_template (template_id),
    INDEX idx_course_template_reviews_reviewer (reviewer_id),
    INDEX idx_course_template_reviews_rating (rating),
    INDEX idx_course_template_reviews_created (created_at),
    
    UNIQUE KEY uk_course_template_reviews (template_id, reviewer_id),
    
    FOREIGN KEY (template_id) REFERENCES course_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Course Progress Tracking Table (detailed tracking)
CREATE TABLE IF NOT EXISTS course_progress_tracking (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    unit_id BIGINT,
    activity_type VARCHAR(100) NOT NULL,
    activity_data JSON,
    progress_percentage DECIMAL(5,2),
    time_spent INT, -- seconds
    engagement_score DECIMAL(3,2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_course_progress_tracking_course (course_id),
    INDEX idx_course_progress_tracking_student (student_id),
    INDEX idx_course_progress_tracking_unit (unit_id),
    INDEX idx_course_progress_tracking_activity (activity_type),
    INDEX idx_course_progress_tracking_recorded (recorded_at),
    
    FOREIGN KEY (course_id) REFERENCES course_blueprints(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES unit_blueprints(id) ON DELETE CASCADE
);

-- Add indexes for performance optimization
CREATE INDEX idx_course_templates_search ON course_templates(name, description(100));
CREATE INDEX idx_advanced_assessments_course_type ON advanced_assessments(course_id, type);
CREATE INDEX idx_assessment_instances_student_status ON assessment_instances(student_id, status);
CREATE INDEX idx_course_analytics_course_type_timeframe ON course_analytics(course_id, metric_type, timeframe);
CREATE INDEX idx_learning_paths_student_status ON learning_paths(student_id, status);
CREATE INDEX idx_course_insights_course_type_generated ON course_insights(course_id, insight_type, generated_at);
CREATE INDEX idx_course_progress_tracking_student_course ON course_progress_tracking(student_id, course_id, recorded_at);

-- Add full-text search indexes
ALTER TABLE course_templates ADD FULLTEXT(name, description);
ALTER TABLE advanced_assessments ADD FULLTEXT(name);
ALTER TABLE course_collaborations ADD FULLTEXT(name);

-- Update Prisma schema comment
-- This migration adds advanced course management features including:
-- 1. Course templates system
-- 2. Advanced assessment types (adaptive, competency-based, etc.)
-- 3. Course analytics and insights
-- 4. Collaboration spaces
-- 5. Personalized learning paths
-- 6. Student learning profiles
-- 7. Detailed progress tracking