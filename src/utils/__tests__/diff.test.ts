import { DiffDetector } from '../diff';
import { FollowingSnapshot, InstagramUser } from '../../types';

describe('DiffDetector', () => {
  const detector = new DiffDetector();

  const createSnapshot = (
    targetUsername: string,
    users: Partial<InstagramUser>[]
  ): FollowingSnapshot => ({
    targetUsername,
    timestamp: Date.now(),
    date: new Date().toISOString(),
    followingCount: users.length,
    users: users.map((u, i) => ({
      username: u.username || `user${i}`,
      fullName: u.fullName || `User ${i}`,
      profilePicUrl: u.profilePicUrl || '',
      isVerified: u.isVerified || false,
      isPrivate: u.isPrivate || false,
    })),
  });

  describe('calculateDiff', () => {
    it('should detect new follows', () => {
      const previous = createSnapshot('test', [{ username: 'user1' }, { username: 'user2' }]);

      const current = createSnapshot('test', [
        { username: 'user1' },
        { username: 'user2' },
        { username: 'user3' },
      ]);

      const diff = detector.calculateDiff(previous, current);

      expect(diff.newFollows).toHaveLength(1);
      expect(diff.newFollows[0].username).toBe('user3');
      expect(diff.unfollows).toHaveLength(0);
      expect(diff.previousCount).toBe(2);
      expect(diff.currentCount).toBe(3);
    });

    it('should detect unfollows', () => {
      const previous = createSnapshot('test', [
        { username: 'user1' },
        { username: 'user2' },
        { username: 'user3' },
      ]);

      const current = createSnapshot('test', [{ username: 'user1' }, { username: 'user2' }]);

      const diff = detector.calculateDiff(previous, current);

      expect(diff.newFollows).toHaveLength(0);
      expect(diff.unfollows).toHaveLength(1);
      expect(diff.unfollows[0].username).toBe('user3');
      expect(diff.previousCount).toBe(3);
      expect(diff.currentCount).toBe(2);
    });

    it('should detect both follows and unfollows', () => {
      const previous = createSnapshot('test', [
        { username: 'user1' },
        { username: 'user2' },
        { username: 'user3' },
      ]);

      const current = createSnapshot('test', [
        { username: 'user1' },
        { username: 'user4' },
        { username: 'user5' },
      ]);

      const diff = detector.calculateDiff(previous, current);

      expect(diff.newFollows).toHaveLength(2);
      expect(diff.unfollows).toHaveLength(2);
      expect(diff.newFollows.map((u) => u.username)).toContain('user4');
      expect(diff.newFollows.map((u) => u.username)).toContain('user5');
      expect(diff.unfollows.map((u) => u.username)).toContain('user2');
      expect(diff.unfollows.map((u) => u.username)).toContain('user3');
    });

    it('should handle no changes', () => {
      const previous = createSnapshot('test', [{ username: 'user1' }, { username: 'user2' }]);

      const current = createSnapshot('test', [{ username: 'user1' }, { username: 'user2' }]);

      const diff = detector.calculateDiff(previous, current);

      expect(diff.newFollows).toHaveLength(0);
      expect(diff.unfollows).toHaveLength(0);
      expect(diff.unchanged).toHaveLength(2);
    });

    it('should handle null previous snapshot', () => {
      const current = createSnapshot('test', [{ username: 'user1' }, { username: 'user2' }]);

      const diff = detector.calculateDiff(null, current);

      expect(diff.newFollows).toHaveLength(0);
      expect(diff.unfollows).toHaveLength(0);
      expect(diff.previousCount).toBe(0);
      expect(diff.currentCount).toBe(2);
    });

    it('should preserve user metadata', () => {
      const previous = createSnapshot('test', [{ username: 'user1' }]);

      const current = createSnapshot('test', [
        {
          username: 'user1',
          fullName: 'John Doe',
          isVerified: true,
          isPrivate: false,
        },
        {
          username: 'user2',
          fullName: 'Jane Smith',
          isVerified: false,
          isPrivate: true,
        },
      ]);

      const diff = detector.calculateDiff(previous, current);

      expect(diff.newFollows[0].fullName).toBe('Jane Smith');
      expect(diff.newFollows[0].isVerified).toBe(false);
      expect(diff.newFollows[0].isPrivate).toBe(true);
    });
  });

  describe('hasChanges', () => {
    it('should return true when there are new follows', () => {
      const previous = createSnapshot('test', [{ username: 'user1' }]);
      const current = createSnapshot('test', [{ username: 'user1' }, { username: 'user2' }]);
      const diff = detector.calculateDiff(previous, current);

      expect(detector.hasChanges(diff)).toBe(true);
    });

    it('should return true when there are unfollows', () => {
      const previous = createSnapshot('test', [{ username: 'user1' }, { username: 'user2' }]);
      const current = createSnapshot('test', [{ username: 'user1' }]);
      const diff = detector.calculateDiff(previous, current);

      expect(detector.hasChanges(diff)).toBe(true);
    });

    it('should return false when there are no changes', () => {
      const previous = createSnapshot('test', [{ username: 'user1' }]);
      const current = createSnapshot('test', [{ username: 'user1' }]);
      const diff = detector.calculateDiff(previous, current);

      expect(detector.hasChanges(diff)).toBe(false);
    });
  });

  describe('formatDiffSummary', () => {
    it('should format summary with changes', () => {
      const previous = createSnapshot('test', [{ username: 'user1' }, { username: 'user2' }]);
      const current = createSnapshot('test', [{ username: 'user1' }, { username: 'user3' }]);
      const diff = detector.calculateDiff(previous, current);

      const summary = detector.formatDiffSummary(diff);

      expect(summary).toContain('New follows: 1');
      expect(summary).toContain('Unfollows: 1');
      expect(summary).toContain('user3');
      expect(summary).toContain('user2');
    });

    it('should format summary with no changes', () => {
      const previous = createSnapshot('test', [{ username: 'user1' }]);
      const current = createSnapshot('test', [{ username: 'user1' }]);
      const diff = detector.calculateDiff(previous, current);

      const summary = detector.formatDiffSummary(diff);

      expect(summary).toContain('No changes');
    });
  });
});
