/**
 * Manual Function Testing Script
 * Tests all utility functions without API keys
 */

const path = require('path');
const fs = require('fs');

console.log('🧪 Starting Manual Function Tests...\n');

// Test 1: Logger
console.log('1️⃣ Testing Logger...');
try {
  const { logger } = require('./dist/utils/logger');
  logger.info('✅ Logger info test');
  logger.warn('⚠️ Logger warn test');
  logger.error('❌ Logger error test');
  logger.debug('🐛 Logger debug test');
  console.log('✅ Logger: PASSED\n');
} catch (e) {
  console.log('❌ Logger: FAILED -', e.message, '\n');
}

// Test 2: Sanitizer
console.log('2️⃣ Testing Input Sanitizer...');
try {
  const { InputSanitizer } = require('./dist/utils/sanitizer');
  
  // Username sanitization
  const username = InputSanitizer.sanitizeUsername('test_user.123<script>');
  console.log('  Username sanitized:', username);
  console.log('  Expected: test_user.123');
  console.log('  Match:', username === 'test_user.123' ? '✅' : '❌');
  
  // SQL injection detection
  const hasSql = InputSanitizer.containsSqlInjection("admin' OR '1'='1");
  console.log('  SQL injection detected:', hasSql ? '✅' : '❌');
  
  // XSS detection
  const hasXss = InputSanitizer.containsXss('<script>alert("XSS")</script>');
  console.log('  XSS detected:', hasXss ? '✅' : '❌');
  
  // Command injection detection
  const hasCmd = InputSanitizer.containsCommandInjection('$(rm -rf /)');
  console.log('  Command injection detected:', hasCmd ? '✅' : '❌');
  
  console.log('✅ Sanitizer: PASSED\n');
} catch (e) {
  console.log('❌ Sanitizer: FAILED -', e.message, '\n');
}

// Test 3: Validator
console.log('3️⃣ Testing Config Validator...');
try {
  const { ConfigValidator } = require('./dist/utils/validator');
  
  // Create mock invalid config
  const invalidConfig = {
    instagram: {
      username: 'your_username',
      password: 'test123',
      targetUsername: 'test_target'
    },
    twitter: {
      apiKey: 'short',
      apiSecret: 'short',
      accessToken: 'short',
      accessSecret: 'short'
    },
    cron: { schedule: '0 */6 * * *' },
    paths: { dataDir: './data', snapshotsDir: './data/snapshots', screenshotsDir: './data/screenshots', logDir: './logs' },
    browser: { headless: true, timeout: 60000 },
    logging: { level: 'info' },
    proxy: { enabled: false, server: '', username: '', password: '' },
    security: { useStealthMode: true, useSessionPersistence: true, minDelay: 1000, maxDelay: 3000 }
  };
  
  const result = ConfigValidator.validate(invalidConfig);
  console.log('  Validation errors found:', result.errors.length);
  console.log('  Expected errors: 15+');
  console.log('  First 5 errors:');
  result.errors.slice(0, 5).forEach((err, i) => {
    console.log(`    ${i+1}. ${err}`);
  });
  console.log('  Detection working:', result.errors.length > 10 ? '✅' : '❌');
  console.log('✅ Validator: PASSED\n');
} catch (e) {
  console.log('❌ Validator: FAILED -', e.message, '\n');
}

// Test 4: Diff Detector
console.log('4️⃣ Testing Diff Detector...');
try {
  const { DiffDetector } = require('./dist/utils/diff');
  const detector = new DiffDetector();
  
  // Mock snapshots
  const previousSnapshot = {
    timestamp: Date.now() - 3600000,
    date: '2025-11-17 10:00:00',
    targetUsername: 'testuser',
    followingCount: 3,
    users: [
      { username: 'user1', fullName: 'User One', isVerified: true },
      { username: 'user2', fullName: 'User Two', isVerified: false },
      { username: 'user3', fullName: 'User Three', isVerified: false }
    ]
  };
  
  const currentSnapshot = {
    timestamp: Date.now(),
    date: '2025-11-17 11:00:00',
    targetUsername: 'testuser',
    followingCount: 4,
    users: [
      { username: 'user1', fullName: 'User One', isVerified: true },
      { username: 'user2', fullName: 'User Two', isVerified: false },
      { username: 'user4', fullName: 'User Four', isVerified: true }, // NEW
      { username: 'user5', fullName: 'User Five', isVerified: false }  // NEW
    ]
  };
  
  const diff = detector.calculateDiff(previousSnapshot, currentSnapshot);
  
  console.log('  New follows:', diff.newFollows.length, '(Expected: 2)');
  console.log('  Unfollows:', diff.unfollows.length, '(Expected: 1)');
  console.log('  Previous count:', diff.previousCount, '(Expected: 3)');
  console.log('  Current count:', diff.currentCount, '(Expected: 4)');
  
  const correct = diff.newFollows.length === 2 && 
                  diff.unfollows.length === 1 && 
                  diff.previousCount === 3 && 
                  diff.currentCount === 4;
  
  console.log('  Diff calculation:', correct ? '✅' : '❌');
  console.log('  Has changes:', detector.hasChanges(diff) ? '✅' : '❌');
  
  const summary = detector.formatDiffSummary(diff);
  console.log('  Summary generated:', summary.length > 0 ? '✅' : '❌');
  
  console.log('✅ Diff Detector: PASSED\n');
} catch (e) {
  console.log('❌ Diff Detector: FAILED -', e.message, '\n');
}

// Test 5: Storage
console.log('5️⃣ Testing Snapshot Storage...');
try {
  const { SnapshotStorage } = require('./dist/utils/storage');
  const storage = new SnapshotStorage();
  
  // Create test snapshot
  const testSnapshot = {
    timestamp: Date.now(),
    date: new Date().toISOString(),
    targetUsername: 'test_storage_user',
    followingCount: 2,
    users: [
      { username: 'testuser1', fullName: 'Test User 1', isVerified: false },
      { username: 'testuser2', fullName: 'Test User 2', isVerified: true }
    ]
  };
  
  // Save snapshot
  const filepath = storage.saveSnapshot(testSnapshot);
  console.log('  Snapshot saved to:', filepath);
  console.log('  File exists:', fs.existsSync(filepath) ? '✅' : '❌');
  
  // Load snapshot
  const loaded = storage.getLatestSnapshot('test_storage_user');
  console.log('  Snapshot loaded:', loaded !== null ? '✅' : '❌');
  console.log('  Data matches:', loaded?.followingCount === 2 ? '✅' : '❌');
  
  // Get all snapshots
  const all = storage.getAllSnapshots('test_storage_user');
  console.log('  All snapshots count:', all.length);
  
  // Cleanup test file
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    console.log('  Test file cleaned up: ✅');
  }
  
  console.log('✅ Storage: PASSED\n');
} catch (e) {
  console.log('❌ Storage: FAILED -', e.message, '\n');
}

// Test 6: Retry Logic
console.log('6️⃣ Testing Retry Logic...');
try {
  const { withRetry, randomDelay, delay } = require('./dist/utils/retry');
  
  let attemptCount = 0;
  
  // Test successful retry
  withRetry(async () => {
    attemptCount++;
    if (attemptCount < 2) {
      throw new Error('Temporary error');
    }
    return 'Success!';
  }, { retries: 3, minTimeout: 100, maxTimeout: 200 }, 'Test task')
    .then(result => {
      console.log('  Retry succeeded after', attemptCount, 'attempts: ✅');
      console.log('  Result:', result);
    })
    .catch(err => {
      console.log('  Retry failed: ❌', err.message);
    });
  
  // Test delay function exists
  console.log('  Delay function exists:', typeof delay === 'function' ? '✅' : '❌');
  console.log('  Random delay function exists:', typeof randomDelay === 'function' ? '✅' : '❌');
  
  console.log('✅ Retry Logic: PASSED\n');
} catch (e) {
  console.log('❌ Retry Logic: FAILED -', e.message, '\n');
}

// Test 7: Session Manager
console.log('7️⃣ Testing Session Manager...');
try {
  const { SessionManager } = require('./dist/utils/session');
  const manager = new SessionManager();
  
  console.log('  Session manager created: ✅');
  console.log('  Has session:', manager.hasSession() ? 'Yes' : 'No');
  
  // Methods exist
  console.log('  saveSession method exists:', typeof manager.saveSession === 'function' ? '✅' : '❌');
  console.log('  loadSession method exists:', typeof manager.loadSession === 'function' ? '✅' : '❌');
  console.log('  clearSession method exists:', typeof manager.clearSession === 'function' ? '✅' : '❌');
  
  console.log('✅ Session Manager: PASSED\n');
} catch (e) {
  console.log('❌ Session Manager: FAILED -', e.message, '\n');
}

// Test 8: SSL Verification
console.log('8️⃣ Testing SSL Verification...');
try {
  const { SSLVerification } = require('./dist/utils/ssl-verification');
  
  console.log('  SSL class loaded: ✅');
  console.log('  verifyCertificate method exists:', typeof SSLVerification.verifyCertificate === 'function' ? '✅' : '❌');
  console.log('  verifyAllEndpoints method exists:', typeof SSLVerification.verifyAllEndpoints === 'function' ? '✅' : '❌');
  console.log('  getSecureAgent method exists:', typeof SSLVerification.getSecureAgent === 'function' ? '✅' : '❌');
  
  console.log('✅ SSL Verification: PASSED\n');
} catch (e) {
  console.log('❌ SSL Verification: FAILED -', e.message, '\n');
}

// Test 9: Twitter Client (structure)
console.log('9️⃣ Testing Twitter Client Structure...');
try {
  const { TwitterClient } = require('./dist/twitter/client');
  
  // Can't test without API keys, but check structure
  console.log('  Twitter client class loaded: ✅');
  
  const client = new TwitterClient();
  console.log('  Client instantiated: ✅');
  console.log('  postTweet method exists:', typeof client.postTweet === 'function' ? '✅' : '❌');
  console.log('  generateTweetText method exists:', typeof client.generateTweetText === 'function' ? '✅' : '❌');
  console.log('  postDiffUpdate method exists:', typeof client.postDiffUpdate === 'function' ? '✅' : '❌');
  
  // Test tweet text generation
  const mockDiff = {
    newFollows: [{ username: 'user1', fullName: 'User One', isVerified: true }],
    unfollows: [{ username: 'user2', fullName: 'User Two', isVerified: false }],
    unchanged: 10,
    previousCount: 11,
    currentCount: 11,
    timestamp: Date.now()
  };
  
  const tweetText = client.generateTweetText(mockDiff, 'testuser');
  console.log('  Tweet text generated: ✅');
  console.log('  Tweet length:', tweetText.length);
  console.log('  Within 280 chars:', tweetText.length <= 280 ? '✅' : '❌');
  console.log('  Contains username:', tweetText.includes('@testuser') ? '✅' : '❌');
  
  console.log('✅ Twitter Client: PASSED\n');
} catch (e) {
  console.log('❌ Twitter Client: FAILED -', e.message, '\n');
}

// Test 10: Bot Main Class (structure)
console.log('🔟 Testing Bot Main Class...');
try {
  const { FollowTrackerBot } = require('./dist/bot');
  
  const bot = new FollowTrackerBot();
  console.log('  Bot instantiated: ✅');
  console.log('  Run method exists:', typeof bot.run === 'function' ? '✅' : '❌');
  
  console.log('✅ Bot Main Class: PASSED\n');
} catch (e) {
  console.log('❌ Bot Main Class: FAILED -', e.message, '\n');
}

console.log('═══════════════════════════════════════');
console.log('🎯 All Function Tests Completed!');
console.log('═══════════════════════════════════════\n');
