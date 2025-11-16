import { FollowingSnapshot, DiffResult, InstagramUser } from '../types';
import { logger } from './logger';

export class DiffDetector {
  calculateDiff(
    previousSnapshot: FollowingSnapshot | null,
    currentSnapshot: FollowingSnapshot
  ): DiffResult {
    if (!previousSnapshot) {
      logger.info('No previous snapshot - treating all users as new follows');
      return {
        newFollows: currentSnapshot.users,
        unfollows: [],
        unchanged: 0,
        previousCount: 0,
        currentCount: currentSnapshot.followingCount,
        timestamp: currentSnapshot.timestamp,
      };
    }

    logger.info('Calculating diff between snapshots...');

    const previousUsernames = new Set(
      previousSnapshot.users.map(u => u.username)
    );
    const currentUsernames = new Set(
      currentSnapshot.users.map(u => u.username)
    );

    const previousUsersMap = new Map(
      previousSnapshot.users.map(u => [u.username, u])
    );
    const currentUsersMap = new Map(
      currentSnapshot.users.map(u => [u.username, u])
    );

    // Find new follows
    const newFollows: InstagramUser[] = [];
    for (const username of currentUsernames) {
      if (!previousUsernames.has(username)) {
        const user = currentUsersMap.get(username)!;
        newFollows.push(user);
      }
    }

    // Find unfollows
    const unfollows: InstagramUser[] = [];
    for (const username of previousUsernames) {
      if (!currentUsernames.has(username)) {
        const user = previousUsersMap.get(username)!;
        unfollows.push(user);
      }
    }

    // Count unchanged
    const unchanged = currentSnapshot.users.length - newFollows.length;

    const result: DiffResult = {
      newFollows,
      unfollows,
      unchanged,
      previousCount: previousSnapshot.followingCount,
      currentCount: currentSnapshot.followingCount,
      timestamp: currentSnapshot.timestamp,
    };

    logger.info(
      `Diff results: ${newFollows.length} new follows, ${unfollows.length} unfollows, ${unchanged} unchanged`
    );

    return result;
  }

  formatDiffSummary(diff: DiffResult): string {
    const lines: string[] = [];

    lines.push('=== Following Changes ===');
    lines.push(`Previous count: ${diff.previousCount}`);
    lines.push(`Current count: ${diff.currentCount}`);
    lines.push(`Net change: ${diff.currentCount - diff.previousCount}`);
    lines.push('');

    if (diff.newFollows.length > 0) {
      lines.push(`New Follows (${diff.newFollows.length}):`);
      for (const user of diff.newFollows) {
        lines.push(`  + @${user.username} (${user.fullName})${user.isVerified ? ' ✓' : ''}`);
      }
      lines.push('');
    }

    if (diff.unfollows.length > 0) {
      lines.push(`Unfollows (${diff.unfollows.length}):`);
      for (const user of diff.unfollows) {
        lines.push(`  - @${user.username} (${user.fullName})${user.isVerified ? ' ✓' : ''}`);
      }
      lines.push('');
    }

    if (diff.newFollows.length === 0 && diff.unfollows.length === 0) {
      lines.push('No changes detected');
    }

    return lines.join('\n');
  }

  hasChanges(diff: DiffResult): boolean {
    return diff.newFollows.length > 0 || diff.unfollows.length > 0;
  }
}
