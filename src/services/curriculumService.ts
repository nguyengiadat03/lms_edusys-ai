import { apiClient } from '../lib/api';

export interface CurriculumFramework {
  id: number;
  tenant_id: number;
  campus_id?: number;
  code: string;
  name: string;
  language: string;
  displayLanguage?: string; // Added: Full language name (e.g., "English", "Japanese")
  target_level?: string;
  age_group?: 'kids' | 'teens' | 'adults' | 'all';
  total_hours: number;
  total_sessions: number; // Tổng số buổi học
  session_duration_hours?: number; // Thời gian học/buổi (giờ)
  learning_method?: string; // Cách thức học
  learning_format?: string; // Hình thức học
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'archived';
  owner_user_id?: number;
  latest_version_id?: number;
  description?: string;
  learning_objectives?: any[];
  prerequisites?: any[];
  assessment_strategy?: string;
  deleted_at?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  // Additional computed fields
  latest_version_no?: string;
  latest_version_state?: string;
  owner_name?: string; // Added: Full name from users table
  tags?: string[];
  courses_count?: number; // Added: Count of courses mapped to this KCT
}

export interface CreateCurriculumRequest {
  code: string;
  name: string;
  language: string;
  target_level?: string;
  age_group?: 'kids' | 'teens' | 'adults' | 'all';
  total_sessions?: number; // Added: Tổng số buổi học
  session_duration_hours?: number; // Added: Thời gian học/buổi (giờ)
  learning_method?: string; // Added: Cách thức học
  learning_format?: string; // Added: Hình thức học
  campus_id?: number;
  description?: string;
  learning_objectives?: unknown[];
  prerequisites?: unknown[];
  assessment_strategy?: string;
  tags?: string[]; // Added: Tags array for manual curriculum creation
}

export interface UpdateCurriculumRequest {
  name?: string;
  target_level?: string;
  age_group?: 'kids' | 'teens' | 'adults' | 'all';
  total_sessions?: number; // Added: Tổng số buổi học
  session_duration_hours?: number; // Added: Thời gian học/buổi (giờ)
  learning_method?: string; // Added: Cách thức học
  learning_format?: string; // Added: Hình thức học
  campus_id?: number;
  description?: string;
  learning_objectives?: unknown[];
  prerequisites?: unknown[];
  assessment_strategy?: string;
  tags?: string[]; // Added: Tags array for curriculum updates
  status?: 'draft' | 'pending_review' | 'approved' | 'published' | 'archived';
}

export interface CurriculumListResponse {
  data: CurriculumFramework[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface CurriculumFilters {
  status?: string;
  language?: string;
  age_group?: string;
  target_level?: string;
  owner_user_id?: number;
  campus_id?: number;
  tag?: string;
  q?: string;
  page?: number;
  page_size?: number;
}

export interface GenerateWithAIRequest {
  language: string;
  targetLevel: string;
  ageGroup: string;
  totalHours: number;
  descriptionInstructions?: string;
}

export interface GenerateWithAIResponse {
  success: boolean;
  data: {
    code: string;
    name: string;
    language: string;
    targetLevel: string;
    ageGroup: string;
    totalHours: number;
    totalSessions: number;
    sessionDurationHours: number;
    learningMethod: string;
    learningFormat: string;
    description: string;
  };
  metadata: {
    generatedAt: string;
    totalHoursMatch: boolean;
    language: string;
    level: string;
    ageGroup: string;
  };
}

export const curriculumService = {
  async getCurriculums(filters?: CurriculumFilters): Promise<CurriculumListResponse> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    // Remove default status filter to show all KCTs for course mapping (course counting context)
    // Status filters can still be applied explicitly by callers when needed

    const endpoint = queryParams.toString() ? `/kct?${queryParams.toString()}` : '/kct';
    return apiClient.get<CurriculumListResponse>(endpoint);
  },

  async createCurriculum(curriculumData: CreateCurriculumRequest): Promise<CurriculumFramework> {
    return apiClient.post<CurriculumFramework>('/kct', curriculumData);
  },

  async getCurriculum(id: number): Promise<CurriculumFramework> {
    return apiClient.get<CurriculumFramework>(`/kct/${id}`);
  },

  async updateCurriculum(id: number, updates: UpdateCurriculumRequest): Promise<void> {
    return apiClient.patch(`/kct/${id}`, updates);
  },

  async deleteCurriculum(id: number): Promise<void> {
    return apiClient.delete(`/kct/${id}`);
  },

  async generateWithAI(requestData: GenerateWithAIRequest): Promise<any> {
    return apiClient.post<any>('/kct/generate-with-ai', requestData);
  },

  // Mock save function for testing AI-generated curriculum
  async mockSaveCurriculum(curriculumData: any): Promise<{ success: boolean; message: string; data?: any }> {
    console.log('🧪 MOCK SAVE: Curriculum data to be saved:', curriculumData);

    // Simulate database save delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validate required fields
    if (!curriculumData.code || !curriculumData.name || !curriculumData.language) {
      console.error('❌ MOCK SAVE FAILED: Missing required fields');
      return {
        success: false,
        message: 'Thiếu thông tin bắt buộc: Code, Name, Language phải được điền'
      };
    }

    // Mock curriculum ID generation
    const mockId = Date.now();

    // Simulate database record
    const mockSavedRecord = {
      id: mockId,
      ...curriculumData,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner_user_id: 163, // Mock user
      tenant_id: 1
    };

    console.log('✅ MOCK SAVE SUCCESS: Record saved with ID:', mockId);
    console.log('📊 Mock saved record:', mockSavedRecord);

    return {
      success: true,
      message: `Khung chương trình "${curriculumData.name}" đã được lưu thành công với ID: ${mockId}`,
      data: mockSavedRecord
    };
  },
};
