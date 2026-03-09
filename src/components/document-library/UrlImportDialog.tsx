import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  LinkIcon,
  FileTextIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "lucide-react";

interface UrlImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

const UrlImportDialog: React.FC<UrlImportDialogProps> = ({ open, onOpenChange, onUploadSuccess }) => {
  const [urlInput, setUrlInput] = useState('');
  const [filenameInput, setFilenameInput] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const fileTypes = [
    { value: 'pdf', label: '📕 PDF Document', icon: FileTextIcon },
    { value: 'docx', label: '📝 Word Document', icon: FileTextIcon },
    { value: 'pptx', label: '📊 PowerPoint', icon: FileTextIcon },
    { value: 'image', label: '🖼️ Image', icon: ImageIcon },
    { value: 'video', label: '🎥 Video', icon: VideoIcon },
    { value: 'audio', label: '🎵 Audio', icon: MusicIcon },
  ];

  const handleUrlImport = async () => {
    if (!urlInput.trim()) {
      setErrorMessage('Vui lòng nhập URL');
      return;
    }

    if (!selectedFileType) {
      setErrorMessage('Vui lòng chọn loại file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');
    setErrorMessage('');

    try {
      setUploadProgress(10);

      const response = await fetch('http://localhost:3001/api/v1/documents/import-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        },
        body: JSON.stringify({
          url: urlInput,
          fileName: filenameInput || undefined,
          fileType: selectedFileType
        })
      });

      if (response.ok) {
        const result = await response.json();
        setUploadProgress(100);
        setUploadStatus('success');

        // OCR processing will be handled automatically by the backend
        // The backend import-url route creates documents without OCR initially
        // We need to trigger OCR processing after successful import

        // Note: URL import currently doesn't trigger OCR automatically
        // This would need to be implemented in the backend import-url endpoint
        // For now, users can manually trigger OCR from the document details page

        setTimeout(() => {
          onOpenChange(false);
          onUploadSuccess?.();
          resetForm();
        }, 1500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import failed:', error);
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setUrlInput('');
    setFilenameInput('');
    setSelectedFileType('');
    setUploadProgress(0);
    setUploadStatus('idle');
    setErrorMessage('');
  };

  const handleClose = () => {
    if (isUploading) return; // Prevent closing during upload
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <LinkIcon className="h-6 w-6 text-green-600" />
            Import từ Google Drive
          </DialogTitle>
          <DialogDescription>
            Import tài liệu từ Google Drive hoặc bất kỳ URL nào
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="url-input">URL của file</Label>
              <Input
                id="url-input"
                placeholder="https://drive.google.com/file/d/... hoặc bất kỳ URL nào"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={isUploading}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Hỗ trợ Google Drive, Google Docs, Google Slides, Dropbox...
              </p>
            </div>

            <div>
              <Label htmlFor="filename-input">Tên file (tùy chọn)</Label>
              <Input
                id="filename-input"
                placeholder="Để trống để tự động phát hiện"
                value={filenameInput}
                onChange={(e) => setFilenameInput(e.target.value)}
                disabled={isUploading}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Loại file</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {fileTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={selectedFileType === type.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFileType(type.value)}
                    disabled={isUploading}
                    className="justify-start"
                  >
                    <type.icon className="h-4 w-4 mr-2" />
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {uploadStatus === 'uploading' && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-gray-600">Đang import file...</p>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircleIcon className="h-5 w-5" />
                <span>Import thành công!</span>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircleIcon className="h-5 w-5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <Button
              onClick={handleUrlImport}
              disabled={!urlInput.trim() || !selectedFileType || isUploading}
              className="w-full"
            >
              {isUploading ? 'Đang import...' : 'Import từ URL'}
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default UrlImportDialog;