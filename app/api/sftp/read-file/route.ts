import { NextRequest, NextResponse } from "next/server";
import { getSFTPManager } from "@/lib/sftp-client";
import type Client from 'ssh2-sftp-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");
    
    if (!filePath) {
      return NextResponse.json({ error: "Path parameter required" }, { status: 400 });
    }

    const sftpManager = getSFTPManager();
    
    if (!sftpManager.isConnected()) {
      return NextResponse.json({ error: "No SFTP connection available" }, { status: 401 });
    }

    const result = await sftpManager.readFile(filePath);
    
    if (result.type === 'image') {
      const base64 = (result.content as Buffer).toString('base64');
      const mimeType = getMimeType(result.extension);
      
      return NextResponse.json({
        type: 'image',
        content: `data:${mimeType};base64,${base64}`,
        size: result.size,
        extension: result.extension,
        mimeType
      });
    } else {
      return NextResponse.json({
        type: 'text',
        content: result.content as string,
        size: result.size,
        extension: result.extension,
        encoding: 'utf-8'
      });
    }
  } catch (error) {
    console.error("Read file error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to read file";
    
    if (errorMessage.includes("Not connected")) {
      return NextResponse.json({ error: "SFTP connection not available" }, { status: 401 });
    } else if (errorMessage.includes("File too large")) {
      return NextResponse.json({ error: errorMessage }, { status: 413 });
    } else if (errorMessage.includes("not supported")) {
      return NextResponse.json({ error: errorMessage }, { status: 415 });
    } else if (errorMessage.includes("directory")) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'tiff': 'image/tiff'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}