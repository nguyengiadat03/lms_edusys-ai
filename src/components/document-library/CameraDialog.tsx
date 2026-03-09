import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  CameraIcon,
  XIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
} from "lucide-react";

interface CameraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

const CameraDialog: React.FC<CameraDialogProps> = ({ open, onOpenChange, onUploadSuccess }) => {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [filenameInput, setFilenameInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
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
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageDataUrl);

        // Generate default filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        setFilenameInput(`camera_capture_${timestamp}`);
      }
    }
  };

  const uploadCapturedImage = async () => {
    if (!capturedImage) {
      setErrorMessage('Không có ảnh để upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');
    setErrorMessage('');

    try {
      setUploadProgress(10);

      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Create FormData
      const formData = new FormData();
      const filename = filenameInput || 'camera_capture.jpg';
      formData.append('file', blob, filename);
      formData.append('name', filename);
      formData.append('description', 'Captured from camera');

      setUploadProgress(30);

      const uploadResponse = await fetch('http://localhost:3001/api/v1/documents', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        }
      });

      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        setUploadProgress(100);
        setUploadStatus('success');

        // OCR processing will be handled automatically by the backend
        // The backend documents route already calls OCR service after upload

        setTimeout(() => {
          onOpenChange(false);
          onUploadSuccess?.();
          resetForm();
        }, 1500);
      } else {
        const errorData = await uploadResponse.json();
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

  const resetForm = () => {
    stopCamera();
    setCapturedImage(null);
    setFilenameInput('');
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
            <CameraIcon className="h-6 w-6 text-blue-600" />
            Chụp ảnh từ Camera
          </DialogTitle>
          <DialogDescription>
            Sử dụng camera để chụp và upload ảnh trực tiếp
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="p-6 space-y-4">
            {!capturedImage ? (
              <>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
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

                <div>
                  <Label htmlFor="filename-input">Tên file</Label>
                  <Input
                    id="filename-input"
                    placeholder="camera_capture.jpg"
                    value={filenameInput}
                    onChange={(e) => setFilenameInput(e.target.value)}
                    disabled={isUploading}
                    className="mt-2"
                  />
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

                <div className="flex gap-2">
                  <Button
                    onClick={uploadCapturedImage}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                        Đang upload...
                      </>
                    ) : (
                      <>
                        <CameraIcon className="h-4 w-4 mr-2" />
                        Upload Ảnh
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCapturedImage(null)}
                    disabled={isUploading}
                  >
                    Chụp Lại
                  </Button>
                </div>
              </>
            )}

            {errorMessage && uploadStatus !== 'error' && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircleIcon className="h-4 w-4" />
                <span>{errorMessage}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default CameraDialog;