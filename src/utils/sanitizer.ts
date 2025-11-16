/**
 * Input Sanitization Utilities
 * Prevents injection attacks and validates user inputs
 */

export class InputSanitizer {
  /**
   * Sanitize Instagram username
   * Only allows alphanumeric, dots, and underscores
   */
  static sanitizeUsername(username: string): string {
    if (!username) return '';

    // Remove all characters except alphanumeric, dots, and underscores
    const sanitized = username.replace(/[^a-zA-Z0-9._]/g, '');

    // Limit to 30 characters (Instagram's max)
    return sanitized.slice(0, 30);
  }

  /**
   * Sanitize path to prevent directory traversal
   */
  static sanitizePath(filePath: string): string {
    if (!filePath) return '';

    // Remove dangerous patterns
    let sanitized = filePath.replace(/\.\./g, ''); // Remove ..
    sanitized = sanitized.replace(/~\//g, ''); // Remove ~/
    sanitized = sanitized.replace(/\/\//g, '/'); // Remove double slashes

    return sanitized;
  }

  /**
   * Validate and sanitize URL
   */
  static sanitizeUrl(url: string): string | null {
    if (!url) return null;

    try {
      const parsed = new URL(url);

      // Only allow http, https, socks4, socks5
      const allowedProtocols = ['http:', 'https:', 'socks4:', 'socks5:'];

      if (!allowedProtocols.includes(parsed.protocol)) {
        return null;
      }

      return parsed.toString();
    } catch {
      return null;
    }
  }

  /**
   * Sanitize cron expression
   */
  static sanitizeCronExpression(expression: string): string {
    if (!expression) return '';

    // Only allow valid cron characters: numbers, spaces, *, /, -, ,
    return expression.replace(/[^0-9\s*\/\-,]/g, '');
  }

  /**
   * Sanitize log messages to prevent log injection
   */
  static sanitizeLogMessage(message: string): string {
    if (!message) return '';

    // Remove newlines and carriage returns to prevent log injection
    let sanitized = message.replace(/[\r\n]/g, ' ');

    // Remove ANSI escape codes
    sanitized = sanitized.replace(/\x1B\[[0-9;]*[JKmsu]/g, '');

    return sanitized;
  }

  /**
   * Validate email format (for notifications, etc.)
   */
  static isValidEmail(email: string): boolean {
    if (!email) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if string contains SQL injection patterns
   */
  static containsSqlInjection(input: string): boolean {
    if (!input) return false;

    const sqlPatterns = [
      /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
      /--/,
      /;/,
      /\/\*/,
      /\*\//,
      /\bOR\b.*=.*=/i,
      /\bAND\b.*=.*=/i,
      /\bUNION\b/i,
    ];

    return sqlPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * Check if string contains command injection patterns
   */
  static containsCommandInjection(input: string): boolean {
    if (!input) return false;

    const cmdPatterns = [
      /[;&|`$(){}[\]<>]/,
      /\$\(/,
      /\$\{/,
      /`/,
      /&&/,
      /\|\|/,
    ];

    return cmdPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * Check if string contains XSS patterns
   */
  static containsXss(input: string): boolean {
    if (!input) return false;

    const xssPatterns = [
      /<script/i,
      /<\/script>/i,
      /javascript:/i,
      /onerror=/i,
      /onload=/i,
      /onclick=/i,
      /<iframe/i,
      /<embed/i,
      /<object/i,
    ];

    return xssPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * General purpose sanitization - removes dangerous characters
   */
  static sanitizeGeneral(input: string): string {
    if (!input) return '';

    // Remove control characters
    let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');

    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/[<>'"\\;`]/g, '');

    return sanitized.trim();
  }

  /**
   * Validate numeric input
   */
  static sanitizeNumber(
    input: string | number,
    min?: number,
    max?: number
  ): number | null {
    const num = typeof input === 'string' ? parseInt(input, 10) : input;

    if (isNaN(num)) return null;

    if (min !== undefined && num < min) return null;
    if (max !== undefined && num > max) return null;

    return num;
  }

  /**
   * Sanitize file name
   */
  static sanitizeFileName(fileName: string): string {
    if (!fileName) return '';

    // Remove path separators and dangerous characters
    let sanitized = fileName.replace(/[\/\\:*?"<>|]/g, '');

    // Remove leading dots
    sanitized = sanitized.replace(/^\.+/, '');

    return sanitized.slice(0, 255); // Max filename length
  }

  /**
   * Check if credentials appear to be leaked/exposed
   */
  static looksLikeLeakedCredential(value: string): boolean {
    if (!value) return false;

    // Check for common patterns of leaked credentials
    const leakPatterns = [
      /github\.com/i,
      /gitlab\.com/i,
      /bitbucket\.org/i,
      /stackoverflow\.com/i,
      /pastebin\.com/i,
      /gist\.github/i,
      /pk_live_/i, // Stripe
      /sk_live_/i, // Stripe
      /AKIA[0-9A-Z]{16}/i, // AWS
      /AIza[0-9A-Za-z\\-_]{35}/i, // Google API
    ];

    return leakPatterns.some((pattern) => pattern.test(value));
  }
}
