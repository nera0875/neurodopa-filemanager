import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { stat } from "fs/promises";

const STORAGE_PATH = path.join(process.env.HOME || "/home/pilote", "storage", "files");

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestPath = searchParams.get("path") || "/";
    
    const fullPath = path.join(STORAGE_PATH, requestPath);
    
    // Security check
    if (!fullPath.startsWith(STORAGE_PATH)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const files = await fs.readdir(fullPath);
    const fileDetails = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(fullPath, file);
        const stats = await stat(filePath);
        return {
          name: file,
          type: stats.isDirectory() ? "folder" : "file",
          size: stats.isFile() ? stats.size : undefined,
          modified: stats.mtime.toISOString(),
          path: path.join(requestPath, file),
        };
      })
    );

    return NextResponse.json({ files: fileDetails });
  } catch (error) {
    console.error("Error reading files:", error);
    return NextResponse.json({ error: "Failed to read files" }, { status: 500 });
  }
}