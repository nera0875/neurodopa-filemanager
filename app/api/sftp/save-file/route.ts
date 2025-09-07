import { NextRequest, NextResponse } from "next/server";
import { getSFTPManager } from "@/lib/sftp-client";
import type Client from 'ssh2-sftp-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, content } = body;
    
    if (!path || content === undefined) {
      return NextResponse.json({ error: "Path and content parameters required" }, { status: 400 });
    }

    const sftpManager = getSFTPManager();
    
    if (!sftpManager.isConnected()) {
      return NextResponse.json({ error: "No SFTP connection available" }, { status: 401 });
    }

    const result = await sftpManager.saveFile(path, content);
    
    return NextResponse.json({ 
      success: result.success,
      size: result.size,
      backupCreated: result.backupCreated
    });
    
  } catch (error) {
    console.error("Save file error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save file";
    
    if (errorMessage.includes("Not connected")) {
      return NextResponse.json({ error: "SFTP connection not available" }, { status: 401 });
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Also support PUT method for consistency
export async function PUT(request: NextRequest) {
  return POST(request);
}