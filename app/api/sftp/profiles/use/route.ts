import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const PROFILES_FILE = path.join(process.cwd(), 'data', 'sftp-profiles.json');

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

// Load profiles from file
async function loadProfiles(): Promise<SFTPProfile[]> {
  try {
    const data = await fs.readFile(PROFILES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Save profiles to file
async function saveProfiles(profiles: SFTPProfile[]): Promise<void> {
  const dataDir = path.dirname(PROFILES_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
  await fs.writeFile(PROFILES_FILE, JSON.stringify(profiles, null, 2));
}

// POST - Mark profile as used (update lastUsed timestamp)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profileId } = body;
    
    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID required' }, { status: 400 });
    }
    
    const profiles = await loadProfiles();
    const profileIndex = profiles.findIndex(p => p.id === profileId);
    
    if (profileIndex === -1) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    // Update last used timestamp
    profiles[profileIndex].lastUsed = new Date().toISOString();
    
    await saveProfiles(profiles);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile usage:', error);
    return NextResponse.json({ error: 'Failed to update profile usage' }, { status: 500 });
  }
}