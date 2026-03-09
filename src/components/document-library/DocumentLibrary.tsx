"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  UploadIcon,
  SearchIcon,
  FilterIcon,
  FileTextIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  DownloadIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  TagIcon,
  FolderIcon,
  CameraIcon,
  BotIcon,
  GridIcon,
  ListIcon,
  ShareIcon,
  PlusIcon,
  RefreshCwIcon,
  HeartIcon,
  LoaderIcon,
} from "lucide-react";
import { toast } from "sonner";
import { EditTagsDialog } from "./EditTagsDialog";
import ShareDocumentDialog from "./ShareDocumentDialog";
import UploadDialog from "./UploadDialog";

// API Response Types
interface DocumentFavorite {
  document_id: string;
  user_id: string;
  created_at: string;
}

interface CollectionFavorite {
  collection_id: string;
  user_id: string;
  created_at: string;
}

interface FavoritesResponse {
  document_favorites: DocumentFavorite[];
  collection_favorites: CollectionFavorite[];
}

// Document interface
interface Document {
  id: number;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  level: string;
  topic: string;
  tags: string[];
  ocrProcessed: boolean;
  downloads: number;
  views: number;
  summary?: string;
  segments?: string[];
  suggestedLevel?: string;
  suggestedTopic?: string;
  shares_count?: number;
  ai_analysis?: Record<string, unknown>;
  ocr_text?: string;
  ai_tasks?: Record<string, unknown>[];
}

// Sample documents with OCR + AI analysis
const sampleDocuments = [
  {
    id: 1,
    name: "Speaking 2_2025 (May-August).docx",
    type: "docx",
    size: "2.0 MB",
    uploadedAt: "2025-11-04",
    uploadedBy: "Nguyễn Văn A",
    level: "B1",
    topic: "Daily Habits",
    tags: ["Grammar", "Speaking Practice", "Vocabulary", "Sample Answers", "Hometown"],
    ocrProcessed: true,
    downloads: 45,
    views: 120,
    summary: "This document offers structured questions, example answers, and vocabulary for IELTS speaking test topics, focusing on personal information such as hometown, living arrangements, work/study preferences, and memory, with an emphasis on B2-C1 level English phrases and idioms. This document provides IELTS speaking practice questions and sample answers across various everyday topics including memory and apps, public transportation, geography, birthdays, and names. It covers vocabulary and expressions for discussing personal experiences, opinions, and cultural aspects related to these subjects. This document offers sample questions and answers for English speaking practice on everyday topics like snacks, puzzles, flowers, text messages, and jewelry. It includes a variety of useful vocabulary and idiomatic expressions to help learners articulate their experiences and opinions.",
    segments: [
      "Housing and Home Life",
      "Jewelry and personal expression",
      "Hometown and Living Area",
      "Forgetting and App Use",
      "Work and Study Preferences"
    ],
    suggestedLevel: "B1",
    suggestedTopic: "Daily Habits"
  },
  {
    id: 2,
    name: "English_Grammar.pdf",
    type: "pdf",
    size: "25.5 MB",
    uploadedAt: "2025-11-03",
    uploadedBy: "Trần Thị B",
    level: "B1",
    topic: "Verb Forms",
    tags: ["Grammar", "Verb Forms", "Tenses", "English Learning"],
    ocrProcessed: true,
    downloads: 78,
    views: 156,
    summary: "Comprehensive English grammar guide focusing on verb forms, tenses, and grammatical structures for B1 level learners.",
    segments: ["Present Tenses", "Past Tenses", "Future Tenses", "Perfect Tenses"],
    suggestedLevel: "B1",
    suggestedTopic: "Verb Forms"
  },
  {
    id: 3,
    name: "pp.pptx",
    type: "pptx",
    size: "1.4 MB",
    uploadedAt: "2025-11-02",
    uploadedBy: "Lê Văn C",
    level: "A2",
    topic: "Consonant Blends",
    tags: ["Grammar", "Phonics", "Consonant Blends", "Pronunciation"],
    ocrProcessed: false,
    downloads: 34,
    views: 89,
    summary: "Interactive presentation on consonant blends and pronunciation practice for A2 level learners.",
    segments: ["Initial Blends", "Final Blends", "Practice Exercises"],
    suggestedLevel: "A2",
    suggestedTopic: "Consonant Blends"
  },
  {
    id: 4,
    name: "cea010d07069fa37a378.jpg",
    type: "image",
    size: "0.1 MB",
    uploadedAt: "2025-11-01",
    uploadedBy: "Phạm Thị D",
    level: "B1",
    topic: "My Best Friend",
    tags: ["Grammar", "Describing People", "Friendship", "Vocabulary"],
    ocrProcessed: false,
    downloads: 12,
    views: 45,
    summary: "Image showing a friendship scene with vocabulary and grammar exercises for describing people.",
    segments: ["Physical Description", "Personality Traits", "Relationships"],
    suggestedLevel: "B1",
    suggestedTopic: "My Best Friend"
  },
  {
    id: 5,
    name: "adi.mp3",
    type: "audio",
    size: "0.0 MB",
    uploadedAt: "2025-10-31",
    uploadedBy: "Hoàng Văn E",
    level: "A2",
    topic: "Household Chores",
    tags: ["Grammar", "Household Chores", "Daily Routines", "Audio"],
    ocrProcessed: false,
    downloads: 23,
    views: 67,
    summary: "Audio lesson on household chores vocabulary and grammar structures for A2 level learners.",
    segments: ["Kitchen Chores", "Cleaning Tasks", "Garden Work"],
    suggestedLevel: "A2",
    suggestedTopic: "Household Chores"
  },
];

const DocumentLibrary = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isAddingToCollection, setIsAddingToCollection] = useState(false);
  const [processingDocuments, setProcessingDocuments] = useState(new Set());
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [isEditTagsOpen, setIsEditTagsOpen] = useState(false);
  const [selectedDocumentForEdit, setSelectedDocumentForEdit] = useState(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedDocumentForShare, setSelectedDocumentForShare] = useState(null);
  const [showSharedDocuments, setShowSharedDocuments] = useState(false);
  const [sharedDocuments, setSharedDocuments] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [isPublicCollection, setIsPublicCollection] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [collectionFavorites, setCollectionFavorites] = useState(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [isEditCollectionOpen, setIsEditCollectionOpen] = useState(false);
  const [selectedCollectionForEdit, setSelectedCollectionForEdit] = useState(null);
  const [editCollectionName, setEditCollectionName] = useState('');
  const [editCollectionDescription, setEditCollectionDescription] = useState('');
  const [editIsPublicCollection, setEditIsPublicCollection] = useState(false);
  const [isManageCollectionOpen, setIsManageCollectionOpen] = useState(false);
  const [selectedCollectionForManage, setSelectedCollectionForManage] = useState(null);
  const [collectionDocuments, setCollectionDocuments] = useState([]);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [userFavorites, setUserFavorites] = useState<{document_favorites: DocumentFavorite[], collection_favorites: CollectionFavorite[]}>({document_favorites: [], collection_favorites: []});
  const [selectedFileType, setSelectedFileType] = useState('');
  // Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [imageQualityError, setImageQualityError] = useState("");
  // Link import states
  const [linkUrl, setLinkUrl] = useState("");
  const [linkFileName, setLinkFileName] = useState("");
  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle search on Enter key
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Trigger search immediately on Enter
      loadDocuments();
    }
  };

  // Filter documents
  const filteredDocuments = React.useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = searchTerm.trim() === "" ||
                            doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            doc.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (doc.tags && Array.isArray(doc.tags) && doc.tags.some(tag => typeof tag === 'string' && tag.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchesLevel = selectedLevel === "all" || doc.level === selectedLevel;
      const matchesType = selectedType === "all" || doc.type === selectedType;
      const matchesFavorites = !showFavorites || favorites.has(doc.id.toString());

      return matchesSearch && matchesLevel && matchesType && matchesFavorites;
    });
  }, [documents, searchTerm, selectedLevel, selectedType, showFavorites, favorites]);

  // Get favorite documents for display
  const favoriteDocuments = documents.filter(doc => favorites.has(doc.id.toString()));

  // Load documents from API
  const loadDocuments = async () => {
       try {
         const params = new URLSearchParams();
         if (searchTerm.trim()) {
           params.append('search', searchTerm.trim());
         }

         const url = `http://localhost:3001/api/v1/documents${params.toString() ? '?' + params.toString() : ''}`;
         const response = await fetch(url, {
           headers: {
             'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
           }
         });

        if (response.ok) {
          const result = await response.json();
          if (result.data && result.data.documents && result.data.documents.length > 0) {
            // Convert API data to frontend format
            const apiDocs = result.data.documents.map(doc => {
              // Safely parse created_at date
              let uploadedAt = "2025-11-04"; // Default date if no created_at
              try {
                if (doc.created_at) {
                  const date = new Date(doc.created_at);
                  if (!isNaN(date.getTime()) && date.getTime() > 0) {
                    // Format as YYYY-MM-DD
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    uploadedAt = `${year}-${month}-${day}`;
                  }
                } else if (doc.updated_at) {
                  // Fallback to updated_at if created_at not available
                  const date = new Date(doc.updated_at);
                  if (!isNaN(date.getTime()) && date.getTime() > 0) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    uploadedAt = `${year}-${month}-${day}`;
                  }
                }
              } catch (error) {
                console.warn('Invalid date format for document:', doc.id, doc.created_at);
                // Keep default date
              }

              // Improved MIME type to file extension mapping with filename fallback
              const getFileTypeFromMime = (mimeType: string | null, fileName?: string): string => {
                // First try MIME type detection
                if (mimeType) {
                  // Microsoft Office files
                  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
                  if (mimeType === 'application/msword') return 'doc';
                  if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'xlsx';
                  if (mimeType === 'application/vnd.ms-excel') return 'xls';
                  if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'pptx';
                  if (mimeType === 'application/vnd.ms-powerpoint') return 'ppt';

                  // Audio files - handle common audio MIME types specifically
                  if (mimeType === 'audio/mpeg') return 'mp3';
                  if (mimeType === 'audio/mp3') return 'mp3';
                  if (mimeType === 'audio/wav') return 'wav';
                  if (mimeType === 'audio/wave') return 'wav';
                  if (mimeType === 'audio/ogg') return 'ogg';
                  if (mimeType === 'audio/aac') return 'aac';
                  if (mimeType === 'audio/flac') return 'flac';
                  if (mimeType === 'audio/m4a') return 'm4a';

                  // Standard types
                  if (mimeType.startsWith('application/pdf')) return 'pdf';
                  if (mimeType.startsWith('text/')) return mimeType.split('/')[1];
                  if (mimeType.startsWith('image/')) return mimeType.split('/')[1];
                  if (mimeType.startsWith('video/')) return mimeType.split('/')[1];
                  if (mimeType.startsWith('audio/')) return mimeType.split('/')[1];
                }

                // Fallback: detect file type from filename extension
                if (fileName) {
                  const extension = fileName.toLowerCase().split('.').pop();
                  switch (extension) {
                    case 'pdf': return 'pdf';
                    case 'doc': return 'doc';
                    case 'docx': return 'docx';
                    case 'ppt': return 'ppt';
                    case 'pptx': return 'pptx';
                    case 'xls': return 'xls';
                    case 'xlsx': return 'xlsx';
                    case 'mp3': return 'mp3';
                    case 'wav': return 'wav';
                    case 'ogg': return 'ogg';
                    case 'aac': return 'aac';
                    case 'flac': return 'flac';
                    case 'm4a': return 'm4a';
                    case 'mp4': return 'mp4';
                    case 'avi': return 'avi';
                    case 'mov': return 'mov';
                    case 'wmv': return 'wmv';
                    case 'jpg': return 'jpg';
                    case 'jpeg': return 'jpeg';
                    case 'png': return 'png';
                    case 'gif': return 'gif';
                    case 'bmp': return 'bmp';
                    case 'tiff': return 'tiff';
                    case 'txt': return 'txt';
                    case 'csv': return 'csv';
                    case 'json': return 'json';
                    case 'xml': return 'xml';
                    case 'zip': return 'zip';
                    case 'rar': return 'rar';
                    case '7z': return '7z';
                    default: return extension || 'unknown';
                  }
                }

                return 'unknown';
              };

              // Parse AI analysis results from database (similar to check-document-prisma.js)
              const aiTasks = doc.ai_tasks || [];
              const summary = aiTasks.find(t => t.task_type === 'summarize')?.output_json?.result || doc.summary || '';
              const segments = aiTasks.find(t => t.task_type === 'segment')?.output_json?.result || doc.segments || [];
              const aiLevel = aiTasks.find(t => t.task_type === 'level_suggestion')?.output_json?.result || '';
              const aiTopic = aiTasks.find(t => t.task_type === 'topic_suggestion')?.output_json?.result || '';
              const tagSuggestions = aiTasks.find(t => t.task_type === 'tag_suggestion')?.output_json?.suggested_tags || [];

              // Only use AI tag suggestions (no manual_tags or document_tags merge)
              const aiTags = [
                ...tagSuggestions.map(t => typeof t === 'string' ? t : t.tag_label)
              ];

              // Only use AI tag suggestions and deduplicate
              const allTags = [
                ...tagSuggestions.map(t => typeof t === 'string' ? t : t.tag_label)
              ];
              const normalizedTags = allTags.map(tag => getTagDisplayValue(tag));
              const finalTags = [...new Set(normalizedTags)];

              // Use AI results first, then fallback to document fields, then smart classification
              const suggestedLevel = aiLevel || doc.level || doc.suggestedLevel || "A1";
              const suggestedTopic = aiTopic || doc.topic || doc.suggestedTopic || "General";

              // Get download/view counts from audit logs (simplified - in production you'd have dedicated counters)
              const downloadCount = 0; // TODO: Implement proper download counter
              const viewCount = 0; // TODO: Implement proper view counter

              // Check OCR status dựa trên AI tasks - chỉ xét status = completed (giống check-document-prisma.js)
              const hasCompletedOCR = (doc.ai_tasks || doc.document_ai_tasks)?.some((task: Record<string, unknown>) => task.status === 'completed') || false;

              return {
                id: doc.id,
                name: doc.name,
                type: getFileTypeFromMime(doc.mime_type, doc.name),
                size: doc.file_size ? `${(Number(doc.file_size) / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
                uploadedAt,
                uploadedBy: "Current User",
                level: suggestedLevel,
                topic: suggestedTopic,
                tags: finalTags.length > 0 ? finalTags : (doc.manual_tags ? JSON.parse(doc.manual_tags) : []),
                ocrProcessed: hasCompletedOCR,
                downloads: downloadCount,
                views: viewCount,
                shares_count: doc._count?.document_shares || 0,
                summary: summary || (doc.ocr_text ? doc.ocr_text.substring(0, 200) + "..." : "Processing..."),
                segments: segments.length > 0 ? segments : ["Processing..."],
                suggestedLevel: suggestedLevel,
                suggestedTopic: suggestedTopic,
                ai_analysis: doc.ai_analysis,
                ocr_text: doc.ocr_text,
                ai_tasks: doc.ai_tasks
              };
            });

            // Replace sample documents with API data
            setDocuments(apiDocs);
          } else {
            // Keep sample documents if no API data
            setDocuments(sampleDocuments);
          }
        } else {
          // Keep sample documents if API fails
          setDocuments(sampleDocuments);
        }
      } catch (error) {
        console.error('Error loading documents:', error);
        // Keep sample documents as fallback
        setDocuments(sampleDocuments);
      }
  };

  // Load documents from API on component mount
  React.useEffect(() => {
    loadDocuments();
    loadCollections();
    loadFavorites();
  }, []);

  // Reload favorites when showFavorites changes
  React.useEffect(() => {
    if (showFavorites) {
      loadFavorites();
    }
  }, [showFavorites]);

  // Debug: Log favorites state changes
  React.useEffect(() => {
    console.log('Favorites state changed:', Array.from(favorites));
  }, [favorites]);

  // Load collections
  const loadCollections = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/v1/documents/collections', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.collections) {
          setCollections(result.data.collections);
        }
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  // Process document data from API to frontend format
  const processDocumentData = (doc) => {
    // Safely parse created_at date
    let uploadedAt = "2025-11-04"; // Default date if no created_at
    try {
      if (doc.created_at) {
        const date = new Date(doc.created_at);
        if (!isNaN(date.getTime()) && date.getTime() > 0) {
          // Format as YYYY-MM-DD
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          uploadedAt = `${year}-${month}-${day}`;
        }
      } else if (doc.updated_at) {
        // Fallback to updated_at if created_at not available
        const date = new Date(doc.updated_at);
        if (!isNaN(date.getTime()) && date.getTime() > 0) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          uploadedAt = `${year}-${month}-${day}`;
        }
      }
    } catch (error) {
      console.warn('Invalid date format for document:', doc.id, doc.created_at);
      // Keep default date
    }

    // Improved MIME type to file extension mapping with filename fallback
    const getFileTypeFromMime = (mimeType: string | null, fileName?: string): string => {
      // First try MIME type detection
      if (mimeType) {
        // Microsoft Office files
        if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
        if (mimeType === 'application/msword') return 'doc';
        if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'xlsx';
        if (mimeType === 'application/vnd.ms-excel') return 'xls';
        if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'pptx';
        if (mimeType === 'application/vnd.ms-powerpoint') return 'ppt';

        // Audio files - handle common audio MIME types specifically
        if (mimeType === 'audio/mpeg') return 'mp3';
        if (mimeType === 'audio/mp3') return 'mp3';
        if (mimeType === 'audio/wav') return 'wav';
        if (mimeType === 'audio/wave') return 'wav';
        if (mimeType === 'audio/ogg') return 'ogg';
        if (mimeType === 'audio/aac') return 'aac';
        if (mimeType === 'audio/flac') return 'flac';
        if (mimeType === 'audio/m4a') return 'm4a';

        // Standard types
        if (mimeType.startsWith('application/pdf')) return 'pdf';
        if (mimeType.startsWith('text/')) return mimeType.split('/')[1];
        if (mimeType.startsWith('image/')) return mimeType.split('/')[1];
        if (mimeType.startsWith('video/')) return mimeType.split('/')[1];
        if (mimeType.startsWith('audio/')) return mimeType.split('/')[1];
      }

      // Fallback: detect file type from filename extension
      if (fileName) {
        const extension = fileName.toLowerCase().split('.').pop();
        switch (extension) {
          case 'pdf': return 'pdf';
          case 'doc': return 'doc';
          case 'docx': return 'docx';
          case 'ppt': return 'ppt';
          case 'pptx': return 'pptx';
          case 'xls': return 'xls';
          case 'xlsx': return 'xlsx';
          case 'mp3': return 'mp3';
          case 'wav': return 'wav';
          case 'ogg': return 'ogg';
          case 'aac': return 'aac';
          case 'flac': return 'flac';
          case 'm4a': return 'm4a';
          case 'mp4': return 'mp4';
          case 'avi': return 'avi';
          case 'mov': return 'mov';
          case 'wmv': return 'wmv';
          case 'jpg': return 'jpg';
          case 'jpeg': return 'jpeg';
          case 'png': return 'png';
          case 'gif': return 'gif';
          case 'bmp': return 'bmp';
          case 'tiff': return 'tiff';
          case 'txt': return 'txt';
          case 'csv': return 'csv';
          case 'json': return 'json';
          case 'xml': return 'xml';
          case 'zip': return 'zip';
          case 'rar': return 'rar';
          case '7z': return '7z';
          default: return extension || 'unknown';
        }
      }

      return 'unknown';
    };

    // Parse AI analysis results from database (similar to check-document-prisma.js)
    const aiTasks = doc.ai_tasks || [];
    const summary = aiTasks.find(t => t.task_type === 'summarize')?.output_json?.result || doc.summary || '';
    const segments = aiTasks.find(t => t.task_type === 'segment')?.output_json?.result || doc.segments || [];
    const aiLevel = aiTasks.find(t => t.task_type === 'level_suggestion')?.output_json?.result || '';
    const aiTopic = aiTasks.find(t => t.task_type === 'topic_suggestion')?.output_json?.result || '';
    const tagSuggestions = aiTasks.find(t => t.task_type === 'tag_suggestion')?.output_json?.suggested_tags || [];

    // Only use AI tag suggestions (no manual_tags or document_tags merge)
    const aiTags = [
      ...tagSuggestions.map(t => typeof t === 'string' ? t : t.tag_label)
    ];

    // Only use AI tag suggestions and deduplicate
    const allTags = [
      ...tagSuggestions.map(t => typeof t === 'string' ? t : t.tag_label)
    ];
    const normalizedTags = allTags.map(tag => getTagDisplayValue(tag));
    const finalTags = [...new Set(normalizedTags)];

    // Use AI results first, then fallback to document fields, then smart classification
    const suggestedLevel = aiLevel || doc.level || doc.suggestedLevel || "A1";
    const suggestedTopic = aiTopic || doc.topic || doc.suggestedTopic || "General";

    // Get download/view counts from audit logs (simplified - in production you'd have dedicated counters)
    const downloadCount = 0; // TODO: Implement proper download counter
    const viewCount = 0; // TODO: Implement proper view counter

    // Check OCR status dựa trên AI tasks - chỉ xét status = completed (giống check-document-prisma.js)
    const hasCompletedOCR = (doc.ai_tasks || doc.document_ai_tasks)?.some((task: Record<string, unknown>) => task.status === 'completed') || false;

    return {
      id: doc.id,
      name: doc.name,
      type: getFileTypeFromMime(doc.mime_type, doc.name),
      size: doc.file_size ? `${(Number(doc.file_size) / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
      uploadedAt,
      uploadedBy: "Current User",
      level: suggestedLevel,
      topic: suggestedTopic,
      tags: finalTags.length > 0 ? finalTags : (doc.manual_tags ? JSON.parse(doc.manual_tags) : []),
      ocrProcessed: hasCompletedOCR,
      downloads: downloadCount,
      views: viewCount,
      shares_count: doc._count?.document_shares || 0,
      summary: summary || (doc.ocr_text ? doc.ocr_text.substring(0, 200) + "..." : "Processing..."),
      segments: segments.length > 0 ? segments : ["Processing..."],
      suggestedLevel: suggestedLevel,
      suggestedTopic: suggestedTopic,
      ai_analysis: doc.ai_analysis,
      ocr_text: doc.ocr_text,
      ai_tasks: doc.ai_tasks
    };
  };

  // Load documents in a specific collection
  const loadCollectionDocuments = async (collectionId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/v1/documents/collections/${collectionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.documents) {
          // Process documents using the same logic as main documents
          const processedDocs = result.data.documents.map(processDocumentData);
          setCollectionDocuments(processedDocs);
        }
      }
    } catch (error) {
      console.error('Error loading collection documents:', error);
    }
  };

  // Load favorites
  const loadFavorites = async () => {
    try {
      const token = localStorage.getItem('token') || 'test-token';
      console.log('Loading favorites with token:', token);

      const response = await fetch('http://localhost:3001/api/v1/documents/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Favorites API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Favorites API response:', result);
        if (result.success && result.data) {
          // Keep as strings to match document IDs from API
          const docFavorites = new Set(result.data.document_favorites?.map((f: DocumentFavorite) => f.document_id) || []);
          const collFavorites = new Set(result.data.collection_favorites?.map((f: CollectionFavorite) => f.collection_id) || []);
          console.log('Parsed favorites:', Array.from(docFavorites));
          setFavorites(docFavorites);
          setCollectionFavorites(collFavorites);
          setUserFavorites(result.data);
        } else {
          console.log('No favorites data in response - keeping existing favorites');
          // Keep existing favorites on empty response - don't reset
        }
      } else {
        console.error('Favorites API failed:', response.status, response.statusText);
        // Keep existing favorites on API error - don't reset
        try {
          const errorText = await response.text();
          console.error('Error response:', errorText);
        } catch (e) {
          console.error('Could not read error response');
        }
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      // Keep existing favorites on network error - don't reset
    }
  };

  // Reload favorites after toggle
  const reloadFavorites = async () => {
    await loadFavorites();
  };

  // Helper function to get file type from MIME type with filename fallback
  const getFileTypeFromMime = (mimeType: string | null, fileName?: string): string => {
    // First try MIME type detection
    if (mimeType) {
      // Microsoft Office files
      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
      if (mimeType === 'application/msword') return 'doc';
      if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'xlsx';
      if (mimeType === 'application/vnd.ms-excel') return 'xls';
      if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'pptx';
      if (mimeType === 'application/vnd.ms-powerpoint') return 'ppt';

      // Audio files - handle common audio MIME types specifically
      if (mimeType === 'audio/mpeg') return 'mp3';
      if (mimeType === 'audio/mp3') return 'mp3';
      if (mimeType === 'audio/wav') return 'wav';
      if (mimeType === 'audio/wave') return 'wav';
      if (mimeType === 'audio/ogg') return 'ogg';
      if (mimeType === 'audio/aac') return 'aac';
      if (mimeType === 'audio/flac') return 'flac';
      if (mimeType === 'audio/m4a') return 'm4a';

      // Standard types
      if (mimeType.startsWith('application/pdf')) return 'pdf';
      if (mimeType.startsWith('text/')) return mimeType.split('/')[1];
      if (mimeType.startsWith('image/')) return mimeType.split('/')[1];
      if (mimeType.startsWith('video/')) return mimeType.split('/')[1];
      if (mimeType.startsWith('audio/')) return mimeType.split('/')[1];
    }

    // Fallback: detect file type from filename extension
    if (fileName) {
      const extension = fileName.toLowerCase().split('.').pop();
      switch (extension) {
        case 'pdf': return 'pdf';
        case 'doc': return 'doc';
        case 'docx': return 'docx';
        case 'ppt': return 'ppt';
        case 'pptx': return 'pptx';
        case 'xls': return 'xls';
        case 'xlsx': return 'xlsx';
        case 'mp3': return 'mp3';
        case 'wav': return 'wav';
        case 'ogg': return 'ogg';
        case 'aac': return 'aac';
        case 'flac': return 'flac';
        case 'm4a': return 'm4a';
        case 'mp4': return 'mp4';
        case 'avi': return 'avi';
        case 'mov': return 'mov';
        case 'wmv': return 'wmv';
        case 'jpg': return 'jpg';
        case 'jpeg': return 'jpeg';
        case 'png': return 'png';
        case 'gif': return 'gif';
        case 'bmp': return 'bmp';
        case 'tiff': return 'tiff';
        case 'txt': return 'txt';
        case 'csv': return 'csv';
        case 'json': return 'json';
        case 'xml': return 'xml';
        case 'zip': return 'zip';
        case 'rar': return 'rar';
        case '7z': return '7z';
        default: return extension || 'unknown';
      }
    }

    return 'unknown';
  };

  // Helper function to get tag display value (handles both string and object tags)
  const getTagDisplayValue = (tag: string | Record<string, unknown>): string => {
    if (typeof tag === 'string') return tag;
    if (tag && typeof tag === 'object' && 'name' in tag && typeof tag.name === 'string') return tag.name;
    if (tag && typeof tag === 'object' && 'tag_label' in tag && typeof tag.tag_label === 'string') return tag.tag_label;
    return String(tag || 'Unknown Tag');
  };

  // Handler functions
  const handleDownload = async (doc) => {
    try {
      const response = await fetch(`http://localhost:3001/api/v1/documents/${doc.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Update download count locally
        setDocuments(prev => prev.map(d =>
          d.id === doc.id
            ? { ...d, downloads: (d.downloads || 0) + 1 }
            : d
        ));
      } else {
        console.error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleExternalPreview = async (doc) => {
    try {
      // Get the file URL for external viewer
      const fileUrl = `http://localhost:3001/api/v1/documents/${doc.id}/download?token=${localStorage.getItem('token') || 'test-token'}`;

      let viewerUrl = '';
      if (doc.type === 'pdf') {
        // Use Google Docs Viewer for PDF
        viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
      } else if (['doc', 'docx'].includes(doc.type)) {
        // Use Google Docs Viewer for Word documents
        viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
      } else if (doc.type === 'pptx') {
        // Use Microsoft Office Online for PowerPoint
        viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`;
      }

      if (viewerUrl) {
        window.open(viewerUrl, '_blank', 'width=800,height=600');

        // Update view count locally when previewing
        setDocuments(prev => prev.map(d =>
          d.id === doc.id
            ? { ...d, views: (d.views || 0) + 1 }
            : d
        ));
      } else {
        // Fallback to download
        handleDownload(doc);
      }
    } catch (error) {
      console.error('External preview error:', error);
      handleDownload(doc);
    }
  };

  const handleEditTags = async (doc) => {
    // Always load preview data to get AI tasks for accurate topic display
    await loadPreviewData(doc.id);
    // Find the updated document with AI tasks
    const updatedDoc = documents.find(d => d.id === doc.id);
    setSelectedDocumentForEdit(updatedDoc || doc);
    setIsEditTagsOpen(true);
  };

  // Load preview data from API
  const loadPreviewData = async (docId) => {
    setIsLoadingPreview(true);
    try {
      const response = await fetch(`http://localhost:3001/api/v1/documents/${docId}?format=preview`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setPreviewData(result.data);
        } else {
          // Fallback to document data if preview API fails
          setPreviewData(null);
        }
      } else {
        console.error('Preview API failed:', response.status);
        setPreviewData(null);
      }
    } catch (error) {
      console.error('Error loading preview data:', error);
      setPreviewData(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Force reload preview data after tag edit
  const reloadPreviewData = async (docId) => {
    await loadPreviewData(docId);
  };

  const handleSaveTags = (updatedDocument) => {
    // Update the document in the documents array with the complete backend response data
    const updatedDocs = documents.map(doc =>
      doc.id === updatedDocument.id ? updatedDocument : doc
    );
    setDocuments(updatedDocs);
    setIsEditTagsOpen(false);
    setSelectedDocumentForEdit(null);

    // Update selectedDocument state if preview is open
    if (isPreviewOpen && selectedDocument && selectedDocument.id === updatedDocument.id) {
      setSelectedDocument(updatedDocument);
      reloadPreviewData(updatedDocument.id);
    }

    // Show success message
    toast.success("Cập nhật thành công", {
      description: "Metadata của tài liệu đã được cập nhật.",
    });

    // Reload documents to ensure consistency with backend
    loadDocuments();
  };

  const handleReprocess = async (doc) => {
    setIsReprocessing(true);
    // Add document to processing set
    setProcessingDocuments(prev => new Set(prev).add(doc.id));

    try {
      // Trigger OCR reprocessing (includes both OCR and AI processing)
      const response = await fetch(`http://localhost:3001/api/v1/documents/${doc.id}/ocr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'OCR reprocessing failed');
      }

      // Show success message immediately
      toast.success("OCR & AI Processing Started", {
        description: `Đang xử lý tài liệu "${doc.name}" với OCR và AI...`,
      });

      // Reload documents after a delay
      setTimeout(() => {
        loadDocuments();
        // Remove document from processing set
        setProcessingDocuments(prev => {
          const newSet = new Set(prev);
          newSet.delete(doc.id);
          return newSet;
        });
        setIsReprocessing(false);

        // Show completion message
        toast.success("OCR & AI Processing Completed", {
          description: `Tài liệu "${doc.name}" đã được xử lý thành công với OCR và AI!`,
        });
      }, 3000);
    } catch (error) {
      console.error('Reprocess error:', error);
      // Remove document from processing set on error
      setProcessingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(doc.id);
        return newSet;
      });
      setIsReprocessing(false);

      // Show error message
      toast.error("OCR Processing Failed", {
        description: `Không thể xử lý tài liệu "${doc.name}": ${error.message}`,
      });
    }
  };

  const handleShare = (doc) => {
    setSelectedDocumentForShare(doc);
    setIsShareDialogOpen(true);
  };

  const handleShareDocument = async (shareData) => {
    console.log('handleShareDocument called with:', shareData);
    console.log('selectedDocumentForShare:', selectedDocumentForShare);

    try {
      const requestBody = JSON.stringify(shareData);
      console.log('Request body:', requestBody);

      const response = await fetch(`http://localhost:3001/api/v1/documents/${selectedDocumentForShare.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        },
        body: requestBody
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('Response data:', result);

        // Update document shares count
        setDocuments(prev => prev.map(doc =>
          doc.id === selectedDocumentForShare.id
            ? { ...doc, shares_count: (doc.shares_count || 0) + 1 }
            : doc
        ));

        alert('Tài liệu đã được chia sẻ thành công!');
        console.log('Share result:', result);
        return result;
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch (e) {
          error = { message: errorText };
        }
        throw new Error(error.message || 'Chia sẻ thất bại');
      }
    } catch (error) {
      console.error('Share error:', error);
      alert('Có lỗi xảy ra khi chia sẻ tài liệu: ' + error.message);
      throw error;
    }
  };

  const handleAddToCollection = async (doc) => {
    if (collections.length === 0) {
      alert('Không có collection nào. Hãy tạo collection trước.');
      return;
    }

    // Create a simple dialog to select collection
    const collectionNames = collections.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
    const collectionId = prompt(`Chọn collection để thêm tài liệu "${doc.name}":\n${collectionNames}`);

    if (collectionId) {
      const index = parseInt(collectionId) - 1;
      if (index >= 0 && index < collections.length) {
        try {
          const response = await fetch(`http://localhost:3001/api/v1/documents/collections/${collections[index].id}/documents`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
            },
            body: JSON.stringify({ document_id: doc.id.toString() })
          });

          if (response.ok) {
            alert('Tài liệu đã được thêm vào collection thành công!');
            // Reload collections to update document counts
            loadCollections();
          } else {
            const errorData = await response.json();
            alert(`Không thể thêm tài liệu vào collection: ${errorData.message || 'Lỗi không xác định'}`);
          }
        } catch (error) {
          console.error('Error adding to collection:', error);
          alert('Có lỗi xảy ra khi thêm tài liệu vào collection.');
        }
      }
    }
  };

  const handleToggleFavorite = async (doc) => {
    const original = new Set(favorites);
    const docIdStr = doc.id.toString();
    const isFavorited = favorites.has(docIdStr);
    const newSet = new Set(favorites);
    if (isFavorited) newSet.delete(docIdStr); else newSet.add(docIdStr);
    setFavorites(newSet); // optimistic

    try {
      const method = isFavorited ? 'DELETE' : 'POST';
      const response = await fetch(`http://localhost:3001/api/v1/documents/${doc.id}/favorite`, {
        method,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}` }
      });

      if (!response.ok) {
        // rollback
        setFavorites(original);
        const text = await response.text();
        let errJson;
        try { errJson = JSON.parse(text); } catch { errJson = { message: text }; }
        console.error('Toggle favorite failed:', response.status, errJson);
        alert(errJson.message || 'Không thể thay đổi yêu thích.');
      } else {
        // Reload favorites to ensure consistency
        await reloadFavorites();
      }
    } catch (err) {
      console.error('Network error toggling favorite:', err);
      setFavorites(original); // rollback on network error
      alert('Lỗi mạng. Vui lòng thử lại.');
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      alert('Tên collection là bắt buộc');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/v1/documents/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        },
        body: JSON.stringify({
          name: newCollectionName,
          description: newCollectionDescription,
          is_public: isPublicCollection
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Optimize: Use functional state update to avoid re-creating the entire array
        setCollections(prevCollections => [...prevCollections, result.data]);
        setNewCollectionName('');
        setNewCollectionDescription('');
        setIsPublicCollection(false);
        setIsCreateCollectionOpen(false);
        alert('Collection đã được tạo thành công!');
      } else {
        alert('Không thể tạo collection.');
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('Có lỗi xảy ra khi tạo collection.');
    }
  };

  const handleToggleCollectionFavorite = async (collection) => {
    const originalFavorites = new Set(collectionFavorites);
    const isFavorited = collectionFavorites.has(collection.id);
    const newFavorites = new Set(collectionFavorites);

    // Optimistic update for favorite count
    const countChange = isFavorited ? -1 : 1;
    setCollections(prev => prev.map(c =>
      c.id === collection.id
        ? { ...c, _count: { ...c._count, document_collection_favorites: (c._count?.document_collection_favorites || 0) + countChange } }
        : c
    ));

    // Optimistic update for favorite state
    if (isFavorited) {
      newFavorites.delete(collection.id);
    } else {
      newFavorites.add(collection.id);
    }
    setCollectionFavorites(newFavorites);

    try {
      const method = isFavorited ? 'DELETE' : 'POST';
      const url = `http://localhost:3001/api/v1/documents/collections/${collection.id}/favorite`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        }
      });

      if (response.ok) {
        // Reload favorites and collections to ensure consistency
        await reloadFavorites();
        await loadCollections();
      } else {
        // Rollback on error
        setCollectionFavorites(originalFavorites);
        setCollections(prev => prev.map(c =>
          c.id === collection.id
            ? { ...c, _count: { ...c._count, document_collection_favorites: (c._count?.document_collection_favorites || 0) - countChange } }
            : c
        ));
      }
    } catch (error) {
      console.error('Error toggling collection favorite:', error);
      // Rollback on error
      setCollectionFavorites(originalFavorites);
      setCollections(prev => prev.map(c =>
        c.id === collection.id
          ? { ...c, _count: { ...c._count, document_collection_favorites: (c._count?.document_collection_favorites || 0) - countChange } }
          : c
      ));
    }
  };

  const handleEditCollection = (collection) => {
    setSelectedCollectionForEdit(collection);
    setEditCollectionName(collection.name);
    setEditCollectionDescription(collection.description || '');
    setEditIsPublicCollection(collection.is_public);
    setIsEditCollectionOpen(true);
  };

  const handleSaveCollectionEdit = async () => {
    if (!editCollectionName.trim()) {
      alert('Tên collection là bắt buộc');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/v1/documents/collections/${selectedCollectionForEdit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        },
        body: JSON.stringify({
          name: editCollectionName,
          description: editCollectionDescription,
          is_public: editIsPublicCollection
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Update collections list
        setCollections(prev => prev.map(c =>
          c.id === selectedCollectionForEdit.id ? result.data : c
        ));
        setIsEditCollectionOpen(false);
        setSelectedCollectionForEdit(null);
        alert('Collection đã được cập nhật thành công!');
      } else {
        alert('Không thể cập nhật collection.');
      }
    } catch (error) {
      console.error('Error updating collection:', error);
      alert('Có lỗi xảy ra khi cập nhật collection.');
    }
  };

  const handleDeleteCollection = async (collection) => {
    if (confirm(`Bạn có chắc chắn muốn xóa collection "${collection.name}"?`)) {
      try {
        const response = await fetch(`http://localhost:3001/api/v1/documents/collections/${collection.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
          }
        });

        if (response.ok) {
          setCollections(prev => prev.filter(c => c.id !== collection.id));
          alert('Collection đã được xóa thành công!');
        } else {
          alert('Không thể xóa collection.');
        }
      } catch (error) {
        console.error('Error deleting collection:', error);
        alert('Có lỗi xảy ra khi xóa collection.');
      }
    }
  };

  const handleManageCollection = async (collection) => {
    setSelectedCollectionForManage(collection);
    // Load documents in this collection
    await loadCollectionDocuments(collection.id);
    setIsManageCollectionOpen(true);
  };

  const handleAddDocumentToCollection = async (collectionId, documentId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/v1/documents/collections/${collectionId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        },
        body: JSON.stringify({ document_id: documentId })
      });

      if (response.ok) {
        alert('Tài liệu đã được thêm vào collection thành công!');
        // Reload collections to update document counts
        loadCollections();
        // Reload collection documents if manage dialog is open
        if (selectedCollectionForManage && selectedCollectionForManage.id === collectionId) {
          await loadCollectionDocuments(collectionId);
        }
      } else {
        const errorData = await response.json();
        alert(`Không thể thêm tài liệu vào collection: ${errorData.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      console.error('Error adding document to collection:', error);
      alert('Có lỗi xảy ra khi thêm tài liệu vào collection.');
    }
  };

  const handleRemoveDocumentFromCollection = async (collectionId, documentId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/v1/documents/collections/${collectionId}/documents`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        },
        body: JSON.stringify({ document_id: documentId.toString() })
      });

      if (response.ok) {
        alert('Tài liệu đã được xóa khỏi collection thành công!');
        // Reload collections to update document counts
        loadCollections();
        // Reload collection documents if manage dialog is open
        if (selectedCollectionForManage && selectedCollectionForManage.id === collectionId) {
          await loadCollectionDocuments(collectionId);
        }
      } else {
        const errorData = await response.json();
        alert(`Không thể xóa tài liệu khỏi collection: ${errorData.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      console.error('Error removing document from collection:', error);
      alert('Có lỗi xảy ra khi xóa tài liệu khỏi collection.');
    }
  };

  const handleDelete = async (doc) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tài liệu "${doc.name}"?`)) {
      setIsDeleting(true);
      try {
        const response = await fetch(`http://localhost:3001/api/v1/documents/${doc.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
          }
        });

        if (response.ok) {
          setDocuments(prev => prev.filter(d => d.id !== doc.id));
          alert('Tài liệu đã được xóa thành công!');
        } else {
          alert('Không thể xóa tài liệu. Vui lòng thử lại.');
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('Có lỗi xảy ra khi xóa tài liệu.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Camera handlers
  const handleOpenCamera = async () => {
    try {
      setCameraError("");

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setCameraStream(stream);
      setIsCameraOpen(true);

      toast.success("Camera đã sẵn sàng", {
        description: "Bạn có thể chụp ảnh tài liệu để upload.",
      });

    } catch (error) {
      console.error('Camera access failed:', error);
      setCameraError("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập camera trong trình duyệt.");

      toast.error("Camera không khả dụng", {
        description: "Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.",
      });
    }
  };

  const handleCapturePhoto = () => {
    if (!cameraStream) return;

    try {
      // Create canvas to capture frame
      const video = document.querySelector('#camera-video') as HTMLVideoElement;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!video || !context) {
        throw new Error('Camera not ready');
      }

      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create file from blob
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setCapturedImage(file);

          // Stop camera
          handleCloseCamera();

          toast.success("Ảnh đã chụp", {
            description: "Ảnh đã được lưu. Bạn có thể upload ngay bây giờ.",
          });
        }
      }, 'image/jpeg', 0.8);

    } catch (error) {
      console.error('Photo capture failed:', error);
      toast.error("Chụp ảnh thất bại", {
        description: "Không thể chụp ảnh. Vui lòng thử lại.",
      });
    }
  };

  const handleCloseCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const handleUploadCapturedImage = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // First, validate image quality by attempting OCR
      toast.loading("Đang kiểm tra chất lượng ảnh...", {
        description: "Vui lòng đợi trong giây lát",
      });

      // Create FormData for quality check
      const formData = new FormData();
      formData.append('file', capturedImage);

      // Upload and check OCR quality first
      const response = await fetch('http://localhost:3001/api/v1/documents', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Check OCR quality - if extracted text is too short or contains error messages
      const extractedText = result.analysis.extractedText || '';
      const hasEnoughText = extractedText.length > 10; // At least 10 characters
      const hasNoErrors = !extractedText.includes('NO_TEXT_FOUND') &&
                         !extractedText.includes('OCR failed') &&
                         !extractedText.includes('processing failed');

      if (!hasEnoughText || !hasNoErrors) {
        // Image quality is poor - prompt user to retake
        setImageQualityError("Ảnh chụp không đủ rõ để đọc văn bản. Vui lòng chụp lại ảnh rõ hơn.");
        toast.error("Ảnh không rõ nét", {
          description: "Ảnh chụp không đủ rõ để đọc văn bản. Vui lòng chụp lại ảnh rõ hơn.",
        });

        // Don't proceed with upload, keep the captured image for retake
        setIsProcessing(false);
        setUploadProgress(0);
        return;
      }

      // Clear any previous quality error
      setImageQualityError("");

      // Image quality is good - proceed with upload
      setUploadProgress(50);

      // Update progress to 100%
      setUploadProgress(100);

      // Add processed document to list
      const newDoc = {
        id: result.data.id,
        name: result.data.name,
        type: getFileTypeFromMime(result.data.mime_type, result.data.name),
        size: `${(Number(result.data.file_size) / 1024 / 1024).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString().split('T')[0],
        uploadedBy: "Current User",
        level: "A1", // Will be updated after AI processing
        topic: "General",
        tags: [],
        ocrProcessed: false, // Will be updated after OCR processing
        downloads: 0,
        views: 0,
        summary: "Processing...",
        ocrText: '',
        ai_segments: [],
        segments: [],
        processingStatus: 'processing'
      };

      setDocuments([...documents, newDoc]);
      setCapturedImage(null);
      setIsUploadDialogOpen(false);

      toast.success("Ảnh đã upload thành công", {
        description: `File đã được upload và đang xử lý OCR/AI`,
      });

    } catch (error) {
      console.error('Upload failed:', error);
      toast.error("Upload thất bại", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };



  const getFileIcon = (type) => {
    switch (type) {
      case "pdf": return <FileTextIcon className="h-8 w-8 text-red-500" />;
      case "docx": return <FileTextIcon className="h-8 w-8 text-blue-500" />;
      case "doc": return <FileTextIcon className="h-8 w-8 text-blue-500" />;
      case "pptx": return <FileTextIcon className="h-8 w-8 text-orange-500" />;
      case "ppt": return <FileTextIcon className="h-8 w-8 text-orange-500" />;
      case "xlsx": return <FileTextIcon className="h-8 w-8 text-green-500" />;
      case "xls": return <FileTextIcon className="h-8 w-8 text-green-500" />;
      case "audio": return <MusicIcon className="h-8 w-8 text-blue-500" />;
      case "mp3": return <MusicIcon className="h-8 w-8 text-blue-500" />;
      case "wav": return <MusicIcon className="h-8 w-8 text-blue-500" />;
      case "ogg": return <MusicIcon className="h-8 w-8 text-blue-500" />;
      case "video": return <VideoIcon className="h-8 w-8 text-purple-500" />;
      case "mp4": return <VideoIcon className="h-8 w-8 text-purple-500" />;
      case "avi": return <VideoIcon className="h-8 w-8 text-purple-500" />;
      case "mov": return <VideoIcon className="h-8 w-8 text-purple-500" />;
      case "wmv": return <VideoIcon className="h-8 w-8 text-purple-500" />;
      case "image": return <ImageIcon className="h-8 w-8 text-green-500" />;
      case "jpg": return <ImageIcon className="h-8 w-8 text-green-500" />;
      case "png": return <ImageIcon className="h-8 w-8 text-green-500" />;
      case "gif": return <ImageIcon className="h-8 w-8 text-green-500" />;
      case "jpeg": return <ImageIcon className="h-8 w-8 text-green-500" />;
      default: return <FileTextIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (files) {
      setIsProcessing(true);
      setUploadProgress(0);

      try {
        const file = files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);
        formData.append('description', 'Uploaded via Document Library');

        // Upload to backend API - OCR and AI processing happens immediately in backend
        setUploadProgress(10);
        const uploadResponse = await fetch('http://localhost:3001/api/v1/documents', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
          }
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          const documentId = uploadResult.data.id;

          setUploadProgress(30);

          // Wait for OCR and AI processing to complete
          let processingComplete = false;
          let attempts = 0;
          const maxAttempts = 60; // 5 minutes max

          while (!processingComplete && attempts < maxAttempts) {
            try {
              const checkResponse = await fetch(`http://localhost:3001/api/v1/documents/${documentId}`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
                }
              });

              if (checkResponse.ok) {
                const docData = await checkResponse.json();
                const document = docData.data;

                // Check if AI tasks are completed
                const aiTasks = document.document_ai_tasks || document.ai_tasks || [];
                const completedTasks = aiTasks.filter(task => task.status === 'completed');

                if (completedTasks.length >= 4) { // All 4 AI tasks completed
                  processingComplete = true;
                  setUploadProgress(100);

                  // Reload documents to show the new document with processing results
                  await loadDocuments();

                  // Close upload dialog and reset states
                  setIsUploadDialogOpen(false);
                  setIsProcessing(false);
                  setUploadProgress(0);

                  // Show success message
                  alert('File đã được upload và xử lý thành công!');

                  break;
                } else {
                  setUploadProgress(30 + (completedTasks.length * 15)); // Progress based on completed tasks
                }
              }
            } catch (checkError) {
              console.warn('Error checking processing status:', checkError);
            }

            attempts++;
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          }

          if (!processingComplete) {
            setTimeout(() => {
              loadDocuments();
              setIsUploadDialogOpen(false);
              setIsProcessing(false);
              setUploadProgress(0);
            }, 3000);
          }

        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error('Upload failed:', error);
        setIsProcessing(false);
        setUploadProgress(0);
        alert('Upload failed. Please try again.');
      }
    }
  };

  const handleUrlImport = async () => {
    if (!linkUrl.trim()) {
      alert('Vui lòng nhập URL');
      return;
    }

    if (!selectedFileType) {
      alert('Vui lòng chọn loại file');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      setUploadProgress(10);

      const importResponse = await fetch('http://localhost:3001/api/v1/documents/import-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        },
        body: JSON.stringify({
          url: linkUrl,
          fileName: linkFileName || null,
          fileType: selectedFileType
        })
      });

      if (importResponse.ok) {
        const importResult = await importResponse.json();

        setUploadProgress(50);

        // Since we removed OCR/AI processing, just wait a moment and complete
        setUploadProgress(100);

        // Reload documents to show the new document
        await loadDocuments();

        // Close upload dialog and reset states
        setIsUploadDialogOpen(false);
        setIsProcessing(false);
        setUploadProgress(0);

        // Clear inputs
        setLinkUrl('');
        setLinkFileName('');
        setSelectedFileType('');

        // Show success message
        alert('File đã được import thành công!');

      } else {
        const errorData = await importResponse.json();
        throw new Error(errorData.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import failed:', error);
      setIsProcessing(false);
      setUploadProgress(0);
      alert('Import failed: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileTextIcon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng tài liệu</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DownloadIcon className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng tải xuống</p>
                <p className="text-2xl font-bold">
                  {documents.reduce((sum, doc) => sum + doc.downloads, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
           <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <EyeIcon className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Tổng xem</p>
                  <p className="text-2xl font-bold">
                    {documents.reduce((sum, doc) => sum + doc.views, 0)}
                  </p>
                </div>
              </div>
           </CardContent>
        </Card>

        <Card>
           <CardContent className="p-4">
             <div className="flex items-center gap-2">
               <BotIcon className="h-5 w-5 text-orange-500" />
               <div>
                 <p className="text-sm text-muted-foreground">OCR đã xử lý</p>
                 <p className="text-2xl font-bold">
                   {documents.filter(doc => doc.ocrProcessed).length}
                 </p>
                 {isLoading && (
                   <p className="text-xs text-blue-600 mt-1">Đang xử lý...</p>
                 )}
               </div>
             </div>
           </CardContent>
         </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tìm kiếm và lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative md:col-span-1">
              <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên, chủ đề, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="pl-10 h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg"
              />
            </div>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-lg">
                <SelectValue placeholder="🎯 Tất cả Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🎯 Tất cả Level</SelectItem>
                <SelectItem value="A1">🟢 A1 - Sơ cấp</SelectItem>
                <SelectItem value="A2">🟡 A2 - Sơ cấp+</SelectItem>
                <SelectItem value="B1">🟠 B1 - Trung cấp</SelectItem>
                <SelectItem value="B2">🔴 B2 - Trung cấp+</SelectItem>
                <SelectItem value="C1">🟣 C1 - Cao cấp</SelectItem>
                <SelectItem value="C2">⚫ C2 - Thành thạo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-lg">
                <SelectValue placeholder="📄 Tất cả loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📄 Tất cả loại</SelectItem>
                <SelectItem value="pdf">📕 PDF</SelectItem>
                <SelectItem value="audio">🎵 Audio</SelectItem>
                <SelectItem value="video">🎥 Video</SelectItem>
                <SelectItem value="image">🖼️ Image</SelectItem>
                <SelectItem value="docx">📝 Word</SelectItem>
                <SelectItem value="xlsx">📊 Excel</SelectItem>
                <SelectItem value="pptx">📊 PowerPoint</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Button
              variant={showFavorites ? "default" : "outline"}
              size="lg"
              onClick={() => {
                setShowFavorites(!showFavorites);
                if (!showFavorites) setShowCollections(false); // Nếu bật favorites thì tắt collections
              }}
              className={`h-12 px-6 border-2 transition-all duration-200 ${showFavorites ? "bg-red-500 hover:bg-red-600 text-white border-red-500" : "border-gray-300 hover:border-red-400 hover:text-red-500"}`}
            >
              <HeartIcon className="mr-2 h-5 w-5" />
              <span className="font-semibold">Yêu thích</span>
              {favorites.size > 0 && (
                <Badge className="ml-2 bg-white text-red-500 border border-red-300">{favorites.size}</Badge>
              )}
            </Button>

            <Button
              variant={showCollections ? "default" : "outline"}
              size="lg"
              onClick={() => {
                setShowCollections(!showCollections);
                if (!showCollections) setShowFavorites(false); // Nếu bật collections thì tắt favorites
              }}
              className={`h-12 px-6 border-2 transition-all duration-200 ${showCollections ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-500" : "border-gray-300 hover:border-blue-400 hover:text-blue-500"}`}
            >
              <FolderIcon className="mr-2 h-5 w-5" />
              <span className="font-semibold">Collections</span>
              {collections.length > 0 && (
                <Badge className="ml-2 bg-white text-blue-500 border border-blue-300">{collections.length}</Badge>
              )}
            </Button>

            <Button variant="outline" size="lg" className="h-12 px-6 border-2 border-green-300 hover:border-green-400 hover:text-green-500 transition-all duration-200" onClick={() => setIsCreateCollectionOpen(true)}>
              <PlusIcon className="mr-2 h-5 w-5" />
              <span className="font-semibold">Tạo Collection</span>
            </Button>

            <Button className="h-12 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold border-2 border-green-500" disabled={isProcessingUpload} onClick={() => setIsUploadDialogOpen(true)}>
              <UploadIcon className="mr-2 h-5 w-5" />
              <span>Upload Tài liệu</span>
            </Button>

            <div className="flex justify-center">
              <div className="flex border-2 border-gray-200 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="lg"
                  onClick={() => setViewMode("grid")}
                  className={`h-12 px-4 rounded-none border-0 ${viewMode === "grid" ? "bg-gray-800 text-white" : "hover:bg-gray-100"}`}
                >
                  <GridIcon className="h-5 w-5" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="lg"
                  onClick={() => setViewMode("list")}
                  className={`h-12 px-4 rounded-none border-0 ${viewMode === "list" ? "bg-gray-800 text-white" : "hover:bg-gray-100"}`}
                >
                  <ListIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favorites Display */}
      {showFavorites && (
        <div className="mb-6 bg-gradient-to-br from-red-50/50 to-pink-50/30 rounded-lg border-2 border-red-100 p-6">
          <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <HeartIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xl font-bold">Yêu thích của tôi</div>
                <div className="text-sm font-normal opacity-90">{favorites.size} tài liệu yêu thích</div>
              </div>
            </div>
          </div>

          {favoriteDocuments.length > 0 ? (
            <div className="space-y-6">
              {favoriteDocuments.map((doc) => (
                <Card key={doc.id} className="border-2 border-red-100 hover:border-red-200 transition-all duration-300 bg-white hover:bg-red-50/30 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-50 rounded-xl">
                          {getFileIcon(doc.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-lg mb-2">{doc.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{doc.size}</span>
                            <span>•</span>
                            <span>Upload: {doc.uploadedAt}</span>
                            <span>•</span>
                            <span>{doc.uploadedBy}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleFavorite(doc)}
                          className="text-red-500 hover:text-red-600 border-red-200 hover:border-red-300"
                        >
                          <HeartIcon className={`h-4 w-4 ${favorites.has(doc.id.toString()) ? "fill-current" : ""}`} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleShare(doc)}>
                          <ShareIcon className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownload(doc)}>
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      {/* Document Info */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">Thông tin cơ bản</Label>
                        <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-lg min-h-[120px]">
                          <p><strong>Kích thước:</strong> {doc.size}</p>
                          <p><strong>Upload:</strong> {doc.uploadedAt}</p>
                          <p><strong>Người upload:</strong> {doc.uploadedBy}</p>
                          <p><strong>OCR:</strong> {doc.ocrProcessed ? "✅ Đã xử lý" : "⏳ Chưa xử lý"}</p>
                        </div>
                      </div>

                      {/* Classification Info */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">Thông tin phân loại</Label>
                        <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg min-h-[120px]">
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-sm px-3 py-1">{doc.level}</Badge>
                          </div>
                          <p><strong>Chủ đề:</strong> {doc.topic}</p>
                          {doc.tags && doc.tags.length > 0 && (
                            <div className="mt-3">
                              <strong>Tags:</strong>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {doc.tags.map((tag, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs px-2 py-1">{getTagDisplayValue(tag)}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>👁 {doc.views} views</span>
                        <span>⬇ {doc.downloads} downloads</span>
                        <span>🔗 {doc.shares_count || 0} shares</span>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(doc);
                            setIsPreviewOpen(true);
                          }}
                        >
                          <EyeIcon className="mr-2 h-4 w-4" />
                          Xem chi tiết
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownload(doc)}>
                          <DownloadIcon className="mr-2 h-4 w-4" />
                          Tải
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="p-6 bg-gradient-to-br from-red-100 to-pink-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <HeartIcon className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có tài liệu yêu thích</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">Thêm tài liệu vào danh sách yêu thích để xem chi tiết ở đây</p>
              <Button onClick={() => setShowFavorites(false)} className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700">
                <FileTextIcon className="mr-2 h-4 w-4" />
                Xem tất cả tài liệu
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Show empty state when no documents found and not showing favorites */}
      {!showFavorites && !showCollections && filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Không tìm thấy tài liệu nào</p>
        </div>
      )}


      {/* Collections Display */}
      {showCollections && (
        <div className="mb-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-lg border-2 border-blue-100 p-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FolderIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xl font-bold">Collections</div>
                <div className="text-sm font-normal opacity-90">{collections.length} collections</div>
              </div>
            </div>
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {collections.map((collection) => (
                <Card key={collection.id} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200 bg-white hover:bg-blue-50/50 group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors">
                          <FolderIcon className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-base truncate mb-1">{collection.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{collection.description || 'Không có mô tả'}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleCollectionFavorite(collection)}
                          className={`transition-all duration-200 ${collectionFavorites.has(collection.id) ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-400"}`}
                          title="Yêu thích collection"
                        >
                          <HeartIcon className={`h-4 w-4 ${collectionFavorites.has(collection.id) ? "fill-current" : ""}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleManageCollection(collection)}
                          className="text-blue-500 hover:text-blue-600"
                          title="Quản lý tài liệu"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditCollection(collection)}
                          className="text-green-500 hover:text-green-600"
                          title="Chỉnh sửa collection"
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCollection(collection)}
                          className="text-red-500 hover:text-red-600"
                          title="Xóa collection"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant={collection.is_public ? "default" : "secondary"} className={collection.is_public ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-gray-100 text-gray-700"}>
                          {collection.is_public ? '🌐 Public' : '🔒 Private'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(collection.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{collection.documents_count || 0}</div>
                          <div className="text-xs text-gray-600">Tài liệu</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-500">{collection._count?.document_collection_favorites || 0}</div>
                          <div className="text-xs text-gray-600">Yêu thích</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {collections.length === 0 && (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <FolderIcon className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có collection nào</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">Tạo collection đầu tiên để tổ chức và quản lý tài liệu của bạn một cách hiệu quả</p>
                <Button onClick={() => setIsCreateCollectionOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Tạo Collection Đầu Tiên
                </Button>
              </div>
            )}
        </div>
      )}

      {/* Documents Display - only show when not showing favorites or collections */}
      {!showFavorites && !showCollections && (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.size}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleFavorite(doc)}
                          className={favorites.has(doc.id.toString()) ? "text-red-500 hover:text-red-600" : "hover:text-red-400"}
                        >
                          <HeartIcon className={`h-3 w-3 ${favorites.has(doc.id.toString()) ? "fill-current" : ""}`} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleShare(doc)}>
                          <ShareIcon className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(doc)}>
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex gap-1">
                        <Badge variant="outline">{doc.level}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{doc.topic}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>{doc.uploadedAt}</span>
                      <div className="flex items-center gap-3">
                        <span>👁 {doc.views}</span>
                        <span>⬇ {doc.downloads}</span>
                        <span>🔗 {doc.shares_count || 0}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={async () => {
                          setSelectedDocument(doc);
                          await loadPreviewData(doc.id);
                          setIsPreviewOpen(true);
                          // Update view count locally when opening preview
                          setDocuments(prev => prev.map(d =>
                            d.id === doc.id
                              ? { ...d, views: (d.views || 0) + 1 }
                              : d
                          ));
                        }}
                      >
                        <EyeIcon className="mr-1 h-3 w-3" />
                        Xem
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDownload(doc)}>
                        <DownloadIcon className="mr-1 h-3 w-3" />
                        Tải
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tài liệu</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Thống kê</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {getFileIcon(doc.type)}
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.size} • {doc.uploadedAt} • {doc.uploadedBy}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.level}</Badge>
                        </TableCell>
                        <TableCell>{doc.topic}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>👁 {doc.views} views</div>
                            <div>⬇ {doc.downloads} downloads</div>
                            <div>🔗 {doc.shares_count || 0} shares</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleFavorite(doc)}
                              className={favorites.has(doc.id.toString()) ? "text-red-500 hover:text-red-600 border-red-200" : "hover:text-red-400"}
                            >
                              <HeartIcon className={`h-3 w-3 ${favorites.has(doc.id.toString()) ? "fill-current" : ""}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedDocument(doc);
                                setIsPreviewOpen(true);
                              }}
                            >
                              <EyeIcon className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDownload(doc)}>
                              <DownloadIcon className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEditTags(doc)}>
                              <EditIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDocument && getFileIcon(selectedDocument.type)}
              {selectedDocument?.name}
            </DialogTitle>
            <DialogDescription>
              Document details, metadata, and AI analysis results
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-6">
              {/* Document Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Thông tin cơ bản</Label>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>Kích thước:</strong> {(previewData || selectedDocument).size}</p>
                    <p><strong>Upload:</strong> {(previewData || selectedDocument).uploadedAt}</p>
                    <p><strong>Người upload:</strong> {(previewData || selectedDocument).uploadedBy}</p>
                    <p><strong>OCR:</strong> {(previewData || selectedDocument).ocrProcessed ? "✅ Đã xử lý" : "⏳ Chưa xử lý"}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium font-bold">Thông tin phân loại</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-sm px-3 py-1 bg-gray-100 text-gray-800">
                        {(previewData || selectedDocument).level || "A1"}
                      </Badge>
                    </div>
                    <p className="text-sm font-bold">
                      Chủ đề: {(previewData || selectedDocument).topic || "General"}
                    </p>
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {[...new Set(((previewData || selectedDocument).tags || []).map((tagLabel: string) => tagLabel))].map((tagLabel: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-sm px-3 py-1 bg-gray-100 text-gray-800 font-medium">
                            {tagLabel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis Results */}
              {isLoadingPreview ? (
                <div className="flex items-center justify-center p-8">
                  <LoaderIcon className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-sm text-gray-600">Đang tải dữ liệu AI...</span>
                </div>
              ) : (
                (previewData || selectedDocument.ocrProcessed) && (
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <BotIcon className="h-4 w-4" />
                      Kết quả phân tích AI 
                    </Label>
                    <div className="mt-2 space-y-3">
                      {/* Extract AI task results from previewData or selectedDocument */}
                {(() => {
                  const documentData = previewData || selectedDocument;
                  const aiTasks = documentData.document_ai_tasks || documentData.ai_tasks || [];
                  const summaryTask = aiTasks.find(task => task.task_type === 'summarize');
                  const segmentTask = aiTasks.find(task => task.task_type === 'segment');
                  const levelTask = aiTasks.find(task => task.task_type === 'level_suggestion');
                  const topicTask = aiTasks.find(task => task.task_type === 'topic_suggestion');

                        return (
                          <>
                            {/* Summary */}
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <h4 className="text-sm font-medium text-blue-900 mb-1 flex items-center gap-2">
                              📝 Tóm tắt AI
                    
                            </h4>
                              <p className="text-sm text-blue-800">
                                {documentData.summary || "Tài liệu đã được xử lý thành công với phân tích AI."}
                              </p>
                            </div>

                            {/* Content Segments */}
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <h4 className="text-sm font-medium text-green-900 mb-3 flex items-center gap-2">
                                <span>📚 Phân đoạn tự động (AI)</span>
                                {documentData.segments && documentData.segments.length > 0 && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                    {documentData.segments.length} phần
                                  </span>
                                )}
                              </h4>
                              {documentData.segments && documentData.segments.length > 0 ? (
                                <div className="space-y-2">
                                  {documentData.segments.map((segment, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-2 bg-white rounded border border-green-100">
                                      <span className="text-green-600 font-medium text-sm min-w-[24px]">
                                        {idx + 1}.
                                      </span>
                                      <span className="text-green-800 text-sm flex-1">{segment}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-green-700 italic p-3 bg-white rounded border border-green-100">
                                  📝 Đang xử lý phân đoạn nội dung...
                                </div>
                              )}
                            </div>


                          </>
                        );
                      })()}
                    </div>
                  </div>
                )
              )}

              {/* Preview */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <EyeIcon className="h-4 w-4" />
                  File Preview
                </Label>
                <div className="mt-3 border rounded-xl p-6 bg-gradient-to-br from-slate-50 to-white min-h-[280px] shadow-sm">
                  {/* PDF Preview */}
                  {selectedDocument.type === "pdf" && (
                    <div className="text-center space-y-6">
                      <div className="bg-gradient-to-br from-red-50 to-rose-50 p-8 rounded-xl border-2 border-red-100 shadow-lg">
                        <div className="text-center">
                          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-200 shadow-md">
                            <FileTextIcon className="h-12 w-12 text-red-600" />
                          </div>
                          <h3 className="font-bold text-gray-900 text-xl mb-3">📄 PDF File</h3>
                          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-red-200">
                            <p className="text-red-700 font-medium text-base mb-2">Không thể hiển thị</p>
                            <p className="text-red-600 text-sm">Vui lòng tải xuống để xem nội dung</p>
                          </div>
                        </div>
                      </div>
                      {selectedDocument.ocrText && typeof selectedDocument.ocrText === 'string' && selectedDocument.ocrText.trim().length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <FileTextIcon className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-blue-900">Content Preview Available</span>
                          </div>
                          <p className="text-blue-800 text-sm mb-3">
                            This document has {selectedDocument.ocrText.length.toLocaleString()} characters of content.
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(selectedDocument)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <DownloadIcon className="h-4 w-4 mr-2" />
                            Download Full Document
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DOC/DOCX Preview */}
                  {(selectedDocument.type === "docx" || selectedDocument.type === "doc") && (
                    <div className="text-center space-y-6">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border-2 border-blue-100 shadow-lg">
                        <div className="text-center">
                          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-blue-200 shadow-md">
                            <FileTextIcon className="h-12 w-12 text-blue-600" />
                          </div>
                          <h3 className="font-bold text-gray-900 text-xl mb-3">📝 Word Document</h3>
                          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-200">
                            <p className="text-blue-700 font-medium text-base mb-2">Không thể hiển thị</p>
                            <p className="text-blue-600 text-sm">Vui lòng tải xuống để xem nội dung</p>
                          </div>
                        </div>
                      </div>
                      {selectedDocument.ocrText && typeof selectedDocument.ocrText === 'string' && selectedDocument.ocrText.trim().length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <FileTextIcon className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-blue-900">Content Preview Available</span>
                          </div>
                          <p className="text-blue-800 text-sm mb-3">
                            This document has {selectedDocument.ocrText.length.toLocaleString()} characters of content.
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(selectedDocument)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <DownloadIcon className="h-4 w-4 mr-2" />
                            Download Full Document
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Audio Preview */}
                  {(selectedDocument.type === "audio" || selectedDocument.type === "mp3" || selectedDocument.type === "wav" || selectedDocument.type === "ogg") && (
                    <div className="text-center space-y-6">
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-xl border-2 border-purple-100 shadow-lg">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-3 mb-4">
                            <h3 className="font-bold text-gray-900 text-xl">{selectedDocument.name}</h3>
                          </div>
                          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-purple-200 mb-4">
                            <audio controls className="w-full max-w-lg mx-auto block" crossOrigin="anonymous">
                              <source src={`http://localhost:3001/api/v1/documents/${selectedDocument.id}/download?token=${localStorage.getItem('token') || 'demo-token'}`} type={`audio/${selectedDocument.type === 'mp3' ? 'mp3' : selectedDocument.type}`} />
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                          <div className="mt-4 text-center">
                            <p className="text-xs text-gray-500 mt-1">Click play để nghe audio</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Video Preview */}
                  {(selectedDocument.type === "video" || selectedDocument.type === "mp4" || selectedDocument.type === "avi" || selectedDocument.type === "mov" || selectedDocument.type === "wmv") && (
                    <div className="text-center space-y-6">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border-2 border-blue-100 shadow-lg">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-3 mb-4">
                            <h3 className="font-bold text-gray-900 text-xl">{selectedDocument.name}</h3>
                          </div>
                          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-200 mb-4">
                            <video controls className="w-full max-w-md mx-auto rounded-lg shadow-sm animate-pulse" crossOrigin="anonymous">
                              <source src={`http://localhost:3001/api/v1/documents/${selectedDocument.id}/download?token=${localStorage.getItem('token') || 'demo-token'}`} type={`video/${selectedDocument.type === 'mp4' ? 'mp4' : selectedDocument.type}`} />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                          <div className="mt-4 text-center">
                            <p className="text-xs text-gray-500 mt-1">Click play để xem video</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image Preview */}
                  {(selectedDocument.type === "image" || ["jpg", "jpeg", "png", "gif", "bmp", "tiff"].includes(selectedDocument.type)) && (
                    <div className="text-center">
                      <img
                        src={`http://localhost:3001/api/v1/documents/${selectedDocument.id}/download?token=${localStorage.getItem('token') || 'demo-token'}`}
                        alt="Preview"
                        className="max-w-full max-h-[600px] rounded-lg mx-auto"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          console.error('Image preview failed');
                          const img = e.target as HTMLImageElement;
                          img.src = '/placeholder.svg';
                          img.alt = 'Preview not available';
                        }}
                      />
                    </div>
                  )}

                  {/* Excel Preview */}
                  {selectedDocument.type === "xlsx" && (
                    <div className="text-center space-y-6">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl border-2 border-green-100 shadow-lg">
                        <div className="text-center">
                          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-200 shadow-md">
                            <FileTextIcon className="h-12 w-12 text-green-600" />
                          </div>
                          <h3 className="font-bold text-gray-900 text-xl mb-3">📊 Excel Spreadsheet</h3>
                          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-green-200">
                            <p className="text-green-700 font-medium text-base mb-2">Không thể hiển thị</p>
                            <p className="text-green-600 text-sm">Vui lòng tải xuống để xem nội dung</p>
                          </div>
                        </div>
                      </div>
                      {selectedDocument.ocrText && typeof selectedDocument.ocrText === 'string' && selectedDocument.ocrText.trim().length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <FileTextIcon className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-blue-900">Content Preview Available</span>
                          </div>
                          <p className="text-blue-800 text-sm mb-3">
                            This document has {selectedDocument.ocrText.length.toLocaleString()} characters of content.
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(selectedDocument)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <DownloadIcon className="h-4 w-4 mr-2" />
                            Download Full Document
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PowerPoint Preview */}
                  {selectedDocument.type === "pptx" && (
                    <div className="text-center space-y-6">
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 rounded-xl border-2 border-orange-100 shadow-lg">
                        <div className="text-center">
                          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-orange-200 shadow-md">
                            <FileTextIcon className="h-12 w-12 text-orange-600" />
                          </div>
                          <h3 className="font-bold text-gray-900 text-xl mb-3">📊 PowerPoint Presentation</h3>
                          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-orange-200">
                            <p className="text-orange-700 font-medium text-base mb-2">Không thể hiển thị</p>
                            <p className="text-orange-600 text-sm">Vui lòng tải xuống để xem nội dung</p>
                          </div>
                        </div>
                      </div>
                      {selectedDocument.ocrText && typeof selectedDocument.ocrText === 'string' && selectedDocument.ocrText.trim().length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <FileTextIcon className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-blue-900">Content Preview Available</span>
                          </div>
                          <p className="text-blue-800 text-sm mb-3">
                            This document has {selectedDocument.ocrText.length.toLocaleString()} characters of content.
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(selectedDocument)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <DownloadIcon className="h-4 w-4 mr-2" />
                            Download Full Document
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PPT Preview */}
                  {selectedDocument.type === "ppt" && (
                    <div className="text-center space-y-6">
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 rounded-xl border-2 border-orange-100 shadow-lg">
                        <div className="text-center">
                          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-orange-200 shadow-md">
                            <FileTextIcon className="h-12 w-12 text-orange-600" />
                          </div>
                          <h3 className="font-bold text-gray-900 text-xl mb-3">📊 PowerPoint Presentation</h3>
                          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-orange-200">
                            <p className="text-orange-700 font-medium text-base mb-2">Không thể hiển thị</p>
                            <p className="text-orange-600 text-sm">Vui lòng tải xuống để xem nội dung</p>
                          </div>
                        </div>
                      </div>
                      {selectedDocument.ocrText && typeof selectedDocument.ocrText === 'string' && selectedDocument.ocrText.trim().length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <FileTextIcon className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-blue-900">Content Preview Available</span>
                          </div>
                          <p className="text-blue-800 text-sm mb-3">
                            This document has {selectedDocument.ocrText.length.toLocaleString()} characters of content.
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(selectedDocument)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <DownloadIcon className="h-4 w-4 mr-2" />
                            Download Full Document
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Unknown file type */}
                  {!["pdf", "docx", "doc", "audio", "video", "image", "xlsx", "ppt", "pptx", "mp3", "mp4", "avi", "mov", "wmv", "wav", "ogg", "jpg", "png", "gif", "jpeg", "bmp", "tiff"].includes(selectedDocument.type) && (
                    <div className="text-center space-y-6">
                      <div className="flex items-center justify-center gap-3 p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-100 mx-auto max-w-md">
                        <div className="p-4 bg-gray-100 rounded-full shadow-sm">
                          <FileTextIcon className="h-8 w-8 text-gray-600" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900 text-xl">📄 {selectedDocument.type?.toUpperCase() || 'Unknown'} File</h4>
                          <p className="text-sm text-gray-700">File type: {selectedDocument.type || 'unknown'}</p>
                        </div>
                      </div>
                      <div className="bg-white p-8 rounded-xl border shadow-lg">
                        <div className="w-24 h-24 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4 border-2 border-gray-200">
                          <FileTextIcon className="h-12 w-12 text-gray-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">File Preview Not Available</h3>
                        <p className="text-gray-600 text-sm mb-4">This file type is not supported for preview</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  className="flex-1"
                  onClick={() => handleDownload(selectedDocument)}
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleEditTags(selectedDocument)}
                >
                  <TagIcon className="mr-2 h-4 w-4" />
                  Edit Tags
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleReprocess(selectedDocument)}
                  disabled={isReprocessing}
                >
                  {isReprocessing ? (
                    <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <BotIcon className="mr-2 h-4 w-4" />
                  )}
                  {isReprocessing ? "Re-processing..." : "Re-process OCR"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload tài liệu</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload File</TabsTrigger>
              <TabsTrigger value="link">Import Link</TabsTrigger>
              <TabsTrigger value="camera">Chụp ảnh</TabsTrigger>
            </TabsList>

            {/* Tab Upload File */}
            <TabsContent value="upload" className="space-y-4">
              <div>
                <Label>Chọn file</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.png,.mp3,.mp4"
                  onChange={handleFileUpload}
                  className="mt-1"
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Hỗ trợ: PDF, DOCX, PPT, Excel, Images, Audio, Video
                </p>
              </div>

              {(uploadProgress > 0 || isProcessing) && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{isProcessing ? "Processing with AI..." : "Uploading..."}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                  {isProcessing && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                      <LoaderIcon className="h-4 w-4 animate-spin" />
                      <span>Đang xử lý OCR và phân tích AI...</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  <BotIcon className="mr-2 h-4 w-4" />
                  {isProcessing ? "Processing..." : "OCR & Auto-tag"}
                </Button>
              </div>
            </TabsContent>

            {/* Tab Import Link (Drive) */}
            <TabsContent value="link" className="space-y-4">
              <div>
                <Label>Link tài liệu</Label>
                <Input
                  placeholder="https://drive.google.com/file/d/FILE_ID/view"
                  className="mt-1"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Hỗ trợ: Google Drive, Dropbox, direct URLs. Đảm bảo file được chia sẻ công khai.
                </p>
              </div>
              <div>
                <Label>Định dạng file</Label>
                <Select value={selectedFileType} onValueChange={setSelectedFileType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn định dạng file" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">📕 PDF</SelectItem>
                    <SelectItem value="docx">📝 Word (DOCX)</SelectItem>
                    <SelectItem value="pptx">📊 PowerPoint (PPTX)</SelectItem>
                    <SelectItem value="audio">🎵 Audio (MP3)</SelectItem>
                    <SelectItem value="video">🎥 Video (MP4)</SelectItem>
                    <SelectItem value="image">🖼️ Image (JPG)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Chọn định dạng file chính xác để import đúng loại tài liệu.
                </p>
              </div>
              <div>
                <Label>Tên tài liệu</Label>
                <Input
                  placeholder="Tên file (tùy chọn)"
                  className="mt-1"
                  value={linkFileName}
                  onChange={(e) => setLinkFileName(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleUrlImport}
                disabled={isProcessing || !linkUrl.trim() || !selectedFileType}
              >
                {isProcessing ? "Importing..." : "Import từ Link"}
              </Button>
            </TabsContent>

            {/* Tab Camera */}
            <TabsContent value="camera" className="space-y-4">
              {!isCameraOpen && !capturedImage ? (
                <div className="text-center">
                  <div className="bg-gray-100 p-8 rounded-lg mb-4">
                    <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {cameraError || "Chụp ảnh tài liệu để upload"}
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleOpenCamera}
                    disabled={!!cameraError}
                  >
                    <CameraIcon className="mr-2 h-4 w-4" />
                    Mở Camera
                  </Button>
                </div>
              ) : capturedImage ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`border p-4 rounded-lg mb-4 ${imageQualityError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                      <CameraIcon className={`h-8 w-8 mx-auto mb-2 ${imageQualityError ? 'text-red-500' : 'text-green-500'}`} />
                      <p className={`text-sm ${imageQualityError ? 'text-red-800' : 'text-green-800'}`}>
                        {imageQualityError || "Ảnh đã chụp thành công!"}
                      </p>
                    </div>
                    <div className="border rounded-lg p-2 mb-4">
                      <img
                        src={URL.createObjectURL(capturedImage)}
                        alt="Captured"
                        className="max-w-full max-h-48 mx-auto rounded"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setCapturedImage(null);
                        setImageQualityError("");
                        handleOpenCamera();
                      }}
                    >
                      <CameraIcon className="mr-2 h-4 w-4" />
                      Chụp lại
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleUploadCapturedImage}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        uploadProgress === 0 ? "Đang kiểm tra chất lượng..." :
                        uploadProgress === 50 ? "Đang upload..." :
                        "Processing..."
                      ) : "Upload Ảnh"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                      <CameraIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm text-blue-800">Camera đang hoạt động</p>
                    </div>
                    <div className="border rounded-lg overflow-hidden bg-black">
                      <video
                        id="camera-video"
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-64 object-cover"
                        ref={(video) => {
                          if (video && cameraStream) {
                            video.srcObject = cameraStream;
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleCloseCamera}
                    >
                      Hủy
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleCapturePhoto}
                    >
                      <CameraIcon className="mr-2 h-4 w-4" />
                      Chụp Ảnh
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Tags Dialog */}
      <EditTagsDialog
        open={isEditTagsOpen}
        onOpenChange={setIsEditTagsOpen}
        document={selectedDocumentForEdit}
        onSave={handleSaveTags}
      />

      {/* Share Document Dialog */}
      <ShareDocumentDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        document={selectedDocumentForShare}
        onShare={handleShareDocument}
      />

      {/* Create Collection Dialog */}
      <Dialog open={isCreateCollectionOpen} onOpenChange={setIsCreateCollectionOpen}>
        <DialogContent className="max-w-lg border-2 border-green-200">
          <DialogHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg -m-6 mb-6">
            <DialogTitle className="flex items-center gap-3 p-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <PlusIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xl font-bold">Tạo Collection Mới</div>
                <div className="text-sm font-normal opacity-90">Tổ chức tài liệu của bạn thành các collection</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold text-gray-700">Tên collection *</Label>
              <Input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Ví dụ: IELTS Writing Samples"
                className="mt-2 h-12 text-base border-2 border-gray-200 focus:border-green-500 rounded-lg"
              />
            </div>
            <div>
              <Label className="text-base font-semibold text-gray-700">Mô tả (tùy chọn)</Label>
              <Input
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder="Mô tả về collection này"
                className="mt-2 h-12 text-base border-2 border-gray-200 focus:border-green-500 rounded-lg"
              />
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="is-public"
                checked={isPublicCollection}
                onChange={(e) => setIsPublicCollection(e.target.checked)}
                className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
              />
              <Label htmlFor="is-public" className="text-base font-medium text-gray-700 cursor-pointer">
                🌐 Công khai (toàn trường có thể xem)
              </Label>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
                className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
              >
                <PlusIcon className="mr-2 h-5 w-5" />
                Tạo Collection
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateCollectionOpen(false);
                  setNewCollectionName('');
                  setNewCollectionDescription('');
                  setIsPublicCollection(false);
                }}
                className="flex-1 h-12 border-2 border-gray-300 hover:border-gray-400 font-semibold"
              >
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Collection Dialog */}
      <Dialog open={isEditCollectionOpen} onOpenChange={setIsEditCollectionOpen}>
        <DialogContent className="max-w-lg border-2 border-blue-200">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg -m-6 mb-6">
            <DialogTitle className="flex items-center gap-3 p-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <EditIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xl font-bold">Chỉnh sửa Collection</div>
                <div className="text-sm font-normal opacity-90">Cập nhật thông tin collection</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold text-gray-700">Tên collection</Label>
              <Input
                value={editCollectionName}
                onChange={(e) => setEditCollectionName(e.target.value)}
                placeholder="Ví dụ: IELTS Writing Samples"
                className="mt-2 h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg"
              />
            </div>
            <div>
              <Label className="text-base font-semibold text-gray-700">Mô tả (tùy chọn)</Label>
              <Input
                value={editCollectionDescription}
                onChange={(e) => setEditCollectionDescription(e.target.value)}
                placeholder="Mô tả về collection này"
                className="mt-2 h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg"
              />
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="edit-is-public"
                checked={editIsPublicCollection}
                onChange={(e) => setEditIsPublicCollection(e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="edit-is-public" className="text-base font-medium text-gray-700 cursor-pointer">
                🌐 Công khai (toàn trường có thể xem)
              </Label>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSaveCollectionEdit} className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold">
                <EditIcon className="mr-2 h-5 w-5" />
                Cập nhật Collection
              </Button>
              <Button variant="outline" onClick={() => setIsEditCollectionOpen(false)} className="flex-1 h-12 border-2 border-gray-300 hover:border-gray-400 font-semibold">
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Collection Dialog */}
      <Dialog open={isManageCollectionOpen} onOpenChange={setIsManageCollectionOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto border-2 border-blue-200">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg -m-6 mb-6">
            <DialogTitle className="flex items-center gap-3 p-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <PlusIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xl font-bold">Quản lý Collection</div>
                <div className="text-sm font-normal opacity-90">{selectedCollectionForManage?.name}</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-base font-semibold text-gray-700 mb-4 block">Thêm tài liệu vào collection</Label>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {documents.slice(0, 10).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.type)}
                        <div>
                          <p className="font-medium text-sm">{doc.name}</p>
                          <p className="text-xs text-gray-600">{doc.size}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddDocumentToCollection(selectedCollectionForManage.id, doc.id)}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <PlusIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-base font-semibold text-gray-700 mb-4 block">Tài liệu trong collection</Label>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {collectionDocuments.length > 0 ? (
                    collectionDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.type)}
                          <p className="font-medium text-sm">{doc.name}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedDocument(doc);
                              loadPreviewData(doc.id);
                              setIsPreviewOpen(true);
                            }}
                            className="text-blue-500 hover:text-blue-600 border-blue-200"
                            title="Xem chi tiết"
                          >
                            <EyeIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveDocumentFromCollection(selectedCollectionForManage.id, doc.id)}
                            className="text-red-500 hover:text-red-600 border-red-200"
                            title="Xóa khỏi collection"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FolderIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Chưa có tài liệu nào trong collection</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Không tìm thấy tài liệu nào</p>
        </div>
      )}
    </div>
  );
};

export default DocumentLibrary;
