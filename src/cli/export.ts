#!/usr/bin/env ts-node
/**
 * Export command - Export snapshots to CSV or Excel
 * Usage: npm run export [options]
 */

import chalk from 'chalk';
import { getConfig } from '../config';
import { SnapshotStorage } from '../utils/storage';
import { ExportService } from '../services/export';
import { format } from 'date-fns';

interface ExportOptions {
  format: 'csv' | 'xlsx';
  username?: string;
  days?: number;
  output?: string;
}

function parseArgs(): ExportOptions {
  const args = process.argv.slice(2);
  const options: ExportOptions = {
    format: 'csv',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--format' || arg === '-f') {
      options.format = args[++i] as 'csv' | 'xlsx';
    } else if (arg === '--user' || arg === '-u') {
      options.username = args[++i];
    } else if (arg === '--days' || arg === '-d') {
      options.days = parseInt(args[++i], 10);
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    }
  }

  return options;
}

async function main() {
  console.log('\n' + chalk.bold.cyan('═══════════════════════════════════════════════════════'));
  console.log(chalk.bold.cyan('   📊 Export Snapshots'));
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════') + '\n');

  try {
    const config = getConfig();
    const storage = new SnapshotStorage();
    const exportService = new ExportService();
    const options = parseArgs();

    const targetUsername = options.username || config.instagram.targetUsername;

    console.log(chalk.white(`Target: @${targetUsername}`));
    console.log(chalk.white(`Format: ${options.format.toUpperCase()}`));
    console.log('');

    // Load snapshots
    let snapshots = storage.getAllSnapshots(targetUsername);

    if (snapshots.length === 0) {
      console.log(chalk.yellow('⚠️  No snapshots found for this user'));
      console.log(chalk.white('   Run "npm run dev" first to create snapshots\n'));
      process.exit(0);
    }

    // Filter by days if specified
    if (options.days) {
      const cutoffDate = Date.now() - options.days * 24 * 60 * 60 * 1000;
      snapshots = snapshots.filter((s) => new Date(s.date).getTime() >= cutoffDate);
      console.log(chalk.white(`Filtered to last ${options.days} days: ${snapshots.length} snapshots`));
    }

    console.log(chalk.white(`Total snapshots: ${snapshots.length}\n`));

    // Export
    const exportDir = process.env.EXPORT_DIR || './exports';
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const filename = options.output || `${targetUsername}_${timestamp}.${options.format}`;

    let outputPath: string;

    if (options.format === 'csv') {
      console.log(chalk.white('📄 Exporting to CSV...'));
      outputPath = await exportService.exportToCSV(snapshots, exportDir, filename);
    } else {
      console.log(chalk.white('📊 Exporting to Excel...'));
      outputPath = await exportService.exportToExcel(snapshots, exportDir, filename);
    }

    console.log('');
    console.log(chalk.bold.green('✅ Export successful!'));
    console.log(chalk.white(`   File: ${outputPath}\n`));

    // Show stats
    const firstSnapshot = snapshots[0];
    const lastSnapshot = snapshots[snapshots.length - 1];

    console.log(chalk.bold.yellow('📈 Summary:'));
    console.log(chalk.white(`   Snapshots: ${snapshots.length}`));
    console.log(
      chalk.white(
        `   Period: ${format(new Date(firstSnapshot.date), 'yyyy-MM-dd')} - ${format(new Date(lastSnapshot.date), 'yyyy-MM-dd')}`
      )
    );
    console.log(
      chalk.white(
        `   Following: ${firstSnapshot.followingCount} → ${lastSnapshot.followingCount} (${lastSnapshot.followingCount >= firstSnapshot.followingCount ? '+' : ''}${lastSnapshot.followingCount - firstSnapshot.followingCount})`
      )
    );
    console.log('');
  } catch (error: any) {
    console.log(chalk.bold.red('\n❌ Export failed:\n'));
    console.log(chalk.red(`   ${error.message}`));
    console.log('');
    process.exit(1);
  }

  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════\n'));
}

main();
