import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'sftp-manager-key-2024-secure-32-char'; // Should be in .env
const ALGORITHM = 'aes-256-cbc';

// Ensure key is exactly 32 bytes for AES-256
function getKey(): Buffer {
  const key = ENCRYPTION_KEY;
  return crypto.createHash('sha256').update(key).digest();
}

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, getKey());
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return iv + encrypted data
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    // Simple base64 fallback for basic obfuscation
    return 'b64:' + Buffer.from(text).toString('base64');
  }
}

export function decrypt(encryptedText: string): string {
  try {
    if (encryptedText.startsWith('b64:')) {
      // Base64 fallback
      return Buffer.from(encryptedText.substring(4), 'base64').toString('utf8');
    }
    
    if (!encryptedText.includes(':')) {
      // Plain text, return as is
      return encryptedText;
    }
    
    const [ivHex, encrypted] = encryptedText.split(':');
    const decipher = crypto.createDecipher(ALGORITHM, getKey());
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedText; // Fallback to encrypted text
  }
}