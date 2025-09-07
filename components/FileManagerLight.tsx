"use client";

import React, { useState, useEffect } from "react";
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
  Eye,
  Move
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

interface FileItem {
  name: string;
  type: "file" | "folder";
  size?: number;
  modified?: string;
  path: string;
}

export default function FileManagerLight() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState("/");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath]);

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

  const handleFileClick = (file: FileItem) => {
    if (file.type === "folder") {
      setCurrentPath(file.path);
      setSelectedFiles(new Set());
    } else {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.path)) {
        newSelected.delete(file.path);
      } else {
        newSelected.add(file.path);
      }
      setSelectedFiles(newSelected);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
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

        <div className="flex items-center space-x-2 px-4 pb-4">
          <Button
            onClick={() => setNewFolderDialogOpen(true)}
            variant="outline"
            size="sm"
            className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            Nouveau dossier
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
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer ({selectedFiles.size})
              </Button>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-140px)]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Chargement...</div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Folder className="w-12 h-12 mb-4 opacity-50" />
            <p>Aucun fichier trouvé</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 p-4">
            {filteredFiles.map((file) => (
              <div
                key={file.path}
                onClick={() => handleFileClick(file)}
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
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white">
            {filteredFiles.map((file) => (
              <div
                key={file.path}
                onClick={() => handleFileClick(file)}
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

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Upload de fichiers</DialogTitle>
            <DialogDescription className="text-gray-500">
              Sélectionnez les fichiers à uploader
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