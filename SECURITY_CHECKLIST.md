# Security Checklist for Developers 🔒

Before running the bot or committing code, go through this checklist to ensure security best practices.

## 📋 Pre-Deployment Checklist

### Environment & Credentials

- [ ] ✅ `.env` file is created and configured
- [ ] ✅ `.env` is listed in `.gitignore`
- [ ] ✅ No credentials in code (all in environment variables)
- [ ] ✅ No hardcoded API keys or passwords
- [ ] ✅ `.env.example` contains only placeholder values
- [ ] ✅ All placeholder values in `.env` are replaced with real credentials
- [ ] ✅ Instagram credentials are for a TEST account, not main account
- [ ] ✅ Twitter API keys have appropriate permissions (read+write)

### Configuration Validation

- [ ] ✅ Run `npm run validate` to check configuration
- [ ] ✅ No validation errors
- [ ] ✅ Review and address any warnings
- [ ] ✅ Cron schedule is reasonable (minimum 6 hours recommended)
- [ ] ✅ Rate limiting delays are configured (1-3 seconds minimum)
- [ ] ✅ Stealth mode is enabled (`USE_STEALTH_MODE=true`)
- [ ] ✅ Session persistence is enabled (`USE_SESSION_PERSISTENCE=true`)

### Git & Version Control

- [ ] ✅ Run `git status` - ensure no `.env` files staged
- [ ] ✅ Run `git diff --cached` - review all changes before commit
- [ ] ✅ No session files (`.session.json`) committed
- [ ] ✅ No screenshots or snapshots committed
- [ ] ✅ No logs committed
- [ ] ✅ Husky pre-commit hooks installed (`npm run prepare`)
- [ ] ✅ Pre-commit hooks are executable

### Security Features

- [ ] ✅ Stealth mode enabled in config
- [ ] ✅ Session management configured
- [ ] ✅ Proxy configured (if needed)
- [ ] ✅ SSL/TLS verification enabled (default)
- [ ] ✅ Input validation enabled
- [ ] ✅ Rate limiting configured

### Testing

- [ ] ✅ Test configuration with `npm run validate`
- [ ] ✅ Run one-time scrape test: `npm run scrape`
- [ ] ✅ Check logs for errors
- [ ] ✅ Verify screenshots are captured
- [ ] ✅ Verify snapshots are saved
- [ ] ✅ Test Twitter posting (optional)

## 🚀 Pre-Commit Checklist

Before every `git commit`:

- [ ] ✅ No `.env` files in staging area
- [ ] ✅ No API keys in code
- [ ] ✅ No passwords in code
- [ ] ✅ No session files
- [ ] ✅ No private keys
- [ ] ✅ Run `git diff` to review changes
- [ ] ✅ Pre-commit hook passed

## 🔐 Credential Security

### Instagram Credentials

- [ ] ✅ Using a dedicated bot account (not personal)
- [ ] ✅ Password is strong (8+ characters)
- [ ] ✅ 2FA is DISABLED on bot account (bot can't handle 2FA)
- [ ] ✅ Account is not linked to personal email/phone
- [ ] ✅ Aware that account may be banned

### Twitter API Credentials

- [ ] ✅ App is created in Twitter Developer Portal
- [ ] ✅ API Key and Secret are generated
- [ ] ✅ Access Token and Secret are generated
- [ ] ✅ App has Read+Write permissions
- [ ] ✅ Credentials are kept secure

### Proxy (Optional)

- [ ] ✅ Proxy server is trusted
- [ ] ✅ Proxy credentials are secure
- [ ] ✅ Proxy uses HTTPS or SOCKS5
- [ ] ✅ Proxy is tested and working

## 🛡️ Runtime Security

### Before Starting Worker

- [ ] ✅ Review cron schedule (not too aggressive)
- [ ] ✅ Check disk space for logs/snapshots
- [ ] ✅ Verify network connectivity
- [ ] ✅ Test manual run first (`npm run dev`)
- [ ] ✅ Monitor initial runs for errors

### Monitoring

- [ ] ✅ Check logs regularly: `tail -f logs/combined.log`
- [ ] ✅ Watch for error messages
- [ ] ✅ Monitor for CAPTCHA challenges
- [ ] ✅ Check for "suspicious activity" warnings
- [ ] ✅ Verify Twitter posts are working
- [ ] ✅ Check snapshot storage growth

### If Errors Occur

- [ ] ✅ Check error logs: `tail -f logs/error.log`
- [ ] ✅ Stop bot immediately if security challenge appears
- [ ] ✅ Review configuration
- [ ] ✅ Increase delays if needed
- [ ] ✅ Reduce frequency if needed
- [ ] ✅ Consider using proxy

## 📊 Common Security Mistakes

### ❌ DON'T:

- [ ] ❌ Commit `.env` files
- [ ] ❌ Hardcode credentials in code
- [ ] ❌ Use main Instagram account
- [ ] ❌ Run bot too frequently (< 6 hours)
- [ ] ❌ Disable stealth mode
- [ ] ❌ Ignore error messages
- [ ] ❌ Use same IP for multiple accounts
- [ ] ❌ Share session files
- [ ] ❌ Push to public repo with credentials
- [ ] ❌ Disable pre-commit hooks

### ✅ DO:

- [ ] ✅ Use environment variables
- [ ] ✅ Use test/burner Instagram account
- [ ] ✅ Run bot infrequently (6-24 hours)
- [ ] ✅ Enable all security features
- [ ] ✅ Monitor logs regularly
- [ ] ✅ Use proxy for extra safety
- [ ] ✅ Keep `.gitignore` updated
- [ ] ✅ Review commits before pushing
- [ ] ✅ Test configuration before deploying
- [ ] ✅ Read SECURITY.md

## 🔍 File Checklist

Make sure these files are properly configured:

```
✅ .env               - Contains real credentials (NOT committed)
✅ .env.example       - Contains placeholders (committed)
✅ .gitignore         - Excludes sensitive files
✅ .gitsecrets        - Secrets scanner patterns
✅ .husky/pre-commit  - Pre-commit security checks
✅ package.json       - Husky prepare script
✅ SECURITY.md        - Security documentation
✅ README.md          - Usage instructions
```

## 📝 Deployment Checklist

### Local Development

- [ ] ✅ All items in Pre-Deployment Checklist
- [ ] ✅ Test run successful
- [ ] ✅ Logs are clean
- [ ] ✅ No credential leaks

### Production Deployment

- [ ] ✅ Use process manager (PM2 recommended)
- [ ] ✅ Set up log rotation
- [ ] ✅ Configure monitoring/alerting
- [ ] ✅ Set up automated backups
- [ ] ✅ Use production-grade proxy
- [ ] ✅ Secure server (firewall, SSH keys)
- [ ] ✅ Regular security updates
- [ ] ✅ Monitor resource usage

### Docker Deployment

- [ ] ✅ Don't include `.env` in Docker image
- [ ] ✅ Use Docker secrets or env vars
- [ ] ✅ Minimize image size
- [ ] ✅ Run as non-root user
- [ ] ✅ Use official base images
- [ ] ✅ Scan for vulnerabilities
- [ ] ✅ Keep images updated

## 🆘 Emergency Procedures

### If Credentials Are Leaked

1. [ ] ⚠️ Immediately change all passwords
2. [ ] ⚠️ Regenerate all API keys
3. [ ] ⚠️ Review git history for leaked data
4. [ ] ⚠️ Use `git filter-branch` to remove sensitive data
5. [ ] ⚠️ Force push cleaned history (if safe)
6. [ ] ⚠️ Notify team members
7. [ ] ⚠️ Check for unauthorized access

### If Account Gets Banned

1. [ ] ⚠️ Stop all bots immediately
2. [ ] ⚠️ Wait 24-48 hours
3. [ ] ⚠️ Review what went wrong
4. [ ] ⚠️ Adjust configuration (slower, less frequent)
5. [ ] ⚠️ Use different account/IP if restarting
6. [ ] ⚠️ Consider if automation is worth the risk

## 📚 Resources

- [SECURITY.md](./SECURITY.md) - Comprehensive security guide
- [README.md](./README.md) - Setup and usage
- [Instagram Terms of Service](https://help.instagram.com/581066165581870)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Remember: Security is not a one-time task, it's an ongoing process.**

Last updated: 2025-11-16
