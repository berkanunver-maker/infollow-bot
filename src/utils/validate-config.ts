#!/usr/bin/env ts-node
/**
 * Standalone configuration validator
 * Usage: npm run validate
 */

import { config } from '../config';
import { ConfigValidator } from './validator';

function main() {
  console.log('🔍 Validating configuration...\n');

  const validation = ConfigValidator.validate(config);

  if (validation.errors.length === 0) {
    console.log('✅ Configuration is valid!\n');
    process.exit(0);
  }

  console.log('❌ Configuration validation failed:\n');

  validation.errors.forEach((error, index) => {
    console.log(`  ${index + 1}. ${error}`);
  });

  console.log('\n📝 Please fix the errors above and try again.\n');
  console.log('💡 Tips:');
  console.log('  - Check your .env file');
  console.log('  - Refer to .env.example for correct format');
  console.log('  - Ensure all API keys are properly set');
  console.log('  - Remove placeholder values\n');

  process.exit(1);
}

main();
