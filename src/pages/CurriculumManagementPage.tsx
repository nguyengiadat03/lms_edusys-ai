"use client";

import React from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Filter,
  Plus,
  BookOpenCheck,
  LayoutGrid,
  FilePenLine,
  BarChart3,
  GitBranch,
  CheckCircle,
  Link,
  FolderOpen,
  Download,
  TrendingUp,
  Bot,
  Zap,
  Shield,
  Edit,
  FileText,
  Users,
  Database,
  Network,
} from "lucide-react";
import CurriculumList from "@/components/curriculum/CurriculumList";
import { CreateCurriculumDialog } from "@/components/curriculum/CreateCurriculumDialog";
import StructureEditor from "@/components/curriculum/StructureEditor";
import VersionApproval from "@/components/curriculum/VersionApproval";
import CurriculumMapping from "@/components/curriculum/CurriculumMapping";
import ContentManagement from "@/components/curriculum/ContentManagement";
import AIAssist from "@/components/curriculum/AIAssist";
import ExportPublishing from "@/components/curriculum/ExportPublishing";
import AcademicReports from "@/components/curriculum/AcademicReports";
import GuardrailsValidation from "@/components/curriculum/GuardrailsValidation";

const CurriculumManagementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "kct-list";

  const navigateToTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleAISaveSuccess = () => {
    // Navigate back to curriculum list and refresh
    navigateToTab("kct-list");
  };

  const tabData = [
    {
      id: "kct-list",
      label: "Danh sách KCT",
      icon: FolderOpen,
      component: <CurriculumList />
    },
    // Hidden tabs - can be re-enabled later if needed
    // {
    //   id: "create-edit",
    //   label: "Tạo mới KCT",
    //   icon: Bot,
    //   component: <AIAssist onSaveSuccess={handleAISaveSuccess} />
    // },
    // {
    //   id: "structure-editor",
    //   label: "Structure Editor",
    //   icon: Edit,
    //   component: <StructureEditor />
    // },
    // {
    //   id: "versions-approval",
    //   label: "Phiên bản & Phê duyệt",
    //   icon: CheckCircle,
    //   component: <VersionApproval />
    // },
    {
      id: "mapping",
      label: "Ánh xạ KCT",
      icon: Network,
      component: <CurriculumMapping />
    },
    {
      id: "content-management",
      label: "Quản lý nội dung",
      icon: FileText,
      component: <ContentManagement />
    },
    {
      id: "export-publishing",
      label: "Xuất bản & Export",
      icon: Download,
      component: <ExportPublishing />
    },
    {
      id: "academic-reports",
      label: "Báo cáo & Ma trận",
      icon: BarChart3,
      component: <AcademicReports />
    },
    {
      id: "guardrails-validation",
      label: "Quy tắc & Bảo vệ",
      icon: Shield,
      component: <GuardrailsValidation />
    },
  ];

  // Get active tab data
  const activeTabData = tabData.find(tab => tab.id === activeTab);

  // Page descriptions for each tab
  const pageDescriptions = {
    'kct-list': 'Danh sách và quản lý khung chương trình',
    'mapping': 'Ánh xạ và liên kết khung chương trình với yêu cầu',
    'content-management': 'Quản lý và tổ chức nội dung giáo trình',
    'export-publishing': 'Xuất bản và chia sẻ khung chương trình',
    'academic-reports': 'Báo cáo học thuật và ma trận khung chương trình',
    'guardrails-validation': 'Thiết lập quy tắc và bảo vệ dữ liệu',
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{activeTabData?.label || 'Curriculum Management'}</h1>
          <p className="text-md text-muted-foreground">
            {pageDescriptions[activeTab as keyof typeof pageDescriptions] || 'Quản lý khung chương trình và các chức năng liên quan'}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={navigateToTab} className="w-full">
        <TabsList className="flex flex-wrap justify-start gap-1 h-auto">
          {tabData.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2"
              >
                <IconComponent className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabData.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            {tab.component}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default CurriculumManagementPage;
