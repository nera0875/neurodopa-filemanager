"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Server, 
  LogIn, 
  LogOut,
  Folder,
  FolderOpen,
  File,
  Download,
  Upload,
  Trash2,
  Home,
  ChevronRight,
  ChevronDown,
  HardDrive,
  Lock,
  Unlock,
  RefreshCw,
  X,
  Edit2,
  Move,
  Copy,
  Star,
  Info,
  Database,
  Globe,
  Settings,
  Terminal,
  Code,
  FileText,
  Users,
  Package,
  Cpu,
  Shield,
  Save,
  Plus,
  FolderPlus,
  MoreVertical,
  Check,
  Eye,
  Search,
  Filter,
  Calendar,
  FileType,
  Zap,
  Clock,
  Hash,
  FileSearch,
  RotateCcw,
  ChevronUp,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileIcon
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
import FilePreviewModal from "./FilePreviewModal";
import ConnectionProfilesManager, { SFTPProfile } from "./ConnectionProfilesManager";
import SidebarManager from "./SidebarManager";

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

interface LinuxFolder {
  path: string;
  name: string;
  icon: React.ReactNode;
  iconType?: string;
  description: string;
  children?: LinuxFolder[];
  isCustom?: boolean;
  id?: string;
  parentId?: string;
}

interface SearchOptions {
  query: string;
  path: string;
  recursive: boolean;
  searchInContent: boolean;
  caseSensitive: boolean;
  useRegex: boolean;
  fileTypes: string[];
  minSize?: number;
  maxSize?: number;
  modifiedAfter?: string;
  modifiedBefore?: string;
  maxResults: number;
}

interface ContentMatch {
  lineNumber: number;
  content: string;
  matchStart: number;
  matchLength: number;
  relevance: number;
}

interface SearchResult {
  path: string;
  name: string;
  size: number;
  modified: string;
  type: 'filename' | 'content';
  relevance: number;
  matches: ContentMatch[];
  isTextFile: boolean;
}

const DEFAULT_LINUX_STRUCTURE: LinuxFolder[] = [
  {
    path: "/home/pilote",
    name: "🏠 Mes Fichiers",
    icon: <Home className="w-4 h-4 text-blue-500" />,
    description: "Votre dossier personnel - tous vos projets",
    children: [
      {
        path: "/home/pilote/filemanager",
        name: "📁 File Manager",
        icon: <Folder className="w-4 h-4 text-blue-500" />,
        description: "Le gestionnaire de fichiers (ce projet)"
      },
      {
        path: "/home/pilote/storage",
        name: "💾 Storage",
        icon: <Database className="w-4 h-4 text-green-500" />,
        description: "Stockage du gestionnaire de fichiers"
      },
      {
        path: "/home/pilote/neurodopa-vitrine",
        name: "🌐 Site Vitrine",
        icon: <Globe className="w-4 h-4 text-purple-500" />,
        description: "Site vitrine Neurodopa"
      }
    ]
  },
  {
    path: "/var/www",
    name: "🌐 Sites Web",
    icon: <Globe className="w-4 h-4 text-green-500" />,
    description: "Tous les sites web hébergés",
    children: [
      {
        path: "/var/www/neurodopa",
        name: "Neurodopa Principal",
        icon: <Globe className="w-4 h-4 text-blue-500" />,
        description: "Site principal neurodopa.fr"
      },
      {
        path: "/var/www/dashboard",
        name: "Dashboard",
        icon: <Package className="w-4 h-4 text-orange-500" />,
        description: "Tableau de bord"
      }
    ]
  },
  {
    path: "/etc",
    name: "⚙️ Configuration",
    icon: <Settings className="w-4 h-4 text-gray-500" />,
    description: "Fichiers de configuration système",
    children: [
      {
        path: "/etc/nginx",
        name: "Nginx",
        icon: <Server className="w-4 h-4 text-green-500" />,
        description: "Configuration serveur web"
      },
      {
        path: "/etc/ssh",
        name: "SSH",
        icon: <Shield className="w-4 h-4 text-red-500" />,
        description: "Configuration SSH"
      }
    ]
  },
  {
    path: "/",
    name: "💻 Système Linux",
    icon: <Cpu className="w-4 h-4 text-red-500" />,
    description: "Structure complète du système",
    children: [
      {
        path: "/bin",
        name: "/bin",
        icon: <Terminal className="w-4 h-4 text-gray-500" />,
        description: "Commandes essentielles (ls, cp, mv...)"
      },
      {
        path: "/boot",
        name: "/boot",
        icon: <HardDrive className="w-4 h-4 text-gray-500" />,
        description: "Fichiers de démarrage du système"
      },
      {
        path: "/dev",
        name: "/dev",
        icon: <Cpu className="w-4 h-4 text-gray-500" />,
        description: "Périphériques (disques, USB...)"
      },
      {
        path: "/home",
        name: "/home",
        icon: <Users className="w-4 h-4 text-blue-500" />,
        description: "Dossiers des utilisateurs"
      },
      {
        path: "/lib",
        name: "/lib",
        icon: <Package className="w-4 h-4 text-gray-500" />,
        description: "Bibliothèques système"
      },
      {
        path: "/media",
        name: "/media",
        icon: <HardDrive className="w-4 h-4 text-gray-500" />,
        description: "Points de montage médias (USB, CD...)"
      },
      {
        path: "/mnt",
        name: "/mnt",
        icon: <HardDrive className="w-4 h-4 text-gray-500" />,
        description: "Points de montage temporaires"
      },
      {
        path: "/opt",
        name: "/opt",
        icon: <Package className="w-4 h-4 text-orange-500" />,
        description: "Logiciels optionnels installés"
      },
      {
        path: "/proc",
        name: "/proc",
        icon: <Cpu className="w-4 h-4 text-gray-500" />,
        description: "Informations système en temps réel"
      },
      {
        path: "/root",
        name: "/root",
        icon: <Shield className="w-4 h-4 text-red-500" />,
        description: "Dossier de l'administrateur root"
      },
      {
        path: "/srv",
        name: "/srv",
        icon: <Server className="w-4 h-4 text-gray-500" />,
        description: "Données des services"
      },
      {
        path: "/tmp",
        name: "/tmp",
        icon: <FileText className="w-4 h-4 text-yellow-500" />,
        description: "Fichiers temporaires (vidé au redémarrage)"
      },
      {
        path: "/usr",
        name: "/usr",
        icon: <Package className="w-4 h-4 text-gray-500" />,
        description: "Programmes et fichiers utilisateur"
      },
      {
        path: "/var",
        name: "/var",
        icon: <Database className="w-4 h-4 text-green-500" />,
        description: "Données variables (logs, sites web...)"
      }
    ]
  }
];

// Add IDs to default structure
const addIdsToStructure = (folders: LinuxFolder[]): LinuxFolder[] => {
  return folders.map(folder => ({
    ...folder,
    id: `system-${folder.path}`,
    iconType: folder.iconType || 'folder',
    children: folder.children ? addIdsToStructure(folder.children) : undefined
  }));
};

export default function SFTPManagerPro() {
  const [connection, setConnection] = useState<SFTPConnection>({ connected: false });
  const [files, setFiles] = useState<SFTPFile[]>([]);
  const [currentPath, setCurrentPath] = useState("/home/pilote");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/home/pilote", "/var/www"]));
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const [customFolders, setCustomFolders] = useState<LinuxFolder[]>([]);
  const [systemFolders, setSystemFolders] = useState<LinuxFolder[]>([]);
  const [addFolderDialogOpen, setAddFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<LinuxFolder | null>(null);
  const [newFolderForm, setNewFolderForm] = useState({ name: "", path: "", description: "", iconType: "folder" });
  
  // Dialogs
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedForAction, setSelectedForAction] = useState<SFTPFile | null>(null);
  const [saveCredentials, setSaveCredentials] = useState(true);
  
  // Drag & Drop and Upload states
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Resizable sidebar states
  const [sidebarWidth, setSidebarWidth] = useState(320); // Default width: 320px
  const [isDragging, setIsDragging] = useState(false);
  
  // File preview states
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<SFTPFile | null>(null);
  
  // Search states
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    query: "",
    path: "/",
    recursive: true,
    searchInContent: true,
    caseSensitive: false,
    useRegex: false,
    fileTypes: [],
    maxResults: 100
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  const [connectionForm, setConnectionForm] = useState({
    host: "localhost",
    port: "22",
    username: "",
    password: ""
  });

  // Profile management
  const handleProfileSelect = (profile: SFTPProfile) => {
    setConnectionForm({
      host: profile.host,
      port: profile.port.toString(),
      username: profile.username,
      password: profile.password
    });
  };

  // Clipboard operations
  const [clipboard, setClipboard] = useState<{files: SFTPFile[], operation: 'copy' | 'cut'} | null>(null);
  const [folderSizes, setFolderSizes] = useState<{[path: string]: number}>({});

  // Calculate folder size
  const calculateFolderSize = async (folderPath: string): Promise<number> => {
    try {
      const response = await fetch('/api/sftp/folder-size', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath })
      });
      const data = await response.json();
      return data.size || 0;
    } catch (error) {
      console.error('Error calculating folder size:', error);
      return 0;
    }
  };

  // Load folder sizes for current directory
  const loadFolderSizes = async () => {
    const folders = files.filter(f => f.type === 'folder');
    const sizes: {[path: string]: number} = {};
    
    for (const folder of folders) {
      const size = await calculateFolderSize(folder.path);
      sizes[folder.path] = size;
    }
    
    setFolderSizes(sizes);
  };

  useEffect(() => {
    checkConnection();
    loadSavedCredentials();
    loadFavorites();
    loadCustomFolders();
    loadSystemFolders();
    loadSidebarWidth();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!connection.connected) return;
      
      // Prevent shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Ctrl+A - Select All
      if (event.ctrlKey && event.key === 'a') {
        event.preventDefault();
        handleSelectAll();
      }
      
      // F2 - Rename
      else if (event.key === 'F2' && selectedFiles.size === 1) {
        event.preventDefault();
        const firstFile = files.find(f => selectedFiles.has(f.path));
        if (firstFile) handleRename(firstFile);
      }
      
      // F5 - Refresh
      else if (event.key === 'F5') {
        event.preventDefault();
        fetchFiles(currentPath);
      }
      
      // Delete - Delete selected files
      else if (event.key === 'Delete' && selectedFiles.size > 0) {
        event.preventDefault();
        handleMultipleDelete();
      }
      
      // Ctrl+C - Copy
      else if (event.ctrlKey && event.key === 'c' && selectedFiles.size > 0) {
        event.preventDefault();
        const selectedFilesList = files.filter(f => selectedFiles.has(f.path));
        setClipboard({ files: selectedFilesList, operation: 'copy' });
      }
      
      // Ctrl+X - Cut
      else if (event.ctrlKey && event.key === 'x' && selectedFiles.size > 0) {
        event.preventDefault();
        const selectedFilesList = files.filter(f => selectedFiles.has(f.path));
        setClipboard({ files: selectedFilesList, operation: 'cut' });
      }
      
      // Ctrl+V - Paste
      else if (event.ctrlKey && event.key === 'v' && clipboard && clipboard.files.length > 0) {
        event.preventDefault();
        handlePaste();
      }
      
      // Ctrl+N - New folder
      else if (event.ctrlKey && event.key === 'n') {
        event.preventDefault();
        setAddFolderDialogOpen(true);
      }
      
      // Ctrl+U - Upload files
      else if (event.ctrlKey && event.key === 'u') {
        event.preventDefault();
        document.getElementById('sftp-upload-pro')?.click();
      }
      
      // Ctrl+F - Search
      else if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        setSearchModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [connection.connected, files, selectedFiles, clipboard]);

  useEffect(() => {
    if (connection.connected) {
      fetchFiles(currentPath);
    }
  }, [currentPath, connection.connected]);

  // Load folder sizes when files change
  useEffect(() => {
    if (connection.connected && files.length > 0) {
      loadFolderSizes();
    }
  }, [files, connection.connected]);

  // Update select all checkbox state
  useEffect(() => {
    if (files.length === 0) {
      setSelectAll(false);
    } else {
      const selectableFiles = files.filter(f => f.type === 'file');
      const selectedFilesList = files.filter(f => selectedFiles.has(f.path) && f.type === 'file');
      
      if (selectableFiles.length > 0) {
        setSelectAll(selectedFilesList.length === selectableFiles.length);
      } else {
        setSelectAll(false);
      }
    }
  }, [files, selectedFiles]);

  const loadSavedCredentials = () => {
    const saved = localStorage.getItem('sftp-credentials');
    if (saved) {
      const creds = JSON.parse(saved);
      setConnectionForm(creds);
    }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem('sftp-favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  };

  const loadCustomFolders = () => {
    const saved = localStorage.getItem('sftp-custom-folders');
    if (saved) {
      setCustomFolders(JSON.parse(saved));
    }
  };

  const saveCustomFolders = (folders: LinuxFolder[]) => {
    setCustomFolders(folders);
    localStorage.setItem('sftp-custom-folders', JSON.stringify(folders));
  };

  const loadSystemFolders = () => {
    const saved = localStorage.getItem('sftp-system-folders');
    if (saved) {
      setSystemFolders(JSON.parse(saved));
    } else {
      // Initialize with default structure
      const defaultWithIds = addIdsToStructure(DEFAULT_LINUX_STRUCTURE);
      setSystemFolders(defaultWithIds);
      localStorage.setItem('sftp-system-folders', JSON.stringify(defaultWithIds));
    }
  };

  const loadSidebarWidth = () => {
    const saved = localStorage.getItem('sftp-sidebar-width');
    if (saved) {
      const width = parseInt(saved, 10);
      if (width >= 250 && width <= 600) { // Validate width bounds
        setSidebarWidth(width);
      }
    }
  };

  const saveSidebarWidth = (width: number) => {
    setSidebarWidth(width);
    localStorage.setItem('sftp-sidebar-width', width.toString());
  };

  // Resizer drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleDoubleClick = useCallback(() => {
    saveSidebarWidth(320); // Reset to default width
  }, [saveSidebarWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newWidth = Math.min(Math.max(e.clientX, 250), 600); // Min: 250px, Max: 600px
    saveSidebarWidth(newWidth);
  }, [isDragging, saveSidebarWidth]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, [isDragging]);

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const saveSystemFolders = (folders: LinuxFolder[]) => {
    setSystemFolders(folders);
    localStorage.setItem('sftp-system-folders', JSON.stringify(folders));
  };

  const getIconComponent = (iconType: string) => {
    switch(iconType) {
      case 'star': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'home': return <Home className="w-4 h-4 text-blue-500" />;
      case 'database': return <Database className="w-4 h-4 text-green-500" />;
      case 'code': return <Code className="w-4 h-4 text-purple-500" />;
      case 'settings': return <Settings className="w-4 h-4 text-gray-500" />;
      case 'globe': return <Globe className="w-4 h-4 text-blue-500" />;
      case 'terminal': return <Terminal className="w-4 h-4 text-gray-700" />;
      case 'package': return <Package className="w-4 h-4 text-orange-500" />;
      case 'shield': return <Shield className="w-4 h-4 text-red-500" />;
      case 'users': return <Users className="w-4 h-4 text-indigo-500" />;
      case 'folder': 
      default: return <Folder className="w-4 h-4 text-yellow-500" />;
    }
  };

  const handleAddCustomFolder = () => {
    const newFolder: LinuxFolder = {
      id: Date.now().toString(),
      name: newFolderForm.name,
      path: newFolderForm.path,
      description: newFolderForm.description,
      icon: getIconComponent(newFolderForm.iconType),
      iconType: newFolderForm.iconType,
      isCustom: true,
      parentId: editingFolder?.id
    };
    
    if (editingFolder && !editingFolder.isCustom) {
      // Adding as subfolder
      const updated = [...customFolders, newFolder];
      saveCustomFolders(updated);
    } else {
      const updated = [...customFolders, newFolder];
      saveCustomFolders(updated);
    }
    
    setAddFolderDialogOpen(false);
    setNewFolderForm({ name: "", path: "", description: "", iconType: "folder" });
  };

  const handleEditCustomFolder = () => {
    if (!editingFolder) return;
    
    if (editingFolder.id?.startsWith('system-')) {
      // Edit system folder
      const editRecursive = (folders: LinuxFolder[]): LinuxFolder[] => {
        return folders.map(f => {
          if (f.id === editingFolder.id) {
            return {
              ...f,
              name: newFolderForm.name,
              path: newFolderForm.path,
              description: newFolderForm.description,
              icon: getIconComponent(newFolderForm.iconType),
              iconType: newFolderForm.iconType
            };
          }
          return {
            ...f,
            children: f.children ? editRecursive(f.children) : undefined
          };
        });
      };
      const updated = editRecursive(systemFolders);
      saveSystemFolders(updated);
    } else {
      // Edit custom folder
      const updated = customFolders.map(f => 
        f.id === editingFolder.id 
          ? { 
              ...f, 
              name: newFolderForm.name, 
              path: newFolderForm.path, 
              description: newFolderForm.description,
              icon: getIconComponent(newFolderForm.iconType),
              iconType: newFolderForm.iconType
            }
          : f
      );
      saveCustomFolders(updated);
    }
    
    setEditingFolder(null);
    setAddFolderDialogOpen(false);
    setNewFolderForm({ name: "", path: "", description: "", iconType: "folder" });
  };

  const handleDeleteFolder = (folder: LinuxFolder) => {
    if (folder.id?.startsWith('system-')) {
      // Delete system folder
      const deleteRecursive = (folders: LinuxFolder[], targetId: string): LinuxFolder[] => {
        return folders.filter(f => f.id !== targetId).map(f => ({
          ...f,
          children: f.children ? deleteRecursive(f.children, targetId) : undefined
        }));
      };
      const updated = deleteRecursive(systemFolders, folder.id);
      saveSystemFolders(updated);
    } else {
      // Delete custom folder and its children
      const updated = customFolders.filter(f => f.id !== folder.id && f.parentId !== folder.id);
      saveCustomFolders(updated);
    }
  };

  const handleEditFolder = (folder: LinuxFolder) => {
    setEditingFolder(folder);
    setNewFolderForm({ 
      name: folder.name, 
      path: folder.path, 
      description: folder.description,
      iconType: folder.iconType || "folder"
    });
    setAddFolderDialogOpen(true);
  };

  const handleAddSubfolder = (parentFolder: LinuxFolder) => {
    setEditingFolder(parentFolder);
    setNewFolderForm({ 
      name: "", 
      path: parentFolder.path, 
      description: "", 
      iconType: "folder" 
    });
    setAddFolderDialogOpen(true);
  };

  const saveFavorites = (newFavorites: string[]) => {
    setFavorites(newFavorites);
    localStorage.setItem('sftp-favorites', JSON.stringify(newFavorites));
  };

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
        
        if (saveCredentials) {
          localStorage.setItem('sftp-credentials', JSON.stringify(connectionForm));
        }
        
        setConnectDialogOpen(false);
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
      setCurrentPath("/home/pilote");
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
    } else if (file.type === "file" && isFilePreviewable(file)) {
      // Double-click to preview previewable files
      handlePreviewFile(file);
    }
  };

  const handleFileSelection = (file: SFTPFile, isSelected: boolean) => {
    const newSelected = new Set(selectedFiles);
    if (isSelected) {
      newSelected.add(file.path);
    } else {
      newSelected.delete(file.path);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = useCallback(() => {
    const selectableFiles = files.filter(f => f.type === 'file');
    
    if (selectAll) {
      // Deselect all
      setSelectedFiles(new Set());
    } else {
      // Select all files (not folders)
      const newSelected = new Set(selectableFiles.map(f => f.path));
      setSelectedFiles(newSelected);
    }
  }, [files, selectAll]);

  const handleRename = (file: SFTPFile) => {
    setSelectedForAction(file);
    setNewName(file.name);
    setRenameDialogOpen(true);
  };

  const confirmRename = async () => {
    if (!selectedForAction || !newName) return;
    
    try {
      const response = await fetch("/api/sftp/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPath: selectedForAction.path,
          newName: newName
        })
      });
      
      if (response.ok) {
        setRenameDialogOpen(false);
        fetchFiles(currentPath);
      }
    } catch (error) {
      console.error("Rename error:", error);
    }
  };

  const handleDelete = (file: SFTPFile) => {
    setSelectedForAction(file);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedForAction && selectedFiles.size === 0) return;
    
    // Fermer immédiatement la dialog et montrer loading
    setDeleteConfirmOpen(false);
    setLoading(true);
    
    try {
      const filesToDelete = selectedForAction ? [selectedForAction] : files.filter(f => selectedFiles.has(f.path));
      const deletePromises = filesToDelete.map(async (file) => {
        const params = new URLSearchParams({
          path: file.path,
          isDirectory: (file.type === 'folder').toString()
        });
        
        return fetch(`/api/sftp/delete?${params}`, {
          method: "DELETE"
        });
      });
      
      const responses = await Promise.all(deletePromises);
      const failedDeletes = responses.filter(r => !r.ok);
      
      if (failedDeletes.length === 0) {
        // Actualiser la liste sans attendre
        const pathsToDelete = new Set(filesToDelete.map(f => f.path));
        setFiles(prev => prev.filter(f => !pathsToDelete.has(f.path)));
        setSelectedFiles(new Set());
        // Puis recharger en arrière-plan
        fetchFiles(currentPath);
      } else {
        setError(`Erreur lors de la suppression de ${failedDeletes.length} fichier(s)`);
        fetchFiles(currentPath);
      }
    } catch (error) {
      console.error("Delete error:", error);
      setError("Erreur lors de la suppression");
      fetchFiles(currentPath);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: SFTPFile) => {
    const link = document.createElement("a");
    link.href = `/api/sftp/download?path=${encodeURIComponent(file.path)}`;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMultipleDownload = async () => {
    const filesToDownload = files.filter(f => selectedFiles.has(f.path) && f.type === 'file');
    
    for (const file of filesToDownload) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between downloads
      handleDownload(file);
    }
  };

  const handleMultipleDelete = () => {
    if (selectedFiles.size === 0) return;
    setSelectedForAction(null); // Clear single file action
    setDeleteConfirmOpen(true);
  };

  const handlePreviewFile = (file: SFTPFile) => {
    setSelectedFileForPreview(file);
    setPreviewModalOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewModalOpen(false);
    setSelectedFileForPreview(null);
  };

  const isFilePreviewable = (file: SFTPFile): boolean => {
    if (file.type !== 'file') return false;
    
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const previewableExtensions = [
      // Text files
      'txt', 'md', 'js', 'ts', 'jsx', 'tsx', 'json', 'xml', 'html', 'css', 'scss', 'sass',
      'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'rb', 'go', 'rs', 'sh', 'bash',
      'yml', 'yaml', 'toml', 'ini', 'conf', 'config', 'env', 'gitignore', 'dockerfile',
      'sql', 'r', 'scala', 'kt', 'swift', 'dart', 'vue', 'svelte', 'astro', 'mjs',
      'log', 'csv', 'tsv',
      // Images
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff'
    ];
    
    return previewableExtensions.includes(extension);
  };

  const handleUpload = async (filesList: FileList | File[]) => {
    const files = Array.from(filesList);
    if (files.length === 0) return;

    // Reset states
    setUploadError(null);
    setUploadSuccess([]);
    const fileNames = files.map(f => f.name);
    setUploadingFiles(fileNames);
    
    // Initialize progress for each file
    const initialProgress: {[key: string]: number} = {};
    fileNames.forEach(name => {
      initialProgress[name] = 0;
    });
    setUploadProgress(initialProgress);

    try {
      const uploadPromises = files.map(async (file, index) => {
        const formData = new FormData();
        formData.append("files", file);
        formData.append("path", currentPath);

        // Simulate progress (since we can't track real progress with fetch)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: Math.min(prev[file.name] + 10, 90)
          }));
        }, 100);

        try {
          const response = await fetch("/api/sftp/upload", {
            method: "POST",
            body: formData,
          });
          
          clearInterval(progressInterval);
          
          if (response.ok) {
            setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
            setUploadSuccess(prev => [...prev, file.name]);
            return { success: true, fileName: file.name };
          } else {
            throw new Error(`Erreur upload ${file.name}`);
          }
        } catch (error) {
          clearInterval(progressInterval);
          throw error;
        }
      });
      
      const results = await Promise.allSettled(uploadPromises);
      const failures = results.filter(r => r.status === 'rejected').length;
      
      if (failures > 0) {
        setUploadError(`${failures} fichier(s) n'ont pas pu être uploadés`);
      }
      
      // Clean up after 3 seconds
      setTimeout(() => {
        setUploadingFiles([]);
        setUploadProgress({});
        setUploadSuccess([]);
        setUploadError(null);
      }, 3000);
      
      // Refresh file list
      fetchFiles(currentPath);
      
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("Erreur générale lors de l'upload");
    }
  };

  const handleFileInputUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    await handleUpload(files);
    
    // Reset the input
    event.target.value = '';
  };

  // Drag & Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the main drop zone
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleUpload(files);
    }
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const toggleFavorite = (path: string) => {
    if (favorites.includes(path)) {
      saveFavorites(favorites.filter(f => f !== path));
    } else {
      saveFavorites([...favorites, path]);
    }
  };

  const renderSidebarFolder = (folder: LinuxFolder, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.path);
    const isCurrent = currentPath === folder.path;
    const isFavorite = favorites.includes(folder.path);
    
    return (
      <div key={folder.id || folder.path}>
        <div
          className={`
            flex items-center space-x-2 py-1.5 px-2 rounded cursor-pointer transition-colors group
            ${isCurrent ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
          `}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {folder.children && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.path);
              }}
              className="p-0.5"
            >
              {isExpanded ? 
                <ChevronDown className="w-3 h-3" /> : 
                <ChevronRight className="w-3 h-3" />
              }
            </button>
          )}
          
          <div
            className="flex items-center space-x-2 flex-1"
            onClick={() => setCurrentPath(folder.path)}
          >
            {folder.icon || (
              isExpanded && folder.children ? 
                <FolderOpen className="w-4 h-4 text-yellow-600" /> : 
                <Folder className="w-4 h-4 text-yellow-500" />
            )}
            <span className="text-sm">{folder.name}</span>
          </div>
          
          <div className="flex items-center space-x-1 opacity-40 group-hover:opacity-100 transition-opacity">
            {/* Add subfolder button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddSubfolder(folder);
              }}
              className="p-1 hover:bg-green-100 rounded"
              title="Ajouter un sous-dossier"
            >
              <FolderPlus className="w-3 h-3 text-green-600" />
            </button>
            
            {/* Edit and Delete buttons for all folders */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditFolder(folder);
              }}
              className="p-1 hover:bg-blue-100 rounded"
              title="Modifier"
            >
              <Edit2 className="w-3 h-3 text-blue-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFolder(folder);
              }}
              className="p-1 hover:bg-red-100 rounded"
              title="Supprimer"
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </button>
            
            {(
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(folder.path);
                }}
                className="p-1"
                title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                <Star className={`w-3 h-3 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`} />
              </button>
            )}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowInfo(!showInfo);
            }}
            title={folder.description}
            className="opacity-40 group-hover:opacity-100 transition-opacity p-1"
          >
            <Info className="w-3 h-3 text-gray-400 hover:text-blue-500" />
          </button>
        </div>
        
        {showInfo && isCurrent && (
          <div className="text-xs text-gray-500 px-4 py-1 bg-gray-50 mx-2 rounded">
            {folder.description}
          </div>
        )}
        
        {isExpanded && folder.children && (
          <div>
            {folder.children.map(child => renderSidebarFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const getFileIcon = (file: SFTPFile) => {
    if (file.type === "folder") {
      return <Folder className="w-5 h-5 text-yellow-500" />;
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch(ext) {
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return <Code className="w-5 h-5 text-yellow-500" />;
      case 'json':
      case 'xml':
      case 'yaml':
      case 'yml':
        return <FileText className="w-5 h-5 text-orange-500" />;
      case 'md':
      case 'txt':
        return <FileText className="w-5 h-5 text-gray-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "-";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Handle paste operation
  const handlePaste = async () => {
    if (!clipboard || clipboard.files.length === 0) return;
    
    try {
      for (const file of clipboard.files) {
        const response = await fetch('/api/sftp/copy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourcePath: file.path,
            destPath: `${currentPath}/${file.name}`,
            operation: clipboard.operation
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to ${clipboard.operation} ${file.name}`);
        }
      }
      
      // Clear clipboard if it was a cut operation
      if (clipboard.operation === 'cut') {
        setClipboard(null);
      }
      
      // Refresh files
      fetchFiles(currentPath);
    } catch (error) {
      console.error('Paste error:', error);
      setError(`Erreur lors du collage: ${error}`);
    }
  };

  // Search functionality
  const performSearch = async () => {
    if (!searchQuery.trim() && !searchOptions.fileTypes.length && !searchOptions.minSize && !searchOptions.maxSize) {
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch('/api/sftp/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...searchOptions,
          query: searchQuery.trim(),
          path: searchOptions.path || currentPath
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSearchResults(data.results || []);
        
        // Add to search history
        if (searchQuery.trim()) {
          const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
          setSearchHistory(newHistory);
          localStorage.setItem('sftp-search-history', JSON.stringify(newHistory));
        }
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (error) {
      setError('Search error');
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchOptions({
      query: "",
      path: currentPath,
      recursive: true,
      searchInContent: true,
      caseSensitive: false,
      useRegex: false,
      fileTypes: [],
      maxResults: 100
    });
  };

  const navigateToFile = (filePath: string) => {
    const directory = filePath.substring(0, filePath.lastIndexOf('/')) || '/';
    setCurrentPath(directory);
    setSearchModalOpen(false);
    
    // Highlight the file briefly after navigation
    setTimeout(() => {
      fetchFiles(directory);
    }, 100);
  };

  const highlightMatch = (content: string, matchStart: number, matchLength: number) => {
    const before = content.substring(0, matchStart);
    const match = content.substring(matchStart, matchStart + matchLength);
    const after = content.substring(matchStart + matchLength);
    
    return (
      <span>
        {before}
        <mark className="bg-yellow-200 text-yellow-900 px-1 rounded">{match}</mark>
        {after}
      </span>
    );
  };

  // Load search history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('sftp-search-history');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Update search path when current path changes
  useEffect(() => {
    setSearchOptions(prev => ({ ...prev, path: currentPath }));
  }, [currentPath]);

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div 
        className="bg-white border-r border-gray-200 flex flex-col transition-all duration-200 ease-out relative"
        style={{ width: `${sidebarWidth}px` }}
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center justify-between">
            <div className="flex items-center">
              <Server className="w-5 h-5 mr-2 text-blue-500" />
              SFTP Manager Pro
            </div>
            <Button
              onClick={() => setConnectDialogOpen(true)}
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title="Gérer les profils de connexion"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </h2>
          {connection.connected && (
            <p className="text-sm text-gray-500 mt-1">
              {connection.username}@{connection.host}
            </p>
          )}
        </div>
        
        {connection.connected ? (
          <div className="flex-1 overflow-hidden">
            <SidebarManager
              onFolderClick={(path) => setCurrentPath(path)}
              currentPath={currentPath}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <Lock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500 text-sm">Non connecté</p>
              <Button
                onClick={() => setConnectDialogOpen(true)}
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                Se connecter
              </Button>
            </div>
          </div>
        )}
        
        <div className="p-4 border-t border-gray-200 space-y-2">
          {!connection.connected && (
            <Button
              onClick={() => setConnectDialogOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Connexion
            </Button>
          )}
          
          {/* Keyboard shortcuts indicator */}
          <div className="text-xs text-gray-500 space-y-1 mt-4">
            <div className="font-medium text-gray-700 mb-2">Raccourcis clavier:</div>
            <div className="grid grid-cols-1 gap-0.5">
              <div>F2 - Renommer</div>
              <div>F5 - Actualiser</div>
              <div>Delete - Supprimer</div>
              <div>Ctrl+A - Tout sélectionner</div>
              <div>Ctrl+C - Copier</div>
              <div>Ctrl+X - Couper</div>
              <div>Ctrl+V - Coller</div>
              <div>Ctrl+N - Nouveau dossier</div>
              <div>Ctrl+U - Upload</div>
              <div>Ctrl+F - Rechercher</div>
            </div>
          </div>
        </div>
        
        {/* Resize handle */}
        <div 
          className="absolute top-0 right-0 w-4 h-full cursor-col-resize group flex items-center justify-center"
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          title="Glisser pour redimensionner • Double-clic pour réinitialiser"
        >
          {/* Invisible hover zone */}
          <div className="absolute inset-0 bg-transparent" />
          
          {/* Visual indicator */}
          <div 
            className={`
              w-0.5 h-8 bg-gray-300 group-hover:bg-blue-400 transition-all duration-200
              ${isDragging ? 'bg-blue-500 w-1' : ''}
            `}
          />
          
          {/* Width indicator during drag */}
          {isDragging && (
            <div 
              className="absolute -top-8 -left-4 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg z-50"
            >
              {sidebarWidth}px
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            {/* Breadcrumbs */}
            <div className="flex items-center space-x-2 text-sm">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPath("/")}
                className="h-8 w-8"
              >
                <Home className="w-4 h-4" />
              </Button>
              <span className="text-gray-400">/</span>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  <button
                    className="hover:text-blue-600 transition-colors"
                    onClick={() => {
                      const newPath = "/" + breadcrumbs.slice(0, index + 1).join("/");
                      setCurrentPath(newPath);
                    }}
                  >
                    {crumb}
                  </button>
                  {index < breadcrumbs.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setSearchModalOpen(true)}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                title="Recherche avancée (Ctrl+F)"
              >
                <Search className="w-4 h-4 mr-2" />
                Rechercher
              </Button>
              
              <Button
                onClick={() => fetchFiles(currentPath)}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Actualiser (F5)"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              
              <div>
                <label htmlFor="sftp-upload-pro" className="cursor-pointer">
                  <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50" title="Upload (Ctrl+U)">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </span>
                </label>
                <input
                  id="sftp-upload-pro"
                  type="file"
                  multiple
                  onChange={handleFileInputUpload}
                  className="hidden"
                />
              </div>
              
              {/* Connection status and disconnect button */}
              {connection.connected && (
                <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200">
                  <div className="flex items-center text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Connecté à {connection.host}
                  </div>
                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    title="Déconnexion"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Déconnexion
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clipboard indicator */}
        {clipboard && clipboard.files.length > 0 && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-700">
                {clipboard.files.length} élément{clipboard.files.length > 1 ? 's' : ''} {clipboard.operation === 'copy' ? 'copié' : 'coupé'}{clipboard.files.length > 1 ? 's' : ''} - Appuyez sur Ctrl+V pour coller
              </span>
              <Button
                onClick={() => setClipboard(null)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Action bar for selected files */}
        {selectedFiles.size > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedFiles.size} {selectedFiles.size === 1 ? 'élément sélectionné' : 'éléments sélectionnés'}
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleMultipleDownload}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  disabled={files.filter(f => selectedFiles.has(f.path) && f.type === 'file').length === 0}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Télécharger ({files.filter(f => selectedFiles.has(f.path) && f.type === 'file').length})
                </Button>
                <Button
                  onClick={() => {
                    const firstFile = files.find(f => selectedFiles.has(f.path));
                    if (firstFile) handleRename(firstFile);
                  }}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  disabled={selectedFiles.size !== 1}
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Renommer
                </Button>
                <Button
                  onClick={handleMultipleDelete}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer ({selectedFiles.size})
                </Button>
                <Button
                  onClick={() => setSelectedFiles(new Set())}
                  variant="ghost"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* File list */}
        {connection.connected ? (
          <div 
            className="flex-1 bg-white relative"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {/* Drag overlay */}
            {isDragOver && (
              <div className="absolute inset-0 bg-blue-50 bg-opacity-90 border-2 border-dashed border-blue-300 z-50 flex items-center justify-center">
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                  <p className="text-lg font-medium text-blue-700">Déposez vos fichiers ici</p>
                  <p className="text-sm text-blue-500">Upload multiple supporté</p>
                </div>
              </div>
            )}
            
            {/* Upload progress notifications */}
            {(uploadingFiles.length > 0 || uploadSuccess.length > 0 || uploadError) && (
              <div className="bg-white border-b border-gray-200 p-4 space-y-2">
                {/* Uploading files */}
                {uploadingFiles.map(fileName => (
                  <div key={fileName} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-700">Upload: {fileName}</span>
                      <span className="text-xs text-blue-500">{uploadProgress[fileName] || 0}%</span>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress[fileName] || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
                
                {/* Success notifications */}
                {uploadSuccess.map(fileName => (
                  <div key={`success-${fileName}`} className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm text-green-700">{fileName} uploadé avec succès</span>
                  </div>
                ))}
                
                {/* Error notification */}
                {uploadError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                    <X className="w-4 h-4 text-red-500 mr-2" />
                    <span className="text-sm text-red-700">{uploadError}</span>
                  </div>
                )}
              </div>
            )}
            
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-400">Chargement...</div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-red-500">{error}</div>
                </div>
              ) : files.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg m-8 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400 group-hover:text-blue-500" />
                    <div className="text-gray-400 group-hover:text-blue-600 mb-2 font-medium">Dossier vide</div>
                    <div className="text-xs text-gray-500 group-hover:text-blue-500">Glissez-déposez des fichiers ici pour les uploader</div>
                    <div className="text-xs text-gray-400 group-hover:text-blue-400 mt-2">ou utilisez le bouton Upload</div>
                  </div>
                </div>
              ) : (
                <div className="relative">
              <div className="p-4">
                {/* Header with select all checkbox */}
                {files.length > 0 && files.some(f => f.type === 'file') && (
                  <div className="flex items-center space-x-3 p-3 mb-2 bg-gray-50 rounded-lg border">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="appearance-none w-4 h-4 border-2 border-gray-300 rounded bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                      />
                      {selectAll && (
                        <Check className="absolute inset-0 w-4 h-4 text-white pointer-events-none" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {selectAll ? 'Désélectionner tout' : 'Tout sélectionner'}
                      {files.filter(f => f.type === 'file').length > 0 && (
                        <span className="text-gray-500"> ({files.filter(f => f.type === 'file').length} fichiers)</span>
                      )}
                    </span>
                    {selectedFiles.size > 0 && (
                      <span className="text-sm text-blue-600 font-medium ml-auto">
                        {selectedFiles.size} sélectionné{selectedFiles.size > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-1">
                  {files.map((file) => (
                    <div
                      key={file.path}
                      className={`
                        flex items-center justify-between p-3 rounded-lg transition-all
                        ${selectedFiles.has(file.path) 
                          ? "bg-blue-50 ring-1 ring-blue-300" 
                          : "hover:bg-gray-50"
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        {file.type === 'file' ? (
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={selectedFiles.has(file.path)}
                              onChange={(e) => handleFileSelection(file, e.target.checked)}
                              className="appearance-none w-4 h-4 border-2 border-gray-300 rounded bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                            />
                            {selectedFiles.has(file.path) && (
                              <Check className="absolute inset-0 w-4 h-4 text-white pointer-events-none" />
                            )}
                          </div>
                        ) : (
                          <div className="w-4 h-4" /> /* Spacer for folders */
                        )}
                        <div 
                          onClick={() => handleFileClick(file)}
                          className={`flex items-center space-x-3 ${
                            file.type === 'folder' || (file.type === 'file' && isFilePreviewable(file))
                              ? 'cursor-pointer' 
                              : ''
                          } ${
                            clipboard?.files.some(f => f.path === file.path) && clipboard.operation === 'cut' 
                              ? 'opacity-60 text-gray-500' 
                              : clipboard?.files.some(f => f.path === file.path) && clipboard.operation === 'copy'
                              ? 'text-blue-700'
                              : ''
                          }`}
                        >
                          {getFileIcon(file)}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {file.type === 'file' 
                                ? formatFileSize(file.size) 
                                : folderSizes[file.path] 
                                  ? `Dossier (${formatFileSize(folderSizes[file.path])})`
                                  : 'Dossier'
                              } 
                              {file.modified && ` • ${new Date(file.modified).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 opacity-0 hover:opacity-100 transition-opacity">
                        {file.type === 'file' && isFilePreviewable(file) && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewFile(file);
                            }}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Preview file"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {file.type === 'file' && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file);
                            }}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRename(file);
                          }}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(file);
                          }}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center">
              <Server className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">Connectez-vous au serveur SFTP</p>
              <Button
                onClick={() => setConnectDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Unlock className="w-4 h-4 mr-2" />
                Se connecter maintenant
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Connection Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Server className="w-5 h-5 mr-2 text-blue-500" />
              Connexion SFTP
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Entrez vos identifiants pour vous connecter au serveur
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Connection Profiles Manager */}
            <div className="border-b border-gray-200 pb-4">
              <ConnectionProfilesManager 
                onProfileSelect={handleProfileSelect}
                currentConnectionData={connectionForm}
              />
            </div>

            {/* Manual Connection Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="host">Hôte</Label>
                <Input
                  id="host"
                  value={connectionForm.host}
                  onChange={(e) => setConnectionForm({...connectionForm, host: e.target.value})}
                  placeholder="localhost ou IP"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={connectionForm.port}
                  onChange={(e) => setConnectionForm({...connectionForm, port: e.target.value})}
                  placeholder="22"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Nom d&apos;utilisateur</Label>
                <Input
                  id="username"
                  value={connectionForm.username}
                  onChange={(e) => setConnectionForm({...connectionForm, username: e.target.value})}
                  placeholder="root ou pilote"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={connectionForm.password}
                  onChange={(e) => setConnectionForm({...connectionForm, password: e.target.value})}
                  placeholder="••••••••"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="save-creds"
                  checked={saveCredentials}
                  onChange={(e) => setSaveCredentials(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="save-creds" className="text-sm font-normal cursor-pointer">
                  Sauvegarder les identifiants (local - ancien système)
                </Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              onClick={handleConnect}
              disabled={loading || !connectionForm.host || !connectionForm.username || !connectionForm.password}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connexion...
                </span>
              ) : (
                <span className="flex items-center">
                  <Unlock className="w-4 h-4 mr-2" />
                  Se connecter
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Renommer</DialogTitle>
            <DialogDescription className="text-gray-500">
              Entrez le nouveau nom pour {selectedForAction?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newname">Nouveau nom</Label>
              <Input
                id="newname"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nouveau nom"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={confirmRename}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Renommer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-gray-500">
              {selectedForAction ? (
                <span>Êtes-vous sûr de vouloir supprimer {selectedForAction.name} ? Cette action est irréversible.</span>
              ) : (
                <span>Êtes-vous sûr de vouloir supprimer {selectedFiles.size} élément{selectedFiles.size > 1 ? 's' : ''} sélectionné{selectedFiles.size > 1 ? 's' : ''} ? Cette action est irréversible.</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer {selectedForAction ? '' : `(${selectedFiles.size})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Custom Folder Dialog */}
      <Dialog open={addFolderDialogOpen} onOpenChange={setAddFolderDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FolderPlus className="w-5 h-5 mr-2 text-blue-500" />
              {editingFolder?.isCustom ? 'Modifier le dossier' : editingFolder ? 'Ajouter un sous-dossier' : 'Ajouter un dossier favori'}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {editingFolder?.isCustom ? 'Modifiez les informations du dossier' : editingFolder ? `Ajouter un sous-dossier dans ${editingFolder.name}` : 'Ajoutez un dossier personnalisé à votre sidebar'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">Nom du dossier</Label>
              <Input
                id="folder-name"
                value={newFolderForm.name}
                onChange={(e) => setNewFolderForm({ ...newFolderForm, name: e.target.value })}
                placeholder="Mon Projet"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="folder-path">Chemin complet</Label>
              <Input
                id="folder-path"
                value={newFolderForm.path}
                onChange={(e) => setNewFolderForm({ ...newFolderForm, path: e.target.value })}
                placeholder="/home/pilote/mon-projet"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="folder-description">Description (optionnel)</Label>
              <Input
                id="folder-description"
                value={newFolderForm.description}
                onChange={(e) => setNewFolderForm({ ...newFolderForm, description: e.target.value })}
                placeholder="Description du dossier"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Icône du dossier</Label>
              <div className="grid grid-cols-5 gap-2 mt-1">
                {[
                  { type: 'folder', icon: <Folder className="w-4 h-4" />, color: 'text-yellow-500' },
                  { type: 'star', icon: <Star className="w-4 h-4" />, color: 'text-yellow-500' },
                  { type: 'home', icon: <Home className="w-4 h-4" />, color: 'text-blue-500' },
                  { type: 'database', icon: <Database className="w-4 h-4" />, color: 'text-green-500' },
                  { type: 'code', icon: <Code className="w-4 h-4" />, color: 'text-purple-500' },
                  { type: 'settings', icon: <Settings className="w-4 h-4" />, color: 'text-gray-500' },
                  { type: 'globe', icon: <Globe className="w-4 h-4" />, color: 'text-blue-500' },
                  { type: 'terminal', icon: <Terminal className="w-4 h-4" />, color: 'text-gray-700' },
                  { type: 'package', icon: <Package className="w-4 h-4" />, color: 'text-orange-500' },
                  { type: 'shield', icon: <Shield className="w-4 h-4" />, color: 'text-red-500' }
                ].map(({ type, icon, color }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewFolderForm({ ...newFolderForm, iconType: type })}
                    className={`
                      p-2 rounded border transition-all
                      ${newFolderForm.iconType === type 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                  >
                    <div className={color}>{icon}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddFolderDialogOpen(false);
                setEditingFolder(null);
                setNewFolderForm({ name: "", path: "", description: "", iconType: "folder" });
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={editingFolder ? handleEditCustomFolder : handleAddCustomFolder}
              disabled={!newFolderForm.name || !newFolderForm.path}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editingFolder ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={previewModalOpen}
        onClose={handleClosePreview}
        filePath={selectedFileForPreview?.path || null}
        fileName={selectedFileForPreview?.name || null}
      />

      {/* Search Modal */}
      <Dialog open={searchModalOpen} onOpenChange={setSearchModalOpen}>
        <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileSearch className="w-5 h-5 mr-2 text-blue-500" />
              Recherche Avancée SFTP
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Recherchez dans les noms de fichiers et le contenu des fichiers
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Search Form */}
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tapez votre recherche..."
                    className="text-base"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={searchLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {searchLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Recherche...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Rechercher
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  variant="outline"
                  className="border-gray-300"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {showAdvancedSearch ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
                {(searchQuery || searchResults.length > 0) && (
                  <Button
                    type="button"
                    onClick={clearSearch}
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Search History */}
              {searchHistory.length > 0 && !searchQuery && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Recherches récentes
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {searchHistory.slice(0, 5).map((query, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSearchQuery(query)}
                        className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Advanced Search Options */}
              {showAdvancedSearch && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search Location */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dossier de recherche
                      </label>
                      <Input
                        value={searchOptions.path}
                        onChange={(e) => setSearchOptions({...searchOptions, path: e.target.value})}
                        placeholder="/home/pilote"
                        className="text-sm"
                      />
                    </div>

                    {/* File Types */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Types de fichiers (séparés par des virgules)
                      </label>
                      <Input
                        value={searchOptions.fileTypes.join(', ')}
                        onChange={(e) => setSearchOptions({
                          ...searchOptions, 
                          fileTypes: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                        })}
                        placeholder="js, ts, txt, md"
                        className="text-sm"
                      />
                    </div>

                    {/* Size Filters */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Taille min (bytes)
                      </label>
                      <Input
                        type="number"
                        value={searchOptions.minSize || ''}
                        onChange={(e) => setSearchOptions({
                          ...searchOptions, 
                          minSize: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                        placeholder="1024"
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Taille max (bytes)
                      </label>
                      <Input
                        type="number"
                        value={searchOptions.maxSize || ''}
                        onChange={(e) => setSearchOptions({
                          ...searchOptions, 
                          maxSize: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                        placeholder="1048576"
                        className="text-sm"
                      />
                    </div>

                    {/* Date Filters */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Modifié après
                      </label>
                      <Input
                        type="date"
                        value={searchOptions.modifiedAfter || ''}
                        onChange={(e) => setSearchOptions({
                          ...searchOptions, 
                          modifiedAfter: e.target.value || undefined
                        })}
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Modifié avant
                      </label>
                      <Input
                        type="date"
                        value={searchOptions.modifiedBefore || ''}
                        onChange={(e) => setSearchOptions({
                          ...searchOptions, 
                          modifiedBefore: e.target.value || undefined
                        })}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Search Options */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchOptions.recursive}
                        onChange={(e) => setSearchOptions({...searchOptions, recursive: e.target.checked})}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Recherche récursive</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchOptions.searchInContent}
                        onChange={(e) => setSearchOptions({...searchOptions, searchInContent: e.target.checked})}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Recherche dans le contenu</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchOptions.caseSensitive}
                        onChange={(e) => setSearchOptions({...searchOptions, caseSensitive: e.target.checked})}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Sensible à la casse</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchOptions.useRegex}
                        onChange={(e) => setSearchOptions({...searchOptions, useRegex: e.target.checked})}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Expression régulière</span>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Résultats max
                      </label>
                      <Input
                        type="number"
                        value={searchOptions.maxResults}
                        onChange={(e) => setSearchOptions({
                          ...searchOptions, 
                          maxResults: Math.max(1, parseInt(e.target.value) || 100)
                        })}
                        min="1"
                        max="1000"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Results */}
            <div className="flex-1 overflow-hidden">
              {searchResults.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
                    </h3>
                    {searchQuery && (
                      <div className="text-sm text-gray-500">
                        Recherche: &quot;{searchQuery}&quot;
                        {searchOptions.path !== "/" && ` dans ${searchOptions.path}`}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <ScrollArea className="flex-1 max-h-96">
                {searchResults.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.map((result, index) => (
                      <div
                        key={`${result.path}-${index}`}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {result.type === 'content' ? (
                                <FileText className="w-4 h-4 text-green-600" />
                              ) : (
                                <FileIcon className="w-4 h-4 text-blue-600" />
                              )}
                              <h4 className="font-medium text-gray-900">{result.name}</h4>
                              {result.type === 'content' && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  Contenu
                                </span>
                              )}
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {Math.round(result.relevance)}% pertinence
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-2">
                              <code className="bg-gray-100 px-1 rounded text-xs">{result.path}</code>
                              <span className="mx-2">•</span>
                              <span>{formatFileSize(result.size)}</span>
                              <span className="mx-2">•</span>
                              <span>{new Date(result.modified).toLocaleDateString()}</span>
                            </div>

                            {/* Content matches */}
                            {result.matches.length > 0 && (
                              <div className="space-y-1">
                                {result.matches.slice(0, 3).map((match, matchIndex) => (
                                  <div key={matchIndex} className="bg-gray-50 p-2 rounded text-sm border-l-4 border-yellow-400">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <Hash className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs text-gray-500">Ligne {match.lineNumber}</span>
                                      <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">
                                        {match.relevance}%
                                      </span>
                                    </div>
                                    <div className="font-mono text-xs text-gray-700 break-all">
                                      {highlightMatch(match.content, match.matchStart, match.matchLength)}
                                    </div>
                                  </div>
                                ))}
                                {result.matches.length > 3 && (
                                  <div className="text-xs text-gray-500 italic">
                                    ... et {result.matches.length - 3} autre{result.matches.length - 3 > 1 ? 's' : ''} correspondance{result.matches.length - 3 > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-1 ml-4">
                            <Button
                              onClick={() => navigateToFile(result.path)}
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              <Folder className="w-3 h-3 mr-1" />
                              Aller au fichier
                            </Button>
                            {result.isTextFile && (
                              <Button
                                onClick={() => {
                                  const file: SFTPFile = {
                                    name: result.name,
                                    type: 'file',
                                    path: result.path,
                                    size: result.size,
                                    modified: result.modified
                                  };
                                  handlePreviewFile(file);
                                }}
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-300 hover:bg-green-50"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Preview
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery && !searchLoading ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Aucun résultat trouvé pour &quot;{searchQuery}&quot;</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Essayez avec d&apos;autres termes ou ajustez les filtres
                    </p>
                  </div>
                ) : !searchLoading && (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Tapez votre recherche ci-dessus</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Recherchez dans les noms de fichiers et le contenu
                    </p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-500">
                {searchResults.length > 0 && `${searchResults.length} résultat${searchResults.length > 1 ? 's' : ''}`}
              </div>
              <Button
                onClick={() => setSearchModalOpen(false)}
                variant="outline"
              >
                Fermer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}