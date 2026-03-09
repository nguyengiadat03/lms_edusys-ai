import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  EyeIcon,
  CheckCircleIcon,
  InfoIcon,
  TargetIcon,
  FileTextIcon,
  RefreshCwIcon,
  ArrowLeftIcon
} from "lucide-react";
import { curriculumService } from "@/services/curriculumService";
import { useToast } from "@/hooks/use-toast";

interface AIPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewData: any;
  onBackToGeneration?: () => void;
  onRegenerate?: () => void;
  onSaveSuccess?: () => void;
}

const AIPreviewDialog: React.FC<AIPreviewDialogProps> = ({
  open,
  onOpenChange,
  previewData,
  onBackToGeneration,
  onRegenerate,
  onSaveSuccess
}) => {
  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Helper function for language display names
  const getVietnameseLanguageDisplay = (language: string) => {
    const languageMap: { [key: string]: string } = {
      'en': 'Tiếng Anh',
      'jp': 'Tiếng Nhật',
      'vi': 'Tiếng Việt',
      'zh': 'Tiếng Trung',
      'ko': 'Tiếng Hàn',
      'English': 'Tiếng Anh',
      'Japanese': 'Tiếng Nhật',
      'Chinese': 'Tiếng Trung',
      'Korean': 'Tiếng Hàn',
      'Vietnamese': 'Tiếng Việt',
    };
    return languageMap[language] || language;
  };



  console.log('🎯 AIPreviewDialog received previewData:', previewData);

  // Update form data when preview data changes - ensure all required fields are properly mapped
  useEffect(() => {
    if (previewData) {
      console.log('🔍 Processing preview data with keys:', Object.keys(previewData));

      // Map backend response to form data with proper field mapping
      const processedData = {
        // Required fields for form
        code: previewData.code,
        name: previewData.name,
        language: previewData.language,
        target_level: previewData.target_level || previewData.targetLevel,
        age_group: previewData.age_group || previewData.ageGroup,
        total_hours: previewData.total_hours || previewData.totalHours,
        total_sessions: previewData.total_sessions || previewData.totalSessions,
        session_duration_hours: previewData.session_duration_hours || previewData.sessionDurationHours,
        learning_method: previewData.learning_method || previewData.learningMethod,
        learning_format: previewData.learning_format || previewData.learningFormat,
        description: previewData.description,
        learning_objectives: previewData.learning_objectives || [],

        // Include tags
        tags: previewData.tags || [],

        // Display fields
        displayLanguage: previewData.displayLanguage,
        owner_name: previewData.owner_name
      };

      console.log('✅ Processed form data:', processedData);
      setFormData(processedData);
    } else {
      console.log('❌ No previewData provided');
      setFormData(null);
    }
  }, [previewData]);

  const handleSaveToDatabase = async () => {
    if (!formData) return;

      console.log('🎯 Starting real database save process...');
      console.log('💾 Original formData:', formData);
      setIsSaving(true);

  try {
    // Ensure code format is valid for backend validation (^[A-Z0-9-_]+$)
    let sanitizedCode = formData.code
      ? formData.code.toUpperCase().replace(/[^A-Z0-9-_]/g, '_')
      : 'DEFAULT_CODE';

      // Map language display names back to language codes for database storage
      const languageCodeMap: { [key: string]: string } = {
        'English': 'en',
        'Vietnamese': 'vi',
        'Japanese': 'jp',
        'Chinese': 'zh',
        'Korean': 'ko',
        'French': 'fr',
        'German': 'de',
        'Spanish': 'es',
        // Handle lowercase versions that might exist
        'english': 'en',
        'vietnamese': 'vi',
        'japanese': 'jp',
        'chinese': 'zh',
        'korean': 'ko',
        'french': 'fr',
        'german': 'de',
        'spanish': 'es',
      };

      // Convert language display name to code for database storage
      const dbLanguageCode = languageCodeMap[formData.language] || formData.language?.toLowerCase();

      // Map form data to database format - include all current form values
      const saveData = {
        code: sanitizedCode,
        name: formData.name,
        language: dbLanguageCode, // Use mapped language code
        target_level: formData.target_level || formData.targetLevel,
        age_group: formData.age_group || formData.ageGroup,
        total_hours: formData.total_hours || formData.totalHours,
        total_sessions: formData.total_sessions || formData.totalSessions,
        session_duration_hours: formData.session_duration_hours || formData.sessionDurationHours,
        learning_method: (formData.learning_method || formData.learningMethod || "").substring(0, 128),
        learning_format: formData.learning_format || formData.learningFormat,
        description: (Array.isArray(formData.description)
          ? formData.description.map((bullet: string) => bullet.startsWith('-') ? bullet : `- ${bullet}`).join('\n')
          : (formData.description || "").substring(0, 2000)),
        learning_objectives: formData.learning_objectives || [],
        tags: formData.tags || [] // Include tags from form data
      };

      console.log('🧹 Generated meaningful code from:', formData.code, 'to:', sanitizedCode);

      console.log('📝 Mapped save data for DB:', saveData);

      // Use database save with automatic retry on duplicate code
      let retryCount = 0;
      const maxRetries = 3;
      let finalSavedCurriculum = null;

      while (retryCount <= maxRetries) {
        try {
          const savedCurriculum = await curriculumService.createCurriculum(saveData);
          console.log('🎉 Database save successful:', savedCurriculum);
          finalSavedCurriculum = savedCurriculum;
          break; // Success, exit retry loop

        } catch (serviceError: any) {
          console.error(`❌ Save attempt ${retryCount + 1} failed:`, serviceError);

          // Check if it's a duplicate code error
          const isDuplicateCode = serviceError?.response?.status === 409 ||
                                serviceError?.response?.data?.error?.code === 'DUPLICATE_CODE';

          if (isDuplicateCode && retryCount < maxRetries) {
            // Generate a new unique code with incrementing suffix
            const suffixNumber = Date.now() % 1000; // Use milliseconds for uniqueness
            const baseCode = sanitizedCode.replace(/_\d{1,4}$/, ''); // Remove previous increment suffix
            sanitizedCode = `${baseCode}_${suffixNumber}`;

            // Update saveData with new code
            saveData.code = sanitizedCode;
            console.log(`🔄 Retrying with new code: ${sanitizedCode}`);

            retryCount++;
            continue; // Retry with new code
          }

          // If not duplicate or max retries reached, try direct API approach
          console.log('🔄 Trying direct API call approach...');

          const directResponse = await fetch('http://localhost:3001/api/v1/kct', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
            },
            body: JSON.stringify(saveData)
          });

          console.log('🔍 Direct API status:', directResponse.status);

          if (directResponse.ok) {
            const responseData = await directResponse.json();
            finalSavedCurriculum = responseData;
            console.log('🎉 Direct API save successful');
            break;
          }

          const responseData = await directResponse.json();
          console.log('🔍 Direct API error response:', responseData);

          // Check for duplicate on direct API too
          const isDirectDuplicate = directResponse.status === 409 ||
                                  responseData?.error?.code === 'DUPLICATE_CODE';

          if (isDirectDuplicate && retryCount < maxRetries) {
            const suffixNumber = (Date.now() + retryCount + 1) % 1000; // Different number each time
            const baseCode = sanitizedCode.replace(/_\d{1,4}$/, '');
            sanitizedCode = `${baseCode}_${suffixNumber}`;
            saveData.code = sanitizedCode;
            console.log(`🔄 Direct API retry with new code: ${sanitizedCode}`);

            retryCount++;
            continue; // Retry direct API with new code
          }

          if (directResponse.status === 422) {
            console.error('❌ Validation errors from direct API:');
            throw new Error(`Validation failed: ${JSON.stringify(responseData.error?.details || responseData.error || responseData)}`);
          }

          throw serviceError; // Re-throw original error if not retryable
        }
      }

      if (!finalSavedCurriculum) {
        throw new Error('Failed to save curriculum after multiple attempts due to duplicate codes');
      }



      toast({
        title: "Thành công!",
        description: `"${saveData.name}" lưu thành công.`,
      });

      // Close dialog and navigate back immediately
      onOpenChange(false);

      // Trigger navigation back and refresh
      if (onSaveSuccess) {
        onSaveSuccess();
      }

    } catch (error: any) {
      console.error('❌ Database save failed:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);

      // Show detailed validation errors if available
      let errorMessage = "Có lỗi xảy ra khi lưu khung chương trình vào database";
      if (error.response?.status === 422 && error.response?.data?.error?.details) {
        const validationErrors = error.response.data.error.details;
        console.error('❌ Validation errors:', validationErrors);
        errorMessage = `Lỗi validation: ${validationErrors.map((err: any) => err.message || err).join(', ')}`;
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      }

      toast({
        title: "Lỗi lưu dữ liệu",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Enable button immediately after real save attempt
      setIsSaving(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EyeIcon className="h-6 w-6" />
            Xem Trước Khung Chương Trình AI
          </DialogTitle>
          <DialogDescription>
            Xem trước nội dung AI tạo ra và lưu bản nháp vào hệ thống.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Dashboard */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <TargetIcon className="h-4 w-4" />
              Tóm Tắt Khung Chương Trình Đã Tạo
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4 text-sm min-w-0">
              <div className="bg-white p-3 rounded border">
                <div className="text-xs font-medium text-gray-500">MÃ KCT</div>
                <div className="font-semibold text-blue-700 truncate">{formData?.code || 'N/A'}</div>
              </div>
              <div className="bg-white p-3 rounded border min-w-0">
                <div className="text-xs font-medium text-gray-500">TÊN KHÓA HỌC</div>
                <div className="font-semibold text-blue-700 text-xs leading-tight break-words line-clamp-2" title={formData?.name || 'N/A'}>
                  {formData?.name || 'N/A'}
                </div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-xs font-medium text-gray-500">NGÔN NGỮ</div>
                <div className="font-semibold text-blue-700 truncate">{getVietnameseLanguageDisplay(formData?.displayLanguage || formData?.language || 'N/A')}</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-xs font-medium text-gray-500">TRÌNH ĐỘ</div>
                <div className="font-semibold text-blue-700 text-xs leading-tight truncate" title={`${formData?.target_level || formData?.targetLevel || 'N/A'} (${formData?.age_group || formData?.ageGroup || 'N/A'})`}>
                  {formData?.target_level || formData?.targetLevel || 'N/A'} ({formData?.age_group || formData?.ageGroup || 'N/A'})
                </div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-xs font-medium text-gray-500">TỔNG GIỜ</div>
                <div className="font-semibold text-blue-700">{formData?.total_hours || formData?.totalHours || 0}h</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-xs font-medium text-gray-500">SỐ BUỔI</div>
                <div className="font-semibold text-blue-700">{formData?.total_sessions || 0} buổi</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-xs font-medium text-gray-500">GIỜ/BUỔI</div>
                <div className="font-semibold text-blue-700">{formData?.session_duration_hours || formData?.sessionDurationHours || 0}h</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-xs font-medium text-gray-500">HÌNH THỨC</div>
                <div className="font-semibold text-blue-700 truncate">{formData?.learning_format || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          {formData?.description && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                <FileTextIcon className="h-4 w-4" />
                Mô Tả Khung Chương Trình
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-orange-900 bg-white p-3 rounded border">
                {Array.isArray(formData.description)
                  ? formData.description.map((bullet: string, index: number) => (
                      <li key={index}>{bullet.startsWith('-') ? bullet.substring(1).trim() : bullet}</li>
                    ))
                  : formData.description.split('\n').filter(line => line.trim().startsWith('-')).map((bullet: string, index: number) => (
                      <li key={index}>{bullet.trim().substring(1).trim()}</li>
                    ))
                }
              </ul>
            </div>
          )}

          {/* Learning Objectives */}
          {formData?.learning_objectives && formData.learning_objectives.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <FileTextIcon className="h-4 w-4" />
                Mục Tiêu Học Tập
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                {formData.learning_objectives.map((objective: string, index: number) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Learning Method */}
          {formData?.learning_method && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <TargetIcon className="h-4 w-4" />
                Phương Thức Học Tập
              </h4>
              <div className="text-sm text-blue-900 bg-white p-3 rounded border">
                {formData.learning_method}
              </div>
            </div>
          )}

          {/* Tags */}
          {previewData?.tags && previewData.tags.length > 0 && (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <TargetIcon className="h-4 w-4" />
                Tags & Nhãn
              </h4>
              <div className="flex flex-wrap gap-2">
                {previewData.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Warning Message */}
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Lưu ý quan trọng:</strong> Sau khi lưu, khung chương trình sẽ được tạo với trạng thái "Nháp"
              và hiển thị trong danh sách Khung Chương Trình. Bạn có thể chỉnh sửa thêm hoặc xuất bản sau.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {onBackToGeneration && (
              <Button type="button" variant="outline" onClick={onBackToGeneration}>
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Quay Lại Tạo Mới
              </Button>
            )}

            {onRegenerate && (
              <Button type="button" variant="secondary" onClick={onRegenerate}>
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Tạo Lại Với AI
              </Button>
            )}

            <Button onClick={handleSaveToDatabase} disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                  Đang Lưu...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Lưu bản nháp
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIPreviewDialog;
