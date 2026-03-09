"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpenIcon,
  PlusCircleIcon,
  SearchIcon,
  FilterIcon,
  EditIcon,
  TrashIcon,
  LinkIcon,
  TargetIcon,
  ClockIcon,
  UsersIcon,
  FileTextIcon,
  BotIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  BarChartIcon,
} from "lucide-react";

import { courseService, CourseBlueprint } from "@/services/courseService";
import { curriculumService, CurriculumFramework } from "@/services/curriculumService";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Fallback for when data is loading
const loadingCourses = [
  {
    id: "loading-1",
    name: "Loading...",
    level: "Loading...",
    program: "Loading...",
    modality: "Loading...",
    totalHours: 0,
    sessions: 0,
    status: "loading",
    mappedKCT: [],
    units: [],
    assessments: [],
    stats: {
      passRate: 0,
      completionRate: 0,
      avgFeedback: 0,
      enrolledClasses: 0,
    },
  }
];

const CourseManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [courses, setCourses] = useState([]);
  const [apiData, setApiData] = useState(null); // Track API response data
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [selectedModality, setSelectedModality] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetailLoading, setCourseDetailLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [kctOptions, setKctOptions] = useState<CurriculumFramework[]>([]);
  const [filteredKctOptions, setFilteredKctOptions] = useState<CurriculumFramework[]>([]);
  const [selectedKct, setSelectedKct] = useState<CurriculumFramework | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(''); // Track language selection for course creation
  const [selectedCreateLevel, setSelectedCreateLevel] = useState<string>(''); // Track level selection for course creation filtering KCT
  const [selectedMappedKCT, setSelectedMappedKCT] = useState<string[]>([]); // Track selected KCTs for mapping
  const [createForm, setCreateForm] = useState({
    name: '',
    level: '',
    mappedKCT: [] as string[]
  });
  const [courseName, setCourseName] = useState<string>(''); // Course name for creation
  const [isCreatingCourse, setIsCreatingCourse] = useState(false); // Loading state for course creation
  const [editingCourse, setEditingCourse] = useState<any>(null); // Course being edited
  const [isEditingCourse, setIsEditingCourse] = useState(false); // Flag for edit mode
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // Delete confirmation dialog
  const [courseToDelete, setCourseToDelete] = useState<any>(null); // Course to delete

  // Load courses from API on component mount
  React.useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const response = await courseService.getCoursesByVersion(621); // Default to version 621
        setApiData(response); // Store API data for status indicator
        // Transform API data to match UI expectations
        const transformedCourses = response.map((course: CourseBlueprint) => {
          // Extract KCT name from summary if available
          let kctName = '';
          if (course.summary && course.summary.includes('Based on KCT:')) {
            const summaryMatch = course.summary.match(/Based on KCT:\s*(.+)/);
            if (summaryMatch) {
              kctName = summaryMatch[1];
            }
          }

          return {
            id: course.id,
            name: course.title,
            level: course.level || "Foundation",
            program: "Language Learning", // Default value since it doesn't exist in API
            modality: course.learning_method || "online", // Use API data or default
            totalHours: course.hours,
            sessions: Math.ceil(course.hours / 2), // Estimate sessions from hours
            status: course.state || "draft", // Use API data or default
            mappedKCT: kctName ? [kctName] : [], // Show extracted KCT name
            units: [], // Empty array since it doesn't exist in API
            assessments: [], // Empty array since it doesn't exist in API
            stats: {
              passRate: 85, // Default value
              completionRate: 90, // Default value
              avgFeedback: 4.5, // Default value
              enrolledClasses: 0, // Default value
            },
          };
        });

        // Sort by newest first (assuming higher ID means newer, or we could sort by created_at)
        transformedCourses.sort((a, b) => (b.id || 0) - (a.id || 0));
        setCourses(transformedCourses);
      } catch (error) {
        console.error("Failed to load courses:", error);
        // Fallback to empty array
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  // Load KCT options only when level is selected (not on dialog open)
  React.useEffect(() => {
    if (!selectedCreateLevel) {
      // When level is cleared, reset KCT options
      setFilteredKctOptions([]);
      setKctOptions([]);
      return;
    }

    console.log("Loading KCT options from API for level:", selectedCreateLevel);

    const loadKCTOptions = async () => {
      try {
        // Build query params with status filter for create dialog: only show approved/published KCTs
        const queryParams: any = {
          status: 'approved,published',
          target_level: selectedCreateLevel
        };

        console.log("Calling KCT API with params:", queryParams);
        const response = await curriculumService.getCurriculums(queryParams);
        const kcts = response.data || [];
        console.log("KCT API response:", kcts.map(k => ({
          code: k.code,
          name: k.name,
          courses_count: k.courses_count,
          status: k.status
        })));
        setKctOptions(kcts);
        setFilteredKctOptions(kcts);
      } catch (error) {
        console.error("Failed to load KCT options:", error);
        setKctOptions([]);
        setFilteredKctOptions([]);
      }
    };

    loadKCTOptions();
  }, [selectedCreateLevel]);

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.program.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === "all" || course.level === selectedLevel;
    const matchesProgram = selectedProgram === "all" || course.program === selectedProgram;
    const matchesModality = selectedModality === "all" || course.modality === selectedModality;

    return matchesSearch && matchesLevel && matchesProgram && matchesModality;
  });

  const getModalityColor = (modality) => {
    switch (modality) {
      case "offline": return "bg-blue-100 text-blue-800";
      case "online": return "bg-green-100 text-green-800";
      case "hybrid": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const generateAILessonPlan = (unitTitle, objectives) => {
    // Mock AI generation
    return {
      warmup: `5-10 min interactive activity related to ${unitTitle.toLowerCase()}`,
      practice: `15-20 min guided practice focusing on ${objectives[0]?.toLowerCase() || 'key objectives'}`,
      assessment: `5-10 min formative assessment to check understanding`,
      homework: `15-20 min independent practice or extension activity`,
    };
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

    // For Vietnamese and other languages, use CEFR levels as default
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

  // Helper function for language display (same as in CurriculumList)
  const getLanguageDisplay = (language: string) => {
    const languageMap: { [key: string]: string } = {
      'en': 'Tiếng Anh',
      'jp': 'Tiếng Nhật',
      'vi': 'Tiếng Việt',
      'zh': 'Tiếng Trung',
      'ko': 'Tiếng Hàn Quốc',
    };
    return languageMap[language] || 'Tiếng Anh';
  };

  // Handle language change for course creation
  const handleLanguageChange = (language: string) => {
    // If "none" (empty value) is selected, reset to empty string
    setSelectedLanguage(language === "none" ? "" : language);
  };

  // Map Vietnamese learning method names to English enum values for backend
  const mapLearningMethod = (vietnameseMethod: string) => {
    const languageMapping: Record<string, string> = {
      'Trực tuyến': 'online',
      'Offline': 'offline',
      'Hybrid': 'hybrid',
      'Blended': 'blended',
      'Học trực tiếp': 'offline',
      'Học kết hợp': 'hybrid',
      'Học hỗn hợp': 'blended',
    };
    return languageMapping[vietnameseMethod] || 'online'; // Default to online if not found
  };

  // Filter KCT options based on selected level
  React.useEffect(() => {
    if (!selectedCreateLevel) {
      setFilteredKctOptions(kctOptions);
      // Clear selected KCT if level is changed
      setSelectedKct(null);
      return;
    }

    const filtered = kctOptions.filter(kct => {
      // Filter KCTs that match the selected level
      // For example: if selectedCreateLevel is "A1", show KCTs with target_level "A1"
      return kct.target_level === selectedCreateLevel;
    });

    setFilteredKctOptions(filtered);
    // Clear selected KCT when level changes
    setSelectedKct(null);
  }, [selectedCreateLevel, kctOptions]);

  // Sync selected KCT when options change during edit
  React.useEffect(() => {
    if (isEditingCourse && editingCourse && filteredKctOptions.length > 0 && !selectedKct) {
      console.log('Syncing KCT selection with loaded options...');

      // Try to find the KCT that was originally mapped
      const fullCourseDetails = editingCourse;
      const validMappings = fullCourseDetails.kctMappings || [];

      let kctToSelect = null;

      // Priority 1: Match by name from summary
      if (fullCourseDetails.summary && fullCourseDetails.summary.includes('Based on KCT:')) {
        const summaryMatch = fullCourseDetails.summary.match(/Based on KCT:\s*(.+)/);
        if (summaryMatch) {
          const kctName = summaryMatch[1];
          console.log('Re-syncing by summary name:', kctName);
          kctToSelect = filteredKctOptions.find(kct => kct.name === kctName);
        }
      }

      // Priority 2: Match by mapping code
      if (!kctToSelect && validMappings.length > 0) {
        const mappingCode = validMappings[0].kct_id;
        console.log('Re-syncing by mapping code:', mappingCode);
        kctToSelect = filteredKctOptions.find(kct => kct.code === mappingCode);
      }

      if (kctToSelect) {
        console.log('Re-selected KCT:', kctToSelect.name);
        setSelectedKct(kctToSelect);
      }
    }
  }, [filteredKctOptions, isEditingCourse, editingCourse, selectedKct]);

  // Handle course creation
  const handleCreateCourse = async () => {
    try {
      // Validation
      if (!courseName.trim()) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập tên khóa học",
          variant: "destructive",
        });
        return;
      }

      if (!selectedCreateLevel) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn trình độ",
          variant: "destructive",
        });
        return;
      }

      // Ensure hours and sessions from KCT data match exactly
      const totalHours = selectedKct?.total_hours || 0;
      const totalSessions = selectedKct?.total_sessions || (totalHours > 0 ? Math.ceil(totalHours / 2) : 0); // Use KCT sessions or calculate default

      // Prepare course data with all available fields from dialog and KCT
      const courseData = {
        title: courseName.trim(),
        level: selectedCreateLevel,
        hours: totalHours,
        sessions: totalSessions, // Match total_sessions from KCT exactly
        order_index: 1, // Default order index, courses can be reordered later
        state: 'draft',
        learning_method: selectedKct?.learning_format || 'online', // Use raw learning_format directly to match KCT
        summary: selectedKct ? `${courseName.trim()} - Based on KCT: ${selectedKct.name}` : courseName.trim(),
        learning_outcomes: selectedKct?.learning_objectives || [], // Map learning objectives from KCT
        // Add assessment_types if available from KCT (could be derived from description or other fields)
      };

      console.log('Course data with KCT fields:', {
        totalHours,
        totalSessions: totalSessions,
        selectedKctHours: selectedKct?.total_hours,
        selectedKctSessions: selectedKct?.total_sessions
      });

      console.log('Creating course with data:', courseData);
      console.log('Selected KCT:', selectedKct);

      setIsCreatingCourse(true);

      // Call API to create course
      const newCourse = await courseService.createCourse(621, courseData);

      console.log('Course created successfully:', newCourse);

      // If KCT was selected, also create the KCT mapping
      if (selectedKct) {
        try {
          console.log('Creating KCT mapping for course:', newCourse.id, 'with KCT:', selectedKct.code);
          await courseService.createKCTMapping(newCourse.id, {
            kct_id: selectedKct.code,
            kct_type: 'competency',
            mapping_level: 'direct',
            description: `Auto-mapped from KCT: ${selectedKct.name} (${selectedKct.target_level})`
          });
          console.log('KCT mapping created successfully');
        } catch (mappingError) {
          console.warn('Failed to create KCT mapping, but course was created:', mappingError);
          // Don't fail the whole operation if mapping fails
        }
      }

      toast({
        title: "Thành công",
        description: `Khóa học "${courseName}" đã được tạo thành công${selectedKct ? ' và đã được map với KCT được chọn!' : '!'} `,
      });

      // Reset form
      setCourseName('');
      setSelectedLanguage('');
      setSelectedCreateLevel('');
      setSelectedKct(null);
      setIsCreateDialogOpen(false);

      // Refresh all curricula queries to update course counts in CurriculumList
      queryClient.invalidateQueries({ queryKey: ['curricula'] });

      // Refresh courses list
      const updatedCourses = await courseService.getCoursesByVersion(621);
      const transformedCourses = updatedCourses.map((course: CourseBlueprint) => {
        // Extract KCT name from summary if available
        let kctName = '';
        if (course.summary && course.summary.includes('Based on KCT:')) {
          const summaryMatch = course.summary.match(/Based on KCT:\s*(.+)/);
          if (summaryMatch) {
            kctName = summaryMatch[1];
          }
        }

        return {
          id: course.id,
          name: course.title,
          level: course.level || "Foundation",
          program: "Language Learning",
          modality: course.learning_method || "online",
          totalHours: course.hours,
          sessions: Math.ceil(course.hours / 2),
          status: course.state || "draft",
          mappedKCT: kctName ? [kctName] : [], // Show extracted KCT name
          units: [],
          assessments: [],
          stats: {
            passRate: 85,
            completionRate: 90,
            avgFeedback: 4.5,
            enrolledClasses: 0,
          },
        };
      });

      // Sort by newest first (assuming higher ID means newer)
      transformedCourses.sort((a, b) => (b.id || 0) - (a.id || 0));

      setCourses(transformedCourses);
      setApiData(updatedCourses);

      // Refresh KCT options to update courses count - no status filter to include all KCTs
      console.log("Refreshing KCT options after course creation");
      try {
        const queryParams: any = {
          // Bỏ status filter để lấy tất cả KCT và cập nhật courses_count mới nhất
          target_level: selectedCreateLevel
        };
        const refreshedKcts = await curriculumService.getCurriculums(queryParams);

        console.log("Refreshed KCT data:", refreshedKcts.data?.map(k => ({
          name: k.name,
          code: k.code,
          courses_count: k.courses_count
        })));

        setKctOptions(refreshedKcts.data || []);
        setFilteredKctOptions(refreshedKcts.data || []);
      } catch (refreshError) {
        console.warn('Failed to refresh KCT options:', refreshError);
      }

    } catch (error) {
      console.error("Failed to create course:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo khóa học. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCourse(false);
    }
  };

  // Handle course editing - opens the create/edit dialog with populated data
  const handleEditCourse = async (course: any) => {
    console.log('Editing course:', course);

    // Reset all form state first
    setCourseName('');
    setSelectedLanguage('');
    setSelectedCreateLevel('');
    setSelectedKct(null);
    setFilteredKctOptions([]);
    setKctOptions([]);

    // Fetch full course details including KCT mappings
    const fullCourseDetails = await courseService.getCourse(course.id);
    const kctMappings = await courseService.getKCTMappings(course.id);
    const validMappings = Array.isArray(kctMappings) ? kctMappings.filter(mapping => mapping && mapping.kct_id) : [];

    console.log('Full course details:', fullCourseDetails);
    console.log('KCT mappings:', validMappings);

    // Set editing state
    setEditingCourse(fullCourseDetails);
    setIsEditingCourse(true);

    // Populate basic form data
    setCourseName(course.name || '');

    // Load KCT options for this level and set selected KCT
    if (course.level) {
      console.log('Loading KCT options for level:', course.level);

      const queryParams: any = {
        target_level: course.level
      };

      try {
        const response = await curriculumService.getCurriculums(queryParams);
        const allKcts = response.data || [];

        console.log('Loaded KCT options:', allKcts.length);
        setFilteredKctOptions(allKcts);
        setKctOptions(allKcts);

        // Find the KCT that was mapped to this course
        let selectedKctToSet = null;

        // Priority 1: Match by KCT name from summary
        if (fullCourseDetails.summary && fullCourseDetails.summary.includes('Based on KCT:')) {
          const summaryMatch = fullCourseDetails.summary.match(/Based on KCT:\s*(.+)/);
          if (summaryMatch) {
            const kctName = summaryMatch[1];
            console.log('Searching for KCT by name from summary:', kctName);
            selectedKctToSet = allKcts.find(kct => kct.name === kctName);
            console.log('Found KCT by summary name:', selectedKctToSet?.name);
          }
        }

        // Priority 2: Match by mapping code
        if (!selectedKctToSet && validMappings.length > 0) {
          const mappingCode = validMappings[0].kct_id;
          console.log('Searching for KCT by mapping code:', mappingCode);
          selectedKctToSet = allKcts.find(kct => kct.code === mappingCode);
          console.log('Found KCT by mapping:', selectedKctToSet?.name);
        }

        // Set the found KCT
        if (selectedKctToSet) {
          console.log('Setting selected KCT to:', selectedKctToSet.name, 'code:', selectedKctToSet.code);
          setSelectedKct(selectedKctToSet);
        } else {
          console.log('No matching KCT found for course');
          setSelectedKct(null);
        }

      } catch (error) {
        console.error('Error loading KCT options for editing:', error);
        setFilteredKctOptions([]);
        setKctOptions([]);
        setSelectedKct(null);
      }
    }

    // Set level and language after KCT is loaded
    setSelectedCreateLevel(course.level || '');
    setSelectedLanguage('en'); // All current courses are English

    // Open the create/edit dialog
    setIsCreateDialogOpen(true);
  };

  // Handle course updating
  const handleUpdateCourse = async () => {
    try {
      if (!editingCourse) return;

      // Validation
      if (!courseName.trim()) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập tên khóa học",
          variant: "destructive",
        });
        return;
      }

      if (!selectedCreateLevel) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn trình độ",
          variant: "destructive",
        });
        return;
      }

      // Ensure hours and sessions from KCT data match exactly
      const totalHours = selectedKct?.total_hours || editingCourse.hours || 0;
      const totalSessions = selectedKct?.total_sessions || editingCourse.sessions || Math.ceil(totalHours / 2);

      // Prepare update data
      const updateData = {
        title: courseName.trim(),
        level: selectedCreateLevel,
        hours: totalHours,
        sessions: totalSessions,
        learning_method: selectedKct?.learning_format || editingCourse.learning_method || 'online',
        summary: selectedKct ? `${courseName.trim()} - Based on KCT: ${selectedKct.name}` : courseName.trim(),
      };

      console.log('Updating course:', editingCourse.id, 'with data:', updateData);
      setIsCreatingCourse(true);

      // Call update API
      await courseService.updateCourse(editingCourse.id, updateData);

      toast({
        title: "Thành công",
        description: `Khóa học "${courseName}" đã được cập nhật thành công!`,
      });

      // Reset form and editing state
      setCourseName('');
      setSelectedLanguage('');
      setSelectedCreateLevel('');
      setSelectedKct(null);
      setIsCreateDialogOpen(false);
      setEditingCourse(null);
      setIsEditingCourse(false);

      // Refresh courses list
      const updatedCourses = await courseService.getCoursesByVersion(621);
      const transformedCourses = updatedCourses.map((course: CourseBlueprint) => {
        let kctName = '';
        if (course.summary && course.summary.includes('Based on KCT:')) {
          const summaryMatch = course.summary.match(/Based on KCT:\s*(.+)/);
          if (summaryMatch) {
            kctName = summaryMatch[1];
          }
        }

        return {
          id: course.id,
          name: course.title,
          level: course.level || "Foundation",
          program: "Language Learning",
          modality: course.learning_method || "online",
          totalHours: course.hours,
          sessions: Math.ceil(course.hours / 2),
          status: course.state || "draft",
          mappedKCT: kctName ? [kctName] : [],
          units: [],
          assessments: [],
          stats: {
            passRate: 85,
            completionRate: 90,
            avgFeedback: 4.5,
            enrolledClasses: 0,
          },
        };
      });

      transformedCourses.sort((a, b) => (b.id || 0) - (a.id || 0));
      setCourses(transformedCourses);
      setApiData(updatedCourses);

    } catch (error) {
      console.error('Failed to update course:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật khóa học. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCourse(false);
    }
  };

  // Handle course deletion with confirmation (opens modal)
  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      console.log('Deleting course:', courseToDelete.id);

      // Call delete API
      await courseService.deleteCourse(courseToDelete.id);

      toast({
        title: "Thành công",
        description: "Khóa học đã được xóa thành công",
      });

      // Close delete dialog
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);

      // Refresh courses list
      const updatedCourses = await courseService.getCoursesByVersion(621);
      const transformedCourses = updatedCourses.map((course: CourseBlueprint) => {
        let kctName = '';
        if (course.summary && course.summary.includes('Based on KCT:')) {
          const summaryMatch = course.summary.match(/Based on KCT:\s*(.+)/);
          if (summaryMatch) {
            kctName = summaryMatch[1];
          }
        }

        return {
          id: course.id,
          name: course.title,
          level: course.level || "Foundation",
          program: "Language Learning",
          modality: course.learning_method || "online",
          totalHours: course.hours,
          sessions: Math.ceil(course.hours / 2),
          status: course.state || "draft",
          mappedKCT: kctName ? [kctName] : [],
          units: [],
          assessments: [],
          stats: {
            passRate: 85,
            completionRate: 90,
            avgFeedback: 4.5,
            enrolledClasses: 0,
          },
        };
      });

      transformedCourses.sort((a, b) => (b.id || 0) - (a.id || 0));
      setCourses(transformedCourses);
      setApiData(updatedCourses);

      // Refresh KCT options to update courses count
      queryClient.invalidateQueries({ queryKey: ['curricula'] });

    } catch (error) {
      console.error('Failed to delete course:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa khóa học. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  // Handle KCT selection to populate course data
  const handleKctSelection = async (code: string) => {
    if (!code || code === "none") {
      setSelectedKct(null);
      return;
    }

    const kct = kctOptions.find(k => k.code === code);
    if (!kct) {
      setSelectedKct(null);
      return;
    }

    try {
      console.log("Fetching KCT details for ID:", kct.id);
      const details = await curriculumService.getCurriculum(kct.id);
      console.log("KCT details:", details);
      setSelectedKct(details);
    } catch (error) {
      console.error("Failed to fetch KCT details:", error);
      setSelectedKct(null);
    }
  };

  // Handle opening course detail modal - fetch full course data and KCT mappings
  const handleViewCourseDetails = async (course: any) => {
    setCourseDetailLoading(true);
    setSelectedCourse(course); // Set basic info first for immediate display

    // Handle edit mode initialization
    if (course.editMode) {
      setEditingCourse(course);
      setIsEditingCourse(true);
      setCourseName(course.title || '');
      setSelectedCreateLevel(course.level || 'A1');
      setSelectedLanguage('en'); // Default to English, could be detected from level
    }

    try {
      // Fetch full course details
      console.log('Fetching full course details for course ID:', course.id);
      const fullCourseDetails = await courseService.getCourse(course.id);
      console.log('Full course details:', fullCourseDetails);

      // Fetch KCT mappings for this course
      console.log('Fetching KCT mappings for course ID:', course.id);
      const kctMappings = await courseService.getKCTMappings(course.id);
      console.log('KCT mappings raw response:', kctMappings);

      // Handle potential undefined mappings with safe array operations
      const validMappings = Array.isArray(kctMappings) ? kctMappings.filter(mapping => mapping && mapping.kct_id) : [];

      // Extract KCT name from summary if available
      let kctName = null;
      if (fullCourseDetails.summary && fullCourseDetails.summary.includes('Based on KCT:')) {
        const summaryMatch = fullCourseDetails.summary.match(/Based on KCT:\s*(.+)/);
        if (summaryMatch) {
          kctName = summaryMatch[1];
        }
      }

      // Update course with full data
      const enrichedCourse = {
        ...course,
        learning_outcomes: fullCourseDetails.learning_outcomes || [],
        mappedKCT: validMappings.map(mapping => mapping.kct_id), // Extract KCT IDs securely
        mappedKCTNames: validMappings.map(mapping => mapping.kct_id), // Could be enhanced with full names
        kctName: kctName,
        program: fullCourseDetails.learning_method === 'online' ? 'Tiếng Anh Online' : 'Tiếng Anh Offline', // Basic language mapping for now
      };

      console.log('Enriched course data for detail view:', enrichedCourse);
      setSelectedCourse(enrichedCourse);

    } catch (error) {
      console.error('Error fetching course details:', error);
      // Keep basic course data if detailed fetch fails
      toast({
        title: "Cảnh báo",
        description: "Không thể tải chi tiết khóa học đầy đủ, hiển thị thông tin cơ bản.",
        variant: "default",
      });
    } finally {
      setCourseDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* API Status Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${apiData ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        <span className="text-muted-foreground">
          {apiData ? 'Đã kết nối với API backend' : 'Đang sử dụng dữ liệu mẫu'}
        </span>
        {apiData && (
          <span className="text-xs text-muted-foreground">
            ({apiData.length} khóa học từ API)
          </span>
        )}
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng khóa học</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Đã xuất bản</p>
                <p className="text-2xl font-bold">
                  {courses.filter(c => c.status === "published").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Lớp đang học</p>
                <p className="text-2xl font-bold">
                  {courses.reduce((sum, c) => sum + c.stats.enrolledClasses, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChartIcon className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tỷ lệ pass TB</p>
                <p className="text-2xl font-bold">
                  {Math.round(courses.reduce((sum, c) => sum + c.stats.passRate, 0) / courses.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm và lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative md:col-span-2">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm khóa học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả level</SelectItem>
                <SelectItem value="A1">A1</SelectItem>
                <SelectItem value="A2">A2</SelectItem>
                <SelectItem value="B1">B1</SelectItem>
                <SelectItem value="B1-B2">B1-B2</SelectItem>
                <SelectItem value="B2">B2</SelectItem>
                <SelectItem value="B2-C1">B2-C1</SelectItem>
                <SelectItem value="C1">C1</SelectItem>
                <SelectItem value="C2">C2</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger>
                <SelectValue placeholder="Chương trình" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chương trình</SelectItem>
                <SelectItem value="IELTS">IELTS</SelectItem>
                <SelectItem value="TOEIC">TOEIC</SelectItem>
                <SelectItem value="Business English">Business English</SelectItem>
                <SelectItem value="General English">General English</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedModality} onValueChange={setSelectedModality}>
              <SelectTrigger>
                <SelectValue placeholder="Hình thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="1-on-1">1-on-1</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
              if (!open) {
                // Reset all form data when dialog closes
                setCourseName('');
                setSelectedLanguage('');
                setSelectedCreateLevel('');
                setSelectedKct(null);
                setEditingCourse(null);
                setIsEditingCourse(false);
                setCreateForm({
                  name: '',
                  level: '',
                  mappedKCT: []
                });
              }
              setIsCreateDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  Tạo khóa học
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingCourse ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tên khóa học</Label>
                      <Input
                        placeholder="IELTS Preparation B2-C1"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Ngôn ngữ</Label>
                      <Select onValueChange={handleLanguageChange} value={selectedLanguage}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn ngôn ngữ trước" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">---</SelectItem>
                          <SelectItem value="en">Tiếng Anh (CEFR)</SelectItem>
                          <SelectItem value="jp">Tiếng Nhật (JLPT)</SelectItem>
                          <SelectItem value="zh">Tiếng Trung (HSK)</SelectItem>
                          <SelectItem value="ko">Tiếng Hàn (TOPIK)</SelectItem>
                          <SelectItem value="vi">Tiếng Việt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Trình độ</Label>
                    <Select disabled={!selectedLanguage} onValueChange={(level) => setSelectedCreateLevel(level === "none" ? "" : level)} value={selectedCreateLevel || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedLanguage ? "Chọn trình độ" : "Chọn ngôn ngữ trước"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">---</SelectItem>
                        {selectedLanguage ? (
                          getAvailableLevels(getLanguageKey(selectedLanguage)).map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))
                        ) : null}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Map với KCT ({filteredKctOptions.length})</Label>
                    <Select onValueChange={handleKctSelection} disabled={!selectedCreateLevel} value={selectedKct?.code || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedCreateLevel ? "Chọn KCT" : "Chọn trình độ trước"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">---</SelectItem>
                        {filteredKctOptions.map((kct) => (
                          <SelectItem key={kct.id} value={kct.code}>
                            {kct.name} - {kct.target_level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>


                  {selectedKct && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Tổng số buổi</Label>
                          <Input value={selectedKct.total_sessions} readOnly />
                        </div>
                        <div>
                          <Label>Tổng số giờ</Label>
                          <Input value={selectedKct.total_hours} readOnly />
                        </div>
                        <div>
                          <Label>Hình thức học</Label>
                          <Input value={mapLearningMethod(selectedKct.learning_format)} readOnly />
                        </div>
                      </div>



                      {selectedKct.learning_objectives && selectedKct.learning_objectives.length > 0 && (
                        <div>
                          <Label>Mục tiêu học tập </Label>
                          <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-3 bg-gray-50">
                            {selectedKct.learning_objectives.map((objective, index) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                <span>{typeof objective === 'string' ? objective : objective?.text || objective}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      className="flex-1"
                      onClick={isEditingCourse ? handleUpdateCourse : handleCreateCourse}
                      disabled={isCreatingCourse}
                    >
                      {isCreatingCourse ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {isEditingCourse ? 'Đang cập nhật...' : 'Đang tạo...'}
                        </>
                      ) : (
                        isEditingCourse ? 'Cập nhật khóa học' : 'Tạo khóa học'
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreatingCourse}>
                      Hủy
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{course.name}</h3>
                  <div className="flex gap-1 mb-2">
                    <Badge variant="outline">{course.level}</Badge>
                    <Badge className={getModalityColor(course.modality)}>
                      {course.modality}
                    </Badge>
                    <Badge variant={course.status === "published" ? "default" : "secondary"}>
                      {course.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleEditCourse(course)}>
                    <EditIcon className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setCourseToDelete(course);
                    setIsDeleteDialogOpen(true);
                  }}>
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  <span>{course.totalHours}h • {course.sessions} buổi</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="h-4 w-4" />
                  <span>{course.units.length} units</span>
                </div>
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  <span>Map: {course.mappedKCT.join(", ")}</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium text-green-600">{course.stats.passRate}%</div>
                  <div>Pass Rate</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium text-blue-600">{course.stats.completionRate}%</div>
                  <div>Completion</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleViewCourseDetails(course)}
                >
                  <TargetIcon className="mr-1 h-3 w-3" />
                  Chi tiết
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <UsersIcon className="mr-1 h-3 w-3" />
                  Gán lớp
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="units">Units</TabsTrigger>
                <TabsTrigger value="assessments">Đánh giá</TabsTrigger>
                <TabsTrigger value="reports">Báo cáo</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {isEditingCourse && selectedCourse ? (
                  // Edit form
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Chỉnh sửa khóa học</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Tên khóa học</Label>
                          <Input
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Ngôn ngữ</Label>
                          <Select onValueChange={handleLanguageChange} value={selectedLanguage}>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn ngôn ngữ" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">---</SelectItem>
                              <SelectItem value="en">Tiếng Anh (CEFR)</SelectItem>
                              <SelectItem value="jp">Tiếng Nhật (JLPT)</SelectItem>
                              <SelectItem value="zh">Tiếng Trung (HSK)</SelectItem>
                              <SelectItem value="ko">Tiếng Hàn (TOPIK)</SelectItem>
                              <SelectItem value="vi">Tiếng Việt</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Trình độ</Label>
                        <Select disabled={!selectedLanguage} onValueChange={(level) => setSelectedCreateLevel(level === "none" ? "" : level)} value={selectedCreateLevel}>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedLanguage ? "Chọn trình độ" : "Chọn ngôn ngữ trước"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">---</SelectItem>
                            {selectedLanguage ? (
                              getAvailableLevels(getLanguageKey(selectedLanguage)).map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))
                            ) : null}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Map với KCT ({filteredKctOptions.length})</Label>
                        <Select onValueChange={handleKctSelection} disabled={!selectedCreateLevel} value={selectedKct?.code || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedCreateLevel ? "Chọn KCT" : "Chọn trình độ trước"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">---</SelectItem>
                            {filteredKctOptions.map((kct) => (
                              <SelectItem key={kct.id} value={kct.code}>
                                {kct.name} - {kct.target_level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedKct && (
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Tổng số buổi</Label>
                            <Input value={selectedKct.total_sessions} readOnly />
                          </div>
                          <div>
                            <Label>Tổng số giờ</Label>
                            <Input value={selectedKct.total_hours} readOnly />
                          </div>
                          <div>
                            <Label>Hình thức học</Label>
                            <Input value={mapLearningMethod(selectedKct.learning_format)} readOnly />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          className="flex-1"
                          onClick={handleUpdateCourse}
                          disabled={isCreatingCourse}
                        >
                          {isCreatingCourse ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Đang cập nhật...
                            </>
                          ) : (
                            'Cập nhật khóa học'
                          )}
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setIsEditingCourse(false);
                          setEditingCourse(null);
                          setCourseName('');
                        }} disabled={isCreatingCourse}>
                          Hủy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  // View mode - show info cards
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Thông tin cơ bản của khóa học</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span><strong>Tên khóa học:</strong></span>
                            <span>{selectedCourse.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span><strong>Level:</strong></span>
                            <span>{selectedCourse.level}</span>
                          </div>
          {/* <div className="flex justify-between">
                            <span><strong>Chương trình học:</strong></span>
                            <span>{selectedCourse.program}</span>
                          </div> */}
                          <div className="flex justify-between">
                            <span><strong>Hình thức học:</strong></span>
                            <span className="capitalize">{selectedCourse.modality}</span>
                          </div>
                          <div className="flex justify-between">
                            <span><strong>Tổng giờ:</strong></span>
                            <span>{selectedCourse.totalHours}h</span>
                          </div>
                          <div className="flex justify-between">
                            <span><strong>Số buổi:</strong></span>
                            <span>{selectedCourse.sessions} buổi</span>
                          </div>
                          <div className="flex justify-between">
                            <span><strong>Trạng thái:</strong></span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              selectedCourse.status === 'published' ? 'bg-green-100 text-green-800' :
                              selectedCourse.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {selectedCourse.status === 'draft' ? 'Bản nháp' :
                               selectedCourse.status === 'published' ? 'Đã xuất bản' :
                               selectedCourse.status}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Thông tin KCT được map</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <strong className="text-sm">KCT được map:</strong>
                            <div className="mt-2">
                              {selectedCourse.kctName ? (
                                <Badge variant="default" className="text-sm">
                                  {selectedCourse.kctName}
                                </Badge>
                              ) : selectedCourse.mappedKCT.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {selectedCourse.mappedKCT.map((kctId, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {kctId}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground italic">
                                  Chưa có KCT nào được map
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium block mb-2">
                              Mục tiêu học tập:
                            </label>
                            <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                              {selectedCourse.learning_outcomes && selectedCourse.learning_outcomes.length > 0 ? (
                                <ul className="space-y-2">
                                  {selectedCourse.learning_outcomes.map((objective, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                      <span>{typeof objective === 'string' ? objective : objective?.text || objective}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-sm text-muted-foreground italic">
                                  Chưa có mục tiêu học tập nào
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="units" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Danh sách Units</h4>
                  <Button size="sm">
                    <PlusCircleIcon className="mr-1 h-3 w-3" />
                    Thêm Unit
                  </Button>
                </div>

                <div className="space-y-3">
                  {selectedCourse.units.map((unit, idx) => (
                    <Card key={unit.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h5 className="font-medium">{unit.title}</h5>
                            <p className="text-sm text-muted-foreground">{unit.duration} phút</p>
                          </div>
                          <Badge variant="outline">Unit {idx + 1}</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <Label className="text-xs font-medium">Mục tiêu</Label>
                            <ul className="text-xs mt-1 space-y-1">
                              {unit.objectives.map((obj, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <CheckCircleIcon className="h-3 w-3 text-green-500 mt-0.5" />
                                  {obj}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <Label className="text-xs font-medium">Lesson Plan (AI Generated)</Label>
                            <div className="text-xs mt-1 space-y-1">
                              <p><strong>Warm-up:</strong> {unit.lessonPlan.warmup}</p>
                              <p><strong>Practice:</strong> {unit.lessonPlan.practice}</p>
                              <p><strong>Assessment:</strong> {unit.lessonPlan.assessment}</p>
                              <p><strong>Homework:</strong> {unit.lessonPlan.homework}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <BotIcon className="mr-1 h-3 w-3" />
                            Tái tạo AI
                          </Button>
                          <Button size="sm" variant="outline">
                            <EditIcon className="mr-1 h-3 w-3" />
                            Chỉnh sửa
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {selectedCourse.units.length === 0 && (
                    <div className="text-center py-8">
                      <BookOpenIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">Chưa có units nào</p>
                      <Button>
                        <BotIcon className="mr-2 h-4 w-4" />
                        Tạo Units với AI
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="assessments" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Bài đánh giá</h4>
                  <Button size="sm">
                    <PlusCircleIcon className="mr-1 h-3 w-3" />
                    Thêm assessment
                  </Button>
                </div>

                <div className="space-y-3">
                  {selectedCourse.assessments.map((assessment, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium">{assessment.name}</h5>
                            <p className="text-sm text-muted-foreground">
                              {assessment.type} • Rubric: {assessment.rubric}
                            </p>
                          </div>
                          <Badge variant="outline">{assessment.type}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {selectedCourse.assessments.length === 0 && (
                    <div className="text-center py-8">
                      <TargetIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Chưa có bài đánh giá nào</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {selectedCourse.stats.passRate}%
                      </div>
                      <p className="text-sm text-muted-foreground">Pass Rate</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {selectedCourse.stats.completionRate}%
                      </div>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {selectedCourse.stats.avgFeedback}
                      </div>
                      <p className="text-sm text-muted-foreground">Avg Feedback</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Cảnh báo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedCourse.units.length === 0 && (
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800">Khóa học chưa có units</span>
                        </div>
                      )}

                      {selectedCourse.assessments.length === 0 && (
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800">Khóa học chưa có bài đánh giá</span>
                        </div>
                      )}

                      {selectedCourse.totalHours < 20 && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                          <AlertTriangleIcon className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-800">Khóa học có ít hơn 20 giờ</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpenIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Không tìm thấy khóa học nào</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-red-500" />
              Xác nhận xóa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Bạn có chắc muốn xóa khóa học này không?
              </p>
              {courseToDelete && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-sm">
                    <strong>{courseToDelete.name}</strong>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Level: {courseToDelete.level} • {courseToDelete.modality}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangleIcon className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-800">
                  <strong>Hành động này không thể hoàn tác.</strong> Tất cả dữ liệu liên quan bao gồm các đơn vị học tập và bài đánh giá sẽ bị xóa.
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDeleteCourse}
                disabled={isCreatingCourse}
              >
                {isCreatingCourse ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Xóa khóa học
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isCreatingCourse}>
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CourseManagement;
