# Security & Safety Guide 🔐

## ⚠️ Important Legal & Safety Warnings

### Instagram Terms of Service
**Using this bot may violate Instagram's Terms of Service**

- Instagram explicitly prohibits automated scraping and bot activity
- Your account may be **temporarily or permanently banned**
- Instagram employs sophisticated bot detection systems
- Use this tool **at your own risk** and only on accounts you're willing to lose

### Recommended Use Cases
✅ **Safe scenarios:**
- Educational purposes and learning automation
- Testing on your own test/development accounts
- Research projects with proper authorization
- Personal tracking of your own following list

❌ **Risky scenarios:**
- Using on your main Instagram account
- Commercial or mass scraping
- High-frequency scraping
- Tracking many different accounts

## 🛡️ Security Features Implemented

### 1. Bot Detection Evasion
- **Stealth Mode**: Hides automation indicators
  - Removes `navigator.webdriver` flag
  - Adds realistic browser plugins
  - Spoofs chrome runtime
- **Random User-Agents**: Rotates between realistic browser signatures
- **Human-like Behavior**: Random delays between actions
- **Realistic Browser Fingerprint**: Proper timezone, locale, viewport

### 2. Session Management
- **Cookie Persistence**: Saves login session to avoid repeated logins
- **Session Validation**: Checks if saved session is still valid
- **Auto-refresh**: Re-authenticates only when necessary
- Sessions expire after 7 days for security

### 3. Rate Limiting Protection
- **Random Delays**: Configurable min/max delays between actions
- **Human Typing**: Character-by-character with random delays
- **Scroll Delays**: Random pauses during list scrolling
- Default: 1-3 seconds between actions (configurable)

### 4. Error Handling
- **Retry Logic**: Automatic retries with exponential backoff
- **2FA Detection**: Alerts when 2FA is required
- **Graceful Failures**: Comprehensive error logging
- **Network Resilience**: Handles timeouts and connection issues

### 5. Privacy Protection
- **Environment Variables**: Never commit credentials
- **Session Encryption**: Sessions stored locally, not shared
- **Log Sanitization**: Passwords not logged

## 🔒 Best Practices

### Account Safety

1. **Use a Secondary Account**
   ```
   ⚠️ NEVER use your main Instagram account
   Create a test/burner account for bot testing
   ```

2. **Enable 2FA on Main Account**
   - Note: This bot doesn't support 2FA (by design for safety)
   - If you need 2FA, you shouldn't be automating

3. **Use Session Persistence**
   ```env
   USE_SESSION_PERSISTENCE=true
   ```
   This reduces login frequency and looks more natural

### Responsible Scraping

1. **Low Frequency**
   ```env
   # Every 6+ hours recommended
   CRON_SCHEDULE=0 */6 * * *
   ```

2. **Longer Delays**
   ```env
   MIN_DELAY=2000  # 2 seconds
   MAX_DELAY=5000  # 5 seconds
   ```

3. **Use Proxy (Advanced)**
   ```env
   USE_PROXY=true
   PROXY_SERVER=http://proxy.example.com:8080
   ```

4. **Monitor Logs**
   - Check for warnings about detection
   - Watch for failed requests
   - Stop immediately if you see security challenges

### Instagram Detection Indicators

🚨 **Stop immediately if you see:**
- CAPTCHA challenges
- "Suspicious activity" warnings
- Repeated login failures
- "Action blocked" messages
- Account restrictions

## 🔧 Configuration Recommendations

### Conservative (Safest)
```env
CRON_SCHEDULE=0 0 * * *     # Once daily
HEADLESS=true
USE_STEALTH_MODE=true
USE_SESSION_PERSISTENCE=true
MIN_DELAY=3000
MAX_DELAY=6000
BROWSER_TIMEOUT=120000
```

### Moderate (Balanced)
```env
CRON_SCHEDULE=0 */6 * * *   # Every 6 hours
HEADLESS=true
USE_STEALTH_MODE=true
USE_SESSION_PERSISTENCE=true
MIN_DELAY=1500
MAX_DELAY=4000
BROWSER_TIMEOUT=60000
```

### Aggressive (Higher Risk)
```env
CRON_SCHEDULE=0 */2 * * *   # Every 2 hours
# Not recommended for long-term use
```

## 🌐 Proxy Setup

### Why Use a Proxy?
- Rotate IP addresses
- Reduce account association
- Geographic distribution
- Additional anonymity layer

### Proxy Types Supported
```env
# HTTP Proxy
PROXY_SERVER=http://proxy.example.com:8080

# SOCKS5 Proxy (recommended)
PROXY_SERVER=socks5://proxy.example.com:1080

# With authentication
PROXY_USERNAME=your_username
PROXY_PASSWORD=your_password
```

### Recommended Proxy Providers
- Residential proxies (most natural)
- Rotating proxy services
- Avoid free proxies (often blacklisted)

## 🚫 What NOT to Do

1. ❌ **Don't** scrape more than once every 2 hours
2. ❌ **Don't** use on accounts with large followings (>10k)
3. ❌ **Don't** disable stealth mode unless debugging
4. ❌ **Don't** run multiple instances on same account
5. ❌ **Don't** use same IP for multiple accounts
6. ❌ **Don't** share your session files
7. ❌ **Don't** commit your `.env` file
8. ❌ **Don't** ignore error messages

## 🔍 Monitoring & Maintenance

### Check Logs Regularly
```bash
# Watch for errors
tail -f logs/error.log

# Monitor all activity
tail -f logs/combined.log
```

### Signs of Trouble
- Increasing failure rates
- Longer execution times
- CAPTCHA mentions in logs
- Session invalidation
- HTTP 429 (Too Many Requests)

### Recovery Steps
1. Stop the bot immediately
2. Wait 24-48 hours
3. Increase delays
4. Reduce frequency
5. Consider using proxy
6. Clear session and re-login

## 📊 Detection Risk Levels

| Frequency | Risk Level | Recommendation |
|-----------|-----------|----------------|
| Daily | 🟢 Low | Safe for most accounts |
| Every 6h | 🟡 Medium | Use with caution |
| Every 2h | 🟠 High | High ban risk |
| Hourly | 🔴 Critical | Almost certain ban |

## 🆘 If Your Account Gets Flagged

1. **Stop all automation immediately**
2. **Don't try to login repeatedly**
3. **Wait 24-48 hours before manual login**
4. **Complete any security challenges manually**
5. **Change password (manual, not automated)**
6. **Review Instagram's email for instructions**

## 📝 Disclaimer

This bot is provided for **educational purposes only**. The developers are not responsible for:
- Account bans or restrictions
- Violations of Instagram's ToS
- Data loss or privacy breaches
- Any damages resulting from use

**Use at your own risk. You are solely responsible for how you use this tool.**

## 🔗 Resources

- [Instagram Terms of Service](https://help.instagram.com/581066165581870)
- [Instagram Community Guidelines](https://help.instagram.com/477434105621119)
- [Responsible Web Scraping Guide](https://www.scraperapi.com/blog/web-scraping-best-practices/)

---

**Remember: The best security is using this tool responsibly and infrequently.**
