import { NextRequest, NextResponse } from "next/server";
import { getSFTPManager } from "@/lib/sftp-client";

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get("path");
    const isDirectory = searchParams.get("isDirectory") === "true";
    
    if (!path) {
      return NextResponse.json({ 
        error: "Path is required" 
      }, { status: 400 });
    }

    const sftpManager = getSFTPManager();
    
    if (!sftpManager.isConnected()) {
      return NextResponse.json({ 
        error: "Not connected to SFTP" 
      }, { status: 401 });
    }

    await sftpManager.delete(path);

    return NextResponse.json({ 
      success: true,
      message: `${isDirectory ? "Directory" : "File"} deleted successfully` 
    });
  } catch (error) {
    console.error("SFTP delete error:", error);
    return NextResponse.json({ 
      error: `Delete failed: ${error}` 
    }, { status: 500 });
  }
}