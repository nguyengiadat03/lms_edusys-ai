import { apiClient } from '../lib/api';

export interface CourseBlueprint {
  id: number;
  version_id: number;
  code?: string;
  title: string;
  subtitle?: string;
  level?: string;
  hours: number;
  sessions?: number; // Add sessions field
  order_index: number;
  summary?: string;
  learning_method?: string;
  state?: string;
  learning_outcomes?: unknown[];
  assessment_types?: unknown[];
  prerequisites?: string;
  deleted_at?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCourseRequest {
  code?: string;
  title: string;
  subtitle?: string;
  level?: string;
  hours?: number;
  sessions?: number; // Add sessions field
  order_index?: number;
  summary?: string;
  learning_method?: string;
  state?: string;
  learning_outcomes?: unknown[];
  assessment_types?: unknown[];
  prerequisites?: string;
}

export interface UpdateCourseRequest {
  code?: string;
  title?: string;
  subtitle?: string;
  level?: string;
  hours?: number;
  sessions?: number; // Add sessions field
  order_index?: number;
  summary?: string;
  learning_method?: string;
  state?: string;
  learning_outcomes?: unknown[];
  assessment_types?: unknown[];
  prerequisites?: string;
}

export interface ReorderCoursesRequest {
  version_id: number;
  orders: Array<{
    course_id: number;
    order_index: number;
  }>;
}

export interface CreateKCTMappingRequest {
  kct_id: string;
  kct_type?: 'competency' | 'standard' | 'skill' | 'knowledge';
  mapping_level?: 'direct' | 'partial' | 'related' | 'indirect';
  description?: string;
}

export interface KCTMapping {
  id: number;
  course_id: number;
  kct_id: string;
  kct_type: string;
  mapping_level: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const courseService = {
  async createCourse(versionId: number, courseData: CreateCourseRequest): Promise<CourseBlueprint> {
    const result = await apiClient.post<CourseBlueprint>(`/courses/versions/${versionId}/courses`, courseData);
    console.log('Course creation result:', result);
    return result;
  },

  async updateCourse(id: number, updates: UpdateCourseRequest): Promise<void> {
    return apiClient.patch(`/courses/${id}`, updates);
  },

  async deleteCourse(id: number): Promise<void> {
    return apiClient.delete(`/courses/${id}`);
  },

  async getCourse(id: number): Promise<CourseBlueprint> {
    return apiClient.get<CourseBlueprint>(`/courses/${id}`);
  },

  async getCoursesByVersion(versionId: number): Promise<CourseBlueprint[]> {
    const response = await apiClient.get<{ courses: CourseBlueprint[] }>(`/courses/versions/${versionId}/courses`);
    return response.courses || [];
  },

  async reorderCourses(reorderData: ReorderCoursesRequest): Promise<void> {
    return apiClient.post('/courses/reorder', reorderData);
  },

  async createKCTMapping(courseId: number, mappingData: CreateKCTMappingRequest): Promise<KCTMapping> {
    return apiClient.post<KCTMapping>(`/courses/${courseId}/kct-mappings`, mappingData);
  },

  async getKCTMappings(courseId: number): Promise<KCTMapping[]> {
    const result = await apiClient.get<{ kct_frameworks: Array<{ kct_frameworks: KCTMapping[] }> }>(`/courses/${courseId}/kct-mappings`);
    // The backend returns results in a nested structure, extract the mappings
    return result.kct_frameworks?.flatMap(framework => framework.kct_frameworks) || [];
  },
};
