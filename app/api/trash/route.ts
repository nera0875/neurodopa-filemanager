import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const STORAGE_PATH = path.join(process.env.HOME || "/home/pilote", "storage", "files");
const TRASH_PATH = path.join(process.env.HOME || "/home/pilote", "storage", ".trash");

async function moveToTrash(filePath: string) {
  const fileName = path.basename(filePath);
  const timestamp = Date.now();
  const trashedName = `${timestamp}_${fileName}`;
  const trashDest = path.join(TRASH_PATH, trashedName);
  
  await fs.mkdir(TRASH_PATH, { recursive: true });
  await fs.rename(filePath, trashDest);
  
  // Save metadata
  const metadataPath = path.join(TRASH_PATH, `${trashedName}.meta.json`);
  await fs.writeFile(metadataPath, JSON.stringify({
    originalPath: filePath,
    deletedAt: new Date().toISOString(),
    fileName: fileName
  }));
}

export async function POST(request: NextRequest) {
  try {
    const { paths } = await request.json();
    
    if (!Array.isArray(paths)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const results = await Promise.all(
      paths.map(async (relativePath) => {
        const fullPath = path.join(STORAGE_PATH, relativePath);
        
        // Security check
        if (!fullPath.startsWith(STORAGE_PATH)) {
          return { path: relativePath, status: "error", message: "Invalid path" };
        }

        try {
          await moveToTrash(fullPath);
          return { path: relativePath, status: "trashed" };
        } catch (error) {
          return { path: relativePath, status: "error", message: String(error) };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Trash error:", error);
    return NextResponse.json({ error: "Failed to move to trash" }, { status: 500 });
  }
}

// GET - List trash items
export async function GET() {
  try {
    await fs.mkdir(TRASH_PATH, { recursive: true });
    const files = await fs.readdir(TRASH_PATH);
    
    const trashItems = [];
    for (const file of files) {
      if (file.endsWith('.meta.json')) continue;
      
      const metaPath = path.join(TRASH_PATH, `${file}.meta.json`);
      try {
        const metadata = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
        const stats = await fs.stat(path.join(TRASH_PATH, file));
        
        trashItems.push({
          name: metadata.fileName,
          originalPath: metadata.originalPath,
          deletedAt: metadata.deletedAt,
          size: stats.size,
          trashPath: file
        });
      } catch {
        // Metadata not found, skip
      }
    }
    
    return NextResponse.json({ items: trashItems });
  } catch (error) {
    console.error("List trash error:", error);
    return NextResponse.json({ error: "Failed to list trash" }, { status: 500 });
  }
}

// DELETE - Empty trash or restore
export async function DELETE(request: NextRequest) {
  try {
    const { action, items } = await request.json();
    
    if (action === "empty") {
      // Empty entire trash
      const files = await fs.readdir(TRASH_PATH);
      for (const file of files) {
        await fs.rm(path.join(TRASH_PATH, file), { recursive: true, force: true });
      }
      return NextResponse.json({ success: true });
      
    } else if (action === "restore" && items) {
      // Restore specific items
      const results = await Promise.all(
        items.map(async (trashPath: string) => {
          try {
            const metaPath = path.join(TRASH_PATH, `${trashPath}.meta.json`);
            const metadata = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
            
            await fs.rename(
              path.join(TRASH_PATH, trashPath),
              metadata.originalPath
            );
            await fs.rm(metaPath);
            
            return { path: trashPath, status: "restored" };
          } catch (error) {
            return { path: trashPath, status: "error", message: String(error) };
          }
        })
      );
      return NextResponse.json({ results });
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Trash action error:", error);
    return NextResponse.json({ error: "Failed to perform trash action" }, { status: 500 });
  }
}