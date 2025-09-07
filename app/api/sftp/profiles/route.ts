import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { encrypt, decrypt } from '@/lib/encryption';

const PROFILES_FILE = path.join(process.cwd(), 'data', 'sftp-profiles.json');

export interface SFTPProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string; // Encrypted
  createdAt: string;
  lastUsed?: string;
}

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(PROFILES_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Load profiles from file
async function loadProfiles(): Promise<SFTPProfile[]> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(PROFILES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is invalid, return empty array
    return [];
  }
}

// Save profiles to file
async function saveProfiles(profiles: SFTPProfile[]): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(PROFILES_FILE, JSON.stringify(profiles, null, 2));
}

// GET - Retrieve all profiles
export async function GET() {
  try {
    const profiles = await loadProfiles();
    
    // Decrypt passwords for sending to client
    const decryptedProfiles = profiles.map(profile => ({
      ...profile,
      password: decrypt(profile.password)
    }));
    
    return NextResponse.json({ profiles: decryptedProfiles });
  } catch (error) {
    console.error('Error loading profiles:', error);
    return NextResponse.json({ error: 'Failed to load profiles' }, { status: 500 });
  }
}

// POST - Save a new profile
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, host, port, username, password } = body;
    
    if (!name || !host || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const profiles = await loadProfiles();
    
    // Check if name already exists
    const existingProfile = profiles.find(p => p.name === name);
    if (existingProfile) {
      return NextResponse.json({ error: 'Profile name already exists' }, { status: 400 });
    }
    
    const newProfile: SFTPProfile = {
      id: Date.now().toString(),
      name,
      host,
      port: parseInt(port) || 22,
      username,
      password: encrypt(password), // Encrypt password before saving
      createdAt: new Date().toISOString(),
    };
    
    profiles.push(newProfile);
    await saveProfiles(profiles);
    
    return NextResponse.json({ 
      profile: {
        ...newProfile,
        password: decrypt(newProfile.password) // Return decrypted for client
      }
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}

// PUT - Update an existing profile
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, host, port, username, password } = body;
    
    if (!id || !name || !host || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const profiles = await loadProfiles();
    const profileIndex = profiles.findIndex(p => p.id === id);
    
    if (profileIndex === -1) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    // Check if new name conflicts with another profile
    const nameConflict = profiles.find(p => p.name === name && p.id !== id);
    if (nameConflict) {
      return NextResponse.json({ error: 'Profile name already exists' }, { status: 400 });
    }
    
    // Update profile
    profiles[profileIndex] = {
      ...profiles[profileIndex],
      name,
      host,
      port: parseInt(port) || 22,
      username,
      password: password ? encrypt(password) : profiles[profileIndex].password, // Only encrypt if password changed
    };
    
    await saveProfiles(profiles);
    
    return NextResponse.json({ 
      profile: {
        ...profiles[profileIndex],
        password: decrypt(profiles[profileIndex].password)
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// DELETE - Remove a profile
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Profile ID required' }, { status: 400 });
    }
    
    const profiles = await loadProfiles();
    const filteredProfiles = profiles.filter(p => p.id !== id);
    
    if (filteredProfiles.length === profiles.length) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    await saveProfiles(filteredProfiles);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting profile:', error);
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }
}