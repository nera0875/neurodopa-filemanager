import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const STORAGE_PATH = path.join(process.env.HOME || "/home/pilote", "storage", "files");

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get("path");
    
    if (!filePath) {
      return NextResponse.json({ error: "No file path provided" }, { status: 400 });
    }

    const fullPath = path.join(STORAGE_PATH, filePath);
    
    // Security check
    if (!fullPath.startsWith(STORAGE_PATH)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const stats = await fs.stat(fullPath);
    
    if (!stats.isFile()) {
      return NextResponse.json({ error: "Not a file" }, { status: 400 });
    }

    const fileBuffer = await fs.readFile(fullPath);
    const fileName = path.basename(fullPath);

    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/octet-stream",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}