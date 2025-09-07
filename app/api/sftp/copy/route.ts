import { NextRequest, NextResponse } from 'next/server';
import { getSFTPManager } from '@/lib/sftp-client';
import Client from 'ssh2-sftp-client';

export async function POST(request: NextRequest) {
  try {
    const { sourcePath, destPath, operation } = await request.json();

    if (!sourcePath || !destPath || !operation) {
      return NextResponse.json(
        { error: 'Source path, destination path, and operation are required' },
        { status: 400 }
      );
    }

    if (!['copy', 'cut'].includes(operation)) {
      return NextResponse.json(
        { error: 'Operation must be either "copy" or "cut"' },
        { status: 400 }
      );
    }

    const sftpManager = getSFTPManager();
    
    if (!sftpManager.isConnected()) {
      return NextResponse.json({ error: 'No SFTP connection available' }, { status: 401 });
    }

    const sftpClient = sftpManager.getClient();

    try {
      // Check if source exists
      const sourceExists = await sftpManager.exists(sourcePath);
      if (!sourceExists) {
        return NextResponse.json({ error: 'Source file/folder not found' }, { status: 404 });
      }

      // Check if destination already exists
      const destExists = await sftpManager.exists(destPath);
      if (destExists) {
        return NextResponse.json({ error: 'Destination already exists' }, { status: 409 });
      }

      // Get source stats to determine if it's a file or directory using the client directly
      const stats = await sftpClient.stat(sourcePath);
      
      if (stats.isDirectory) {
        // Handle directory copy/move
        await copyDirectory(sftpClient, sourcePath, destPath);
        
        if (operation === 'cut') {
          await sftpClient.rmdir(sourcePath, true);
        }
      } else {
        // Handle file copy/move
        if (operation === 'copy') {
          // Read file and write to destination
          const fileBuffer = await sftpClient.get(sourcePath);
          await sftpClient.put(fileBuffer as Buffer, destPath);
        } else {
          // Move file
          await sftpManager.rename(sourcePath, destPath);
        }
      }

      return NextResponse.json({
        success: true,
        message: `File/folder ${operation === 'copy' ? 'copied' : 'moved'} successfully`,
        sourcePath,
        destPath,
        operation
      });

    } catch (error: unknown) {
      console.error('SFTP copy/move error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { error: 'Failed to perform operation', details: errorMessage },
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    console.error('SFTP copy route error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Server error', details: errorMessage },
      { status: 500 }
    );
  }
}

async function copyDirectory(client: Client, sourcePath: string, destPath: string) {
  // Create destination directory
  await client.mkdir(destPath, true);
  
  // Get list of files in source directory
  const files = await client.list(sourcePath);
  
  for (const file of files) {
    const sourceFilePath = `${sourcePath}/${file.name}`;
    const destFilePath = `${destPath}/${file.name}`;
    
    if (file.type === 'd') {
      // Recursively copy subdirectory
      await copyDirectory(client, sourceFilePath, destFilePath);
    } else {
      // Copy file
      const fileBuffer = await client.get(sourceFilePath);
      await client.put(fileBuffer as Buffer, destFilePath);
    }
  }
}