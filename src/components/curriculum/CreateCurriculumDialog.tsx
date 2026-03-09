"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { curriculumService } from "@/services/curriculumService";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, BookOpen, X, Target } from "lucide-react";
import AIAssist from "./AIAssist";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

const createSchema = z.object({
  code: z.string().min(1, "Mã KCT là bắt buộc").max(64, "Mã KCT tối đa 64 ký tự").regex(/^[A-Z0-9-_]+$/, "Mã KCT chỉ được chứa chữ hoa, số, gạch ngang và gạch dưới"),
  name: z.string().min(1, "Tên KCT là bắt buộc").max(255, "Tên KCT tối đa 255 ký tự"),
  language: z.string().min(1, "Ngôn ngữ là bắt buộc"),
  target_level: z.string().optional(),
  age_group: z.enum(["kids", "teens", "adults", "all"]).optional(),
  total_hours: z.number().min(0, "Tổng giờ phải >= 0").optional(),
  total_sessions: z.number().min(0, "Tổng buổi học phải >= 0").optional(),
  session_duration_hours: z.number().min(0, "Thời gian học/buổi phải >= 0").optional().nullable(),
  learning_method: z.string().max(128, "Cách thức học tối đa 128 ký tự").optional(),
  learning_format: z.string().max(128, "Hình thức học tối đa 128 ký tự").optional(),
  campus_id: z.number().optional(),
  description: z.string().max(2000, "Mô tả tối đa 2000 ký tự").optional(),
  learning_objectives: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

type CreateFormData = z.infer<typeof createSchema>;

interface CreateCurriculumDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  showAIAssist?: boolean;
}

export const CreateCurriculumDialog: React.FC<CreateCurriculumDialogProps> = ({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  children
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(''); // Track language selection

  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
  const queryClient = useQueryClient();

  const form = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      language: "",
      target_level: "",
      age_group: "all",
      total_hours: 0,
      total_sessions: 0,
      session_duration_hours: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: curriculumService.createCurriculum,
    onSuccess: (data) => {
      toast({
        title: "Thành công",
        description: `Đã tạo khung chương trình "${data.name}" thành công`,
      });
      queryClient.invalidateQueries({ queryKey: ['curricula'] });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi tạo khung chương trình",
        description: error.response?.data?.error?.message || "Có lỗi xảy ra khi tạo khung chương trình",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateFormData) => {
    createMutation.mutate(data as any);
  };

  const handleReset = () => {
    form.reset();
    setSelectedLanguage('');
  };

  const isSubmitting = createMutation.isPending;

  // Helper function for age group display
  const getAgeGroupDisplay = (value: string) => {
    const ageGroupMap: { [key: string]: string } = {
      'kids': 'Trẻ em',
      'teens': 'Thiếu niên',
      'adults': 'Người lớn',
      'all': 'Tất cả',
    };
    return ageGroupMap[value] || value;
  };

  // Helper function for language display
  const getLanguageDisplay = (value: string) => {
    const languageMap: { [key: string]: string } = {
      'en': 'Tiếng Anh',
      'jp': 'Tiếng Nhật',
      'vi': 'Tiếng Việt',
      'zh': 'Tiếng Trung',
      'ko': 'Tiếng Hàn Quốc',
      'fr': 'Tiếng Pháp',
      'de': 'Tiếng Đức',
      'es': 'Tiếng Tây Ban Nha',
    };
    return languageMap[value] || value;
  };

  // Handle language change for manual form
  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    form.setValue('language', language);
    // Reset level when language changes
    form.setValue('target_level', '');
  };

  // Get available levels based on selected language (same logic as AI form)
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

    // For Vietnamese and other languages, use CEFR levels
    return levelOptions[language] || levelOptions['English'];
  };

  // Convert language code to display name for getAvailableLevels function
  const getLanguageKey = (languageCode: string) => {
    const mapping: Record<string, string> = {
      'en': 'English',
      'jp': 'Japanese',
      'zh': 'Chinese',
      'ko': 'Korean',
      'vi': 'Vietnamese',
    };
    return mapping[languageCode] || 'English';
  };

  // Sync selectedLanguage with form language field
  useEffect(() => {
    if (open) {
      setSelectedLanguage(form.watch('language') || '');
    }
  }, [form.watch('language'), open]);

  // Reset selectedLanguage when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedLanguage('');
    }
  }, [open]);

  // Auto-calculate session duration based on total hours and total sessions
  useEffect(() => {
    const totalHours = form.watch('total_hours');
    const totalSessions = form.watch('total_sessions');

    // If both fields are filled and are positive numbers, calculate duration
    if (totalHours && totalSessions && totalHours > 0 && totalSessions > 0) {
      const sessionDurationHours = totalHours / totalSessions;
      const currentValue = form.getValues('session_duration_hours');

      // Only update if the calculated value differs significantly from current value
      if (Math.abs(sessionDurationHours - (currentValue || 0)) > 0.01) {
        form.setValue('session_duration_hours', Math.round(sessionDurationHours * 10) / 10); // Round to 1 decimal place
      }
    } else {
      // If either field is missing or zero, set duration to 0
      const currentValue = form.getValues('session_duration_hours');
      if (currentValue !== null && currentValue !== 0) {
        form.setValue('session_duration_hours', null);
      }
    }
  }, [form.watch('total_hours'), form.watch('total_sessions'), form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Tạo Khung Chương Trình Mới
          </DialogTitle>
          <DialogDescription>
            Tạo khung chương trình học mới theo cách thủ công hoặc sử dụng AI hỗ trợ
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Tạo thủ công</TabsTrigger>
            <TabsTrigger value="ai">AI Assistant</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Thông tin cơ bản */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Thông tin cơ bản</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Mã KCT */}
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mã KCT</FormLabel>
                          <FormControl>
                            <Input placeholder="BUS-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Tên KCT */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tên KCT</FormLabel>
                          <FormControl>
                            <Input placeholder="Business English B1-B2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Ngôn ngữ */}
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ngôn ngữ</FormLabel>
                          <Select onValueChange={handleLanguageChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn ngôn ngữ trước" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="en">Tiếng Anh (CEFR)</SelectItem>
                              <SelectItem value="jp">Tiếng Nhật (JLPT)</SelectItem>
                              <SelectItem value="zh">Tiếng Trung (HSK)</SelectItem>
                              <SelectItem value="ko">Tiếng Hàn (TOPIK)</SelectItem>
                              <SelectItem value="vi">Tiếng Việt</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Trình độ */}
                    <FormField
                      control={form.control}
                      name="target_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trình độ</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!selectedLanguage}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={selectedLanguage ? "Chọn trình độ" : "Chọn ngôn ngữ trước"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedLanguage ? (
                                getAvailableLevels(getLanguageKey(selectedLanguage)).map((level) => (
                                  <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                  </SelectItem>
                                ))
                              ) : null}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Nhóm tuổi */}
                    <FormField
                      control={form.control}
                      name="age_group"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nhóm tuổi</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn nhóm tuổi" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="kids">{getAgeGroupDisplay('kids')}</SelectItem>
                              <SelectItem value="teens">{getAgeGroupDisplay('teens')}</SelectItem>
                              <SelectItem value="adults">{getAgeGroupDisplay('adults')}</SelectItem>
                              <SelectItem value="all">{getAgeGroupDisplay('all')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Tổng giờ */}
                    <FormField
                      control={form.control}
                      name="total_hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tổng giờ</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="150"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Cấu trúc học tập */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Cấu trúc học tập</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Tổng số buổi học */}
                    <FormField
                      control={form.control}
                      name="total_sessions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tổng số buổi học</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="30"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Thời gian học/buổi */}
                    <FormField
                      control={form.control}
                      name="session_duration_hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Thời gian học/buổi (giờ)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.5"
                              placeholder="1.5"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Cách thức học */}
                    <FormField
                      control={form.control}
                      name="learning_method"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Cách thức học</FormLabel>
                          <FormControl>
                            <Input placeholder="Trực tuyến, Offline, Hybrid..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Hình thức học */}
                    <FormField
                      control={form.control}
                      name="learning_format"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Hình thức học</FormLabel>
                          <FormControl>
                            <Input placeholder="Lớp học nhóm, 1-1, Tự học..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                {/* Mô tả */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Mô tả</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Mô tả về khung chương trình..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Mục tiêu học tập và hạng mục */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5" />
                Mục tiêu học tập và Hạng mục
              </h3>

              {/* Mục tiêu học tập */}
              <FormField
                control={form.control}
                name="learning_objectives"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Mục tiêu học tập</FormLabel>
                    <div className="space-y-2">
                      {/* Display existing objectives */}
                      {field.value?.map((objective, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-md">
                          <span className="flex-1 text-sm">{objective}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newObjectives = [...(field.value || [])];
                              newObjectives.splice(index, 1);
                              field.onChange(newObjectives);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      {/* Add new objective */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nhập mục tiêu học tập..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.target as HTMLInputElement;
                              if (input.value.trim()) {
                                field.onChange([...(field.value || []), input.value.trim()]);
                                input.value = '';
                              }
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const currentObjectives = field.value || [];
                            const input = document.querySelector('input[placeholder="Nhập mục tiêu học tập..."]') as HTMLInputElement;
                            if (input && input.value.trim()) {
                              field.onChange([...currentObjectives, input.value.trim()]);
                              input.value = '';
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags */}
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hạng mục (Tags)</FormLabel>
                    <div className="space-y-2">
                      {/* Display existing tags */}
                      <div className="flex flex-wrap gap-2">
                        {field.value?.map((tag, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md">
                            {tag}
                            <button
                              type="button"
                              onClick={() => {
                                const newTags = [...(field.value || [])];
                                newTags.splice(index, 1);
                                field.onChange(newTags);
                              }}
                              className="hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Add new tag */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nhập hạng mục..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.target as HTMLInputElement;
                              if (input.value.trim()) {
                                const currentTags = field.value || [];
                                if (!currentTags.includes(input.value.trim())) {
                                  field.onChange([...currentTags, input.value.trim()]);
                                  input.value = '';
                                }
                              }
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const currentTags = field.value || [];
                            const input = document.querySelector('input[placeholder="Nhập hạng mục..."]') as HTMLInputElement;
                            if (input && input.value.trim()) {
                              if (!currentTags.includes(input.value.trim())) {
                                field.onChange([...currentTags, input.value.trim()]);
                                input.value = '';
                              }
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Tạo khung chương trình
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <AIAssist onSaveSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['curricula'] });
              setOpen(false);
            }} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
