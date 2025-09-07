import { NextRequest, NextResponse } from 'next/server';
import { getSFTPManager } from '@/lib/sftp-client';

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    const sftpManager = getSFTPManager();
    
    if (!sftpManager.isConnected()) {
      return NextResponse.json({ error: 'No SFTP connection available' }, { status: 401 });
    }

    // Calculate folder size recursively
    const calculateSize = async (dirPath: string): Promise<number> => {
      try {
        const list = await sftpManager.list(dirPath);
        let totalSize = 0;

        for (const item of list) {
          if (item.type === 'd') {
            // Recursive call for subdirectories
            const subDirSize = await calculateSize(`${dirPath}/${item.name}`);
            totalSize += subDirSize;
          } else {
            // Add file size
            totalSize += item.size || 0;
          }
        }

        return totalSize;
      } catch (error) {
        console.error(`Error calculating size for ${dirPath}:`, error);
        return 0;
      }
    };

    const size = await calculateSize(path);

    return NextResponse.json({ 
      size,
      path,
      formattedSize: formatBytes(size)
    });

  } catch (error: unknown) {
    console.error('SFTP folder size error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to calculate folder size', details: errorMessage },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Store connection config (this is a simplified approach)
export function setConnectionConfig(config: unknown) {
  // This function is not currently used but kept for future compatibility
  console.log('Connection config set:', config);
}