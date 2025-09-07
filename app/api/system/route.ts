import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);
const STORAGE_PATH = path.join(process.env.HOME || "/home/pilote", "storage", "files");

async function getDiskUsage() {
  try {
    const { stdout } = await execAsync("df -h /");
    const lines = stdout.trim().split('\n');
    const data = lines[1].split(/\s+/);
    
    return {
      total: data[1],
      used: data[2],
      available: data[3],
      percentage: parseInt(data[4])
    };
  } catch {
    return null;
  }
}

async function getSystemInfo() {
  try {
    const uptime = await execAsync("uptime");
    const memory = await execAsync("free -h");
    const cpu = await execAsync("top -bn1 | grep 'Cpu(s)' | head -1");
    
    // Parse memory
    const memLines = memory.stdout.split('\n');
    const memData = memLines[1].split(/\s+/);
    
    return {
      uptime: uptime.stdout.trim(),
      memory: {
        total: memData[1],
        used: memData[2],
        free: memData[3]
      },
      cpu: cpu.stdout.trim()
    };
  } catch {
    return null;
  }
}

async function getStorageStats() {
  try {
    const stats = await fs.stat(STORAGE_PATH);
    const { stdout } = await execAsync(`du -sh ${STORAGE_PATH}`);
    const size = stdout.split('\t')[0];
    
    // Count files and folders
    const countFiles = async (dir: string): Promise<{files: number, folders: number}> => {
      let files = 0;
      let folders = 0;
      
      const items = await fs.readdir(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = await fs.stat(itemPath);
        
        if (stat.isDirectory()) {
          folders++;
          const subCount = await countFiles(itemPath);
          files += subCount.files;
          folders += subCount.folders;
        } else {
          files++;
        }
      }
      
      return { files, folders };
    };
    
    const counts = await countFiles(STORAGE_PATH);
    
    return {
      totalSize: size,
      filesCount: counts.files,
      foldersCount: counts.folders
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const [disk, system, storage] = await Promise.all([
      getDiskUsage(),
      getSystemInfo(),
      getStorageStats()
    ]);
    
    return NextResponse.json({
      disk,
      system,
      storage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("System info error:", error);
    return NextResponse.json({ error: "Failed to get system info" }, { status: 500 });
  }
}