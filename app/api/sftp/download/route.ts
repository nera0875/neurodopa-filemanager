import { NextRequest, NextResponse } from "next/server";
import { getSFTPManager } from "@/lib/sftp-client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get("path");
    
    if (!filePath) {
      return NextResponse.json({ error: "No file path provided" }, { status: 400 });
    }

    const sftpManager = getSFTPManager();
    
    if (!sftpManager.isConnected()) {
      return NextResponse.json({ error: "Not connected to SFTP" }, { status: 401 });
    }

    const fileBuffer = await sftpManager.download(filePath);
    const fileName = filePath.split('/').pop() || 'download';

    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/octet-stream",
      },
    });
  } catch (error) {
    console.error("SFTP download error:", error);
    return NextResponse.json({ 
      error: `Download failed: ${error}` 
    }, { status: 500 });
  }
}