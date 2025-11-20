import { NotificationProvider, FollowEvent, NotificationResult } from '../../types/notifications';
import { logger } from '../../utils/logger';
import nodemailer, { Transporter } from 'nodemailer';
import { format } from 'date-fns';

/**
 * Email notification provider
 */
export class EmailProvider implements NotificationProvider {
  name = 'Email';
  private transporter: Transporter | null = null;

  isEnabled(): boolean {
    return process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true';
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!process.env.EMAIL_FROM) {
      errors.push('EMAIL_FROM not configured');
    }

    if (!process.env.EMAIL_TO) {
      errors.push('EMAIL_TO not configured');
    }

    const provider = process.env.EMAIL_PROVIDER || 'smtp';

    if (provider === 'smtp') {
      if (!process.env.EMAIL_SMTP_HOST) errors.push('EMAIL_SMTP_HOST not configured');
      if (!process.env.EMAIL_SMTP_PORT) errors.push('EMAIL_SMTP_PORT not configured');
      if (!process.env.EMAIL_SMTP_USER) errors.push('EMAIL_SMTP_USER not configured');
      if (!process.env.EMAIL_SMTP_PASS) errors.push('EMAIL_SMTP_PASS not configured');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const provider = process.env.EMAIL_PROVIDER || 'smtp';

    let config: any = {};

    switch (provider) {
      case 'gmail':
        config = {
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_SMTP_USER,
            pass: process.env.EMAIL_SMTP_PASS,
          },
        };
        break;

      case 'outlook':
        config = {
          service: 'outlook',
          auth: {
            user: process.env.EMAIL_SMTP_USER,
            pass: process.env.EMAIL_SMTP_PASS,
          },
        };
        break;

      case 'smtp':
      default:
        config = {
          host: process.env.EMAIL_SMTP_HOST,
          port: parseInt(process.env.EMAIL_SMTP_PORT || '587', 10),
          secure: process.env.EMAIL_SMTP_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_SMTP_USER,
            pass: process.env.EMAIL_SMTP_PASS,
          },
        };
        break;
    }

    this.transporter = nodemailer.createTransport(config);
    return this.transporter;
  }

  async send(event: FollowEvent): Promise<NotificationResult> {
    try {
      logger.info('Sending email notification...');

      const transporter = this.getTransporter();
      const html = this.createHtmlEmail(event);
      const text = this.createTextEmail(event);

      const mailOptions = {
        from: process.env.EMAIL_FROM!,
        to: process.env.EMAIL_TO!,
        subject: `📊 Instagram Update - @${event.targetUsername}`,
        text,
        html,
      };

      const info = await transporter.sendMail(mailOptions);

      return {
        provider: this.name,
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      logger.error('Email error:', error);
      return {
        provider: this.name,
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  private createTextEmail(event: FollowEvent): string {
    const { diff, targetUsername } = event;
    const netChange = diff.currentCount - diff.previousCount;

    const lines: string[] = [];

    lines.push(`Instagram Following Update - @${targetUsername}`);
    lines.push('='.repeat(60));
    lines.push('');
    lines.push(`Following: ${diff.previousCount} → ${diff.currentCount} (${netChange >= 0 ? '+' : ''}${netChange})`);
    lines.push('');

    if (diff.newFollows.length > 0) {
      lines.push(`New Follows (${diff.newFollows.length}):`);
      diff.newFollows.slice(0, 10).forEach((user) => {
        lines.push(`  • @${user.username} - ${user.fullName}${user.isVerified ? ' ✓' : ''}`);
      });
      if (diff.newFollows.length > 10) {
        lines.push(`  ... and ${diff.newFollows.length - 10} more`);
      }
      lines.push('');
    }

    if (diff.unfollows.length > 0) {
      lines.push(`Unfollowed (${diff.unfollows.length}):`);
      diff.unfollows.slice(0, 10).forEach((user) => {
        lines.push(`  • @${user.username} - ${user.fullName}${user.isVerified ? ' ✓' : ''}`);
      });
      if (diff.unfollows.length > 10) {
        lines.push(`  ... and ${diff.unfollows.length - 10} more`);
      }
      lines.push('');
    }

    lines.push('');
    lines.push(`Time: ${format(event.timestamp, 'yyyy-MM-dd HH:mm:ss')}`);
    lines.push('');
    lines.push('---');
    lines.push('Instagram Follow Tracker Bot');

    return lines.join('\n');
  }

  private createHtmlEmail(event: FollowEvent): string {
    const { diff, targetUsername } = event;
    const netChange = diff.currentCount - diff.previousCount;
    const changeColor = netChange > 0 ? '#27ae60' : netChange < 0 ? '#e74c3c' : '#95a5a6';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Instagram Update</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .stat-box {
      background-color: #f8f9fa;
      border-left: 4px solid ${changeColor};
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: ${changeColor};
    }
    .change-section {
      margin: 20px 0;
    }
    .change-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .user-list {
      list-style: none;
      padding: 0;
      margin: 10px 0;
    }
    .user-item {
      padding: 8px 12px;
      background-color: #f8f9fa;
      margin: 4px 0;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .username {
      font-weight: 600;
      color: #667eea;
      text-decoration: none;
    }
    .fullname {
      color: #666;
      font-size: 14px;
    }
    .verified {
      color: #1da1f2;
      font-size: 12px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      background-color: #f8f9fa;
      border-top: 1px solid #dee2e6;
      font-size: 12px;
      color: #666;
    }
    .more-info {
      color: #666;
      font-style: italic;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Instagram Following Update</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">@${targetUsername}</p>
    </div>

    <div class="content">
      <div class="stat-box">
        <div class="stat-label">Following Count</div>
        <div class="stat-value">${diff.previousCount} → ${diff.currentCount} (${netChange >= 0 ? '+' : ''}${netChange})</div>
      </div>

      ${
        diff.newFollows.length > 0
          ? `
      <div class="change-section">
        <div class="change-title">
          <span>✅</span>
          <span>New Follows (${diff.newFollows.length})</span>
        </div>
        <ul class="user-list">
          ${diff.newFollows
            .slice(0, 10)
            .map(
              (user) => `
            <li class="user-item">
              <a href="https://instagram.com/${user.username}" class="username">@${user.username}</a>
              <span class="fullname">${user.fullName}</span>
              ${user.isVerified ? '<span class="verified">✓</span>' : ''}
            </li>
          `
            )
            .join('')}
        </ul>
        ${diff.newFollows.length > 10 ? `<p class="more-info">... and ${diff.newFollows.length - 10} more</p>` : ''}
      </div>
      `
          : ''
      }

      ${
        diff.unfollows.length > 0
          ? `
      <div class="change-section">
        <div class="change-title">
          <span>❌</span>
          <span>Unfollowed (${diff.unfollows.length})</span>
        </div>
        <ul class="user-list">
          ${diff.unfollows
            .slice(0, 10)
            .map(
              (user) => `
            <li class="user-item">
              <a href="https://instagram.com/${user.username}" class="username">@${user.username}</a>
              <span class="fullname">${user.fullName}</span>
              ${user.isVerified ? '<span class="verified">✓</span>' : ''}
            </li>
          `
            )
            .join('')}
        </ul>
        ${diff.unfollows.length > 10 ? `<p class="more-info">... and ${diff.unfollows.length - 10} more</p>` : ''}
      </div>
      `
          : ''
      }

      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        <strong>Time:</strong> ${format(event.timestamp, 'yyyy-MM-dd HH:mm:ss')}
      </p>
    </div>

    <div class="footer">
      <p>Instagram Follow Tracker Bot</p>
      <p style="margin: 5px 0 0 0; font-size: 11px;">
        This is an automated message. Do not reply.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }
}
