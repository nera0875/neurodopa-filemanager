import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const STORAGE_PATH = path.join(process.env.HOME || "/home/pilote", "storage", "files");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const uploadPath = formData.get("path") as string || "/";
    
    const fullPath = path.join(STORAGE_PATH, uploadPath);
    
    // Security check
    if (!fullPath.startsWith(STORAGE_PATH)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const uploadResults = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = path.join(fullPath, file.name);
        
        await fs.writeFile(filePath, buffer);
        return { name: file.name, status: "uploaded" };
      })
    );

    return NextResponse.json({ results: uploadResults });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}