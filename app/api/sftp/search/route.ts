import { NextRequest, NextResponse } from "next/server";
import { getSFTPManager, SearchOptions } from "@/lib/sftp-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query,
      path = "/",
      recursive = true,
      searchInContent = true,
      caseSensitive = false,
      useRegex = false,
      fileTypes = [],
      minSize,
      maxSize,
      modifiedAfter,
      modifiedBefore,
      maxResults = 100,
      maxMatchesPerFile = 10,
      maxContentSize = 10 * 1024 * 1024 // 10MB
    } = body;

    const sftpManager = getSFTPManager();
    
    if (!sftpManager.isConnected()) {
      return NextResponse.json({ error: "Not connected to SFTP" }, { status: 401 });
    }

    // Prepare search options
    const searchOptions: SearchOptions = {
      query,
      path,
      recursive,
      searchInContent,
      caseSensitive,
      useRegex,
      fileTypes: fileTypes.length > 0 ? fileTypes : undefined,
      minSize,
      maxSize,
      modifiedAfter: modifiedAfter ? new Date(modifiedAfter) : undefined,
      modifiedBefore: modifiedBefore ? new Date(modifiedBefore) : undefined,
      maxResults,
      maxMatchesPerFile,
      maxContentSize
    };

    // Perform search
    const results = await sftpManager.searchFiles(searchOptions);
    
    return NextResponse.json({
      success: true,
      results,
      totalResults: results.length,
      searchOptions: {
        query,
        path,
        recursive,
        searchInContent,
        caseSensitive,
        useRegex,
        fileTypes,
        filters: {
          minSize,
          maxSize,
          modifiedAfter,
          modifiedBefore
        }
      }
    });

  } catch (error) {
    console.error("SFTP search error:", error);
    return NextResponse.json({ 
      error: `Search failed: ${error}`,
      success: false 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Use POST method to perform search",
    supportedFileTypes: [
      'txt', 'md', 'js', 'ts', 'jsx', 'tsx', 'json', 'xml', 'html', 'css', 'scss', 'sass',
      'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'rb', 'go', 'rs', 'sh', 'bash',
      'yml', 'yaml', 'toml', 'ini', 'conf', 'config', 'env', 'gitignore', 'dockerfile',
      'sql', 'r', 'scala', 'kt', 'swift', 'dart', 'vue', 'svelte', 'astro', 'mjs',
      'log', 'csv', 'tsv', 'properties', 'cfg'
    ],
    maxFileSize: "10MB",
    maxResults: 100
  });
}