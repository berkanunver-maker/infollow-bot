import { FollowingSnapshot } from '../types';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';

/**
 * Export service for CSV and Excel
 */
export class ExportService {
  /**
   * Export snapshots to CSV
   */
  async exportToCSV(
    snapshots: FollowingSnapshot[],
    outputDir: string,
    filename: string
  ): Promise<string> {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, filename.endsWith('.csv') ? filename : `${filename}.csv`);

    // Build CSV content
    const lines: string[] = [];

    // Header
    lines.push('Date,Username,Full Name,Following Count,Is Verified,Is Private,Profile URL');

    // Data rows
    for (const snapshot of snapshots) {
      const date = format(new Date(snapshot.date), 'yyyy-MM-dd HH:mm:ss');

      for (const user of snapshot.users) {
        const row = [
          date,
          `"${snapshot.targetUsername}"`,
          `"${user.username}"`,
          `"${user.fullName.replace(/"/g, '""')}"`,
          snapshot.followingCount,
          user.isVerified ? 'Yes' : 'No',
          user.isPrivate ? 'Yes' : 'No',
          `https://instagram.com/${user.username}`,
        ];
        lines.push(row.join(','));
      }
    }

    // Write to file
    fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');

    logger.info(`CSV exported: ${outputPath}`);

    return outputPath;
  }

  /**
   * Export snapshots to Excel
   */
  async exportToExcel(
    snapshots: FollowingSnapshot[],
    outputDir: string,
    filename: string
  ): Promise<string> {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Following Data');

    // Set column widths
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Target', key: 'target', width: 20 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Full Name', key: 'fullName', width: 30 },
      { header: 'Following Count', key: 'followingCount', width: 15 },
      { header: 'Verified', key: 'verified', width: 10 },
      { header: 'Private', key: 'private', width: 10 },
      { header: 'Profile URL', key: 'url', width: 40 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data rows
    for (const snapshot of snapshots) {
      const date = format(new Date(snapshot.date), 'yyyy-MM-dd HH:mm:ss');

      for (const user of snapshot.users) {
        worksheet.addRow({
          date,
          target: snapshot.targetUsername,
          username: user.username,
          fullName: user.fullName,
          followingCount: snapshot.followingCount,
          verified: user.isVerified ? 'Yes' : 'No',
          private: user.isPrivate ? 'Yes' : 'No',
          url: `https://instagram.com/${user.username}`,
        });
      }
    }

    // Add summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 30 },
    ];

    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    };
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const firstSnapshot = snapshots[0];
    const lastSnapshot = snapshots[snapshots.length - 1];
    const netChange = lastSnapshot.followingCount - firstSnapshot.followingCount;

    summarySheet.addRow({ metric: 'Total Snapshots', value: snapshots.length });
    summarySheet.addRow({
      metric: 'First Snapshot',
      value: format(new Date(firstSnapshot.date), 'yyyy-MM-dd HH:mm:ss'),
    });
    summarySheet.addRow({
      metric: 'Last Snapshot',
      value: format(new Date(lastSnapshot.date), 'yyyy-MM-dd HH:mm:ss'),
    });
    summarySheet.addRow({ metric: 'Initial Following Count', value: firstSnapshot.followingCount });
    summarySheet.addRow({ metric: 'Current Following Count', value: lastSnapshot.followingCount });
    summarySheet.addRow({ metric: 'Net Change', value: netChange });

    // Write to file
    await workbook.xlsx.writeFile(outputPath);

    logger.info(`Excel exported: ${outputPath}`);

    return outputPath;
  }

  /**
   * Auto-export if enabled in config
   */
  async autoExport(snapshot: FollowingSnapshot): Promise<void> {
    const enableCSV = process.env.ENABLE_CSV_EXPORT === 'true';
    const enableExcel = process.env.ENABLE_EXCEL_EXPORT === 'true';
    const autoCSV = process.env.AUTO_EXPORT_CSV === 'true';
    const autoExcel = process.env.AUTO_EXPORT_EXCEL === 'true';

    if (!enableCSV && !enableExcel) {
      return; // Export not enabled
    }

    const exportDir = process.env.EXPORT_DIR || './exports';
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');

    try {
      if (enableCSV && autoCSV) {
        const filename = `${snapshot.targetUsername}_${timestamp}.csv`;
        await this.exportToCSV([snapshot], exportDir, filename);
        logger.info(`Auto-exported to CSV: ${filename}`);
      }

      if (enableExcel && autoExcel) {
        const filename = `${snapshot.targetUsername}_${timestamp}.xlsx`;
        await this.exportToExcel([snapshot], exportDir, filename);
        logger.info(`Auto-exported to Excel: ${filename}`);
      }
    } catch (error: any) {
      logger.error('Auto-export failed:', error);
      // Don't throw - auto-export failure shouldn't stop the bot
    }
  }
}
