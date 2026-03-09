import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TagIcon, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string | number;
  name: string;
  level?: string;
  skill?: string;
  topic?: string;
  tags?: (string | { name?: string; tag_label?: string })[];
  type?: string;
  size?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  ocrProcessed?: boolean;
  downloads?: number;
  views?: number;
  summary?: string;
  segments?: string[];
  suggestedLevel?: string;
  suggestedTopic?: string;
  ai_analysis?: unknown;
  ocr_text?: string;
  ai_tasks?: unknown[];
}

interface EditTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
  onSave: (updatedDocument: Document) => void;
}

export const EditTagsDialog: React.FC<EditTagsDialogProps> = ({
  open,
  onOpenChange,
  document,
  onSave
}) => {
  const { toast } = useToast();
  // Form state
  const [level, setLevel] = useState("");
  const [topic, setTopic] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load document data when dialog opens
  useEffect(() => {
    if (document && open) {
      // Get level from AI tasks level_suggestion
      let levelValue = "";
      if (document.ai_tasks) {
        const levelTask = document.ai_tasks.find((task: Record<string, unknown>) =>
          task.task_type === 'level_suggestion'
        );
        if (levelTask && typeof levelTask === 'object' && 'output_json' in levelTask) {
          const outputJson = levelTask.output_json;
          if (outputJson && typeof outputJson === 'object' && 'result' in outputJson) {
            levelValue = String(outputJson.result);
          }
        }
      }
      setLevel(levelValue);

      // Get tags from AI tasks tag_suggestion
      let tagValue: string[] = [];
      if (document.ai_tasks) {
        const tagTask = document.ai_tasks.find((task: Record<string, unknown>) =>
          task.task_type === 'tag_suggestion'
        );
        if (tagTask && typeof tagTask === 'object' && 'output_json' in tagTask) {
          const outputJson = tagTask.output_json;
          if (outputJson && typeof outputJson === 'object' && 'suggested_tags' in outputJson) {
            const suggestedTags = outputJson.suggested_tags;
            if (Array.isArray(suggestedTags)) {
              tagValue = suggestedTags.map((tag: unknown) =>
                typeof tag === 'string' ? tag : (tag as Record<string, unknown>)?.tag_label as string || ''
              ).filter(name => name.trim() !== '');
            }
          }
        }
      }
      setTags(tagValue);

      // Get topic from AI tasks topic_suggestion
      let topicValue = "";
      if (document.ai_tasks) {
        const topicTask = document.ai_tasks.find((task: Record<string, unknown>) =>
          task.task_type === 'topic_suggestion'
        );
        if (topicTask && typeof topicTask === 'object' && 'output_json' in topicTask) {
          const outputJson = topicTask.output_json;
          if (outputJson && typeof outputJson === 'object' && 'result' in outputJson) {
            topicValue = String(outputJson.result);
          }
        }
      }
      setTopic(topicValue);
      setNewTag("");
    }
  }, [document, open]);

  // Add new tag (no auto update)
  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag("");
    }
  };

  // Remove tag (no auto update)
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle Enter key for adding tags
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };


  // Handle level change (no auto update)
  const handleLevelChange = (newLevel: string) => {
    setLevel(newLevel);
  };

  // Handle topic change (no auto update)
  const handleTopicChange = (newTopic: string) => {
    setTopic(newTopic);
  };

  // Save changes
  const handleSave = async () => {
    if (!document?.id) return;

    setIsSaving(true);

    try {
      const response = await fetch(`http://localhost:3001/api/v1/documents/${document.id}/tags`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        },
        body: JSON.stringify({
          tags,
          level,
          topic
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update tags');
      }

      const result = await response.json();

      // Use the complete updated document data from backend response
      const updatedDocument = {
        ...document,
        ...result.data,
        level: result.data.level,
        topic: result.data.topic,
        tags: result.data.tags,
        summary: result.data.summary,
        segments: result.data.segments
      };

      onSave(updatedDocument);
      onOpenChange(false);

      toast({
        title: "Cập nhật thành công",
        description: "Metadata của tài liệu đã được cập nhật.",
      });

    } catch (error) {
      console.error('Tag update failed:', error);
      toast({
        title: "Cập nhật thất bại",
        description: "Không thể cập nhật nhãn. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            Chỉnh sửa nhãn
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* CEFR Level */}
          <div className="space-y-2">
            <Label htmlFor="level">CEFR Level</Label>
            <Select value={level} onValueChange={handleLevelChange} disabled={isSaving}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A1">A1 - Beginner</SelectItem>
                <SelectItem value="A2">A2 - Elementary</SelectItem>
                <SelectItem value="B1">B1 - Intermediate</SelectItem>
                <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                <SelectItem value="C1">C1 - Advanced</SelectItem>
                <SelectItem value="C2">C2 - Proficiency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">Chủ đề</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => handleTopicChange(e.target.value)}
              placeholder="Nhập chủ đề"
              disabled={isSaving}
            />
          </div>

          {/* Tags Management */}
          <div className="space-y-2">
            <Label>Tags</Label>

            {/* Add new tag input */}
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Thêm tag mới"
                className="flex-1"
                disabled={isSaving}
              />
              <Button onClick={addTag} size="sm" variant="outline" disabled={isSaving}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Display current tags */}
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto border rounded p-2 min-h-[2.5rem]">
              {tags.length === 0 ? (
                <span className="text-sm text-muted-foreground">Chưa có tag nào</span>
              ) : (
                tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? "Đang lưu..." : "Cập nhật"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Hủy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTagsDialog;