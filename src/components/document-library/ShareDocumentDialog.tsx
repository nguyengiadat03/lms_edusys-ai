"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShareIcon, UserIcon, UsersIcon, BuildingIcon, ClockIcon, CheckIcon, EyeIcon, DownloadIcon, EditIcon, TrashIcon, ShieldIcon } from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
}

interface ShareData {
  subject_type: 'user' | 'role' | 'org_unit';
  subject_id: string;
  permission: 'view' | 'download' | 'edit' | 'delete' | 'share';
  expires_at?: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
}

interface ShareDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document;
  onShare: (shareData: ShareData) => Promise<void>;
}

const ShareDocumentDialog: React.FC<ShareDocumentDialogProps> = ({
  open,
  onOpenChange,
  document,
  onShare
}) => {
  const [subjectType, setSubjectType] = useState<'user' | 'role' | 'org_unit'>('user');
  const [subjectId, setSubjectId] = useState('');
  const [permission, setPermission] = useState<'view' | 'download' | 'edit' | 'delete' | 'share'>('view');
  const [expiresAt, setExpiresAt] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load users when dialog opens and subject type is user
  React.useEffect(() => {
    if (open && subjectType === 'user') {
      loadUsers();
    }
  }, [open, subjectType]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch('http://localhost:3001/api/v1/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setUsers(result.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShare = async () => {
    if (!subjectId.trim()) {
      alert('Vui lòng chọn người nhận');
      return;
    }

    const shareData = {
      subject_type: subjectType,
      subject_id: subjectId,
      permission,
      expires_at: expiresAt || undefined
    };

    console.log('Sending share data:', shareData);

    setIsSharing(true);
    try {
      await onShare(shareData);

      setShareSuccess(true);
      setTimeout(() => {
        setShareSuccess(false);
        onOpenChange(false);
        // Reset form
        setSubjectId('');
        setPermission('view');
        setExpiresAt('');
        setSearchTerm('');
      }, 2000);
    } catch (error) {
      console.error('Share failed:', error);
      alert('Có lỗi xảy ra khi chia sẻ tài liệu');
    } finally {
      setIsSharing(false);
    }
  };

  const getSubjectTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return <UserIcon className="h-4 w-4" />;
      case 'role': return <UsersIcon className="h-4 w-4" />;
      case 'org_unit': return <BuildingIcon className="h-4 w-4" />;
      default: return <UserIcon className="h-4 w-4" />;
    }
  };

  const getSubjectTypeLabel = (type: string) => {
    switch (type) {
      case 'user': return 'Người dùng';
      case 'role': return 'Vai trò';
      case 'org_unit': return 'Đơn vị tổ chức';
      default: return 'Người dùng';
    }
  };

  const getPermissionLabel = (perm: string) => {
    switch (perm) {
      case 'view': return 'Xem';
      case 'download': return 'Tải xuống';
      case 'edit': return 'Chỉnh sửa';
      case 'delete': return 'Xóa';
      case 'share': return 'Chia sẻ';
      default: return 'Xem';
    }
  };

  const getPermissionIcon = (perm: string) => {
    switch (perm) {
      case 'view': return <EyeIcon className="h-4 w-4" />;
      case 'download': return <DownloadIcon className="h-4 w-4" />;
      case 'edit': return <EditIcon className="h-4 w-4" />;
      case 'delete': return <TrashIcon className="h-4 w-4" />;
      case 'share': return <ShareIcon className="h-4 w-4" />;
      default: return <EyeIcon className="h-4 w-4" />;
    }
  };

  const getPermissionColor = (perm: string) => {
    switch (perm) {
      case 'view': return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100';
      case 'download': return 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100';
      case 'edit': return 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100';
      case 'delete': return 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100';
      case 'share': return 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100';
      default: return 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100';
    }
  };

  const getPermissionDescription = (perm: string) => {
    switch (perm) {
      case 'view': return 'Chỉ xem nội dung tài liệu';
      case 'download': return 'Xem và tải xuống tài liệu';
      case 'edit': return 'Chỉnh sửa metadata và chia sẻ';
      case 'delete': return 'Xóa tài liệu và quản lý chia sẻ';
      case 'share': return 'Quyền quản trị viên đầy đủ';
      default: return 'Chỉ xem nội dung tài liệu';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShareIcon className="h-5 w-5" />
            Chia sẻ tài liệu
          </DialogTitle>
          <DialogDescription>
            Chia sẻ tài liệu "{document?.name}" với người dùng khác
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Thông tin tài liệu</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                <div className="font-medium">{document?.name}</div>
                <Badge variant="outline">{document?.type}</Badge>
                <Badge variant="outline">{document?.size}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Share Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject Type */}
            <div className="space-y-2">
              <Label>Loại đối tượng chia sẻ</Label>
              <Select value={subjectType} onValueChange={(value: 'user' | 'role' | 'org_unit') => setSubjectType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Người dùng
                    </div>
                  </SelectItem>
                  <SelectItem value="role">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="h-4 w-4" />
                      Vai trò
                    </div>
                  </SelectItem>
                  <SelectItem value="org_unit">
                    <div className="flex items-center gap-2">
                      <BuildingIcon className="h-4 w-4" />
                      Đơn vị tổ chức
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject Selection */}
            {subjectType === 'user' ? (
              <div className="space-y-2">
                <Label>Chọn người dùng</Label>
                <Input
                  placeholder="Tìm kiếm theo email hoặc tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-2"
                />
                <div className="border rounded-md max-h-32 overflow-y-auto">
                  {isLoadingUsers ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">Đang tải...</div>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`p-2 cursor-pointer hover:bg-gray-100 border-b last:border-b-0 ${
                          subjectId === user.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => setSubjectId(user.id)}
                      >
                        <div className="font-medium text-sm">{user.full_name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      {searchTerm ? 'Không tìm thấy người dùng' : 'Không có người dùng nào'}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>ID {getSubjectTypeLabel(subjectType).toLowerCase()}</Label>
                <Input
                  placeholder={`Nhập ID ${getSubjectTypeLabel(subjectType).toLowerCase()}`}
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                />
              </div>
            )}

            {/* Permission */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ShieldIcon className="h-4 w-4" />
                Quyền truy cập
              </Label>
              <Select value={permission} onValueChange={(value: 'view' | 'download' | 'edit' | 'delete' | 'share') => setPermission(value)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectItem value="view" className="p-3">
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                        <EyeIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Xem</div>
                        <p className="text-xs text-gray-600 mt-1">Chỉ xem nội dung tài liệu</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="download" className="p-3">
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                        <DownloadIcon className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Tải xuống</div>
                        <p className="text-xs text-gray-600 mt-1">Xem và tải xuống tài liệu</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="edit" className="p-3">
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100">
                        <EditIcon className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Chỉnh sửa</div>
                        <p className="text-xs text-gray-600 mt-1">Chỉnh sửa metadata và chia sẻ</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="delete" className="p-3">
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                        <TrashIcon className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Xóa</div>
                        <p className="text-xs text-gray-600 mt-1">Xóa tài liệu và quản lý chia sẻ</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="share" className="p-3">
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100">
                        <ShareIcon className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Chia sẻ</div>
                        <p className="text-xs text-gray-600 mt-1">Quyền quản trị viên đầy đủ</p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                Hết hạn (tùy chọn)
              </Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                placeholder="Chọn thời gian hết hạn"
              />
            </div>
          </div>

          {/* Share Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                {getSubjectTypeIcon(subjectType)}
                <span className="font-semibold text-gray-800">Tóm tắt chia sẻ:</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-gray-700 min-w-[80px]">Đối tượng:</div>
                  <div className="text-sm text-gray-600">
                    {getSubjectTypeLabel(subjectType)} {
                      subjectType === 'user' && subjectId ?
                        (() => {
                          const selectedUser = users.find(u => u.id === subjectId);
                          return selectedUser ? `(${selectedUser.email})` : `(ID: ${subjectId})`;
                        })() :
                        subjectId ? `(ID: ${subjectId})` : '(chưa chọn)'
                    }
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-gray-700 min-w-[80px]">Quyền:</div>
                  <div className="flex items-center gap-2">
                    {getPermissionIcon(permission)}
                    <Badge className={`${getPermissionColor(permission)} border font-medium`}>
                      {getPermissionLabel(permission)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-gray-700 min-w-[80px]">Mô tả:</div>
                  <div className="text-sm text-gray-600">{getPermissionDescription(permission)}</div>
                </div>
                {expiresAt && (
                  <div className="flex items-center gap-3">
                    <ClockIcon className="h-4 w-4 text-gray-500" />
                    <div className="text-sm text-gray-600">
                      Hết hạn: {new Date(expiresAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Success Message */}
          {shareSuccess && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                    <CheckIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-green-800">Chia sẻ thành công!</div>
                    <p className="text-sm text-green-700 mt-1">
                      Tài liệu đã được chia sẻ với {getSubjectTypeLabel(subjectType).toLowerCase()}.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              onClick={handleShare}
              disabled={isSharing || !subjectId.trim()}
              className="flex-1"
            >
              {isSharing ? 'Đang chia sẻ...' : 'Chia sẻ'}
            </Button>
          </div>
        </div>

        {/* User Selection Helper */}
        {subjectType === 'user' && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 mt-0.5">
                <span className="text-blue-600 text-sm">💡</span>
              </div>
              <div className="text-blue-800">
                <div className="font-medium text-sm mb-1">Mẹo hữu ích</div>
                <div className="text-sm">
                  Bạn có thể tìm kiếm người dùng bằng email hoặc tên đầy đủ. Chọn người dùng từ danh sách để chia sẻ tài liệu một cách nhanh chóng.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alternative Input for Roles/Org Units */}
        {(subjectType === 'role' || subjectType === 'org_unit') && (
          <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 mt-0.5">
                <span className="text-yellow-600 text-sm">⚠️</span>
              </div>
              <div className="text-yellow-800">
                <div className="font-medium text-sm mb-1">Lưu ý quan trọng</div>
                <div className="text-sm">
                  Để chia sẻ với {subjectType === 'role' ? 'vai trò' : 'đơn vị tổ chức'}, bạn cần nhập ID số chính xác. Liên hệ quản trị viên để biết ID chính xác.
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareDocumentDialog;