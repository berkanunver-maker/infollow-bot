#!/usr/bin/env ts-node
/**
 * Help command - Display all available commands and their usage
 * Usage: npm run help
 */

import chalk from 'chalk';

const COMMANDS = [
  {
    command: 'npm run help',
    description: 'Display this help message',
    examples: ['npm run help'],
  },
  {
    command: 'npm run validate',
    description: 'Validate configuration in .env file',
    details: 'Checks API keys, credentials, and detects placeholder values',
    examples: ['npm run validate'],
  },
  {
    command: 'npm run build',
    description: 'Compile TypeScript to JavaScript',
    details: 'Builds the project and outputs to dist/ directory',
    examples: ['npm run build'],
  },
  {
    command: 'npm run dev',
    description: 'Run bot once in development mode',
    details: 'Executes a single scraping cycle with TypeScript directly',
    examples: ['npm run dev', 'npm run dev -- --dry-run  # Preview without posting'],
  },
  {
    command: 'npm start',
    description: 'Run bot once in production mode',
    details: 'Executes compiled JavaScript from dist/',
    examples: ['npm start'],
  },
  {
    command: 'npm run worker',
    description: 'Start cron worker for automated scheduling',
    details: 'Runs continuously based on CRON_SCHEDULE in .env',
    examples: ['npm run worker'],
  },
  {
    command: 'npm run scrape',
    description: 'Manual scraping only (no Twitter posting)',
    details: 'Scrapes Instagram and saves snapshot without tweeting',
    examples: ['npm run scrape'],
  },
  {
    command: 'npm run status',
    description: 'Check bot status and recent activity',
    details: 'Shows last run time, snapshot count, and target user',
    examples: ['npm run status'],
  },
  {
    command: 'npm run stats',
    description: 'Display detailed statistics and trends',
    details: 'Analyzes all snapshots and shows follow/unfollow trends',
    examples: ['npm run stats', 'npm run stats -- --days 30  # Last 30 days'],
  },
  {
    command: 'npm run setup',
    description: 'Interactive setup wizard',
    details: 'Guides you through creating .env file with prompts',
    examples: ['npm run setup'],
  },
  {
    command: 'npm test',
    description: 'Run all unit tests',
    details: 'Executes Jest test suite',
    examples: ['npm test', 'npm test -- --watch  # Watch mode', 'npm test -- --coverage  # Coverage report'],
  },
];

const WORKFLOW = [
  { step: 1, action: 'First time setup', command: 'npm run setup' },
  { step: 2, action: 'Validate configuration', command: 'npm run validate' },
  { step: 3, action: 'Build the project', command: 'npm run build' },
  { step: 4, action: 'Test with dry run', command: 'npm run dev -- --dry-run' },
  { step: 5, action: 'Run once to verify', command: 'npm run dev' },
  { step: 6, action: 'Start automated worker', command: 'npm run worker' },
];

const TIPS = [
  'Use --dry-run flag to preview tweets without posting',
  'Check logs/ directory for detailed execution logs',
  'Snapshots are saved in data/snapshots/ with timestamps',
  'Use headless=false in .env to see browser during scraping',
  'Increase MIN_DELAY and MAX_DELAY to avoid rate limiting',
  'Run "npm run status" regularly to monitor bot health',
];

function displayHelp() {
  console.log('\n' + chalk.bold.cyan('═══════════════════════════════════════════════════════'));
  console.log(chalk.bold.cyan('   📚 Instagram Follow Tracker Bot - Help Guide'));
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════') + '\n');

  // Available Commands
  console.log(chalk.bold.yellow('📋 Available Commands:\n'));
  COMMANDS.forEach((cmd, index) => {
    console.log(chalk.bold.green(`${index + 1}. ${cmd.command}`));
    console.log(chalk.gray(`   ${cmd.description}`));
    if (cmd.details) {
      console.log(chalk.gray(`   ${cmd.details}`));
    }
    if (cmd.examples && cmd.examples.length > 0) {
      console.log(chalk.cyan('   Examples:'));
      cmd.examples.forEach((ex) => {
        console.log(chalk.white(`     $ ${ex}`));
      });
    }
    console.log('');
  });

  // Recommended Workflow
  console.log(chalk.bold.yellow('🚀 Recommended Workflow (First Time):\n'));
  WORKFLOW.forEach((item) => {
    console.log(
      chalk.bold(`${item.step}.`) +
        chalk.white(` ${item.action}`) +
        chalk.cyan(`\n   $ ${item.command}\n`)
    );
  });

  // Tips
  console.log(chalk.bold.yellow('💡 Tips & Tricks:\n'));
  TIPS.forEach((tip, index) => {
    console.log(chalk.white(`   ${index + 1}. ${tip}`));
  });
  console.log('');

  // Documentation
  console.log(chalk.bold.yellow('📖 Documentation:\n'));
  console.log(chalk.white('   README.md          - Full documentation'));
  console.log(chalk.white('   AI_GUIDE.md        - Guide for AI-assisted editing'));
  console.log(chalk.white('   QUICK_REFERENCE.md - Ready-to-use AI prompts'));
  console.log(chalk.white('   SECURITY.md        - Security best practices'));
  console.log('');

  // Support
  console.log(chalk.bold.yellow('🆘 Need Help?\n'));
  console.log(chalk.white('   Check logs:     tail -f logs/combined.log'));
  console.log(chalk.white('   Check errors:   tail -f logs/error.log'));
  console.log(chalk.white('   Validate setup: npm run validate'));
  console.log(chalk.white('   Test config:    npm run dev -- --dry-run'));
  console.log('');

  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════\n'));
}

// Execute
displayHelp();
