import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const STORAGE_PATH = path.join(process.env.HOME || "/home/pilote", "storage", "files");

async function deleteRecursive(filePath: string) {
  const stats = await fs.stat(filePath);
  
  if (stats.isDirectory()) {
    const files = await fs.readdir(filePath);
    await Promise.all(
      files.map(file => deleteRecursive(path.join(filePath, file)))
    );
    await fs.rmdir(filePath);
  } else {
    await fs.unlink(filePath);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { paths } = await request.json();
    
    if (!Array.isArray(paths)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const deleteResults = await Promise.all(
      paths.map(async (relativePath) => {
        const fullPath = path.join(STORAGE_PATH, relativePath);
        
        // Security check
        if (!fullPath.startsWith(STORAGE_PATH)) {
          return { path: relativePath, status: "error", message: "Invalid path" };
        }

        try {
          await deleteRecursive(fullPath);
          return { path: relativePath, status: "deleted" };
        } catch (error) {
          return { path: relativePath, status: "error", message: String(error) };
        }
      })
    );

    return NextResponse.json({ results: deleteResults });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}