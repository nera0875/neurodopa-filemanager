"use client";

import React, { useState, useEffect } from "react";
import { 
  Server, 
  LogIn, 
  LogOut,
  Folder,
  File,
  Download,
  Upload,
  Trash2,
  Home,
  ChevronRight,
  Terminal,
  HardDrive,
  Lock,
  Unlock,
  RefreshCw,
  X
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

interface SFTPFile {
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: string;
  path: string;
  permissions?: {
    user?: string;
    group?: string;
    other?: string;
  };
  owner?: number;
  group?: number;
}

interface SFTPConnection {
  connected: boolean;
  host?: string;
  username?: string;
}

interface SFTPManagerProps {
  onClose?: () => void;
}

export default function SFTPManager({ onClose }: SFTPManagerProps) {
  const [connection, setConnection] = useState<SFTPConnection>({ connected: false });
  const [files, setFiles] = useState<SFTPFile[]>([]);
  const [currentPath, setCurrentPath] = useState("/");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Connection dialog
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [connectionForm, setConnectionForm] = useState({
    host: "",
    port: "22",
    username: "",
    password: ""
  });

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (connection.connected) {
      fetchFiles(currentPath);
    }
  }, [currentPath, connection.connected]);

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/sftp/connect");
      const data = await response.json();
      setConnection(data);
      
      if (!data.connected) {
        setConnectDialogOpen(true);
      }
    } catch (error) {
      console.error("Failed to check connection:", error);
      setConnectDialogOpen(true);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/sftp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: connectionForm.host,
          port: parseInt(connectionForm.port),
          username: connectionForm.username,
          password: connectionForm.password
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setConnection({
          connected: true,
          host: connectionForm.host,
          username: connectionForm.username
        });
        setConnectDialogOpen(false);
        setConnectionForm({ host: "", port: "22", username: "", password: "" });
      } else {
        setError(data.error || "Connexion échouée");
      }
    } catch (error) {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch("/api/sftp/connect", { method: "DELETE" });
      setConnection({ connected: false });
      setFiles([]);
      setCurrentPath("/");
      setConnectDialogOpen(true);
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  const fetchFiles = async (path: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sftp/files?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      
      if (response.ok) {
        setFiles(data.files || []);
      } else {
        setError(data.error);
        if (response.status === 401) {
          setConnection({ connected: false });
          setConnectDialogOpen(true);
        }
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file: SFTPFile) => {
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

  const handleDownload = async () => {
    if (selectedFiles.size === 0) return;

    for (const filePath of selectedFiles) {
      const link = document.createElement("a");
      link.href = `/api/sftp/download?path=${encodeURIComponent(filePath)}`;
      link.download = filePath.split('/').pop() || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
      const response = await fetch("/api/sftp/upload", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        fetchFiles(currentPath);
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const getFileIcon = (file: SFTPFile) => {
    if (file.type === "folder") {
      return <Folder className="w-5 h-5 text-blue-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "-";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Server className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-lg font-semibold">SFTP Manager</h1>
              {connection.connected && (
                <p className="text-sm text-gray-400">
                  {connection.username}@{connection.host}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {connection.connected ? (
              <>
                <Button
                  onClick={() => fetchFiles(currentPath)}
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleDisconnect}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setConnectDialogOpen(true)}
                variant="ghost"
                size="sm"
                className="text-green-400 hover:text-green-300 hover:bg-gray-700"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Connexion
              </Button>
            )}
            {onClose && (
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {connection.connected && (
          <>
            {/* Path navigation */}
            <div className="px-4 pb-2">
              <div className="flex items-center space-x-2 text-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPath("/")}
                  className="hover:bg-gray-700 h-6 w-6"
                >
                  <Home className="w-3 h-3" />
                </Button>
                <span className="text-gray-500">/</span>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    <button
                      className="hover:text-blue-400 transition-colors"
                      onClick={() => {
                        const newPath = "/" + breadcrumbs.slice(0, index + 1).join("/");
                        setCurrentPath(newPath);
                      }}
                    >
                      {crumb}
                    </button>
                    {index < breadcrumbs.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-gray-600" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Actions bar */}
            <div className="flex items-center space-x-2 px-4 pb-3">
              <div>
                <label htmlFor="sftp-upload" className="cursor-pointer">
                  <span className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-gray-700 border border-gray-600 hover:bg-gray-600 text-white transition-colors">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </span>
                </label>
                <input
                  id="sftp-upload"
                  type="file"
                  multiple
                  onChange={handleUpload}
                  className="hidden"
                />
              </div>

              {selectedFiles.size > 0 && (
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger ({selectedFiles.size})
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {/* File list */}
      {connection.connected ? (
        <ScrollArea className="h-[calc(100vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">Chargement...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-red-400">{error}</div>
            </div>
          ) : files.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">Dossier vide</div>
            </div>
          ) : (
            <div className="p-4">
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-3 text-gray-400 font-medium">Nom</th>
                      <th className="text-left p-3 text-gray-400 font-medium">Taille</th>
                      <th className="text-left p-3 text-gray-400 font-medium">Modifié</th>
                      <th className="text-left p-3 text-gray-400 font-medium">Permissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => (
                      <tr
                        key={file.path}
                        onClick={() => handleFileClick(file)}
                        className={`
                          border-b border-gray-700 cursor-pointer transition-colors
                          ${selectedFiles.has(file.path) 
                            ? "bg-blue-900 bg-opacity-30" 
                            : "hover:bg-gray-700"
                          }
                        `}
                      >
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            {getFileIcon(file)}
                            <span>{file.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-gray-400">
                          {file.type === 'file' ? formatFileSize(file.size) : '-'}
                        </td>
                        <td className="p-3 text-gray-400">
                          {file.modified ? new Date(file.modified).toLocaleString() : '-'}
                        </td>
                        <td className="p-3 text-gray-400 font-mono text-xs">
                          {file.permissions ? (
                            <div className="flex items-center space-x-1">
                              {file.permissions.user && (
                                <span className="text-green-400">{file.permissions.user}</span>
                              )}
                              {file.permissions.group && (
                                <span className="text-yellow-400">{file.permissions.group}</span>
                              )}
                              {file.permissions.other && (
                                <span className="text-red-400">{file.permissions.other}</span>
                              )}
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </ScrollArea>
      ) : (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <Lock className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">Non connecté au serveur SFTP</p>
            <Button
              onClick={() => setConnectDialogOpen(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              Se connecter
            </Button>
          </div>
        </div>
      )}

      {/* Connection Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Server className="w-5 h-5 mr-2 text-blue-400" />
              Connexion SFTP
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Entrez vos identifiants pour vous connecter au serveur
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {error && (
              <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded p-3 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="host" className="text-gray-300">Hôte</Label>
              <Input
                id="host"
                value={connectionForm.host}
                onChange={(e) => setConnectionForm({...connectionForm, host: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="exemple.com ou 192.168.1.1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="port" className="text-gray-300">Port</Label>
              <Input
                id="port"
                type="number"
                value={connectionForm.port}
                onChange={(e) => setConnectionForm({...connectionForm, port: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="22"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">Nom d&apos;utilisateur</Label>
              <Input
                id="username"
                value={connectionForm.username}
                onChange={(e) => setConnectionForm({...connectionForm, username: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="root"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={connectionForm.password}
                onChange={(e) => setConnectionForm({...connectionForm, password: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              onClick={handleConnect}
              disabled={loading || !connectionForm.host || !connectionForm.username || !connectionForm.password}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  Se connecter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}