/**
 * Node.js filesystem adapter
 * Wraps fs module for dependency injection and testability
 */

import fs from 'fs';
import type { FileSystem } from '../lib/ports';

export class NodeFileSystemAdapter implements FileSystem {
  existsSync(path: string): boolean {
    return fs.existsSync(path);
  }

  mkdirSync(path: string, options?: { recursive: boolean }): void {
    fs.mkdirSync(path, options);
  }

  async writeFile(path: string, data: Buffer): Promise<void> {
    await fs.promises.writeFile(path, data);
  }

  async unlink(path: string): Promise<void> {
    await fs.promises.unlink(path);
  }
}
