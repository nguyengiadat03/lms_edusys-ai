"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BotIcon,
  SparklesIcon,
  CheckCircleIcon,
  InfoIcon,
  RefreshCwIcon,
  PinIcon,
  EyeIcon,
  LightbulbIcon,
  TargetIcon,
  FileTextIcon,
  DownloadIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { curriculumService } from "@/services/curriculumService";
import AIPreviewDialog from "./AIPreviewDialog";

interface RubricTemplate {
  criteria: Array<{
    name: string;
    weight: number;
    levels: string[];
  }>;
  passingScore: number;
}

interface AISuggestionSkeleton {
  type: 'skeleton';
  content: CurriculumSkeleton;
}

interface AISuggestionCEFR {
  type: 'cefr';
  content: CEFRMapping;
}

interface AISuggestionResources {
  type: 'resources';
  content: ResourceSuggestion[];
}

interface AISuggestionRubric {
  type: 'rubric';
  content: RubricTemplate;
}

type AISuggestion = {
  id: string;
  title: string;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  source: string;
  accepted?: boolean;
} & (AISuggestionSkeleton | AISuggestionCEFR | AISuggestionResources | AISuggestionRubric);

interface CurriculumSkeleton {
  name: string;
  level: string;
  ageGroup: string;
  totalHours: number;
  courses: Array<{
    title: string;
    hours: number;
    units: Array<{
      title: string;
      duration: number;
      objectives: string[];
      skills: string[];
      activities: string[];
      assessment: string;
    }>;
  }>;
}

interface CEFRMapping {
  level: string;
  canDoStatements: string[];
  objectives: string[];
  skills: string[];
}

interface ResourceSuggestion {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'audio' | 'slide' | 'worksheet' | 'link';
  skill: string;
  cefrLevel: string;
  topic: string;
  relevanceScore: number;
  url?: string;
  description: string;
}



interface AIAssistProps {
  onSaveSuccess?: () => void;
}

const AIAssist: React.FC<AIAssistProps> = ({ onSaveSuccess }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  // Form state for curriculum generation
  const [generationForm, setGenerationForm] = useState({
    language: '',
    targetLevel: '',
    ageGroup: '',
    totalHours: 0,
    descriptionInstructions: '',
  });

  // Reset form function
  const handleReset = () => {
    setGenerationForm({
      language: '',
      targetLevel: '',
      ageGroup: '',
      totalHours: 0,
      descriptionInstructions: '',
    });
    setSuggestions([]);
  };



  // Get available levels based on selected language
  const getAvailableLevels = (language: string) => {
    const levelOptions: Record<string, Array<{ value: string; label: string }>> = {
      'English': [
        { value: 'A1', label: 'A1 - Sơ cấp' },
        { value: 'A2', label: 'A2 - Sơ cấp' },
        { value: 'B1', label: 'B1 - Trung cấp' },
        { value: 'B2', label: 'B2 - Trung cấp' },
        { value: 'C1', label: 'C1 - Cao cấp' },
        { value: 'C2', label: 'C2 - Thông thạo' }
      ],
      'Japanese': [
        { value: 'N5', label: 'N5 - Sơ cấp' },
        { value: 'N4', label: 'N4 - Sơ cấp' },
        { value: 'N3', label: 'N3 - Trung cấp' },
        { value: 'N2', label: 'N2 - Trung cấp' },
        { value: 'N1', label: 'N1 - Cao cấp' }
      ],
      'Chinese': [
        { value: 'HSK1', label: 'HSK 1 - Sơ cấp' },
        { value: 'HSK2', label: 'HSK 2 - Sơ cấp' },
        { value: 'HSK3', label: 'HSK 3 - Trung cấp' },
        { value: 'HSK4', label: 'HSK 4 - Trung cấp' },
        { value: 'HSK5', label: 'HSK 5 - Cao cấp' },
        { value: 'HSK6', label: 'HSK 6 - Thông thạo' }
      ],
      'Korean': [
        { value: 'TOPIK1', label: 'TOPIK I - Sơ cấp' },
        { value: 'TOPIK2', label: 'TOPIK II - Trung cấp' },
        { value: 'TOPIK3', label: 'TOPIK III - Cao cấp' },
        { value: 'TOPIK4', label: 'TOPIK IV - Thông thạo' }
      ]
    };

    // For other languages (French, German, Spanish), use default CEFR levels
    return levelOptions[language] || levelOptions['English'];
  };

  // Handle language change
  const handleLanguageChange = (language: string) => {
    setGenerationForm(prev => ({
      ...prev,
      language,
      targetLevel: '', // Reset level when language changes
    }));
  };

  // Call Gemini API to generate curriculum with AI
  const generateCurriculumWithAI = useCallback(async (form: typeof generationForm): Promise<any> => {
    console.log('🚀 Starting generateCurriculumWithAI with form:', form);

    try {
      console.log('📡 Making API call to curriculumService.generateWithAI...');
      const response = await curriculumService.generateWithAI({
        language: form.language,
        targetLevel: form.targetLevel,
        ageGroup: form.ageGroup,
        totalHours: form.totalHours,
        descriptionInstructions: form.descriptionInstructions
      });

      console.log('📡 API Response received:', response);
      console.log('📦 Checking response structure...');

      // Check if data is in response.data or response itself
      const result = response?.data || response;
      console.log('🎯 Extracted data:', result);
      console.log('🎯 Data type:', typeof result);
      console.log('🎯 Has curriculum fields?', !!result.code);
      console.log('🎯 Full result keys:', Object.keys(result));

      return result;
    } catch (error) {
      console.error('❌ Failed to generate curriculum with AI:', error);
      console.error('❌ Error details:', error?.response?.data || error?.message);
      throw new Error('Không thể tạo khung chương trình với AI. Vui lòng thử lại.');
    }
  }, []);

  const handleGenerateAndPreview = async () => {
    setIsGenerating(true);
    try {
      // Map language display names to ISO codes for backend API call
      const languageCodeMap: { [key: string]: string } = {
        'English': 'en',
        'Vietnamese': 'vi',
        'Japanese': 'jp',
        'Chinese': 'zh',
        'Korean': 'ko',
        'French': 'fr',
        'German': 'de',
        'Spanish': 'es',
      };

      // Create API payload with proper language codes
      const apiPayload = {
        language: languageCodeMap[generationForm.language] || generationForm.language.toLowerCase(),
        targetLevel: generationForm.targetLevel,
        ageGroup: generationForm.ageGroup,
        totalHours: generationForm.totalHours,
        descriptionInstructions: generationForm.descriptionInstructions,
      };

      console.log('🔄 Generating curriculum with AI...', apiPayload);
      const curriculumData = await generateCurriculumWithAI(apiPayload);
      console.log('✅ AI generation successful:', curriculumData);

      // Set the data and open dialog
      setPreviewData(curriculumData);
      setShowPreviewDialog(true);
      console.log('🎯 Preview data set and dialog opened:', !!curriculumData);

    } catch (error) {
      console.error('❌ AI generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle back to generation
  const handleBackToGeneration = () => {
    console.log('🔙 Back to generation called - closing dialog, clearing previewData, and resetting form');
    setShowPreviewDialog(false);
    setPreviewData(null);

    // Reset form fields as requested
    handleReset();
  };

  // Handle regenerate
  const handleRegenerate = async () => {
    console.log('🔄 Regenerate called - closing dialog, clearing data, and regenerating');
    setShowPreviewDialog(false);
    setPreviewData(null);
    await handleGenerateAndPreview();
  };

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    console.log('🔄 Dialog open state changed:', open);
    setShowPreviewDialog(open);
    if (!open) {
      setPreviewData(null);
    }
  };

  const acceptSuggestion = (suggestionId: string) => {
    setSuggestions(prev =>
      prev.map(s =>
        s.id === suggestionId ? { ...s, accepted: true } : s
      )
    );
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getResourceIcon = () => {
    // Simplified - just use FileTextIcon for all resource types
    return <FileTextIcon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Thông tin cơ bản */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5" />
            Thông tin cơ bản
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">Ngôn ngữ</Label>
              <Select
                value={generationForm.language}
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngôn ngữ trước" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">Tiếng Anh (CEFR)</SelectItem>
                  <SelectItem value="Japanese">Tiếng Nhật (JLPT)</SelectItem>
                  <SelectItem value="Chinese">Tiếng Trung (HSK)</SelectItem>
                  <SelectItem value="Korean">Tiếng Hàn (TOPIK)</SelectItem>
                  <SelectItem value="Vietnamese">Tiếng Việt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="targetLevel">Trình độ</Label>
              <Select
                value={generationForm.targetLevel}
                onValueChange={(value) => setGenerationForm(prev => ({ ...prev, targetLevel: value }))}
                disabled={!generationForm.language}
              >
                <SelectTrigger>
                  <SelectValue placeholder={generationForm.language ? "Chọn trình độ" : "Chọn ngôn ngữ trước"} />
                </SelectTrigger>
                <SelectContent>
                  {generationForm.language ? (
                    getAvailableLevels(generationForm.language).map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))
                  ) : null}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="ageGroup">Nhóm tuổi</Label>
              <Select
                value={generationForm.ageGroup}
                onValueChange={(value) => setGenerationForm(prev => ({ ...prev, ageGroup: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhóm tuổi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kids">Trẻ em</SelectItem>
                  <SelectItem value="teens">Thiếu niên</SelectItem>
                  <SelectItem value="adults">Người lớn</SelectItem>
                  <SelectItem value="all">Tất cả</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="totalHours">Tổng giờ</Label>
              <Input
                id="totalHours"
                type="number"
                value={generationForm.totalHours || ""}
                onChange={(e) => setGenerationForm(prev => ({ ...prev, totalHours: parseInt(e.target.value) || 0 }))}
                placeholder="150"
              />
            </div>
          </div>

          <div className="col-span-2">
            <Label htmlFor="descriptionInstructions">Mô tả chi dẫn cho AI (tuỳ chọn)</Label>
            <Textarea
              id="descriptionInstructions"
              value={generationForm.descriptionInstructions}
              onChange={(e) => setGenerationForm(prev => ({ ...prev, descriptionInstructions: e.target.value }))}
              placeholder="Nhập chi dẫn cụ thể để AI tạo mô tả khung chương trình và mục tiêu học tập chính xác hơn với yêu cầu của bạn (ví dụ: tập trung vào giao tiếp hàng ngày, văn hóa kinh doanh, từ vựng chuyên ngành, v.v.)"
              className="resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              AI sẽ sử dụng thông tin này để tạo nội dung phù hợp với nhu cầu cụ thể của bạn
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button
          onClick={handleGenerateAndPreview}
          disabled={isGenerating || !generationForm.language || !generationForm.targetLevel || !generationForm.ageGroup}
        >
          {isGenerating ? (
            <>
              <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
              Đang Tạo Gợi Ý AI...
            </>
          ) : (
            <>
              <SparklesIcon className="h-4 w-4 mr-2" />
              Tạo Khung Chương Trình với AI
            </>
          )}
        </Button>
      </div>

      {/* AI Preview Dialog */}
      <AIPreviewDialog
        open={showPreviewDialog}
        onOpenChange={handleDialogClose}
        previewData={previewData}
        onBackToGeneration={handleBackToGeneration}
        onRegenerate={handleRegenerate}
        onSaveSuccess={onSaveSuccess}
      />
    </div>
  );
};

export default AIAssist;
