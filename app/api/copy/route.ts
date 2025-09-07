import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const STORAGE_PATH = path.join(process.env.HOME || "/home/pilote", "storage", "files");

async function copyRecursive(src: string, dest: string) {
  const stats = await fs.stat(src);
  
  if (stats.isDirectory()) {
    await fs.mkdir(dest, { recursive: true });
    const files = await fs.readdir(src);
    
    for (const file of files) {
      await copyRecursive(
        path.join(src, file),
        path.join(dest, file)
      );
    }
  } else {
    await fs.copyFile(src, dest);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { source, destination } = await request.json();
    
    if (!source || !destination) {
      return NextResponse.json({ error: "Missing source or destination" }, { status: 400 });
    }

    const fullSourcePath = path.join(STORAGE_PATH, source);
    const fileName = path.basename(fullSourcePath);
    const fullDestPath = path.join(STORAGE_PATH, destination, fileName);
    
    // Security check
    if (!fullSourcePath.startsWith(STORAGE_PATH) || !fullDestPath.startsWith(STORAGE_PATH)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // If destination exists, add a copy suffix
    let copyIndex = 1;
    let finalDestPath = fullDestPath;
    while (true) {
      try {
        await fs.access(finalDestPath);
        const ext = path.extname(fileName);
        const nameWithoutExt = path.basename(fileName, ext);
        finalDestPath = path.join(
          path.dirname(fullDestPath),
          `${nameWithoutExt}_copy${copyIndex}${ext}`
        );
        copyIndex++;
      } catch {
        break;
      }
    }

    await copyRecursive(fullSourcePath, finalDestPath);
    
    return NextResponse.json({ 
      success: true, 
      newPath: path.relative(STORAGE_PATH, finalDestPath)
    });
  } catch (error) {
    console.error("Copy error:", error);
    return NextResponse.json({ error: "Failed to copy" }, { status: 500 });
  }
}