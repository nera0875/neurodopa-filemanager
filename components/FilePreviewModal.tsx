"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Save, 
  X, 
  Eye, 
  Edit3, 
  Download, 
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { Editor } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string | null;
  fileName: string | null;
}

interface FileContent {
  type: 'text' | 'image';
  content: string;
  size: number;
  extension: string;
  mimeType?: string;
  encoding?: string;
}

export default function FilePreviewModal({ 
  isOpen, 
  onClose, 
  filePath, 
  fileName 
}: FilePreviewModalProps) {
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && filePath) {
      fetchFileContent();
    } else if (!isOpen) {
      resetState();
    }
  }, [isOpen, filePath]);

  const resetState = () => {
    setFileContent(null);
    setError(null);
    setIsEditing(false);
    setHasChanges(false);
    setEditedContent("");
  };

  const fetchFileContent = async () => {
    if (!filePath) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sftp/read-file?path=${encodeURIComponent(filePath)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load file');
      }
      
      const data = await response.json();
      setFileContent(data);
      setEditedContent(data.type === 'text' ? data.content : '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!filePath || !fileContent || fileContent.type !== 'text') return;
    
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/sftp/save-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          content: editedContent
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save file');
      }
      
      const result = await response.json();
      
      // Update file content with saved content
      setFileContent(prev => prev ? {
        ...prev,
        content: editedContent,
        size: result.size
      } : null);
      
      setHasChanges(false);
      setIsEditing(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (!filePath || !fileName) return;
    
    const link = document.createElement('a');
    link.href = `/api/sftp/download?path=${encodeURIComponent(filePath)}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditorChange = (value: string | undefined) => {
    const newContent = value || '';
    setEditedContent(newContent);
    setHasChanges(newContent !== (fileContent?.content || ''));
  };

  const getLanguageFromExtension = (extension: string): string => {
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'sh': 'shell',
      'bash': 'shell',
      'yml': 'yaml',
      'yaml': 'yaml',
      'xml': 'xml',
      'sql': 'sql',
      'md': 'markdown',
      'txt': 'plaintext',
      'dockerfile': 'dockerfile',
      'vue': 'html',
      'svelte': 'html'
    };
    
    return languageMap[extension] || 'plaintext';
  };

  const formatFileSize = (bytes: number): string => {
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      );
      if (!confirmClose) return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[90vh] bg-white flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {fileContent?.type === 'image' ? (
                <ImageIcon className="w-5 h-5 text-blue-500" />
              ) : (
                <FileText className="w-5 h-5 text-blue-500" />
              )}
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {fileName || 'File Preview'}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  {filePath}
                  {fileContent && (
                    <span className="ml-2">• {formatFileSize(fileContent.size)}</span>
                  )}
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {fileContent?.type === 'text' && (
                <>
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedContent(fileContent.content);
                          setHasChanges(false);
                        }}
                        variant="outline"
                        size="sm"
                        disabled={saving}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        size="sm"
                        disabled={!hasChanges || saving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-1" />
                        )}
                        Save
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </>
              )}
              
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
          
          {hasChanges && (
            <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-2 rounded">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">You have unsaved changes</span>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-500" />
                <p className="text-gray-600">Loading file...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-4" />
                <p className="font-medium mb-2">Failed to load file</p>
                <p className="text-sm">{error}</p>
                <Button
                  onClick={fetchFileContent}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  Try again
                </Button>
              </div>
            </div>
          ) : fileContent ? (
            fileContent.type === 'image' ? (
              <ScrollArea className="h-full">
                <div className="flex items-center justify-center p-8">
                  <img
                    src={fileContent.content}
                    alt={fileName || 'Preview'}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              </ScrollArea>
            ) : (
              <div className="h-full">
                {isEditing ? (
                  <Editor
                    height="100%"
                    language={getLanguageFromExtension(fileContent.extension)}
                    value={editedContent}
                    onChange={handleEditorChange}
                    onMount={(editor) => {
                      editorRef.current = editor;
                    }}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      insertSpaces: true,
                      wordWrap: 'on',
                      theme: 'vs-dark'
                    }}
                  />
                ) : (
                  <Editor
                    height="100%"
                    language={getLanguageFromExtension(fileContent.extension)}
                    value={fileContent.content}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: 'on',
                      theme: 'vs-dark'
                    }}
                  />
                )}
              </div>
            )
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}