import { NextRequest, NextResponse } from "next/server";
import { getSFTPManager } from "@/lib/sftp-client";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

export async function POST(request: NextRequest) {
  try {
    const { host, port, username, password } = await request.json();
    
    if (!host || !username || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sftpManager = getSFTPManager();
    
    // Disconnect if already connected
    if (sftpManager.isConnected()) {
      await sftpManager.disconnect();
    }

    // Connect to SFTP
    await sftpManager.connect({
      host,
      port: port || 22,
      username,
      password
    });

    // Generate JWT token for session
    const token = jwt.sign(
      { host, username, connected: true },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response = NextResponse.json({ 
      success: true,
      message: "Connected successfully",
      user: { host, username }
    });

    // Set token as cookie
    response.cookies.set('sftp-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400 // 24 hours
    });

    return response;
  } catch (error) {
    console.error("SFTP connection error:", error);
    return NextResponse.json({ 
      error: `Connection failed: ${error}` 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sftpManager = getSFTPManager();
    
    if (sftpManager.isConnected()) {
      await sftpManager.disconnect();
    }

    const response = NextResponse.json({ 
      success: true,
      message: "Disconnected successfully"
    });

    // Clear session cookie
    response.cookies.delete('sftp-session');

    return response;
  } catch (error) {
    console.error("SFTP disconnect error:", error);
    return NextResponse.json({ 
      error: "Failed to disconnect" 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sftpManager = getSFTPManager();
    const isConnected = sftpManager.isConnected();
    const config = sftpManager.getConfig();

    return NextResponse.json({
      connected: isConnected,
      host: config?.host,
      username: config?.username
    });
  } catch (error) {
    return NextResponse.json({ 
      connected: false 
    });
  }
}