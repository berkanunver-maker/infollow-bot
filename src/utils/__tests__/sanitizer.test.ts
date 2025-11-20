import { InputSanitizer } from '../sanitizer';

describe('InputSanitizer', () => {
  describe('sanitizeUsername', () => {
    it('should allow valid usernames', () => {
      expect(InputSanitizer.sanitizeUsername('valid_user.123')).toBe('valid_user.123');
      expect(InputSanitizer.sanitizeUsername('john_doe')).toBe('john_doe');
      expect(InputSanitizer.sanitizeUsername('user.name')).toBe('user.name');
    });

    it('should remove invalid characters', () => {
      expect(InputSanitizer.sanitizeUsername('user@name')).toBe('username');
      expect(InputSanitizer.sanitizeUsername('user name')).toBe('username');
      expect(InputSanitizer.sanitizeUsername('user#name')).toBe('username');
    });

    it('should remove XSS attempts', () => {
      const result = InputSanitizer.sanitizeUsername('user<script>alert(1)</script>');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('script');
    });

    it('should handle empty input', () => {
      expect(InputSanitizer.sanitizeUsername('')).toBe('');
    });
  });

  describe('containsSqlInjection', () => {
    it('should detect SQL injection patterns', () => {
      expect(InputSanitizer.containsSqlInjection("admin' OR '1'='1")).toBe(true);
      expect(InputSanitizer.containsSqlInjection('SELECT * FROM users')).toBe(true);
      expect(InputSanitizer.containsSqlInjection('DROP TABLE users')).toBe(true);
      expect(InputSanitizer.containsSqlInjection('UNION SELECT')).toBe(true);
      expect(InputSanitizer.containsSqlInjection('-- comment')).toBe(true);
    });

    it('should allow safe input', () => {
      expect(InputSanitizer.containsSqlInjection('john_doe')).toBe(false);
      expect(InputSanitizer.containsSqlInjection('user123')).toBe(false);
      expect(InputSanitizer.containsSqlInjection('valid.username')).toBe(false);
    });
  });

  describe('containsXss', () => {
    it('should detect XSS patterns', () => {
      expect(InputSanitizer.containsXss('<script>alert(1)</script>')).toBe(true);
      expect(InputSanitizer.containsXss('<img src=x onerror=alert(1)>')).toBe(true);
      expect(InputSanitizer.containsXss('javascript:alert(1)')).toBe(true);
      expect(InputSanitizer.containsXss('<iframe src="evil.com">')).toBe(true);
    });

    it('should allow safe input', () => {
      expect(InputSanitizer.containsXss('Hello World')).toBe(false);
      expect(InputSanitizer.containsXss('user@example.com')).toBe(false);
      expect(InputSanitizer.containsXss('normal text')).toBe(false);
    });
  });

  describe('containsCommandInjection', () => {
    it('should detect command injection patterns', () => {
      expect(InputSanitizer.containsCommandInjection('$(rm -rf /)')).toBe(true);
      expect(InputSanitizer.containsCommandInjection('`whoami`')).toBe(true);
      expect(InputSanitizer.containsCommandInjection('cat /etc/passwd')).toBe(false); // Only metacharacters
      expect(InputSanitizer.containsCommandInjection('test && echo bad')).toBe(true);
      expect(InputSanitizer.containsCommandInjection('test; echo bad')).toBe(true);
    });

    it('should allow safe input', () => {
      expect(InputSanitizer.containsCommandInjection('john_doe')).toBe(false);
      expect(InputSanitizer.containsCommandInjection('user-123')).toBe(false);
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow valid URLs', () => {
      expect(InputSanitizer.sanitizeUrl('https://example.com')).toBe('https://example.com/');
      expect(InputSanitizer.sanitizeUrl('http://test.com')).toBe('http://test.com/');
    });

    it('should reject invalid protocols', () => {
      expect(InputSanitizer.sanitizeUrl('javascript:alert(1)')).toBe(null);
      expect(InputSanitizer.sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe(null);
      expect(InputSanitizer.sanitizeUrl('file:///etc/passwd')).toBe(null);
    });

    it('should handle malformed URLs', () => {
      expect(InputSanitizer.sanitizeUrl('not a url')).toBe(null);
      expect(InputSanitizer.sanitizeUrl('')).toBe(null);
    });
  });

  describe('sanitizePath', () => {
    it('should allow safe paths', () => {
      expect(InputSanitizer.sanitizePath('/data/snapshots/file.json')).toContain('file.json');
      expect(InputSanitizer.sanitizePath('data/file.txt')).toContain('file.txt');
    });

    it('should prevent path traversal', () => {
      const result = InputSanitizer.sanitizePath('../../../etc/passwd');
      expect(result).not.toContain('..');
    });

    it('should remove dangerous characters', () => {
      const result = InputSanitizer.sanitizePath('file;rm -rf /.txt');
      expect(result).not.toContain(';');
    });
  });
});
