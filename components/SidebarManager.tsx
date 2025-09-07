"use client";

import React, { useState, useEffect } from "react";
import {
  Folder,
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Home,
  Settings,
  Database,
  Globe,
  Package,
  Server,
  HardDrive,
  Star,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SidebarFolder {
  id: string;
  path: string;
  name: string;
  icon?: string;
  description?: string;
  children?: SidebarFolder[];
  isExpanded?: boolean;
  isCustom?: boolean;
  parentId?: string | null;
  order?: number;
}

interface SidebarManagerProps {
  onFolderClick: (path: string) => void;
  currentPath: string;
}

const ICON_OPTIONS = [
  { value: "folder", label: "📁 Dossier", icon: <Folder className="w-4 h-4" /> },
  { value: "home", label: "🏠 Accueil", icon: <Home className="w-4 h-4" /> },
  { value: "globe", label: "🌐 Web", icon: <Globe className="w-4 h-4" /> },
  { value: "database", label: "💾 Stockage", icon: <Database className="w-4 h-4" /> },
  { value: "settings", label: "⚙️ Config", icon: <Settings className="w-4 h-4" /> },
  { value: "server", label: "🖥️ Serveur", icon: <Server className="w-4 h-4" /> },
  { value: "package", label: "📦 Package", icon: <Package className="w-4 h-4" /> },
  { value: "star", label: "⭐ Favori", icon: <Star className="w-4 h-4" /> },
  { value: "harddrive", label: "💿 Disque", icon: <HardDrive className="w-4 h-4" /> },
];

const DEFAULT_STRUCTURE: SidebarFolder[] = [
  {
    id: "system-linux",
    path: "/",
    name: "📁 SYSTÈME LINUX",
    icon: "harddrive",
    description: "Racine du système",
    isCustom: false,
    parentId: null,
    order: 0,
    isExpanded: true,
    children: [
      {
        id: "home-folder",
        path: "/home/pilote",
        name: "🏠 Mes Fichiers",
        icon: "home",
        description: "Votre dossier personnel - tous vos projets",
        isCustom: false,
        parentId: "system-linux",
        isExpanded: true,
        children: [
          {
            id: "filemanager-folder",
            path: "/home/pilote/filemanager",
            name: "📁 File Manager",
            icon: "folder",
            description: "Le gestionnaire de fichiers (ce projet)",
            isCustom: false,
            parentId: "home-folder"
          },
          {
            id: "storage-folder",
            path: "/home/pilote/storage",
            name: "💾 Storage",
            icon: "database",
            description: "Stockage du gestionnaire de fichiers",
            isCustom: false,
            parentId: "home-folder"
          },
          {
            id: "neurodopa-vitrine-folder",
            path: "/home/pilote/neurodopa-vitrine",
            name: "🌐 Site Vitrine",
            icon: "globe",
            description: "Site vitrine Neurodopa",
            isCustom: false,
            parentId: "home-folder"
          },
          {
            id: "projects-folder",
            path: "/home/pilote/projects",
            name: "📂 Projets",
            icon: "folder",
            description: "Tous vos projets de développement",
            isCustom: false,
            parentId: "home-folder"
          },
          {
            id: "documents-folder",
            path: "/home/pilote/Documents",
            name: "📄 Documents",
            icon: "folder",
            description: "Documents personnels",
            isCustom: false,
            parentId: "home-folder"
          },
          {
            id: "downloads-folder",
            path: "/home/pilote/Downloads",
            name: "📥 Téléchargements",
            icon: "folder",
            description: "Fichiers téléchargés",
            isCustom: false,
            parentId: "home-folder"
          }
        ]
      },
      {
        id: "var-www-folder",
        path: "/var/www",
        name: "🌐 Sites Web",
        icon: "globe",
        description: "Tous les sites web hébergés",
        isCustom: false,
        parentId: "system-linux",
        isExpanded: true,
        children: [
          {
            id: "neurodopa-main",
            path: "/var/www/neurodopa",
            name: "Neurodopa Principal",
            icon: "globe",
            description: "Site principal neurodopa.fr",
            isCustom: false,
            parentId: "var-www-folder"
          },
          {
            id: "dashboard-folder",
            path: "/var/www/dashboard",
            name: "Dashboard",
            icon: "package",
            description: "Tableau de bord",
            isCustom: false,
            parentId: "var-www-folder"
          },
          {
            id: "api-folder",
            path: "/var/www/api",
            name: "API",
            icon: "server",
            description: "Services API REST",
            isCustom: false,
            parentId: "var-www-folder"
          }
        ]
      },
      {
        id: "etc-folder",
        path: "/etc",
        name: "⚙️ Configuration",
        icon: "settings",
        description: "Fichiers de configuration système",
        isCustom: false,
        parentId: "system-linux",
        isExpanded: false,
        children: [
          {
            id: "nginx-config",
            path: "/etc/nginx",
            name: "Nginx",
            icon: "server",
            description: "Configuration serveur web",
            isCustom: false,
            parentId: "etc-folder",
            children: [
              {
                id: "sites-available",
                path: "/etc/nginx/sites-available",
                name: "Sites disponibles",
                icon: "folder",
                description: "Configurations disponibles",
                isCustom: false,
                parentId: "nginx-config"
              },
              {
                id: "sites-enabled",
                path: "/etc/nginx/sites-enabled",
                name: "Sites activés",
                icon: "folder",
                description: "Configurations actives",
                isCustom: false,
                parentId: "nginx-config"
              }
            ]
          },
          {
            id: "systemd-config",
            path: "/etc/systemd",
            name: "SystemD",
            icon: "settings",
            description: "Services système",
            isCustom: false,
            parentId: "etc-folder"
          },
          {
            id: "ssh-config",
            path: "/etc/ssh",
            name: "SSH",
            icon: "server",
            description: "Configuration SSH",
            isCustom: false,
            parentId: "etc-folder"
          }
        ]
      },
      {
        id: "opt-folder",
        path: "/opt",
        name: "📦 Applications",
        icon: "package",
        description: "Applications tierces",
        isCustom: false,
        parentId: "system-linux",
        isExpanded: false,
        children: [
          {
            id: "nodejs-folder",
            path: "/opt/nodejs",
            name: "Node.js",
            icon: "package",
            description: "Runtime JavaScript",
            isCustom: false,
            parentId: "opt-folder"
          },
          {
            id: "docker-folder",
            path: "/opt/docker",
            name: "Docker",
            icon: "package",
            description: "Conteneurs Docker",
            isCustom: false,
            parentId: "opt-folder"
          }
        ]
      },
      {
        id: "usr-folder",
        path: "/usr",
        name: "🔧 Système Unix",
        icon: "folder",
        description: "Ressources système partagées",
        isCustom: false,
        parentId: "system-linux",
        isExpanded: false,
        children: [
          {
            id: "usr-local",
            path: "/usr/local",
            name: "Local",
            icon: "folder",
            description: "Applications locales",
            isCustom: false,
            parentId: "usr-folder"
          },
          {
            id: "usr-share",
            path: "/usr/share",
            name: "Share",
            icon: "folder",
            description: "Données partagées",
            isCustom: false,
            parentId: "usr-folder"
          },
          {
            id: "usr-bin",
            path: "/usr/bin",
            name: "Binaires",
            icon: "folder",
            description: "Exécutables système",
            isCustom: false,
            parentId: "usr-folder"
          }
        ]
      },
      {
        id: "var-folder",
        path: "/var",
        name: "📊 Variables",
        icon: "database",
        description: "Données variables du système",
        isCustom: false,
        parentId: "system-linux",
        isExpanded: false,
        children: [
          {
            id: "var-log",
            path: "/var/log",
            name: "Logs",
            icon: "folder",
            description: "Journaux système",
            isCustom: false,
            parentId: "var-folder",
            children: [
              {
                id: "nginx-logs",
                path: "/var/log/nginx",
                name: "Nginx Logs",
                icon: "folder",
                description: "Logs du serveur web",
                isCustom: false,
                parentId: "var-log"
              },
              {
                id: "system-logs",
                path: "/var/log/syslog",
                name: "System Log",
                icon: "folder",
                description: "Journal système principal",
                isCustom: false,
                parentId: "var-log"
              }
            ]
          },
          {
            id: "var-cache",
            path: "/var/cache",
            name: "Cache",
            icon: "folder",
            description: "Cache système",
            isCustom: false,
            parentId: "var-folder"
          },
          {
            id: "var-lib",
            path: "/var/lib",
            name: "Libraries",
            icon: "folder",
            description: "Données d'applications",
            isCustom: false,
            parentId: "var-folder"
          }
        ]
      },
      {
        id: "root-folder",
        path: "/root",
        name: "🔐 Root",
        icon: "folder",
        description: "Dossier administrateur",
        isCustom: false,
        parentId: "system-linux",
        isExpanded: false
      },
      {
        id: "tmp-folder",
        path: "/tmp",
        name: "🗑️ Temporaire",
        icon: "folder",
        description: "Fichiers temporaires",
        isCustom: false,
        parentId: "system-linux",
        isExpanded: false
      }
    ]
  }
];

export default function SidebarManager({ onFolderClick, currentPath }: SidebarManagerProps) {
  const [folders, setFolders] = useState<SidebarFolder[]>([]);
  const [editingFolder, setEditingFolder] = useState<SidebarFolder | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    path: "",
    icon: "folder",
    description: ""
  });

  // Load folders from localStorage on mount
  useEffect(() => {
    const savedFolders = localStorage.getItem("sftp-sidebar-folders");
    if (savedFolders) {
      try {
        const parsed = JSON.parse(savedFolders);
        setFolders(parsed);
      } catch {
        setFolders(DEFAULT_STRUCTURE);
      }
    } else {
      setFolders(DEFAULT_STRUCTURE);
    }
  }, []);

  // Save folders to localStorage when they change
  useEffect(() => {
    if (folders.length > 0) {
      localStorage.setItem("sftp-sidebar-folders", JSON.stringify(folders));
    }
  }, [folders]);

  const generateId = () => {
    return `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const toggleFolderExpand = (folderId: string) => {
    setFolders(prevFolders => {
      const updateFolder = (items: SidebarFolder[]): SidebarFolder[] => {
        return items.map(folder => {
          if (folder.id === folderId) {
            return { ...folder, isExpanded: !folder.isExpanded };
          }
          if (folder.children) {
            return { ...folder, children: updateFolder(folder.children) };
          }
          return folder;
        });
      };
      return updateFolder(prevFolders);
    });
  };

  const handleCreateFolder = () => {
    const newFolder: SidebarFolder = {
      id: generateId(),
      name: formData.name,
      path: formData.path,
      icon: formData.icon,
      description: formData.description,
      isCustom: true,
      parentId: selectedParent,
      order: folders.length,
      isExpanded: false,
      children: []
    };

    if (selectedParent) {
      // Add as child to selected parent
      setFolders(prevFolders => {
        const addToParent = (items: SidebarFolder[]): SidebarFolder[] => {
          return items.map(folder => {
            if (folder.id === selectedParent) {
              return {
                ...folder,
                children: [...(folder.children || []), newFolder],
                isExpanded: true
              };
            }
            if (folder.children) {
              return { ...folder, children: addToParent(folder.children) };
            }
            return folder;
          });
        };
        return addToParent(prevFolders);
      });
    } else {
      // Add as root folder
      setFolders(prev => [...prev, newFolder]);
    }

    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEditFolder = () => {
    if (!editingFolder) return;

    setFolders(prevFolders => {
      const updateFolder = (items: SidebarFolder[]): SidebarFolder[] => {
        return items.map(folder => {
          if (folder.id === editingFolder.id) {
            return {
              ...folder,
              name: formData.name,
              path: formData.path,
              icon: formData.icon,
              description: formData.description
            };
          }
          if (folder.children) {
            return { ...folder, children: updateFolder(folder.children) };
          }
          return folder;
        });
      };
      return updateFolder(prevFolders);
    });

    setIsEditDialogOpen(false);
    setEditingFolder(null);
    resetForm();
  };

  const handleDeleteFolder = (folderId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce dossier et tous ses sous-dossiers ?")) {
      return;
    }

    setFolders(prevFolders => {
      const removeFolder = (items: SidebarFolder[]): SidebarFolder[] => {
        return items
          .filter(folder => folder.id !== folderId)
          .map(folder => {
            if (folder.children) {
              return { ...folder, children: removeFolder(folder.children) };
            }
            return folder;
          });
      };
      return removeFolder(prevFolders);
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      path: "",
      icon: "folder",
      description: ""
    });
    setSelectedParent(null);
  };

  const openCreateDialog = (parentId: string | null = null) => {
    setSelectedParent(parentId);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (folder: SidebarFolder) => {
    setEditingFolder(folder);
    setFormData({
      name: folder.name,
      path: folder.path,
      icon: folder.icon || "folder",
      description: folder.description || ""
    });
    setIsEditDialogOpen(true);
  };

  const resetToDefault = () => {
    if (confirm("Réinitialiser la structure par défaut ? Tous vos dossiers personnalisés seront perdus.")) {
      setFolders(DEFAULT_STRUCTURE);
    }
  };

  const renderFolder = (folder: SidebarFolder, level: number = 0) => {
    const isActive = currentPath === folder.path;
    const hasChildren = folder.children && folder.children.length > 0;

    return (
      <div key={folder.id} className="w-full">
        <div
          className={`
            flex items-center justify-between group hover:bg-gray-50 rounded-md px-2 py-1.5 cursor-pointer
            ${isActive ? 'bg-blue-50 text-blue-600' : ''}
          `}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          <div 
            className="flex items-center flex-1 min-w-0"
            onClick={() => onFolderClick(folder.path)}
          >
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolderExpand(folder.id);
                }}
                className="mr-1 hover:bg-gray-200 rounded p-0.5"
              >
                {folder.isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-5" />}
            
            <span className="text-sm truncate">{folder.name}</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => openCreateDialog(folder.id)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un sous-dossier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditDialog(folder)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeleteFolder(folder.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onFolderClick(folder.path)}>
                <Star className="w-4 h-4 mr-2" />
                Ajouter aux favoris
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {folder.description && (
          <div className="text-xs text-gray-500 pl-9 pr-2 -mt-1 mb-1" style={{ paddingLeft: `${level * 12 + 32}px` }}>
            {folder.description}
          </div>
        )}

        {hasChildren && folder.isExpanded && (
          <div>
            {folder.children!.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">Structure</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => openCreateDialog(null)}
            title="Ajouter un dossier racine"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <button
          onClick={resetToDefault}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Réinitialiser la structure par défaut
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {folders.map(folder => renderFolder(folder))}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Créer un nouveau dossier</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau dossier à votre structure de navigation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du dossier</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Mon Dossier"
              />
            </div>

            <div>
              <Label htmlFor="path">Chemin SFTP</Label>
              <Input
                id="path"
                value={formData.path}
                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                placeholder="/home/user/dossier"
              />
            </div>

            <div>
              <Label htmlFor="icon">Icône</Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du dossier..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreateFolder}
              disabled={!formData.name || !formData.path}
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Modifier le dossier</DialogTitle>
            <DialogDescription>
              Modifiez les informations du dossier
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nom du dossier</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Mon Dossier"
              />
            </div>

            <div>
              <Label htmlFor="edit-path">Chemin SFTP</Label>
              <Input
                id="edit-path"
                value={formData.path}
                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                placeholder="/home/user/dossier"
              />
            </div>

            <div>
              <Label htmlFor="edit-icon">Icône</Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-description">Description (optionnel)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du dossier..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleEditFolder}
              disabled={!formData.name || !formData.path}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}