import { SnapshotStorage } from '../storage';
import { FollowingSnapshot } from '../../types';
import fs from 'fs';
import path from 'path';

describe('SnapshotStorage', () => {
  const testDataDir = path.join(process.cwd(), 'test-data-temp');
  const testSnapshotsDir = path.join(testDataDir, 'snapshots');
  let storage: SnapshotStorage;

  // Create mock config
  beforeAll(() => {
    // Mock config paths
    jest.mock('../../config', () => ({
      getConfig: () => ({
        paths: {
          snapshotsDir: testSnapshotsDir,
          dataDir: testDataDir,
        },
      }),
      config: new Proxy(
        {},
        {
          get: () => ({
            paths: {
              snapshotsDir: testSnapshotsDir,
              dataDir: testDataDir,
            },
          }),
        }
      ),
    }));
  });

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testSnapshotsDir)) {
      fs.mkdirSync(testSnapshotsDir, { recursive: true });
    }
    storage = new SnapshotStorage();
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  const createMockSnapshot = (targetUsername: string, count: number = 5): FollowingSnapshot => ({
    targetUsername,
    timestamp: Date.now(),
    date: new Date().toISOString(),
    followingCount: count,
    users: Array.from({ length: count }, (_, i) => ({
      username: `user${i}`,
      fullName: `User ${i}`,
      profilePicUrl: '',
      isVerified: false,
      isPrivate: false,
    })),
  });

  describe('saveSnapshot', () => {
    it('should save snapshot to file', () => {
      const snapshot = createMockSnapshot('testuser');
      const filepath = storage.saveSnapshot(snapshot);

      expect(fs.existsSync(filepath)).toBe(true);
      expect(filepath).toContain('testuser');
      expect(filepath).toContain('.json');
    });

    it('should create snapshots directory if it does not exist', () => {
      // Remove directory
      if (fs.existsSync(testSnapshotsDir)) {
        fs.rmSync(testSnapshotsDir, { recursive: true });
      }

      const snapshot = createMockSnapshot('testuser');
      const filepath = storage.saveSnapshot(snapshot);

      expect(fs.existsSync(testSnapshotsDir)).toBe(true);
      expect(fs.existsSync(filepath)).toBe(true);
    });

    it('should save valid JSON', () => {
      const snapshot = createMockSnapshot('testuser');
      const filepath = storage.saveSnapshot(snapshot);

      const content = fs.readFileSync(filepath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.targetUsername).toBe('testuser');
      expect(parsed.followingCount).toBe(5);
      expect(parsed.users).toHaveLength(5);
    });
  });

  describe('getLatestSnapshot', () => {
    it('should return latest snapshot for user', () => {
      const snapshot1 = createMockSnapshot('testuser');
      storage.saveSnapshot(snapshot1);

      // Wait a bit to ensure different timestamp
      const snapshot2 = createMockSnapshot('testuser');
      storage.saveSnapshot(snapshot2);

      const latest = storage.getLatestSnapshot('testuser');

      expect(latest).not.toBeNull();
      expect(latest?.targetUsername).toBe('testuser');
    });

    it('should return null if no snapshots exist', () => {
      const latest = storage.getLatestSnapshot('nonexistent');
      expect(latest).toBeNull();
    });

    it('should only return snapshots for specified user', () => {
      storage.saveSnapshot(createMockSnapshot('user1'));
      storage.saveSnapshot(createMockSnapshot('user2'));

      const latest = storage.getLatestSnapshot('user1');

      expect(latest).not.toBeNull();
      expect(latest?.targetUsername).toBe('user1');
    });
  });

  describe('getAllSnapshots', () => {
    it('should return all snapshots for user', () => {
      storage.saveSnapshot(createMockSnapshot('testuser'));
      storage.saveSnapshot(createMockSnapshot('testuser'));
      storage.saveSnapshot(createMockSnapshot('testuser'));

      const all = storage.getAllSnapshots('testuser');

      expect(all).toHaveLength(3);
      expect(all.every((s) => s.targetUsername === 'testuser')).toBe(true);
    });

    it('should return snapshots in chronological order', () => {
      const snapshot1 = createMockSnapshot('testuser');
      const filepath1 = storage.saveSnapshot(snapshot1);

      const snapshot2 = createMockSnapshot('testuser');
      const filepath2 = storage.saveSnapshot(snapshot2);

      const all = storage.getAllSnapshots('testuser');

      expect(all).toHaveLength(2);
      // First snapshot should be older
      expect(new Date(all[0].date).getTime()).toBeLessThanOrEqual(
        new Date(all[1].date).getTime()
      );
    });

    it('should return empty array if no snapshots exist', () => {
      const all = storage.getAllSnapshots('nonexistent');
      expect(all).toEqual([]);
    });
  });

  describe('deleteOldSnapshots', () => {
    it('should keep only the specified number of snapshots', () => {
      // Create 10 snapshots
      for (let i = 0; i < 10; i++) {
        storage.saveSnapshot(createMockSnapshot('testuser'));
      }

      storage.deleteOldSnapshots('testuser', 5);

      const remaining = storage.getAllSnapshots('testuser');
      expect(remaining).toHaveLength(5);
    });

    it('should keep the most recent snapshots', () => {
      // Create snapshots with known data
      for (let i = 0; i < 10; i++) {
        const snapshot = createMockSnapshot('testuser', i);
        storage.saveSnapshot(snapshot);
      }

      storage.deleteOldSnapshots('testuser', 3);

      const remaining = storage.getAllSnapshots('testuser');
      expect(remaining).toHaveLength(3);

      // The remaining should be the last 3 (count 7, 8, 9)
      expect(remaining[remaining.length - 1].followingCount).toBe(9);
    });

    it('should not delete if count is below limit', () => {
      storage.saveSnapshot(createMockSnapshot('testuser'));
      storage.saveSnapshot(createMockSnapshot('testuser'));

      storage.deleteOldSnapshots('testuser', 5);

      const remaining = storage.getAllSnapshots('testuser');
      expect(remaining).toHaveLength(2);
    });

    it('should only delete snapshots for specified user', () => {
      storage.saveSnapshot(createMockSnapshot('user1'));
      storage.saveSnapshot(createMockSnapshot('user2'));

      storage.deleteOldSnapshots('user1', 0);

      const user1Snapshots = storage.getAllSnapshots('user1');
      const user2Snapshots = storage.getAllSnapshots('user2');

      expect(user1Snapshots).toHaveLength(0);
      expect(user2Snapshots).toHaveLength(1);
    });
  });
});
