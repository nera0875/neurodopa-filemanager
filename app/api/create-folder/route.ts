import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const STORAGE_PATH = path.join(process.env.HOME || "/home/pilote", "storage", "files");

export async function POST(request: NextRequest) {
  try {
    const { path: folderPath, name } = await request.json();
    
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid folder name" }, { status: 400 });
    }

    const fullPath = path.join(STORAGE_PATH, folderPath || "/", name);
    
    // Security check
    if (!fullPath.startsWith(STORAGE_PATH)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    await fs.mkdir(fullPath, { recursive: true });

    return NextResponse.json({ success: true, path: path.join(folderPath || "/", name) });
  } catch (error) {
    console.error("Create folder error:", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}