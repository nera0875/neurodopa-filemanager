import { NextRequest, NextResponse } from "next/server";
import { getSFTPManager } from "@/lib/sftp-client";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const uploadPath = formData.get("path") as string || "/";
    
    const sftpManager = getSFTPManager();
    
    if (!sftpManager.isConnected()) {
      return NextResponse.json({ error: "Not connected to SFTP" }, { status: 401 });
    }

    const uploadResults = await Promise.all(
      files.map(async (file) => {
        try {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const remotePath = uploadPath === '/' 
            ? `/${file.name}` 
            : `${uploadPath}/${file.name}`;
          
          await sftpManager.upload(remotePath, buffer);
          return { name: file.name, status: "uploaded" };
        } catch (error) {
          return { name: file.name, status: "error", message: String(error) };
        }
      })
    );

    return NextResponse.json({ results: uploadResults });
  } catch (error) {
    console.error("SFTP upload error:", error);
    return NextResponse.json({ 
      error: `Upload failed: ${error}` 
    }, { status: 500 });
  }
}