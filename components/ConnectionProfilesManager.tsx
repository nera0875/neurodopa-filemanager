"use client";

import React, { useState, useEffect } from "react";
import { 
  Save,
  Trash2,
  Edit2,
  Plus,
  Clock,
  Eye,
  EyeOff
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SFTPProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  createdAt: string;
  lastUsed?: string;
}

interface ConnectionProfilesManagerProps {
  onProfileSelect: (profile: SFTPProfile) => void;
  currentConnectionData?: {
    host: string;
    port: string;
    username: string;
    password: string;
  };
}

export default function ConnectionProfilesManager({ 
  onProfileSelect, 
  currentConnectionData 
}: ConnectionProfilesManagerProps) {
  const [profiles, setProfiles] = useState<SFTPProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  
  // Profile management dialog
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SFTPProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: "",
    host: "",
    port: "22",
    username: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // Save current connection dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sftp/profiles');
      const data = await response.json();
      
      if (response.ok) {
        // Sort profiles: recently used first, then by creation date
        const sortedProfiles = data.profiles.sort((a: SFTPProfile, b: SFTPProfile) => {
          if (a.lastUsed && b.lastUsed) {
            return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
          }
          if (a.lastUsed && !b.lastUsed) return -1;
          if (!a.lastUsed && b.lastUsed) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setProfiles(sortedProfiles);
      } else {
        setError(data.error || 'Failed to load profiles');
      }
    } catch (err) {
      setError('Error loading profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSelect = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    
    // Mark as used
    try {
      await fetch('/api/sftp/profiles/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId })
      });
    } catch (err) {
      console.error('Error updating profile usage:', err);
    }
    
    onProfileSelect(profile);
    loadProfiles(); // Refresh to update sort order
  };

  const handleSaveCurrentConnection = async () => {
    if (!currentConnectionData || !saveName.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/sftp/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName.trim(),
          host: currentConnectionData.host,
          port: currentConnectionData.port,
          username: currentConnectionData.username,
          password: currentConnectionData.password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSaveDialogOpen(false);
        setSaveName("");
        loadProfiles();
      } else {
        setError(data.error || 'Failed to save profile');
      }
    } catch (err) {
      setError('Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce profil ?')) return;
    
    try {
      const response = await fetch(`/api/sftp/profiles?id=${profileId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadProfiles();
        if (selectedProfileId === profileId) {
          setSelectedProfileId("");
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete profile');
      }
    } catch (err) {
      setError('Error deleting profile');
    }
  };

  const handleEditProfile = (profile: SFTPProfile) => {
    setEditingProfile(profile);
    setProfileForm({
      name: profile.name,
      host: profile.host,
      port: profile.port.toString(),
      username: profile.username,
      password: profile.password
    });
    setManageDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name || !profileForm.host || !profileForm.username) return;
    
    try {
      setLoading(true);
      const method = editingProfile ? 'PUT' : 'POST';
      const body = editingProfile 
        ? { id: editingProfile.id, ...profileForm }
        : profileForm;
      
      const response = await fetch('/api/sftp/profiles', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setManageDialogOpen(false);
        setEditingProfile(null);
        setProfileForm({ name: "", host: "", port: "22", username: "", password: "" });
        loadProfiles();
      } else {
        setError(data.error || 'Failed to save profile');
      }
    } catch (err) {
      setError('Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Quick Select */}
      <div className="space-y-2">
        <Label>Profils sauvegardés</Label>
        <div className="flex space-x-2">
          <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Choisir un profil..." />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={() => selectedProfileId && handleProfileSelect(selectedProfileId)}
            disabled={!selectedProfileId}
            variant="outline"
          >
            Charger
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <div className="flex space-x-2">
          <Button
            onClick={() => setSaveDialogOpen(true)}
            disabled={!currentConnectionData}
            variant="outline"
            size="sm"
          >
            <Save className="w-4 h-4 mr-1" />
            Sauvegarder
          </Button>
        </div>
        
        <Button
          onClick={() => {
            setEditingProfile(null);
            setProfileForm({ name: "", host: "", port: "22", username: "", password: "" });
            setManageDialogOpen(true);
          }}
          variant="outline"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Gérer
        </Button>
      </div>

      {/* Recent Profiles List */}
      {profiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-500">Profils récents</Label>
          <ScrollArea className="h-32 border rounded-md p-2">
            {profiles.slice(0, 3).map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer group"
                onClick={() => handleProfileSelect(profile.id)}
              >
                <div className="flex items-center space-x-2 flex-1">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{profile.name}</div>
                    <div className="text-xs text-gray-500">
                      {profile.username}@{profile.host}:{profile.port}
                    </div>
                  </div>
                  {profile.lastUsed && (
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(profile.lastUsed)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditProfile(profile);
                    }}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProfile(profile.id);
                    }}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-2 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Save Current Connection Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Sauvegarder la connexion</DialogTitle>
            <DialogDescription>
              Donnez un nom à cette configuration de connexion pour la réutiliser plus tard.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nom du profil</Label>
              <Input
                id="profile-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Mon Serveur VPS"
              />
            </div>
            
            {currentConnectionData && (
              <div className="bg-gray-50 p-3 rounded space-y-1">
                <div className="text-sm text-gray-600">Connexion actuelle:</div>
                <div className="text-sm">
                  <strong>{currentConnectionData.username}@{currentConnectionData.host}:{currentConnectionData.port}</strong>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSaveCurrentConnection}
              disabled={!saveName.trim() || loading}
            >
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Profiles Dialog */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>
              {editingProfile ? 'Modifier le profil' : 'Nouveau profil'}
            </DialogTitle>
            <DialogDescription>
              {editingProfile ? 'Modifiez les informations du profil de connexion' : 'Créez un nouveau profil de connexion'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-form-name">Nom du profil *</Label>
                <Input
                  id="profile-form-name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                  placeholder="Mon Serveur"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="profile-form-host">Hôte *</Label>
                <Input
                  id="profile-form-host"
                  value={profileForm.host}
                  onChange={(e) => setProfileForm({...profileForm, host: e.target.value})}
                  placeholder="192.168.1.100"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-form-port">Port</Label>
                <Input
                  id="profile-form-port"
                  type="number"
                  value={profileForm.port}
                  onChange={(e) => setProfileForm({...profileForm, port: e.target.value})}
                  placeholder="22"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="profile-form-username">Nom d&apos;utilisateur *</Label>
                <Input
                  id="profile-form-username"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                  placeholder="root"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profile-form-password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="profile-form-password"
                  type={showPassword ? "text" : "password"}
                  value={profileForm.password}
                  onChange={(e) => setProfileForm({...profileForm, password: e.target.value})}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* All Profiles List */}
            {!editingProfile && profiles.length > 0 && (
              <div className="border-t pt-4">
                <Label className="text-sm font-semibold">Profils existants</Label>
                <ScrollArea className="h-48 mt-2 border rounded p-2">
                  {profiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded group"
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="text-sm font-medium">{profile.name}</div>
                          <div className="text-xs text-gray-500">
                            {profile.username}@{profile.host}:{profile.port}
                          </div>
                          <div className="text-xs text-gray-400">
                            Créé le {formatDate(profile.createdAt)}
                            {profile.lastUsed && ` • Utilisé le ${formatDate(profile.lastUsed)}`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={() => handleEditProfile(profile)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteProfile(profile.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setManageDialogOpen(false);
                setEditingProfile(null);
                setProfileForm({ name: "", host: "", port: "22", username: "", password: "" });
              }}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSaveProfile}
              disabled={!profileForm.name || !profileForm.host || !profileForm.username || loading}
            >
              {editingProfile ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}