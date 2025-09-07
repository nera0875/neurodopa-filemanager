import { NextRequest, NextResponse } from "next/server";
import { getSFTPManager } from "@/lib/sftp-client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get("path") || "/";
    
    const sftpManager = getSFTPManager();
    
    if (!sftpManager.isConnected()) {
      return NextResponse.json({ error: "Not connected to SFTP" }, { status: 401 });
    }

    const files = await sftpManager.list(path);
    
    const formattedFiles = files.map(file => ({
      name: file.name,
      type: file.type === 'd' ? 'folder' : 'file',
      size: file.size,
      modified: new Date(file.modifyTime).toISOString(),
      path: path === '/' ? `/${file.name}` : `${path}/${file.name}`,
      permissions: file.rights,
      owner: file.owner,
      group: file.group
    }));

    return NextResponse.json({ 
      files: formattedFiles,
      currentPath: path 
    });
  } catch (error) {
    console.error("SFTP list error:", error);
    return NextResponse.json({ 
      error: `Failed to list files: ${error}` 
    }, { status: 500 });
  }
}