import { NextRequest, NextResponse } from "next/server";
import { getSFTPManager } from "@/lib/sftp-client";

export async function POST(request: NextRequest) {
  try {
    const { oldPath, newPath } = await request.json();
    
    if (!oldPath || !newPath) {
      return NextResponse.json({ 
        error: "Old path and new path are required" 
      }, { status: 400 });
    }

    const sftpManager = getSFTPManager();
    
    if (!sftpManager.isConnected()) {
      return NextResponse.json({ 
        error: "Not connected to SFTP" 
      }, { status: 401 });
    }

    await sftpManager.rename(oldPath, newPath);

    return NextResponse.json({ 
      success: true,
      message: "File renamed successfully" 
    });
  } catch (error) {
    console.error("SFTP rename error:", error);
    return NextResponse.json({ 
      error: `Rename failed: ${error}` 
    }, { status: 500 });
  }
}