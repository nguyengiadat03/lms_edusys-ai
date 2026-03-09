import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  UploadIcon,
  FileTextIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  CameraIcon,
  LinkIcon,
  XIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "lucide-react";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

const UploadDialog: React.FC<UploadDialogProps> = ({ open, onOpenChange, onUploadSuccess }) => {
  const [activeTab, setActiveTab] = useState("local");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // URL Import states
  const [urlInput, setUrlInput] = useState('');
  const [filenameInput, setFilenameInput] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');

  // Camera states
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileTypes = [
    { value: 'pdf', label: '📕 PDF Document', icon: FileTextIcon },
    { value: 'docx', label: '📝 Word Document', icon: FileTextIcon },
    { value: 'pptx', label: '📊 PowerPoint', icon: FileTextIcon },
    { value: 'image', label: '🖼️ Image', icon: ImageIcon },
    { value: 'video', label: '🎥 Video', icon: VideoIcon },
    { value: 'audio', label: '🎵 Audio', icon: MusicIcon },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrorMessage('');
    }
  };

  const handleLocalUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Vui lòng chọn file để upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', selectedFile.name);
      formData.append('description', 'Uploaded via Document Library');

      const response = await fetch('http://localhost:3001/api/v1/documents', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        }
      });

      if (response.ok) {
        const result = await response.json();

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        // Wait for OCR/AI processing to complete
        let processingComplete = false;
        let attempts = 0;
        const maxAttempts = 60;

        while (!processingComplete && attempts < maxAttempts) {
          try {
            const checkResponse = await fetch(`http://localhost:3001/api/v1/documents/${result.data.id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
              }
            });

            if (checkResponse.ok) {
              const docData = await checkResponse.json();
              const document = docData.data;
              const aiTasks = document.ai_tasks || [];
              const completedTasks = aiTasks.filter((task: { status: string }) => task.status === 'completed');

              if (completedTasks.length >= 4) {
                processingComplete = true;
                setUploadProgress(100);
                setUploadStatus('success');
                clearInterval(progressInterval);

                setTimeout(() => {
                  onOpenChange(false);
                  onUploadSuccess?.();
                  resetForm();
                }, 1500);
                break;
              } else {
                setUploadProgress(30 + (completedTasks.length * 15));
              }
            }
          } catch (checkError) {
            console.warn('Error checking processing status:', checkError);
          }

          attempts++;
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

        if (!processingComplete) {
          setUploadProgress(100);
          setUploadStatus('success');
          clearInterval(progressInterval);

          setTimeout(() => {
            onOpenChange(false);
            onUploadSuccess?.();
            resetForm();
          }, 1500);
        }

      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

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

        // Wait for OCR/AI processing to complete
        let processingComplete = false;
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes max

        while (!processingComplete && attempts < maxAttempts) {
          try {
            const checkResponse = await fetch(`http://localhost:3001/api/v1/documents/${result.documentId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
              }
            });

            if (checkResponse.ok) {
              const docData = await checkResponse.json();
              const document = docData.data;
              const aiTasks = document.ai_tasks || [];
              const completedTasks = aiTasks.filter((task: { status: string }) => task.status === 'completed');

              if (completedTasks.length >= 4) {
                processingComplete = true;
                setUploadProgress(100);
                setUploadStatus('success');

                setTimeout(() => {
                  onOpenChange(false);
                  onUploadSuccess?.();
                  resetForm();
                }, 1500);
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
          setUploadProgress(100);
          setUploadStatus('success');

          setTimeout(() => {
            onOpenChange(false);
            onUploadSuccess?.();
            resetForm();
          }, 1500);
        }

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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
        audio: false
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setErrorMessage('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageDataUrl);
        stopCamera();
      }
    }
  };

  const uploadCapturedImage = async () => {
    if (!capturedImage) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');
    setErrorMessage('');

    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('file', blob, `camera_capture_${Date.now()}.jpg`);
      formData.append('name', `Camera Capture ${new Date().toLocaleString('vi-VN')}`);
      formData.append('description', 'Captured via camera');

      const uploadResponse = await fetch('http://localhost:3001/api/v1/documents', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        }
      });

      if (uploadResponse.ok) {
        const result = await uploadResponse.json();

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        // Wait for OCR/AI processing to complete
        let processingComplete = false;
        let attempts = 0;
        const maxAttempts = 60;

        while (!processingComplete && attempts < maxAttempts) {
          try {
            const checkResponse = await fetch(`http://localhost:3001/api/v1/documents/${result.data.id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
              }
            });

            if (checkResponse.ok) {
              const docData = await checkResponse.json();
              const document = docData.data;
              const aiTasks = document.ai_tasks || [];
              const completedTasks = aiTasks.filter((task: { status: string }) => task.status === 'completed');

              if (completedTasks.length >= 4) {
                processingComplete = true;
                setUploadProgress(100);
                setUploadStatus('success');
                clearInterval(progressInterval);

                setTimeout(() => {
                  onOpenChange(false);
                  onUploadSuccess?.();
                  resetForm();
                }, 1500);
                break;
              } else {
                setUploadProgress(30 + (completedTasks.length * 15));
              }
            }
          } catch (checkError) {
            console.warn('Error checking processing status:', checkError);
          }

          attempts++;
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

        if (!processingComplete) {
          setUploadProgress(100);
          setUploadStatus('success');
          clearInterval(progressInterval);

          setTimeout(() => {
            onOpenChange(false);
            onUploadSuccess?.();
            resetForm();
          }, 1500);
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus('idle');
    setErrorMessage('');
    setUrlInput('');
    setFilenameInput('');
    setSelectedFileType('');
    setCapturedImage(null);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
            <UploadIcon className="h-6 w-6 text-blue-600" />
            Upload Tài liệu
          </DialogTitle>
          <DialogDescription>
            Upload file từ máy tính, import từ URL, hoặc chụp ảnh từ camera
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="local" className="flex items-center gap-2">
              <UploadIcon className="h-4 w-4" />
              File Local
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Từ URL
            </TabsTrigger>
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <CameraIcon className="h-4 w-4" />
              Camera
            </TabsTrigger>
          </TabsList>

          {/* Local File Upload Tab */}
          <TabsContent value="local" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors">
                    <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium">Kéo thả file vào đây</p>
                      <p className="text-sm text-gray-500">hoặc click để chọn file</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.wmv,.mp3,.wav,.ogg"
                    />
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      Chọn File
                    </Button>
                  </div>

                  {selectedFile && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <FileTextIcon className="h-5 w-5 text-blue-600" />
                      <div className="flex-1 text-left">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        disabled={isUploading}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {uploadStatus === 'uploading' && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} className="w-full" />
                      <p className="text-sm text-gray-600">
                        Đang upload và xử lý... {uploadProgress}%
                      </p>
                    </div>
                  )}

                  {uploadStatus === 'success' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>Upload thành công!</span>
                    </div>
                  )}

                  {uploadStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircleIcon className="h-5 w-5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <Button
                    onClick={handleLocalUpload}
                    disabled={!selectedFile || isUploading}
                    className="w-full"
                  >
                    {isUploading ? 'Đang upload...' : 'Upload File'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* URL Import Tab */}
          <TabsContent value="url" className="space-y-4">
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
                  />
                </div>

                <div>
                  <Label htmlFor="filename-input">Tên file (tùy chọn)</Label>
                  <Input
                    id="filename-input"
                    placeholder="Để trống để tự động phát hiện"
                    value={filenameInput}
                    onChange={(e) => setFilenameInput(e.target.value)}
                    disabled={isUploading}
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
          </TabsContent>

          {/* Camera Tab */}
          <TabsContent value="camera" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  {!capturedImage ? (
                    <>
                      <div className="relative bg-black rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-64 object-cover"
                          style={{ display: cameraStream ? 'block' : 'none' }}
                        />
                        <canvas
                          ref={canvasRef}
                          className="hidden"
                        />
                        {!cameraStream && (
                          <div className="w-full h-64 flex items-center justify-center">
                            <CameraIcon className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 justify-center">
                        {!cameraStream ? (
                          <Button onClick={startCamera} disabled={isUploading}>
                            <CameraIcon className="h-4 w-4 mr-2" />
                            Mở Camera
                          </Button>
                        ) : (
                          <>
                            <Button onClick={captureImage} disabled={isUploading}>
                              <CameraIcon className="h-4 w-4 mr-2" />
                              Chụp Ảnh
                            </Button>
                            <Button variant="outline" onClick={stopCamera} disabled={isUploading}>
                              Dừng Camera
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <img
                          src={capturedImage}
                          alt="Captured"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setCapturedImage(null)}
                          disabled={isUploading}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>

                      {uploadStatus === 'uploading' && (
                        <div className="space-y-2">
                          <Progress value={uploadProgress} className="w-full" />
                          <p className="text-sm text-gray-600">Đang upload ảnh...</p>
                        </div>
                      )}

                      {uploadStatus === 'success' && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircleIcon className="h-5 w-5" />
                          <span>Upload thành công!</span>
                        </div>
                      )}

                      {uploadStatus === 'error' && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircleIcon className="h-5 w-5" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      <Button
                        onClick={uploadCapturedImage}
                        disabled={isUploading}
                        className="w-full"
                      >
                        {isUploading ? 'Đang upload...' : 'Upload Ảnh'}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;