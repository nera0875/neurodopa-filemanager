import Client from 'ssh2-sftp-client';

export interface SFTPConfig {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
}

export interface RemoteFile {
  name: string;
  type: 'd' | '-' | 'l';
  size: number;
  modifyTime: number;
  accessTime: number;
  rights: {
    user: string;
    group: string;
    other: string;
  };
  owner: number;
  group: number;
}

class SFTPManager {
  private client: Client;
  private config: SFTPConfig | null = null;
  private connected: boolean = false;

  constructor() {
    this.client = new Client();
  }

  async connect(config: SFTPConfig): Promise<void> {
    try {
      this.config = config;
      await this.client.connect({
        host: config.host,
        port: config.port || 22,
        username: config.username,
        password: config.password,
        privateKey: config.privateKey,
        readyTimeout: 10000,
      });
      this.connected = true;
    } catch (error) {
      this.connected = false;
      throw new Error(`Connection failed: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.end();
      this.connected = false;
    }
  }

  async list(remotePath: string = '/'): Promise<RemoteFile[]> {
    if (!this.connected) throw new Error('Not connected');
    
    try {
      const files = await this.client.list(remotePath);
      return files.map(file => ({
        ...file,
        type: file.type as 'd' | '-' | 'l'
      }));
    } catch (error) {
      throw new Error(`Failed to list directory: ${error}`);
    }
  }

  async download(remotePath: string): Promise<Buffer> {
    if (!this.connected) throw new Error('Not connected');
    
    try {
      const buffer = await this.client.get(remotePath);
      return buffer as Buffer;
    } catch (error) {
      throw new Error(`Failed to download file: ${error}`);
    }
  }

  async upload(remotePath: string, data: Buffer): Promise<void> {
    if (!this.connected) throw new Error('Not connected');
    
    try {
      await this.client.put(data, remotePath);
    } catch (error) {
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  async mkdir(remotePath: string): Promise<void> {
    if (!this.connected) throw new Error('Not connected');
    
    try {
      await this.client.mkdir(remotePath, true);
    } catch (error) {
      throw new Error(`Failed to create directory: ${error}`);
    }
  }

  async delete(remotePath: string): Promise<void> {
    if (!this.connected) throw new Error('Not connected');
    
    try {
      const stats = await this.client.stat(remotePath);
      if (stats.isDirectory) {
        await this.client.rmdir(remotePath, true);
      } else {
        await this.client.delete(remotePath);
      }
    } catch (error) {
      throw new Error(`Failed to delete: ${error}`);
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    if (!this.connected) throw new Error('Not connected');
    
    try {
      await this.client.rename(oldPath, newPath);
    } catch (error) {
      throw new Error(`Failed to rename: ${error}`);
    }
  }

  async exists(remotePath: string): Promise<boolean> {
    if (!this.connected) throw new Error('Not connected');
    
    try {
      await this.client.stat(remotePath);
      return true;
    } catch {
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConfig(): SFTPConfig | null {
    return this.config;
  }

  async readFile(remotePath: string): Promise<{ content: string | Buffer, type: 'text' | 'image', size: number, extension: string }> {
    if (!this.connected) throw new Error('Not connected');
    
    try {
      // Check if path exists and is a file
      const stats = await this.client.stat(remotePath);
      if (stats.isDirectory) {
        throw new Error('Path is a directory, not a file');
      }

      // Check file size (limit to 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (stats.size > maxSize) {
        throw new Error('File too large for preview');
      }

      // Determine file type
      const extension = remotePath.split('.').pop()?.toLowerCase() || '';
      const isTextFile = [
        'txt', 'md', 'js', 'ts', 'jsx', 'tsx', 'json', 'xml', 'html', 'css', 'scss', 'sass',
        'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'rb', 'go', 'rs', 'sh', 'bash',
        'yml', 'yaml', 'toml', 'ini', 'conf', 'config', 'env', 'gitignore', 'dockerfile',
        'sql', 'r', 'scala', 'kt', 'swift', 'dart', 'vue', 'svelte', 'astro', 'mjs',
        'log', 'csv', 'tsv'
      ].includes(extension);

      const isImageFile = [
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff'
      ].includes(extension);

      if (!isTextFile && !isImageFile) {
        throw new Error('File type not supported for preview');
      }

      const buffer = await this.client.get(remotePath) as Buffer;
      
      if (isImageFile) {
        return {
          content: buffer,
          type: 'image',
          size: stats.size,
          extension
        };
      } else {
        return {
          content: buffer.toString('utf-8'),
          type: 'text',
          size: stats.size,
          extension
        };
      }
    } catch (error) {
      throw new Error(`Failed to read file: ${error}`);
    }
  }

  async saveFile(remotePath: string, content: string): Promise<{ success: boolean, size: number, backupCreated: boolean }> {
    if (!this.connected) throw new Error('Not connected');
    
    try {
      // Create backup if file exists
      let backupCreated = false;
      try {
        const stats = await this.client.stat(remotePath);
        if (stats.isFile) {
          const backupPath = `${remotePath}.backup.${Date.now()}`;
          await this.client.rename(remotePath, backupPath);
          backupCreated = true;
        }
      } catch (error) {
        // File doesn't exist, no backup needed
      }

      // Convert content to buffer and write
      const buffer = Buffer.from(content, 'utf-8');
      await this.client.put(buffer, remotePath);
      
      // Verify write was successful
      const stats = await this.client.stat(remotePath);
      
      return {
        success: true,
        size: stats.size,
        backupCreated
      };
    } catch (error) {
      throw new Error(`Failed to save file: ${error}`);
    }
  }

  getClient(): Client {
    return this.client;
  }

  // Search functionality
  async searchFiles(searchOptions: SearchOptions): Promise<SearchResult[]> {
    if (!this.connected) throw new Error('Not connected');
    
    const results: SearchResult[] = [];
    
    try {
      await this.searchInDirectory(searchOptions.path, searchOptions, results);
      
      // Sort results by relevance (text matches first, then by filename matches)
      return results.sort((a, b) => {
        if (a.type === 'content' && b.type === 'filename') return -1;
        if (a.type === 'filename' && b.type === 'content') return 1;
        return b.relevance - a.relevance;
      });
    } catch (error) {
      throw new Error(`Search failed: ${error}`);
    }
  }

  private async searchInDirectory(dirPath: string, options: SearchOptions, results: SearchResult[]): Promise<void> {
    try {
      const files = await this.list(dirPath);
      
      for (const file of files) {
        const fullPath = dirPath === '/' ? `/${file.name}` : `${dirPath}/${file.name}`;
        
        // Skip if we've hit the maximum results
        if (results.length >= (options.maxResults || 100)) {
          return;
        }
        
        if (file.type === 'd') {
          // Recursively search in directories if enabled
          if (options.recursive) {
            await this.searchInDirectory(fullPath, options, results);
          }
        } else {
          // Search in files
          await this.searchInFile(fullPath, file, options, results);
        }
      }
    } catch (error) {
      // Continue searching other directories even if one fails
      console.warn(`Failed to search in directory ${dirPath}:`, error);
    }
  }

  private async searchInFile(filePath: string, file: RemoteFile, options: SearchOptions, results: SearchResult[]): Promise<void> {
    try {
      // Apply file type filters
      if (options.fileTypes && options.fileTypes.length > 0) {
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        if (!options.fileTypes.includes(extension)) {
          return;
        }
      }

      // Apply size filters
      if (options.minSize && file.size < options.minSize) return;
      if (options.maxSize && file.size > options.maxSize) return;

      // Apply date filters
      if (options.modifiedAfter && file.modifyTime < options.modifiedAfter.getTime()) return;
      if (options.modifiedBefore && file.modifyTime > options.modifiedBefore.getTime()) return;

      // Check filename match
      let filenameMatch = false;
      let filenameRelevance = 0;
      
      if (options.query) {
        const searchQuery = options.caseSensitive ? options.query : options.query.toLowerCase();
        const fileName = options.caseSensitive ? file.name : file.name.toLowerCase();
        
        if (options.useRegex) {
          try {
            const regex = new RegExp(searchQuery, options.caseSensitive ? 'g' : 'gi');
            if (regex.test(fileName)) {
              filenameMatch = true;
              filenameRelevance = fileName.includes(searchQuery) ? 100 : 50;
            }
          } catch {
            // Invalid regex, fall back to simple search
            if (fileName.includes(searchQuery)) {
              filenameMatch = true;
              filenameRelevance = fileName === searchQuery ? 100 : 75;
            }
          }
        } else {
          if (fileName.includes(searchQuery)) {
            filenameMatch = true;
            filenameRelevance = fileName === searchQuery ? 100 : 75;
          }
        }
      }

      // If searching in content or if filename matches, add to results
      if (options.searchInContent || filenameMatch || !options.query) {
        // Check if file is text file for content search
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        const isTextFile = [
          'txt', 'md', 'js', 'ts', 'jsx', 'tsx', 'json', 'xml', 'html', 'css', 'scss', 'sass',
          'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'rb', 'go', 'rs', 'sh', 'bash',
          'yml', 'yaml', 'toml', 'ini', 'conf', 'config', 'env', 'gitignore', 'dockerfile',
          'sql', 'r', 'scala', 'kt', 'swift', 'dart', 'vue', 'svelte', 'astro', 'mjs',
          'log', 'csv', 'tsv', 'properties', 'cfg'
        ].includes(extension);

        let contentMatches: ContentMatch[] = [];
        let hasContentMatch = false;

        // Search in file content for text files
        if (options.searchInContent && isTextFile && options.query && file.size < (options.maxContentSize || 10 * 1024 * 1024)) {
          try {
            const buffer = await this.client.get(filePath) as Buffer;
            const content = buffer.toString('utf-8');
            
            contentMatches = await this.searchInContent(content, options);
            hasContentMatch = contentMatches.length > 0;
          } catch (error) {
            console.warn(`Failed to read file for content search ${filePath}:`, error);
          }
        }

        // Add result if there's a match or no query (list all)
        if (filenameMatch || hasContentMatch || !options.query) {
          results.push({
            path: filePath,
            name: file.name,
            size: file.size,
            modified: new Date(file.modifyTime).toISOString(),
            type: hasContentMatch ? 'content' : 'filename',
            relevance: Math.max(filenameRelevance, contentMatches.reduce((max, match) => Math.max(max, match.relevance), 0)),
            matches: contentMatches,
            isTextFile
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to search file ${filePath}:`, error);
    }
  }

  private async searchInContent(content: string, options: SearchOptions): Promise<ContentMatch[]> {
    const matches: ContentMatch[] = [];
    const lines = content.split('\n');
    const searchQuery = options.caseSensitive ? options.query! : options.query!.toLowerCase();
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = options.caseSensitive ? lines[lineIndex] : lines[lineIndex].toLowerCase();
      
      if (options.useRegex) {
        try {
          const regex = new RegExp(searchQuery, options.caseSensitive ? 'g' : 'gi');
          let match;
          
          while ((match = regex.exec(line)) !== null) {
            const start = Math.max(0, match.index - 50);
            const end = Math.min(line.length, match.index + match[0].length + 50);
            
            matches.push({
              lineNumber: lineIndex + 1,
              content: lines[lineIndex].substring(start, end),
              matchStart: match.index - start,
              matchLength: match[0].length,
              relevance: this.calculateRelevance(match[0], options.query!)
            });
            
            if (matches.length >= (options.maxMatchesPerFile || 10)) break;
          }
        } catch {
          // Invalid regex, fall back to simple search
          const index = line.indexOf(searchQuery);
          if (index !== -1) {
            const start = Math.max(0, index - 50);
            const end = Math.min(line.length, index + searchQuery.length + 50);
            
            matches.push({
              lineNumber: lineIndex + 1,
              content: lines[lineIndex].substring(start, end),
              matchStart: index - start,
              matchLength: searchQuery.length,
              relevance: this.calculateRelevance(searchQuery, options.query!)
            });
          }
        }
      } else {
        const index = line.indexOf(searchQuery);
        if (index !== -1) {
          const start = Math.max(0, index - 50);
          const end = Math.min(line.length, index + searchQuery.length + 50);
          
          matches.push({
            lineNumber: lineIndex + 1,
            content: lines[lineIndex].substring(start, end),
            matchStart: index - start,
            matchLength: searchQuery.length,
            relevance: this.calculateRelevance(searchQuery, options.query!)
          });
        }
      }
      
      if (matches.length >= (options.maxMatchesPerFile || 10)) break;
    }
    
    return matches;
  }

  private calculateRelevance(match: string, query: string): number {
    if (match === query) return 100;
    if (match.toLowerCase() === query.toLowerCase()) return 90;
    if (match.includes(query)) return 80;
    if (match.toLowerCase().includes(query.toLowerCase())) return 70;
    return 50;
  }
}

export interface SearchOptions {
  query?: string;
  path: string;
  recursive: boolean;
  searchInContent: boolean;
  caseSensitive: boolean;
  useRegex: boolean;
  fileTypes?: string[];
  minSize?: number;
  maxSize?: number;
  modifiedAfter?: Date;
  modifiedBefore?: Date;
  maxResults?: number;
  maxMatchesPerFile?: number;
  maxContentSize?: number;
}

export interface ContentMatch {
  lineNumber: number;
  content: string;
  matchStart: number;
  matchLength: number;
  relevance: number;
}

export interface SearchResult {
  path: string;
  name: string;
  size: number;
  modified: string;
  type: 'filename' | 'content';
  relevance: number;
  matches: ContentMatch[];
  isTextFile: boolean;
}

// Singleton instance
let sftpManager: SFTPManager | null = null;

export function getSFTPManager(): SFTPManager {
  if (!sftpManager) {
    sftpManager = new SFTPManager();
  }
  return sftpManager;
}