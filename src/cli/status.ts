#!/usr/bin/env ts-node
/**
 * Status command - Check bot status and recent activity
 * Usage: npm run status
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { getConfig } from '../config';
import { formatDistanceToNow } from 'date-fns';

interface StatusInfo {
  targetUsername: string;
  totalSnapshots: number;
  lastSnapshotTime: Date | null;
  lastSnapshotPath: string | null;
  dataSize: string;
  logSize: string;
  sessionExists: boolean;
  configValid: boolean;
}

function getDirectorySize(dirPath: string): string {
  if (!fs.existsSync(dirPath)) {
    return '0 B';
  }

  let totalSize = 0;
  const files = fs.readdirSync(dirPath, { recursive: true });

  for (const file of files) {
    const filePath = path.join(dirPath, file.toString());
    try {
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        totalSize += stats.size;
      }
    } catch (err) {
      // Skip files we can't read
    }
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = totalSize;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function getLatestSnapshot(snapshotsDir: string): { path: string; time: Date } | null {
  if (!fs.existsSync(snapshotsDir)) {
    return null;
  }

  const files = fs.readdirSync(snapshotsDir).filter((f) => f.endsWith('.json'));

  if (files.length === 0) {
    return null;
  }

  // Sort by modification time
  const sortedFiles = files
    .map((file) => {
      const filePath = path.join(snapshotsDir, file);
      const stats = fs.statSync(filePath);
      return { path: filePath, time: stats.mtime };
    })
    .sort((a, b) => b.time.getTime() - a.time.getTime());

  return sortedFiles[0];
}

function getStatus(): StatusInfo {
  const config = getConfig();

  const snapshotsDir = config.paths.snapshotsDir;
  const sessionsDir = path.join(config.paths.dataDir, 'sessions');
  const logDir = config.paths.logDir;

  const snapshots = fs.existsSync(snapshotsDir)
    ? fs.readdirSync(snapshotsDir).filter((f) => f.endsWith('.json'))
    : [];

  const latestSnapshot = getLatestSnapshot(snapshotsDir);

  const sessionPath = path.join(sessionsDir, `${config.instagram.username}.json`);
  const sessionExists = fs.existsSync(sessionPath);

  return {
    targetUsername: config.instagram.targetUsername,
    totalSnapshots: snapshots.length,
    lastSnapshotTime: latestSnapshot?.time || null,
    lastSnapshotPath: latestSnapshot?.path || null,
    dataSize: getDirectorySize(config.paths.dataDir),
    logSize: getDirectorySize(logDir),
    sessionExists,
    configValid: true, // If we got here, config loaded successfully
  };
}

function displayStatus() {
  console.log('\n' + chalk.bold.cyan('═══════════════════════════════════════════════════════'));
  console.log(chalk.bold.cyan('   📊 Bot Status Report'));
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════') + '\n');

  try {
    const status = getStatus();

    // Target Info
    console.log(chalk.bold.yellow('🎯 Target Information:'));
    console.log(chalk.white(`   Tracking: @${status.targetUsername}\n`));

    // Snapshot Info
    console.log(chalk.bold.yellow('📸 Snapshot Information:'));
    console.log(chalk.white(`   Total Snapshots: ${chalk.bold.green(status.totalSnapshots)}`));

    if (status.lastSnapshotTime) {
      const timeAgo = formatDistanceToNow(status.lastSnapshotTime, { addSuffix: true });
      console.log(chalk.white(`   Last Snapshot: ${chalk.bold.green(timeAgo)}`));
      console.log(chalk.gray(`   (${status.lastSnapshotTime.toLocaleString()})`));
    } else {
      console.log(chalk.white(`   Last Snapshot: ${chalk.bold.red('Never')}`));
      console.log(chalk.yellow('   ℹ️  Run "npm run dev" to create first snapshot'));
    }
    console.log('');

    // Storage Info
    console.log(chalk.bold.yellow('💾 Storage Information:'));
    console.log(chalk.white(`   Data Size: ${chalk.bold(status.dataSize)}`));
    console.log(chalk.white(`   Log Size:  ${chalk.bold(status.logSize)}`));
    console.log('');

    // Session Info
    console.log(chalk.bold.yellow('🍪 Session Information:'));
    if (status.sessionExists) {
      console.log(chalk.white(`   Session: ${chalk.bold.green('✓ Active')}`));
      console.log(chalk.gray(`   (Saved login cookies available)`));
    } else {
      console.log(chalk.white(`   Session: ${chalk.bold.yellow('⚠ Not Found')}`));
      console.log(chalk.gray(`   (Will need to login on next run)`));
    }
    console.log('');

    // Configuration
    console.log(chalk.bold.yellow('⚙️  Configuration:'));
    if (status.configValid) {
      console.log(chalk.white(`   Status: ${chalk.bold.green('✓ Valid')}`));
      console.log(chalk.gray(`   (Run "npm run validate" for detailed check)`));
    } else {
      console.log(chalk.white(`   Status: ${chalk.bold.red('✗ Invalid')}`));
      console.log(chalk.yellow(`   ⚠️  Run "npm run validate" to see errors`));
    }
    console.log('');

    // Health Status
    console.log(chalk.bold.yellow('🏥 Health Status:'));
    const healthScore = calculateHealthScore(status);
    const healthColor = healthScore >= 80 ? 'green' : healthScore >= 50 ? 'yellow' : 'red';
    console.log(chalk.white(`   Health Score: ${chalk.bold[healthColor](`${healthScore}%`)}`));
    displayHealthRecommendations(status, healthScore);
    console.log('');

    // Quick Actions
    console.log(chalk.bold.yellow('🚀 Quick Actions:'));
    console.log(chalk.white('   Run now:        npm run dev'));
    console.log(chalk.white('   Start worker:   npm run worker'));
    console.log(chalk.white('   View stats:     npm run stats'));
    console.log(chalk.white('   Check logs:     tail -f logs/combined.log'));
    console.log('');
  } catch (error: any) {
    console.log(chalk.bold.red('❌ Error reading status:\n'));
    console.log(chalk.red(`   ${error.message}`));
    console.log('');
    console.log(chalk.yellow('💡 Try running: npm run validate'));
    console.log('');
  }

  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════\n'));
}

function calculateHealthScore(status: StatusInfo): number {
  let score = 0;

  // Has snapshots: +40
  if (status.totalSnapshots > 0) score += 40;

  // Recent activity: +30
  if (status.lastSnapshotTime) {
    const hoursSinceLastSnapshot =
      (Date.now() - status.lastSnapshotTime.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastSnapshot < 6) score += 30;
    else if (hoursSinceLastSnapshot < 24) score += 20;
    else if (hoursSinceLastSnapshot < 168) score += 10;
  }

  // Session exists: +20
  if (status.sessionExists) score += 20;

  // Config valid: +10
  if (status.configValid) score += 10;

  return score;
}

function displayHealthRecommendations(status: StatusInfo, score: number) {
  const recommendations: string[] = [];

  if (status.totalSnapshots === 0) {
    recommendations.push('No snapshots yet - Run "npm run dev" to start');
  }

  if (!status.lastSnapshotTime) {
    recommendations.push('Never run before - Execute first scrape');
  } else {
    const hoursSince = (Date.now() - status.lastSnapshotTime.getTime()) / (1000 * 60 * 60);
    if (hoursSince > 24) {
      recommendations.push('No recent activity - Consider running worker');
    }
  }

  if (!status.sessionExists) {
    recommendations.push('No saved session - First run will require login');
  }

  if (recommendations.length > 0) {
    console.log(chalk.yellow('   ℹ️  Recommendations:'));
    recommendations.forEach((rec) => {
      console.log(chalk.white(`      • ${rec}`));
    });
  } else {
    console.log(chalk.green('   ✅ Everything looks good!'));
  }
}

// Execute
displayStatus();
