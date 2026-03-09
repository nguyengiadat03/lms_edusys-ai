"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { curriculumService } from "@/services/curriculumService";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  SearchIcon,
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  CheckCircle2,
  PlayCircle,
  Archive,
  Filter,
  Download,
  Settings,
  CalendarIcon,
  X,
  Save,
  Eye,
  EyeOff,
  Plus,
  Target,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { CreateCurriculumDialog } from "./CreateCurriculumDialog";
import { EditCurriculumDialog } from "./EditCurriculumDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const mockCurricula = [
  {
    id: "kct-001",
    name: "Business English B1-B2",
    program: "Business English",
    language: "English",
    level: "B1-B2",
    ageGroup: "Adults",
    totalHours: 150,
    courseCount: 15,
    status: "draft" as const,
    owner: "Lê Thị Hoa",
    version: "v1.0",
    lastUpdated: "2024-10-28",
    createdAt: "2024-09-15",
    learningObjectives: ["Business Communication", "Presentation Skills", "Email Writing"],
    summary: "Focuses on business communication and presentation skills for professionals.",
    tags: ["Business", "Communication", "Professional"],
  },
  {
    id: "kct-002",
    name: "English Foundation A1-A2",
    program: "English for Kids",
    language: "English",
    level: "A1-A2",
    ageGroup: "Kids",
    totalHours: 120,
    courseCount: 12,
    status: "approved" as const,
    owner: "Nguyễn Thị Lan",
    version: "v2.1",
    lastUpdated: "2024-10-25",
    createdAt: "2024-08-10",
    learningObjectives: ["Basic Speaking", "Listening Skills", "Simple Reading"],
    summary: "Builds foundational speaking and listening skills for young learners.",
    tags: ["Foundation", "Kids", "Basic"],
  },
  {
    id: "kct-003",
    name: "IELTS Preparation B2-C1",
    program: "Exam Prep",
    language: "English",
    level: "B2-C1",
    ageGroup: "Teens/Adults",
    totalHours: 200,
    courseCount: 20,
    status: "published" as const,
    owner: "Trần Văn An",
    version: "v1.5",
    lastUpdated: "2024-10-20",
    createdAt: "2024-07-20",
    learningObjectives: ["IELTS 6.5+", "Academic Writing", "Test Strategies"],
    summary: "Prepares students for the IELTS exam, targeting band 6.5+.",
    tags: ["IELTS", "Exam", "Academic"],
  },
  {
    id: "kct-004",
    name: "Japanese Communication N5",
    program: "Japanese",
    language: "Japanese",
    level: "N5",
    ageGroup: "Adults",
    totalHours: 100,
    courseCount: 10,
    status: "archived" as const,
    owner: "Sato Yumi",
    version: "v1.0",
    lastUpdated: "2023-05-15",
    createdAt: "2023-03-01",
    learningObjectives: ["Hiragana/Katakana", "Basic Phrases", "Self-Introduction"],
    summary: "Basic Japanese communication for beginners.",
    tags: ["Japanese", "Beginner", "Communication"],
  },
];

type StatusType = "draft" | "approved" | "published" | "archived";

interface FilterState {
  search: string;
  language: string;
  level: string;
  ageGroup: string;
  learningObjectives: string;
  status: StatusType[];
  owner: string;
  dateRange: { from?: Date; to?: Date };
}

interface SavedView {
  id: string;
  name: string;
  filters: FilterState;
  visibleColumns: string[];
  isPrivate: boolean;
}

const getStatusBadge = (status: StatusType) => {
  const config = {
    draft: {
      label: "Bản nháp",
      icon: Pencil,
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    approved: {
      label: "Đã phê duyệt",
      icon: CheckCircle2,
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    published: {
      label: "Đã xuất bản",
      icon: PlayCircle,
      className: "bg-green-100 text-green-800 border-green-200",
    },
    archived: {
      label: "Lưu trữ",
      icon: Archive,
      className: "bg-gray-100 text-gray-800 border-gray-200",
    },
  };
  const current = config[status] || {
    label: "Không xác định",
    icon: Pencil,
    className: "bg-gray-100 text-gray-800 border-gray-200",
  };
  const Icon = current.icon;
  return (
    <Badge variant="outline" className={`flex items-center gap-1.5 ${current.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {current.label}
    </Badge>
  );
};

const defaultColumns = [
  { key: "name", label: "Tên KCT", visible: true },
  { key: "program", label: "Ngôn ngữ/Ngành", visible: true },
  { key: "level", label: "Trình độ", visible: false },
  { key: "ageGroup", label: "Nhóm tuổi", visible: false },
  { key: "totalHours", label: "Tổng giờ", visible: false },
  { key: "courseCount", label: "Số khoá", visible: true },
  { key: "status", label: "Trạng thái", visible: true },
  { key: "owner", label: "Người phụ trách", visible: true },
  { key: "version", label: "Phiên bản", visible: true },
  { key: "createdAt", label: "Ngày tạo", visible: true },
  { key: "lastUpdated", label: "Cập nhật cuối", visible: true },
];

// Helper function for age group display
const getAgeGroupDisplay = (ageGroup: string) => {
  const ageGroupMap: { [key: string]: string } = {
    'kids': 'Trẻ em',
    'teens': 'Thiếu niên',
    'adults': 'Người lớn',
    'all': 'Tất cả',
  };
  return ageGroupMap[ageGroup] || ageGroup;
};

// Helper function for language display
const getLanguageDisplay = (language: string) => {
  const languageMap: { [key: string]: string } = {
    'en': 'Tiếng Anh',
    'jp': 'Tiếng Nhật',
    'vi': 'Tiếng Việt',
    'zh': 'Tiếng Trung',
    'ko': 'Tiếng Hàn Quốc',
    'fr': 'Tiếng Pháp',
    'de': 'Tiếng Đức',
    'es': 'Tiếng Tây Ban Nha',
    'English': 'Tiếng Anh',
    'Japanese': 'Tiếng Nhật',
  };
  return languageMap[language] || language;
};

// Helper function for date display in DD/MM/YYYY - hh:mm format
const formatDisplayDate = (dateString: string) => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    // Always show both date and time in the specified format: DD/MM/YYYY - hh:mm
    return `${day}/${month}/${year} - ${hours}:${minutes}`;
  } catch (error) {
    return dateString; // Fallback to original string
  }
};

// Helper function for column width classes
const getColumnWidthClass = (columnKey: string) => {
  const widthClasses = {
    'name': 'min-w-[240px] w-full',
    'program': 'min-w-[130px]',
    'level': 'min-w-[90px]',
    'ageGroup': 'min-w-[90px]',
    'totalHours': 'min-w-[80px]',
    'courseCount': 'min-w-[80px]',
    'status': 'min-w-[110px]',
    'owner': 'min-w-[130px]',
    'version': 'min-w-[70px]',
    'createdAt': 'min-w-[160px]',
    'lastUpdated': 'min-w-[160px]',
    'learningObjectives': 'min-w-[160px]',
  };
  return widthClasses[columnKey as keyof typeof widthClasses] || '';
};

const CurriculumList = () => {
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCurriculumId, setEditingCurriculumId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState<any>(null);

  const queryClient = useQueryClient();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => curriculumService.deleteCurriculum(id),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa khung chương trình thành công",
      });
      queryClient.invalidateQueries({ queryKey: ['curricula'] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi xóa khung chương trình",
        description: error.response?.data?.error?.message || "Có lỗi xảy ra khi xóa khung chương trình",
        variant: "destructive",
      });
    },
  });

  // Fetch curriculum data from API
  const { data: apiData, isLoading, error } = useQuery({
    queryKey: ['curricula'],
    queryFn: () => curriculumService.getCurriculums(),
    retry: 1,
  });

  // Use API data if available, otherwise fall back to mock data
  const [data, setData] = useState(mockCurricula);

  // Update data when API response arrives
  React.useEffect(() => {
    if (apiData?.data) {
      // Transform API data to match component's expected format
      const transformedData = apiData.data.map(item => ({
        id: item.id.toString(),
        code: item.code, // Keep original code from API
        name: item.name,
        program: getLanguageDisplay(item.language) || getLanguageDisplay(item.displayLanguage), // Đổi sang tiếng Việt
        language: getLanguageDisplay(item.language) || getLanguageDisplay(item.displayLanguage), // Đổi sang tiếng Việt
        level: item.target_level || '',
        ageGroup: item.age_group || 'all',
        totalHours: item.total_hours,
        courseCount: item.courses_count || 0, // Sử dụng số khóa học từ API JOIN
        status: item.status as StatusType,
        owner: item.owner_name || 'Unknown',
        version: item.latest_version_no || 'v1.0',
        lastUpdated: item.updated_at ? new Date(item.updated_at).toISOString() : '',
        createdAt: item.created_at ? new Date(item.created_at).toISOString() : '',
        learningObjectives: item.learning_objectives || [],
        summary: item.description || '',
        tags: item.tags || [], // Đã có từ API response
        // New fields from database
        totalSessions: item.total_sessions,
        sessionDurationHours: item.session_duration_hours,
        learningMethod: item.learning_method,
        learningFormat: item.learning_format,
      }));
      setData(transformedData);
    }
  }, [apiData]);

  // Show error toast if API fails
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Error loading curricula",
        description: "Failed to load curriculum data. Using sample data instead.",
        variant: "destructive",
      });
    }
  }, [error]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [columns, setColumns] = useState(defaultColumns);
  const [savedViews, setSavedViews] = useState<SavedView[]>([
    {
      id: "default",
      name: "Tất cả KCT",
      filters: {
        search: "",
        language: "all",
        level: "all",
        ageGroup: "all",
        learningObjectives: "all",
        status: [],
        owner: "all",
        dateRange: {},
      },
      visibleColumns: defaultColumns.map(col => col.key),
      isPrivate: false,
    },
  ]);
  const [currentView, setCurrentView] = useState("default");

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    language: "all",
    level: "all",
    ageGroup: "all",
    learningObjectives: "all",
    status: [],
    owner: "all",
    dateRange: {},
  });

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    const filtered = data.filter((item) => {
      // Search filter
      if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !item.summary.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }



      // Language filter - handle different language representations
      if (filters.language !== "all") {
        const languageMap: { [key: string]: string[] } = {
          "Tiếng Anh": ["Tiếng Anh", "English", "en"],
          "Tiếng Nhật": ["Tiếng Nhật", "Japanese", "jp"],
          "Tiếng Trung": ["Tiếng Trung", "Chinese", "zh"],
          "Tiếng Hàn Quốc": ["Tiếng Hàn Quốc", "Korean", "ko"],
          "Tiếng Pháp": ["Tiếng Pháp", "French", "fr"],
          "Tiếng Đức": ["Tiếng Đức", "German", "de"],
          "Tiếng Tây Ban Nha": ["Tiếng Tây Ban Nha", "Spanish", "es"],
          "Tiếng Ý": ["Tiếng Ý", "Italian", "it"],
          "Tiếng Nga": ["Tiếng Nga", "Russian", "ru"],
          "Tiếng Ả Rập": ["Tiếng Ả Rập", "Arabic", "ar"],
          "Tiếng Thái": ["Tiếng Thái", "Thai", "th"],
          "Tiếng Việt": ["Tiếng Việt", "Vietnamese", "vi"],
          "Tiếng Bồ Đào Nha": ["Tiếng Bồ Đào Nha", "Portuguese", "pt"]
        };
        const matchingLanguages = languageMap[filters.language] || [filters.language];
        if (!matchingLanguages.some(lang => lang === item.language.toLowerCase() ||
                                              lang === getLanguageDisplay(item.language).toLowerCase())) {
          return false;
        }
      }

      // Level filter - handle both formatted and simple level names
      if (filters.level !== "all") {
        const levelToMatch = filters.level.split(' ')[0]; // Extract code like A1, B2, N5, HSK1, etc.
        const itemLevel = item.level.split(' ')[0]; // Extract code from item level
        if (levelToMatch !== itemLevel && !item.level.toLowerCase().includes(levelToMatch.toLowerCase())) {
          return false;
        }
      }

      // Age group filter - handle different age group representations
      if (filters.ageGroup !== "all") {
        const ageGroupMap: { [key: string]: string[] } = {
          "kids": ["kids", "Trẻ em", "Trẻ em (6-12 tuổi)", "children", "Trẻ nhỏ (4-8 tuổi)"],
          "teens": ["teens", "Thiếu niên", "Thiếu niên (13-17 tuổi)", "adolescents", "Vị thành niên (14-18 tuổi)"],
          "adults": ["adults", "Người lớn", "Người lớn (18-65 tuổi)"],
          "young-adults": ["young-adults", "Người trẻ (18-25 tuổi)"],
          "professionals": ["professionals", "Nhân viên văn phòng (25-45 tuổi)"],
          "seniors": ["seniors", "Người cao tuổi (50+ tuổi)"],
          "mixed": ["mixed", "Nhóm hỗn hợp"],
          "college": ["college", "Sinh viên Đại học"]
        };
        const matchingAgeGroups = ageGroupMap[filters.ageGroup] || [filters.ageGroup];
        if (!matchingAgeGroups.some(age =>
          age === item.ageGroup ||
          age === getAgeGroupDisplay(item.ageGroup)
        )) {
          return false;
        }
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(item.status)) {
        return false;
      }

      // Owner filter
      if (filters.owner !== "all" && item.owner !== filters.owner) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const itemDate = new Date(item.lastUpdated);
        if (filters.dateRange.from && itemDate < filters.dateRange.from) return false;
        if (filters.dateRange.to && itemDate > filters.dateRange.to) return false;
      }

      return true;
    });

    // Sort
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof typeof a];
        const bValue = b[sortConfig.key as keyof typeof b];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, filters, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleBulkStatusChange = (newStatus: StatusType) => {
    const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
    setData(prev => prev.map(item =>
      selectedIds.includes(item.id) ? { ...item, status: newStatus } : item
    ));
    setRowSelection({});
  };

  const handleBulkReassign = (newOwner: string) => {
    const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
    setData(prev => prev.map(item =>
      selectedIds.includes(item.id) ? { ...item, owner: newOwner } : item
    ));
    setRowSelection({});
  };

  const handleEdit = (curriculumId: string) => {
    setEditingCurriculumId(curriculumId);
    setEditDialogOpen(true);
  };

  const handleViewDetails = (curriculum: any) => {
    setSelectedCurriculum(curriculum);
    setDetailDialogOpen(true);
  };

  const handleDelete = (curriculumId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa khung chương trình này?")) {
      deleteMutation.mutate(parseInt(curriculumId));
    }
  };

  const handleBulkExport = () => {
    // Real export functionality using API
    const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
    if (selectedIds.length === 0) {
      toast({
        title: "Không có dữ liệu để export",
        description: "Vui lòng chọn ít nhất một khung chương trình để export",
        variant: "destructive",
      });
      return;
    }

    const selectedData = data.filter(item => selectedIds.includes(item.id));

    // Create CSV content - following visible columns order
    const csvHeaders = visibleColumns.map(col => col.label);
    csvHeaders.unshift("Mã KCT"); // Add ID at beginning

    const csvContent = [
      csvHeaders,
      ...selectedData.map(item => [
        item.id,
        item.name,
        item.program, // Ngôn ngữ/Ngành
        item.level,
        item.ageGroup,
        item.totalHours.toString(),
        item.courseCount,
        item.status,
        item.owner,
        item.version,
        item.createdAt, // Ngày tạo comes before Cập nhật cuối
        item.lastUpdated
      ].slice(0, csvHeaders.length)) // Make sure we have the same number of columns
    ].map(row => row.join(",")).join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `curricula_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setRowSelection({});
    toast({
      title: "Export thành công",
      description: `Đã export ${selectedData.length} khung chương trình`,
    });
  };

  const saveCurrentView = (name: string, isPrivate: boolean = false) => {
    const newView: SavedView = {
      id: Date.now().toString(),
      name,
      filters: { ...filters },
      visibleColumns: columns.filter(col => col.visible).map(col => col.key),
      isPrivate,
    };
    setSavedViews(prev => [...prev, newView]);
    setCurrentView(newView.id);
  };

  const loadView = (view: SavedView) => {
    setFilters(view.filters);
    setColumns(columns.map(col => ({
      ...col,
      visible: view.visibleColumns.includes(col.key)
    })));
    setCurrentView(view.id);
  };

  const visibleColumns = columns.filter(col => col.visible);

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải danh sách KCT...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* API Status Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${apiData ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        <span className="text-muted-foreground">
          {apiData ? 'Đã kết nối với API backend' : 'Đang sử dụng dữ liệu mẫu'}
        </span>
        {apiData && (
          <span className="text-xs text-muted-foreground">
            ({apiData.total} KCT từ API)
          </span>
        )}
      </div>



      {/* Header with Filters and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative w-full max-w-lg">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm KCT..."
              className="pl-9"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Bộ lọc
                {(filters.language !== "all" ||
                  filters.level !== "all" ||
                  filters.ageGroup !== "all" ||
                  filters.dateRange.from ||
                  filters.search) && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {[
                      filters.language !== "all",
                      filters.level !== "all",
                      filters.ageGroup !== "all",
                      filters.dateRange.from,
                    ].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-4" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Bộ lọc nâng cao</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({
                      search: "",
                      language: "all",
                      level: "all",
                      ageGroup: "all",
                      learningObjectives: "all",
                      status: [],
                      owner: "all",
                      dateRange: {},
                    })}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Xóa tất cả
                  </Button>
                </div>



                {/* Language Filter */}
                <div>
                  <Label className="text-sm font-medium">Ngôn ngữ</Label>
                  <Select
                    value={filters.language}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="Tiếng Anh">Tiếng Anh</SelectItem>
                      <SelectItem value="Tiếng Nhật">Tiếng Nhật</SelectItem>
                      <SelectItem value="Tiếng Trung">Tiếng Trung</SelectItem>
                      <SelectItem value="Tiếng Hàn Quốc">Tiếng Hàn Quốc</SelectItem>
                      <SelectItem value="Tiếng Pháp">Tiếng Pháp</SelectItem>
                      <SelectItem value="Tiếng Đức">Tiếng Đức</SelectItem>
                      <SelectItem value="Tiếng Tây Ban Nha">Tiếng Tây Ban Nha</SelectItem>
                      <SelectItem value="Tiếng Ý">Tiếng Ý</SelectItem>
                      <SelectItem value="Tiếng Nga">Tiếng Nga</SelectItem>
                      <SelectItem value="Tiếng Ả Rập">Tiếng Ả Rập</SelectItem>
                      <SelectItem value="Tiếng Thái">Tiếng Thái</SelectItem>
                      <SelectItem value="Tiếng Việt">Tiếng Việt</SelectItem>
                      <SelectItem value="Tiếng Hàn">Tiếng Hàn</SelectItem>
                      <SelectItem value="Tiếng Bồ Đào Nha">Tiếng Bồ Đào Nha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Level Filter */}
                <div>
                  <Label className="text-sm font-medium">Trình độ</Label>
                  <Select
                    value={filters.level}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, level: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {/* CEFR Levels */}
                      <SelectItem value="A1">A1 - Sơ cấp</SelectItem>
                      <SelectItem value="A2">A2 - Trung cấp sơ</SelectItem>
                      <SelectItem value="B1">B1 - Trung cấp</SelectItem>
                      <SelectItem value="B2">B2 - Trung cấp cao</SelectItem>
                      <SelectItem value="C1">C1 - Cao cấp</SelectItem>
                      <SelectItem value="C2">C2 - Thành thạo</SelectItem>
                      {/* JLPT Levels */}
                      <SelectItem value="N5">N5 - Sơ cấp JLPT</SelectItem>
                      <SelectItem value="N4">N4 - Trung cấp sơ JLPT</SelectItem>
                      <SelectItem value="N3">N3 - Trung cấp JLPT</SelectItem>
                      <SelectItem value="N2">N2 - Trung cấp cao JLPT</SelectItem>
                      <SelectItem value="N1">N1 - Cao cấp JLPT</SelectItem>
                      {/* HSK Levels */}
                      <SelectItem value="HSK1">HSK1 - Sơ cấp</SelectItem>
                      <SelectItem value="HSK2">HSK2 - Sơ cấp trung</SelectItem>
                      <SelectItem value="HSK3">HSK3 - Trung cấp</SelectItem>
                      <SelectItem value="HSK4">HSK4 - Trung cấp cao</SelectItem>
                      <SelectItem value="HSK5">HSK5 - Cao cấp</SelectItem>
                      <SelectItem value="HSK6">HSK6 - Thành thạo</SelectItem>
                      {/* TOPIK Levels */}
                      <SelectItem value="TOPIK1">TOPIK I - Sơ cấp</SelectItem>
                      <SelectItem value="TOPIK2">TOPIK II - Trung cấp</SelectItem>
                      <SelectItem value="TOPIK3">TOPIK III - Cao cấp</SelectItem>
                      <SelectItem value="TOPIK4">TOPIK IV - Thành thạo</SelectItem>
                      {/* TOEFL/IELTS Range */}
                      <SelectItem value="TOEFL-iBT">TOEFL iBT</SelectItem>
                      <SelectItem value="IELTS">IELTS</SelectItem>
                      <SelectItem value="TOEIC">TOEIC</SelectItem>
                      {/* Basic Ranges */}
                      <SelectItem value="Sơ cấp">Sơ cấp tổng quát</SelectItem>
                      <SelectItem value="Trung cấp">Trung cấp tổng quát</SelectItem>
                      <SelectItem value="Cao cấp">Cao cấp tổng quát</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Age Group Filter */}
                <div>
                  <Label className="text-sm font-medium">Nhóm tuổi</Label>
                  <Select
                    value={filters.ageGroup}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, ageGroup: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="kids">Trẻ em (6-12 tuổi)</SelectItem>
                      <SelectItem value="teens">Thiếu niên (13-17 tuổi)</SelectItem>
                      <SelectItem value="adults">Người lớn (18-65 tuổi)</SelectItem>
                      <SelectItem value="young-adults">Người trẻ (18-25 tuổi)</SelectItem>
                      <SelectItem value="professionals">Nhân viên văn phòng (25-45 tuổi)</SelectItem>
                      <SelectItem value="seniors">Người cao tuổi (50+ tuổi)</SelectItem>
                      <SelectItem value="mixed">Nhóm hỗn hợp</SelectItem>
                      <SelectItem value="children">Trẻ nhỏ (4-8 tuổi)</SelectItem>
                      <SelectItem value="adolescents">Vị thành niên (14-18 tuổi)</SelectItem>
                      <SelectItem value="college">Sinh viên Đại học</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <Label className="text-sm font-medium">Khoảng thời gian</Label>
                  <div className="mt-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.from ? (
                            filters.dateRange.to ? (
                              <>
                                {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                                {format(filters.dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(filters.dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Chọn khoảng thời gian</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={filters.dateRange?.from}
                          onSelect={(range) => setFilters(prev => ({ ...prev, dateRange: range || {} }))}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>



          <Button variant="outline">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>

          <Button className="bg-gradient-to-r from-green-600 to-green-700 text-white" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Thêm mới
          </Button>

          {/* Edit Button - Always visible but disabled when not exactly one item selected */}
          <Button
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
            disabled={Object.keys(rowSelection).length !== 1}
            onClick={() => {
              const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
              if (selectedIds.length === 1) {
                handleEdit(selectedIds[0]);
              } else {
                toast({
                  title: "Không thể chỉnh sửa nhiều items",
                  description: "Chỉ có thể chỉnh sửa một khung chương trình tại một thời điểm.",
                  variant: "destructive",
                });
              }
            }}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Chỉnh sửa
          </Button>

          {/* Delete Button - Only enabled when selections exist */}
          <Button
            variant="destructive"
            disabled={Object.keys(rowSelection).length === 0}
            onClick={() => {
              const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
              const confirmed = confirm(
                `Bạn có chắc chắn muốn xóa ${selectedIds.length} khung chương trình đã chọn?`
              );
              if (confirmed) {
                // Delete all selected items
                selectedIds.forEach(id => deleteMutation.mutate(parseInt(id)));
                setRowSelection({});
              }
            }}
          >
            <Archive className="h-4 w-4 mr-1" />
            Xóa ({Object.keys(rowSelection).length})
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Hiển thị {filteredData.length} trên {data.length} KCT
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    filteredData.length > 0 &&
                    filteredData.every((row) => rowSelection[row.id])
                  }
                  onCheckedChange={(checked) => {
                    const newSelection: Record<string, boolean> = {};
                    if (checked) {
                      filteredData.forEach((row) => {
                        newSelection[row.id] = true;
                      });
                    }
                    setRowSelection(newSelection);
                  }}
                />
              </TableHead>
              {visibleColumns.map(column => (
                <TableHead key={column.key} className={getColumnWidthClass(column.key)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium justify-start w-full"
                    onClick={() => handleSort(column.key)}
                  >
                    {column.label}
                    <ArrowUpDown className="ml-2 h-4 w-4 flex-shrink-0" />
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Checkbox
                    checked={rowSelection[row.id] || false}
                    onCheckedChange={(checked) => {
                      const newSelection = { ...rowSelection };
                      if (checked) {
                        newSelection[row.id] = true;
                      } else {
                        delete newSelection[row.id];
                      }
                      setRowSelection(newSelection);
                    }}
                  />
                </TableCell>
                {visibleColumns.map(column => {
                  switch (column.key) {
                    case "name":
                      return (
                        <TableCell key={column.key}>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="cursor-pointer hover:text-blue-600 min-w-0"
                                  onClick={() => handleViewDetails(row)}
                                  title={row.name}
                                >
                                  <div className="font-medium text-ellipsis overflow-hidden whitespace-nowrap">
                                    {row.name}
                                  </div>
                                  {/* Tags display */}
                                  {row.tags && row.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {row.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                                        <Badge
                                          key={tagIndex}
                                          variant="secondary"
                                          className="text-xs px-1.5 py-0.5 text-blue-700 bg-blue-50 border-blue-200"
                                        >
                                          {tag}
                                        </Badge>
                                      ))}
                                      {row.tags.length > 3 && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs px-1.5 py-0.5 text-gray-600 bg-gray-50 border-gray-200"
                                        >
                                          +{row.tags.length - 3}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="max-w-xs">
                                  <p className="font-medium mb-2">{row.name}</p>
                                  {row.tags && row.tags.length > 0 && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Tags:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {row.tags.map((tag: string, tagIndex: number) => (
                                          <Badge
                                            key={tagIndex}
                                            variant="secondary"
                                            className="text-xs px-1.5 py-0.5"
                                          >
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      );
                    case "program":
                      return (
                        <TableCell key={column.key}>
                          <div>
                            <div className="font-medium">{row.program}</div>
                            <div className="text-sm text-muted-foreground">{row.language}</div>
                          </div>
                        </TableCell>
                      );
                    case "status":
                      return (
                        <TableCell key={column.key}>
                          {getStatusBadge(row.status)}
                        </TableCell>
                      );
                    case "totalHours":
                      return (
                        <TableCell key={column.key}>
                          {row.totalHours}h
                        </TableCell>
                      );
                    case "courseCount":
                      return (
                        <TableCell key={column.key}>
                          {row.courseCount} khoá
                        </TableCell>
                      );
                    case "createdAt":
                      return (
                        <TableCell key={column.key}>
                          {formatDisplayDate(row.createdAt)}
                        </TableCell>
                      );
                    case "lastUpdated":
                      return (
                        <TableCell key={column.key}>
                          {formatDisplayDate(row.lastUpdated)}
                        </TableCell>
                      );
                    default:
                      return (
                        <TableCell key={column.key}>
                          {row[column.key as keyof typeof row]}
                        </TableCell>
                      );
                  }
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Đã chọn {Object.keys(rowSelection).length} trên {filteredData.length} KCT.
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Trước
          </Button>
          <Button variant="outline" size="sm" disabled>
            Sau
          </Button>
        </div>
      </div>



      {/* Create Dialog */}
      <CreateCurriculumDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit Dialog */}
      <EditCurriculumDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        curriculumId={editingCurriculumId}
      />

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
      <DialogContent className="max-w-[50vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Chi tiết Khung Chương Trình
            </DialogTitle>
          </DialogHeader>

          {selectedCurriculum && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Thông tin cơ bản</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Mã KCT</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.code || selectedCurriculum.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phiên bản</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.version}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Tên KCT</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Ngôn ngữ</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.language}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Ngành/Chuyên ngành</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.program}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Trình độ</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.level}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nhóm tuổi</Label>
                    <p className="text-sm font-medium">{getAgeGroupDisplay(selectedCurriculum.ageGroup)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tổng giờ</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.totalHours}h</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Số khoá</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.courseCount} khoá</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Trạng thái</Label>
                    <div className="flex items-center mt-1">
                      {getStatusBadge(selectedCurriculum.status)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Người phụ trách</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.owner}</p>
                  </div>

                </div>
              </div>

              {/* Learning Structure - New Fields */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Cấu trúc học tập</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tổng số buổi học</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.totalSessions || 'Chưa cập nhật'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Thời gian học/buổi</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.sessionDurationHours ? `${selectedCurriculum.sessionDurationHours}h` : 'Chưa cập nhật'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Cách thức học</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.learningMethod || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Hình thức học</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.learningFormat || 'Chưa cập nhật'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Mô tả</h3>
                {selectedCurriculum.summary ? (
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                    {selectedCurriculum.summary.split('-').map((item, index) =>
                      item.trim() ? (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-xs mt-0.5 flex-shrink-0">-</span>
                          <span>{item.trim()}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Không có mô tả</p>
                )}
              </div>

              <Separator />

              {/* Mục tiêu học tập và Hạng mục */}
              <div>
                <div className="flex items-center gap-2 pb-2">
                  <Target className="h-4 w-4" />
                  <span className="text-lg font-semibold">Mục tiêu học tập và Hạng mục</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mục tiêu học tập */}
                  <div>
                    <h4 className="font-medium mb-2">Mục tiêu học tập</h4>
                    {selectedCurriculum.learningObjectives && selectedCurriculum.learningObjectives.length > 0 ? (
                      <div className="space-y-2">
                        {selectedCurriculum.learningObjectives.map((objective: string, index: number) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-slate-50 rounded-md">
                            <span className=" text-xs mt-0.5 flex-shrink-0">•</span>
                            <span className="text-sm text-muted-foreground flex-1">{objective}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Không có mục tiêu học tập</p>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <h4 className="font-medium mb-2">Hạng mục (Tags)</h4>
                    {selectedCurriculum.tags && selectedCurriculum.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedCurriculum.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Không có hạng mục</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CurriculumList;
