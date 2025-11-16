import fs from 'fs';
import path from 'path';
import { FollowingSnapshot } from '../types';
import { logger } from './logger';
import { config } from '../config';

export class SnapshotStorage {
  private snapshotsDir: string;

  constructor() {
    this.snapshotsDir = config.paths.snapshotsDir;
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.snapshotsDir)) {
      fs.mkdirSync(this.snapshotsDir, { recursive: true });
      logger.info(`Created snapshots directory: ${this.snapshotsDir}`);
    }
  }

  saveSnapshot(snapshot: FollowingSnapshot): string {
    const filename = this.generateFilename(snapshot);
    const filepath = path.join(this.snapshotsDir, filename);

    try {
      fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2), 'utf-8');
      logger.info(`Snapshot saved: ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error('Error saving snapshot:', error);
      throw error;
    }
  }

  getLatestSnapshot(username: string): FollowingSnapshot | null {
    try {
      const files = this.getSnapshotFiles(username);
      if (files.length === 0) {
        logger.info('No previous snapshots found');
        return null;
      }

      // Sort by timestamp (newest first)
      files.sort((a, b) => {
        const timestampA = this.extractTimestamp(a);
        const timestampB = this.extractTimestamp(b);
        return timestampB - timestampA;
      });

      const latestFile = files[0];
      const filepath = path.join(this.snapshotsDir, latestFile);

      const content = fs.readFileSync(filepath, 'utf-8');
      const snapshot = JSON.parse(content) as FollowingSnapshot;

      logger.info(`Loaded latest snapshot: ${latestFile}`);
      return snapshot;
    } catch (error) {
      logger.error('Error loading latest snapshot:', error);
      return null;
    }
  }

  getAllSnapshots(username: string): FollowingSnapshot[] {
    try {
      const files = this.getSnapshotFiles(username);
      const snapshots: FollowingSnapshot[] = [];

      for (const file of files) {
        const filepath = path.join(this.snapshotsDir, file);
        const content = fs.readFileSync(filepath, 'utf-8');
        snapshots.push(JSON.parse(content));
      }

      // Sort by timestamp (oldest first)
      snapshots.sort((a, b) => a.timestamp - b.timestamp);

      logger.info(`Loaded ${snapshots.length} snapshots for @${username}`);
      return snapshots;
    } catch (error) {
      logger.error('Error loading snapshots:', error);
      return [];
    }
  }

  private getSnapshotFiles(username: string): string[] {
    if (!fs.existsSync(this.snapshotsDir)) {
      return [];
    }

    const files = fs.readdirSync(this.snapshotsDir);
    return files.filter(file =>
      file.startsWith(`${username}_`) && file.endsWith('.json')
    );
  }

  private generateFilename(snapshot: FollowingSnapshot): string {
    return `${snapshot.targetUsername}_${snapshot.timestamp}.json`;
  }

  private extractTimestamp(filename: string): number {
    const match = filename.match(/_(\d+)\.json$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  deleteOldSnapshots(username: string, keepCount: number = 10): void {
    try {
      const files = this.getSnapshotFiles(username);

      if (files.length <= keepCount) {
        return;
      }

      // Sort by timestamp (newest first)
      files.sort((a, b) => {
        const timestampA = this.extractTimestamp(a);
        const timestampB = this.extractTimestamp(b);
        return timestampB - timestampA;
      });

      // Delete old files
      const filesToDelete = files.slice(keepCount);
      for (const file of filesToDelete) {
        const filepath = path.join(this.snapshotsDir, file);
        fs.unlinkSync(filepath);
        logger.info(`Deleted old snapshot: ${file}`);
      }
    } catch (error) {
      logger.error('Error deleting old snapshots:', error);
    }
  }
}
