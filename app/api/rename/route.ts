import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const STORAGE_PATH = path.join(process.env.HOME || "/home/pilote", "storage", "files");

export async function POST(request: NextRequest) {
  try {
    const { oldPath, newName } = await request.json();
    
    if (!oldPath || !newName) {
      return NextResponse.json({ error: "Missing path or new name" }, { status: 400 });
    }

    const fullOldPath = path.join(STORAGE_PATH, oldPath);
    const dir = path.dirname(fullOldPath);
    const fullNewPath = path.join(dir, newName);
    
    // Security check
    if (!fullOldPath.startsWith(STORAGE_PATH) || !fullNewPath.startsWith(STORAGE_PATH)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // Check if new name already exists
    try {
      await fs.access(fullNewPath);
      return NextResponse.json({ error: "A file with this name already exists" }, { status: 400 });
    } catch {
      // File doesn't exist, we can proceed
    }

    await fs.rename(fullOldPath, fullNewPath);
    
    return NextResponse.json({ success: true, newPath: path.join(path.dirname(oldPath), newName) });
  } catch (error) {
    console.error("Rename error:", error);
    return NextResponse.json({ error: "Failed to rename" }, { status: 500 });
  }
}