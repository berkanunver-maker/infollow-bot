#!/usr/bin/env ts-node
/**
 * Stats command - Display detailed statistics and trends
 * Usage: npm run stats
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { getConfig } from '../config';
import { FollowingSnapshot } from '../types';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';

interface UserChange {
  username: string;
  fullName: string;
  changeCount: number;
  lastSeen: Date;
  changeType: 'follow' | 'unfollow' | 'both';
}

interface StatsData {
  totalSnapshots: number;
  firstSnapshotDate: Date | null;
  lastSnapshotDate: Date | null;
  trackingDays: number;
  totalFollows: number;
  totalUnfollows: number;
  netChange: number;
  mostActiveUsers: UserChange[];
  followingTrend: { date: Date; count: number }[];
  avgFollowingCount: number;
  maxFollowingCount: number;
  minFollowingCount: number;
}

function loadAllSnapshots(snapshotsDir: string): FollowingSnapshot[] {
  if (!fs.existsSync(snapshotsDir)) {
    return [];
  }

  const files = fs.readdirSync(snapshotsDir).filter((f) => f.endsWith('.json'));

  return files
    .map((file) => {
      try {
        const content = fs.readFileSync(path.join(snapshotsDir, file), 'utf-8');
        return JSON.parse(content) as FollowingSnapshot;
      } catch {
        return null;
      }
    })
    .filter((s): s is FollowingSnapshot => s !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function analyzeSnapshots(snapshots: FollowingSnapshot[]): StatsData {
  if (snapshots.length === 0) {
    return {
      totalSnapshots: 0,
      firstSnapshotDate: null,
      lastSnapshotDate: null,
      trackingDays: 0,
      totalFollows: 0,
      totalUnfollows: 0,
      netChange: 0,
      mostActiveUsers: [],
      followingTrend: [],
      avgFollowingCount: 0,
      maxFollowingCount: 0,
      minFollowingCount: 0,
    };
  }

  const firstDate = new Date(snapshots[0].date);
  const lastDate = new Date(snapshots[snapshots.length - 1].date);
  const trackingDays = differenceInDays(lastDate, firstDate);

  // Calculate follow/unfollow changes
  const userChanges = new Map<string, UserChange>();
  let totalFollows = 0;
  let totalUnfollows = 0;

  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1];
    const current = snapshots[i];

    const prevUsernames = new Set(prev.users.map((u) => u.username));
    const currentUsernames = new Set(current.users.map((u) => u.username));

    // New follows
    current.users.forEach((user) => {
      if (!prevUsernames.has(user.username)) {
        totalFollows++;
        const existing = userChanges.get(user.username);
        if (existing) {
          existing.changeCount++;
          existing.lastSeen = new Date(current.date);
          existing.changeType = 'both';
        } else {
          userChanges.set(user.username, {
            username: user.username,
            fullName: user.fullName,
            changeCount: 1,
            lastSeen: new Date(current.date),
            changeType: 'follow',
          });
        }
      }
    });

    // Unfollows
    prev.users.forEach((user) => {
      if (!currentUsernames.has(user.username)) {
        totalUnfollows++;
        const existing = userChanges.get(user.username);
        if (existing) {
          existing.changeCount++;
          existing.lastSeen = new Date(current.date);
          existing.changeType = 'both';
        } else {
          userChanges.set(user.username, {
            username: user.username,
            fullName: user.fullName,
            changeCount: 1,
            lastSeen: new Date(current.date),
            changeType: 'unfollow',
          });
        }
      }
    });
  }

  // Most active users (most changes)
  const mostActiveUsers = Array.from(userChanges.values())
    .sort((a, b) => b.changeCount - a.changeCount)
    .slice(0, 10);

  // Following trend
  const followingTrend = snapshots.map((s) => ({
    date: new Date(s.date),
    count: s.followingCount,
  }));

  // Calculate averages
  const counts = snapshots.map((s) => s.followingCount);
  const avgFollowingCount = counts.reduce((a, b) => a + b, 0) / counts.length;
  const maxFollowingCount = Math.max(...counts);
  const minFollowingCount = Math.min(...counts);

  const netChange = totalFollows - totalUnfollows;

  return {
    totalSnapshots: snapshots.length,
    firstSnapshotDate: firstDate,
    lastSnapshotDate: lastDate,
    trackingDays,
    totalFollows,
    totalUnfollows,
    netChange,
    mostActiveUsers,
    followingTrend,
    avgFollowingCount,
    maxFollowingCount,
    minFollowingCount,
  };
}

function drawSimpleChart(trend: { date: Date; count: number }[], maxWidth: number = 50) {
  if (trend.length === 0) return;

  const maxCount = Math.max(...trend.map((t) => t.count));
  const minCount = Math.min(...trend.map((t) => t.count));
  const range = maxCount - minCount;

  // Sample data if too many points
  let sampledTrend = trend;
  if (trend.length > maxWidth) {
    const step = Math.ceil(trend.length / maxWidth);
    sampledTrend = trend.filter((_, i) => i % step === 0);
  }

  const height = 10;
  const chart: string[][] = Array(height)
    .fill(null)
    .map(() => Array(sampledTrend.length).fill(' '));

  sampledTrend.forEach((point, x) => {
    const normalized = range === 0 ? 0.5 : (point.count - minCount) / range;
    const y = Math.floor((height - 1) * (1 - normalized));
    for (let i = y; i < height; i++) {
      chart[i][x] = '█';
    }
  });

  console.log(chalk.bold.yellow('   Following Count Trend:\n'));
  chart.forEach((row, i) => {
    const value = maxCount - (i * range) / (height - 1);
    const label = Math.round(value).toString().padStart(5);
    console.log(chalk.gray(`   ${label} │`) + chalk.cyan(row.join('')));
  });
  console.log(chalk.gray(`        └${'─'.repeat(sampledTrend.length)}`));

  // Show date range
  if (sampledTrend.length > 0) {
    const firstDate = format(sampledTrend[0].date, 'MMM dd');
    const lastDate = format(sampledTrend[sampledTrend.length - 1].date, 'MMM dd');
    const padding = Math.floor((sampledTrend.length - firstDate.length - lastDate.length) / 2);
    console.log(
      chalk.gray(
        `        ${' '.repeat(2)}${firstDate}${' '.repeat(Math.max(0, padding * 2))}${lastDate}`
      )
    );
  }
  console.log('');
}

function displayStats() {
  console.log('\n' + chalk.bold.cyan('═══════════════════════════════════════════════════════'));
  console.log(chalk.bold.cyan('   📊 Detailed Statistics & Trends'));
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════') + '\n');

  try {
    const config = getConfig();
    const snapshots = loadAllSnapshots(config.paths.snapshotsDir);

    if (snapshots.length === 0) {
      console.log(chalk.yellow('   ⚠️  No snapshots found'));
      console.log(chalk.white('   Run "npm run dev" to create your first snapshot\n'));
      console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════\n'));
      return;
    }

    const stats = analyzeSnapshots(snapshots);

    // Overview
    console.log(chalk.bold.yellow('📈 Overview:'));
    console.log(chalk.white(`   Target: @${config.instagram.targetUsername}`));
    console.log(chalk.white(`   Total Snapshots: ${chalk.bold(stats.totalSnapshots)}`));

    if (stats.firstSnapshotDate && stats.lastSnapshotDate) {
      console.log(
        chalk.white(
          `   Tracking Period: ${chalk.bold(stats.trackingDays)} days (${format(stats.firstSnapshotDate, 'MMM dd, yyyy')} - ${format(stats.lastSnapshotDate, 'MMM dd, yyyy')})`
        )
      );
      console.log(
        chalk.white(
          `   Last Updated: ${chalk.bold(formatDistanceToNow(stats.lastSnapshotDate, { addSuffix: true }))}`
        )
      );
    }
    console.log('');

    // Changes Summary
    console.log(chalk.bold.yellow('🔄 Changes Summary:'));
    console.log(
      chalk.white(`   Total New Follows: ${chalk.bold.green(`+${stats.totalFollows}`)}`)
    );
    console.log(
      chalk.white(`   Total Unfollows: ${chalk.bold.red(`-${stats.totalUnfollows}`)}`)
    );

    const netChangeColor = stats.netChange > 0 ? 'green' : stats.netChange < 0 ? 'red' : 'yellow';
    const netChangeSign = stats.netChange > 0 ? '+' : '';
    console.log(
      chalk.white(
        `   Net Change: ${chalk.bold[netChangeColor](`${netChangeSign}${stats.netChange}`)}`
      )
    );
    console.log('');

    // Following Statistics
    console.log(chalk.bold.yellow('📊 Following Statistics:'));
    console.log(
      chalk.white(`   Current: ${chalk.bold(stats.followingTrend[stats.followingTrend.length - 1]?.count || 0)}`)
    );
    console.log(chalk.white(`   Average: ${chalk.bold(Math.round(stats.avgFollowingCount))}`));
    console.log(chalk.white(`   Maximum: ${chalk.bold(stats.maxFollowingCount)}`));
    console.log(chalk.white(`   Minimum: ${chalk.bold(stats.minFollowingCount)}`));
    console.log('');

    // Trend Chart
    if (stats.followingTrend.length > 1) {
      drawSimpleChart(stats.followingTrend);
    }

    // Most Active Users
    if (stats.mostActiveUsers.length > 0) {
      console.log(chalk.bold.yellow('🏆 Most Active Users (Follow/Unfollow):'));
      console.log('');
      stats.mostActiveUsers.slice(0, 10).forEach((user, index) => {
        const badge = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
        const typeIcon =
          user.changeType === 'follow' ? '📈' : user.changeType === 'unfollow' ? '📉' : '🔄';

        console.log(
          chalk.white(
            `   ${badge} @${user.username.padEnd(20)} ${typeIcon} ${chalk.bold(user.changeCount)} changes`
          )
        );
        console.log(chalk.gray(`      ${user.fullName}`));
      });
      console.log('');
    }

    // Activity Rate
    if (stats.trackingDays > 0) {
      console.log(chalk.bold.yellow('⚡ Activity Rate:'));
      const followsPerDay = (stats.totalFollows / stats.trackingDays).toFixed(2);
      const unfollowsPerDay = (stats.totalUnfollows / stats.trackingDays).toFixed(2);
      const changesPerDay = ((stats.totalFollows + stats.totalUnfollows) / stats.trackingDays).toFixed(2);

      console.log(chalk.white(`   New Follows per Day: ${chalk.bold.green(followsPerDay)}`));
      console.log(chalk.white(`   Unfollows per Day: ${chalk.bold.red(unfollowsPerDay)}`));
      console.log(chalk.white(`   Total Changes per Day: ${chalk.bold(changesPerDay)}`));
      console.log('');
    }

    // Insights
    console.log(chalk.bold.yellow('💡 Insights:'));
    const insights: string[] = [];

    if (stats.netChange > 0) {
      insights.push(`Following count is growing (${chalk.green(`+${stats.netChange}`)})`);
    } else if (stats.netChange < 0) {
      insights.push(`Following count is decreasing (${chalk.red(stats.netChange)})`);
    } else {
      insights.push('Following count is stable');
    }

    if (stats.totalFollows > stats.totalUnfollows * 2) {
      insights.push('High follow activity detected');
    } else if (stats.totalUnfollows > stats.totalFollows * 2) {
      insights.push('High unfollow activity detected');
    }

    if (stats.mostActiveUsers.length > 0 && stats.mostActiveUsers[0].changeCount >= 3) {
      insights.push(
        `@${stats.mostActiveUsers[0].username} has the most changes (${stats.mostActiveUsers[0].changeCount})`
      );
    }

    insights.forEach((insight) => {
      console.log(chalk.white(`   • ${insight}`));
    });
    console.log('');
  } catch (error: any) {
    console.log(chalk.bold.red('❌ Error generating statistics:\n'));
    console.log(chalk.red(`   ${error.message}`));
    console.log('');
  }

  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════\n'));
}

// Execute
displayStats();
