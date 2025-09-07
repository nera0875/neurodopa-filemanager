import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const STORAGE_PATH = path.join(process.env.HOME || "/home/pilote", "storage", "files");

export async function POST(request: NextRequest) {
  try {
    const { path: filePath, content } = await request.json();
    
    if (!filePath || content === undefined) {
      return NextResponse.json({ error: "Missing path or content" }, { status: 400 });
    }

    const fullPath = path.join(STORAGE_PATH, filePath);
    
    // Security check
    if (!fullPath.startsWith(STORAGE_PATH)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    await fs.writeFile(fullPath, content, "utf-8");
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Write error:", error);
    return NextResponse.json({ error: "Failed to write file" }, { status: 500 });
  }
}