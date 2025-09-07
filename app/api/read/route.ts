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

    const content = await fs.readFile(fullPath, "utf-8");
    
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Read error:", error);
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}