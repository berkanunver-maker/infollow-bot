#!/usr/bin/env ts-node
/**
 * Interactive setup wizard
 * Usage: npm run setup
 */

import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

interface SetupAnswers {
  instagramUsername: string;
  instagramPassword: string;
  targetUsername: string;
  twitterApiKey: string;
  twitterApiSecret: string;
  twitterAccessToken: string;
  twitterAccessSecret: string;
  cronSchedule: string;
  headless: boolean;
  useProxy: boolean;
  proxyServer?: string;
  minDelay: number;
  maxDelay: number;
}

async function runSetup() {
  console.log('\n' + chalk.bold.cyan('═══════════════════════════════════════════════════════'));
  console.log(chalk.bold.cyan('   🚀 Instagram Follow Tracker Bot - Setup Wizard'));
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════') + '\n');

  console.log(chalk.yellow('⚠️  IMPORTANT SECURITY WARNINGS:\n'));
  console.log(chalk.white('   • Do NOT use your main Instagram account'));
  console.log(chalk.white('   • Create a test/burner account for this bot'));
  console.log(chalk.white('   • Instagram may ban accounts using automation'));
  console.log(chalk.white('   • This violates Instagram Terms of Service'));
  console.log(chalk.white('   • Use at your own risk!\n'));

  const proceed = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'accept',
      message: 'I understand the risks and want to proceed',
      default: false,
    },
  ]);

  if (!proceed.accept) {
    console.log(chalk.red('\n❌ Setup cancelled.\n'));
    process.exit(0);
  }

  console.log(chalk.bold.green('\n✅ Let\'s get started!\n'));

  // Instagram Configuration
  console.log(chalk.bold.yellow('📸 Instagram Configuration:\n'));

  const answers = await inquirer.prompt<SetupAnswers>([
    {
      type: 'input',
      name: 'instagramUsername',
      message: 'Instagram username (your bot account):',
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'Username is required';
        }
        if (!/^[a-zA-Z0-9._]+$/.test(input)) {
          return 'Invalid username format (alphanumeric, dots, underscores only)';
        }
        return true;
      },
    },
    {
      type: 'password',
      name: 'instagramPassword',
      message: 'Instagram password:',
      mask: '*',
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'Password is required';
        }
        if (input.length < 6) {
          return 'Password too short (min 6 characters)';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'targetUsername',
      message: 'Target Instagram username to track:',
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'Target username is required';
        }
        if (!/^[a-zA-Z0-9._]+$/.test(input)) {
          return 'Invalid username format';
        }
        return true;
      },
    },
  ]);

  // Twitter API Configuration
  console.log(chalk.bold.yellow('\n🐦 Twitter API Configuration:\n'));
  console.log(chalk.gray('   Get your API keys from: https://developer.twitter.com/en/portal/dashboard\n'));

  const twitterAnswers = await inquirer.prompt<SetupAnswers>([
    {
      type: 'input',
      name: 'twitterApiKey',
      message: 'Twitter API Key:',
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'API Key is required';
        }
        if (input.length < 20) {
          return 'API Key seems too short';
        }
        return true;
      },
    },
    {
      type: 'password',
      name: 'twitterApiSecret',
      message: 'Twitter API Secret:',
      mask: '*',
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'API Secret is required';
        }
        if (input.length < 20) {
          return 'API Secret seems too short';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'twitterAccessToken',
      message: 'Twitter Access Token:',
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'Access Token is required';
        }
        if (input.length < 20) {
          return 'Access Token seems too short';
        }
        return true;
      },
    },
    {
      type: 'password',
      name: 'twitterAccessSecret',
      message: 'Twitter Access Secret:',
      mask: '*',
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'Access Secret is required';
        }
        if (input.length < 20) {
          return 'Access Secret seems too short';
        }
        return true;
      },
    },
  ]);

  Object.assign(answers, twitterAnswers);

  // Scheduling Configuration
  console.log(chalk.bold.yellow('\n⏰ Scheduling Configuration:\n'));

  const scheduleChoice = await inquirer.prompt([
    {
      type: 'list',
      name: 'schedulePreset',
      message: 'How often should the bot check for changes?',
      choices: [
        { name: 'Every 6 hours (Recommended)', value: '0 */6 * * *' },
        { name: 'Every 12 hours', value: '0 */12 * * *' },
        { name: 'Every 24 hours (Daily at midnight)', value: '0 0 * * *' },
        { name: 'Every 2 hours (Aggressive - not recommended)', value: '0 */2 * * *' },
        { name: 'Custom cron expression', value: 'custom' },
      ],
      default: '0 */6 * * *',
    },
  ]);

  if (scheduleChoice.schedulePreset === 'custom') {
    const customSchedule = await inquirer.prompt([
      {
        type: 'input',
        name: 'cronSchedule',
        message: 'Enter custom cron expression:',
        default: '0 */6 * * *',
        validate: (input) => {
          const parts = input.trim().split(/\s+/);
          if (parts.length !== 5) {
            return 'Invalid cron format (should be: minute hour day month weekday)';
          }
          return true;
        },
      },
    ]);
    answers.cronSchedule = customSchedule.cronSchedule;
  } else {
    answers.cronSchedule = scheduleChoice.schedulePreset;
  }

  // Advanced Configuration
  console.log(chalk.bold.yellow('\n⚙️  Advanced Configuration:\n'));

  const advancedAnswers = await inquirer.prompt<SetupAnswers>([
    {
      type: 'confirm',
      name: 'headless',
      message: 'Run browser in headless mode? (Recommended for production)',
      default: true,
    },
    {
      type: 'confirm',
      name: 'useProxy',
      message: 'Use proxy server?',
      default: false,
    },
  ]);

  Object.assign(answers, advancedAnswers);

  if (answers.useProxy) {
    const proxyAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'proxyServer',
        message: 'Proxy server (e.g., http://proxy.example.com:8080):',
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return 'Proxy server is required when using proxy';
          }
          try {
            new URL(input);
            return true;
          } catch {
            return 'Invalid proxy URL format';
          }
        },
      },
    ]);
    answers.proxyServer = proxyAnswers.proxyServer;
  }

  const delayAnswers = await inquirer.prompt<SetupAnswers>([
    {
      type: 'number',
      name: 'minDelay',
      message: 'Minimum delay between actions (ms):',
      default: 2000,
      validate: (input) => {
        if (input < 500) {
          return 'Too fast! Minimum 500ms to avoid detection';
        }
        return true;
      },
    },
    {
      type: 'number',
      name: 'maxDelay',
      message: 'Maximum delay between actions (ms):',
      default: 5000,
      validate: (input, answers: any) => {
        if (input < answers.minDelay) {
          return 'Maximum delay must be greater than minimum delay';
        }
        return true;
      },
    },
  ]);

  Object.assign(answers, delayAnswers);

  // Generate .env content
  console.log(chalk.bold.yellow('\n📝 Generating configuration...\n'));

  const envContent = `# Instagram Follow Tracker Bot Configuration
# Generated by setup wizard on ${new Date().toISOString()}

# Instagram Credentials (⚠️  Use a test account!)
INSTAGRAM_USERNAME=${answers.instagramUsername}
INSTAGRAM_PASSWORD=${answers.instagramPassword}

# Target Account
TARGET_INSTAGRAM_USERNAME=${answers.targetUsername}

# Twitter API Credentials
TWITTER_API_KEY=${answers.twitterApiKey}
TWITTER_API_SECRET=${answers.twitterApiSecret}
TWITTER_ACCESS_TOKEN=${answers.twitterAccessToken}
TWITTER_ACCESS_SECRET=${answers.twitterAccessSecret}

# Scheduling
CRON_SCHEDULE=${answers.cronSchedule}

# Browser Configuration
HEADLESS=${answers.headless}
BROWSER_TIMEOUT=60000

# Logging
LOG_LEVEL=info

# Proxy Configuration
USE_PROXY=${answers.useProxy}
${answers.useProxy && answers.proxyServer ? `PROXY_SERVER=${answers.proxyServer}` : '# PROXY_SERVER='}
${answers.useProxy ? '# PROXY_USERNAME=' : '# PROXY_USERNAME='}
${answers.useProxy ? '# PROXY_PASSWORD=' : '# PROXY_PASSWORD='}

# Security & Anti-Detection
USE_STEALTH_MODE=true
USE_SESSION_PERSISTENCE=true
MIN_DELAY=${answers.minDelay}
MAX_DELAY=${answers.maxDelay}

# Data Paths
DATA_DIR=./data
SNAPSHOTS_DIR=./data/snapshots
SCREENSHOTS_DIR=./data/screenshots
LOG_DIR=./logs
`;

  // Check if .env already exists
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const overwrite = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: chalk.yellow('.env file already exists. Overwrite?'),
        default: false,
      },
    ]);

    if (!overwrite.overwrite) {
      console.log(chalk.red('\n❌ Setup cancelled. Existing .env file preserved.\n'));
      process.exit(0);
    }

    // Backup existing .env
    const backupPath = path.join(process.cwd(), `.env.backup.${Date.now()}`);
    fs.copyFileSync(envPath, backupPath);
    console.log(chalk.green(`\n✅ Backed up existing .env to: ${backupPath}`));
  }

  // Write .env file
  fs.writeFileSync(envPath, envContent);

  console.log(chalk.bold.green('\n✅ Configuration saved to .env file!\n'));

  // Next steps
  console.log(chalk.bold.yellow('🎯 Next Steps:\n'));
  console.log(chalk.white('   1. Validate configuration:'));
  console.log(chalk.cyan('      $ npm run validate\n'));
  console.log(chalk.white('   2. Build the project:'));
  console.log(chalk.cyan('      $ npm run build\n'));
  console.log(chalk.white('   3. Test with dry run (preview without posting):'));
  console.log(chalk.cyan('      $ npm run dev -- --dry-run\n'));
  console.log(chalk.white('   4. Run once to verify:'));
  console.log(chalk.cyan('      $ npm run dev\n'));
  console.log(chalk.white('   5. Start automated worker:'));
  console.log(chalk.cyan('      $ npm run worker\n'));

  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════'));
  console.log(chalk.bold.green('   🎉 Setup Complete! Happy Tracking!'));
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════\n'));
}

runSetup().catch((error) => {
  console.error(chalk.red('\n❌ Setup failed:'), error.message);
  process.exit(1);
});
