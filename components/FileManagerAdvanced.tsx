"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  Folder, 
  File, 
  Download, 
  Upload, 
  Trash2, 
  Home,
  ChevronRight,
  Grid,
  List,
  Search,
  X,
  FolderPlus,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  Code,
  Edit2,
  Move,
  Save,
  Copy,
  Clipboard,
  Settings,
  HardDrive,
  Activity,
  RefreshCw,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileEdit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import dynamic from "next/dynamic";
import { useDropzone } from "react-dropzone";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface FileItem {
  name: string;
  type: "file" | "folder";
  size?: number;
  modified?: string;
  path: string;
}

interface SystemInfo {
  disk: {
    total: string;
    used: string;
    available: string;
    percentage: number;
  };
  system: {
    uptime: string;
    memory: {
      total: string;
      used: string;
      free: string;
    };
    cpu: string;
  };
  storage: {
    totalSize: string;
    filesCount: number;
    foldersCount: number;
  };
  timestamp: string;
}

export default function FileManagerAdvanced() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState("/");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Dialogs
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [editorDialogOpen, setEditorDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [monitoringOpen, setMonitoringOpen] = useState(false);
  
  // Form states
  const [newFolderName, setNewFolderName] = useState("");
  const [moveTargetPath, setMoveTargetPath] = useState("");
  const [currentFileContent, setCurrentFileContent] = useState("");
  const [currentFilePath, setCurrentFilePath] = useState("");
  const [currentFileName, setCurrentFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [renameItem, setRenameItem] = useState<FileItem | null>(null);
  
  // Clipboard
  const [clipboard, setClipboard] = useState<{items: string[], operation: "copy" | "cut"} | null>(null);
  
  // System monitoring
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loadingSystem, setLoadingSystem] = useState(false);

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+C / Cmd+C - Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedFiles.size > 0) {
        e.preventDefault();
        handleCopy();
      }
      // Ctrl+X / Cmd+X - Cut
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selectedFiles.size > 0) {
        e.preventDefault();
        handleCut();
      }
      // Ctrl+V / Cmd+V - Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
        e.preventDefault();
        handlePaste();
      }
      // F2 - Rename
      if (e.key === 'F2' && selectedFiles.size === 1) {
        e.preventDefault();
        handleRenameDialog();
      }
      // Del - Delete
      if (e.key === 'Delete' && selectedFiles.size > 0) {
        e.preventDefault();
        handleDelete();
      }
      // Ctrl+A / Cmd+A - Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const allPaths = new Set(files.map(f => f.path));
        setSelectedFiles(allPaths);
      }
      // F5 - Refresh
      if (e.key === 'F5') {
        e.preventDefault();
        fetchFiles(currentPath);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFiles, clipboard, currentPath, files]);

  const fetchFiles = async (path: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("Error fetching files:", error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemInfo = async () => {
    setLoadingSystem(true);
    try {
      const response = await fetch("/api/system");
      const data = await response.json();
      setSystemInfo(data);
    } catch (error) {
      console.error("Error fetching system info:", error);
    } finally {
      setLoadingSystem(false);
    }
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === "folder") return <Folder className="w-5 h-5 text-blue-500" />;
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <ImageIcon className="w-5 h-5 text-green-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'webm':
        return <Film className="w-5 h-5 text-purple-500" />;
      case 'mp3':
      case 'wav':
      case 'ogg':
        return <Music className="w-5 h-5 text-pink-500" />;
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
        return <Archive className="w-5 h-5 text-yellow-500" />;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'html':
      case 'css':
      case 'json':
        return <Code className="w-5 h-5 text-orange-500" />;
      case 'txt':
      case 'md':
      case 'pdf':
      case 'doc':
      case 'docx':
        return <FileText className="w-5 h-5 text-gray-600" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const isTextFile = (fileName: string): boolean => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const textExtensions = ['txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'css', 'html', 'json', 'xml', 'yml', 'yaml', 'env', 'config', 'py', 'java', 'c', 'cpp', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'sh', 'bash'];
    return textExtensions.includes(ext || '');
  };

  const handleFileClick = (file: FileItem, event?: React.MouseEvent) => {
    if (event && (event.ctrlKey || event.metaKey)) {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.path)) {
        newSelected.delete(file.path);
      } else {
        newSelected.add(file.path);
      }
      setSelectedFiles(newSelected);
    } else if (file.type === "folder") {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.path)) {
        newSelected.delete(file.path);
      } else {
        newSelected.clear();
        newSelected.add(file.path);
      }
      setSelectedFiles(newSelected);
    } else {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.path)) {
        newSelected.delete(file.path);
      } else {
        newSelected.clear();
        newSelected.add(file.path);
      }
      setSelectedFiles(newSelected);
    }
  };

  const handleFileDoubleClick = async (file: FileItem) => {
    if (file.type === "folder") {
      setCurrentPath(file.path);
      setSelectedFiles(new Set());
    } else if (file.type === "file" && isTextFile(file.name)) {
      await openFileEditor(file);
    }
  };

  const openFileEditor = async (file: FileItem) => {
    try {
      const response = await fetch(`/api/read?path=${encodeURIComponent(file.path)}`);
      const data = await response.json();
      setCurrentFileContent(data.content);
      setCurrentFilePath(file.path);
      setCurrentFileName(file.name);
      setEditorDialogOpen(true);
    } catch (error) {
      console.error("Error reading file:", error);
      alert("Erreur lors de la lecture du fichier");
    }
  };

  const saveFile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          path: currentFilePath,
          content: currentFileContent
        }),
      });
      
      if (response.ok) {
        setEditorDialogOpen(false);
      } else {
        alert("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    setClipboard({
      items: Array.from(selectedFiles),
      operation: "copy"
    });
  };

  const handleCut = () => {
    setClipboard({
      items: Array.from(selectedFiles),
      operation: "cut"
    });
  };

  const handlePaste = async () => {
    if (!clipboard) return;
    
    try {
      for (const sourcePath of clipboard.items) {
        const fileName = sourcePath.split('/').pop();
        const destPath = currentPath === "/" ? `/${fileName}` : `${currentPath}/${fileName}`;
        
        if (clipboard.operation === "cut") {
          await fetch("/api/move", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              sources: [sourcePath],
              destination: currentPath
            }),
          });
        } else {
          // Pour copy, on devrait avoir une API de copie
          // Pour l'instant on peut juste lire et réécrire
        }
      }
      
      if (clipboard.operation === "cut") {
        setClipboard(null);
      }
      
      fetchFiles(currentPath);
      setSelectedFiles(new Set());
    } catch (error) {
      console.error("Paste error:", error);
    }
  };

  const handleRenameDialog = () => {
    if (selectedFiles.size !== 1) return;
    
    const filePath = Array.from(selectedFiles)[0];
    const file = files.find(f => f.path === filePath);
    if (file) {
      setRenameItem(file);
      setNewName(file.name);
      setRenameDialogOpen(true);
    }
  };

  const handleRename = async () => {
    if (!renameItem || !newName.trim()) return;
    
    try {
      const response = await fetch("/api/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          oldPath: renameItem.path,
          newName: newName
        }),
      });
      
      if (response.ok) {
        setRenameDialogOpen(false);
        setRenameItem(null);
        setNewName("");
        fetchFiles(currentPath);
        setSelectedFiles(new Set());
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors du renommage");
      }
    } catch (error) {
      console.error("Rename error:", error);
      alert("Erreur lors du renommage");
    }
  };

  // Drag & Drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append("files", file);
    });
    formData.append("path", currentPath);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        fetchFiles(currentPath);
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  }, [currentPath]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    noClick: true,
    noKeyboard: true
  });

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    formData.append("path", currentPath);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        fetchFiles(currentPath);
        setUploadDialogOpen(false);
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleDelete = async () => {
    if (selectedFiles.size === 0) return;
    
    if (!confirm(`Voulez-vous vraiment supprimer ${selectedFiles.size} élément(s) ?`)) {
      return;
    }

    try {
      const response = await fetch("/api/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: Array.from(selectedFiles) }),
      });

      if (response.ok) {
        setSelectedFiles(new Set());
        fetchFiles(currentPath);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleMove = async () => {
    if (selectedFiles.size === 0 || !moveTargetPath) return;

    try {
      const response = await fetch("/api/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sources: Array.from(selectedFiles),
          destination: moveTargetPath
        }),
      });

      if (response.ok) {
        setSelectedFiles(new Set());
        setMoveDialogOpen(false);
        setMoveTargetPath("");
        fetchFiles(currentPath);
      }
    } catch (error) {
      console.error("Move error:", error);
    }
  };

  const handleDownload = async () => {
    if (selectedFiles.size === 0) return;

    for (const filePath of selectedFiles) {
      const file = files.find(f => f.path === filePath);
      if (file && file.type === "file") {
        const link = document.createElement("a");
        link.href = `/api/download?path=${encodeURIComponent(filePath)}`;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch("/api/create-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          path: currentPath,
          name: newFolderName 
        }),
      });

      if (response.ok) {
        setNewFolderName("");
        setNewFolderDialogOpen(false);
        fetchFiles(currentPath);
      }
    } catch (error) {
      console.error("Create folder error:", error);
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  return (
    <div className="min-h-screen bg-gray-50" {...getRootProps()}>
      <input {...getInputProps()} />
      
      {isDragActive && (
        <div className="fixed inset-0 bg-blue-500 bg-opacity-20 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <Upload className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <p className="text-lg font-medium">Déposez vos fichiers ici</p>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPath("/")}
              className="hover:bg-gray-100 text-gray-700"
            >
              <Home className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center text-sm">
              <span className="text-gray-400">/</span>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
                  <button
                    className="hover:text-blue-600 text-gray-700 transition-colors"
                    onClick={() => {
                      const newPath = "/" + breadcrumbs.slice(0, index + 1).join("/");
                      setCurrentPath(newPath);
                    }}
                  >
                    {crumb}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchFiles(currentPath)}
              className="hover:bg-gray-100 text-gray-700"
              title="Rafraîchir (F5)"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setMonitoringOpen(true);
                fetchSystemInfo();
              }}
              className="hover:bg-gray-100 text-gray-700"
              title="Monitoring"
            >
              <Activity className="w-4 h-4" />
            </Button>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-400 w-64 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            <div className="flex items-center border-l border-gray-200 pl-2 space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={`${viewMode === "grid" ? "bg-gray-100" : ""} hover:bg-gray-100 text-gray-700`}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("list")}
                className={`${viewMode === "list" ? "bg-gray-100" : ""} hover:bg-gray-100 text-gray-700`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setNewFolderDialogOpen(true)}
              variant="outline"
              size="sm"
              className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Nouveau
            </Button>
            
            <Button
              onClick={() => setUploadDialogOpen(true)}
              variant="outline"
              size="sm"
              className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>

            {selectedFiles.size > 0 && (
              <>
                {selectedFiles.size === 1 && (
                  <Button
                    onClick={handleRenameDialog}
                    variant="outline"
                    size="sm"
                    className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
                    title="F2"
                  >
                    <FileEdit className="w-4 h-4 mr-2" />
                    Renommer
                  </Button>
                )}
                {selectedFiles.size === 1 && files.find(f => f.path === Array.from(selectedFiles)[0])?.type === "file" && isTextFile(files.find(f => f.path === Array.from(selectedFiles)[0])?.name || "") && (
                  <Button
                    onClick={() => {
                      const file = files.find(f => f.path === Array.from(selectedFiles)[0]);
                      if (file) openFileEditor(file);
                    }}
                    variant="outline"
                    size="sm"
                    className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Éditer
                  </Button>
                )}
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
                  title="Ctrl+C"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copier
                </Button>
                <Button
                  onClick={handleCut}
                  variant="outline"
                  size="sm"
                  className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
                  title="Ctrl+X"
                >
                  <Move className="w-4 h-4 mr-2" />
                  Couper
                </Button>
                <Button
                  onClick={() => setMoveDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
                >
                  <Move className="w-4 h-4 mr-2" />
                  Déplacer
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  size="sm"
                  className="bg-white border-red-50 hover:bg-red-100 text-red-600 border-red-300"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </>
            )}
          </div>

          {clipboard && (
            <div className="flex items-center space-x-2">
              <Button
                onClick={handlePaste}
                variant="outline"
                size="sm"
                className="bg-blue-50 border-blue-300 hover:bg-blue-100 text-blue-700"
                title="Ctrl+V"
              >
                <Clipboard className="w-4 h-4 mr-2" />
                Coller ({clipboard.items.length} élément{clipboard.items.length > 1 ? 's' : ''})
              </Button>
              <Button
                onClick={() => setClipboard(null)}
                variant="ghost"
                size="sm"
                className="text-gray-500"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Raccourcis clavier */}
        <div className="px-4 pb-2 text-xs text-gray-500 flex items-center space-x-4">
          <span>Raccourcis:</span>
          <span>F2: Renommer</span>
          <span>Ctrl+C: Copier</span>
          <span>Ctrl+X: Couper</span>
          <span>Ctrl+V: Coller</span>
          <span>Ctrl+A: Tout sélectionner</span>
          <span>Del: Supprimer</span>
          <span>F5: Rafraîchir</span>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Chargement...</div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Folder className="w-12 h-12 mb-4 opacity-50" />
            <p>Aucun fichier trouvé</p>
            <p className="text-sm mt-2">Glissez-déposez des fichiers pour les uploader</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 p-4">
            {filteredFiles.map((file) => (
              <div
                key={file.path}
                onClick={(e) => handleFileClick(file, e)}
                onDoubleClick={() => handleFileDoubleClick(file)}
                className={`
                  group cursor-pointer rounded-lg p-4 transition-all bg-white border
                  ${selectedFiles.has(file.path) 
                    ? "border-blue-500 shadow-md ring-2 ring-blue-200" 
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }
                `}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="transition-transform group-hover:scale-110">
                    {getFileIcon(file)}
                  </div>
                  <span className="text-xs text-center text-gray-700 break-all line-clamp-2">
                    {file.name}
                  </span>
                  {file.type === "file" && isTextFile(file.name) && (
                    <span className="text-[10px] text-gray-400">Double-clic pour éditer</span>
                  )}
                  {file.type === "folder" && (
                    <span className="text-[10px] text-gray-400">Double-clic pour ouvrir</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white">
            {filteredFiles.map((file) => (
              <div
                key={file.path}
                onClick={(e) => handleFileClick(file, e)}
                onDoubleClick={() => handleFileDoubleClick(file)}
                className={`
                  flex items-center justify-between px-4 py-3 border-b border-gray-100 cursor-pointer transition-all
                  ${selectedFiles.has(file.path) 
                    ? "bg-blue-50" 
                    : "hover:bg-gray-50"
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <div>{getFileIcon(file)}</div>
                  <span className="text-sm text-gray-900">
                    {file.name}
                  </span>
                  {file.type === "file" && isTextFile(file.name) && (
                    <span className="text-xs text-gray-400">(éditable)</span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {file.size && (
                    <span>{formatFileSize(file.size)}</span>
                  )}
                  {file.modified && (
                    <span>{new Date(file.modified).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Dialog Upload */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Upload de fichiers</DialogTitle>
            <DialogDescription className="text-gray-500">
              Sélectionnez les fichiers à uploader ou glissez-les dans la fenêtre
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              type="file"
              multiple
              onChange={handleUpload}
              className="bg-gray-50 border-gray-300 text-gray-900"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Nouveau Dossier */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Nouveau dossier</DialogTitle>
            <DialogDescription className="text-gray-500">
              Entrez le nom du nouveau dossier
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-gray-700">
                Nom
              </Label>
              <Input
                id="name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="col-span-3 bg-gray-50 border-gray-300"
                placeholder="Nouveau dossier"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateFolder}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Renommer */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Renommer</DialogTitle>
            <DialogDescription className="text-gray-500">
              Entrez le nouveau nom pour {renameItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newname" className="text-right text-gray-700">
                Nouveau nom
              </Label>
              <Input
                id="newname"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3 bg-gray-50 border-gray-300"
                placeholder="Nouveau nom"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleRename}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Renommer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Déplacer */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Déplacer les fichiers</DialogTitle>
            <DialogDescription className="text-gray-500">
              Entrez le chemin de destination (ex: /documents ou /images)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="path" className="text-right text-gray-700">
                Chemin
              </Label>
              <Input
                id="path"
                value={moveTargetPath}
                onChange={(e) => setMoveTargetPath(e.target.value)}
                className="col-span-3 bg-gray-50 border-gray-300"
                placeholder="/dossier/destination"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleMove}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Déplacer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Monitoring */}
      <Dialog open={monitoringOpen} onOpenChange={setMonitoringOpen}>
        <DialogContent className="bg-white max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Monitoring Système
              </span>
              <Button
                onClick={fetchSystemInfo}
                size="sm"
                variant="outline"
                disabled={loadingSystem}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingSystem ? 'animate-spin' : ''}`} />
                Rafraîchir
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {systemInfo ? (
            <div className="space-y-4">
              {/* Disque */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <HardDrive className="w-4 h-4 mr-2" />
                  Espace Disque
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-medium">{systemInfo.disk.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Utilisé</p>
                    <p className="font-medium">{systemInfo.disk.used}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Disponible</p>
                    <p className="font-medium">{systemInfo.disk.available}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Utilisation</p>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${systemInfo.disk.percentage > 80 ? 'bg-red-500' : systemInfo.disk.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{width: `${systemInfo.disk.percentage}%`}}
                        />
                      </div>
                      <span className="font-medium">{systemInfo.disk.percentage}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Système */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Système
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Uptime</p>
                    <p className="font-mono text-sm">{systemInfo.system.uptime}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">RAM Total</p>
                      <p className="font-medium">{systemInfo.system.memory.total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">RAM Utilisée</p>
                      <p className="font-medium">{systemInfo.system.memory.used}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">RAM Libre</p>
                      <p className="font-medium">{systemInfo.system.memory.free}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stockage des fichiers */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <Folder className="w-4 h-4 mr-2" />
                  Stockage Files Manager
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Taille totale</p>
                    <p className="font-medium">{systemInfo.storage.totalSize}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fichiers</p>
                    <p className="font-medium">{systemInfo.storage.filesCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dossiers</p>
                    <p className="font-medium">{systemInfo.storage.foldersCount}</p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 text-right">
                Dernière mise à jour: {new Date(systemInfo.timestamp).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">
                {loadingSystem ? "Chargement..." : "Cliquez sur Rafraîchir pour charger les données"}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Éditeur */}
      <Dialog open={editorDialogOpen} onOpenChange={setEditorDialogOpen}>
        <DialogContent className="bg-white max-w-6xl h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Éditeur - {currentFileName}</span>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={saveFile}
                  size="sm"
                  disabled={isSaving}
                  className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-[calc(100%-80px)] border border-gray-200 rounded">
            <MonacoEditor
              height="100%"
              language={getLanguageFromFileName(currentFileName)}
              value={currentFileContent}
              onChange={(value) => setCurrentFileContent(value || "")}
              theme="vs-light"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                automaticLayout: true,
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}