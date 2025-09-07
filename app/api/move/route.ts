import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const STORAGE_PATH = path.join(process.env.HOME || "/home/pilote", "storage", "files");

export async function POST(request: NextRequest) {
  try {
    const { sources, destination } = await request.json();
    
    if (!Array.isArray(sources) || !destination) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const destPath = path.join(STORAGE_PATH, destination);
    
    // Security check
    if (!destPath.startsWith(STORAGE_PATH)) {
      return NextResponse.json({ error: "Invalid destination" }, { status: 400 });
    }

    // Ensure destination directory exists
    await fs.mkdir(destPath, { recursive: true });

    const moveResults = await Promise.all(
      sources.map(async (sourcePath) => {
        const fullSourcePath = path.join(STORAGE_PATH, sourcePath);
        const fileName = path.basename(fullSourcePath);
        const fullDestPath = path.join(destPath, fileName);
        
        // Security check
        if (!fullSourcePath.startsWith(STORAGE_PATH)) {
          return { source: sourcePath, status: "error", message: "Invalid source path" };
        }

        try {
          await fs.rename(fullSourcePath, fullDestPath);
          return { source: sourcePath, status: "moved" };
        } catch (error) {
          return { source: sourcePath, status: "error", message: String(error) };
        }
      })
    );

    return NextResponse.json({ results: moveResults });
  } catch (error) {
    console.error("Move error:", error);
    return NextResponse.json({ error: "Move failed" }, { status: 500 });
  }
}