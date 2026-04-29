# Security Policy

## Reporting a Vulnerability

We take the security of QR-TicketFlow seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: [INSERT SECURITY EMAIL]

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include

Please include the following information:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Preferred Languages

We prefer all communications to be in English or Spanish.

## Security Best Practices

When deploying QR-TicketFlow in production:

1. **Change the default admin password** - Set a strong password via `ADMIN_PASSWORD` environment variable
2. **Use a strong SECRET_KEY** - Generate a random secret key and keep it confidential
3. **Use HTTPS** - Always use SSL/TLS in production with valid certificates
4. **Keep dependencies updated** - Regularly update packages: `pip install --upgrade -r requirements.txt`
5. **Secure your database** - Use a production database (PostgreSQL/MySQL) instead of SQLite for production
6. **Set up proper firewall rules** - Restrict access to the admin interface
7. **Regular backups** - Backup your database and generated QR codes regularly
8. **Monitor logs** - Keep an eye on access logs for suspicious activity

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < 1.0   | :x:                |

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine the affected versions.
2. Audit code to find any potential similar problems.
3. Prepare fixes for all releases still under maintenance.
4. Release new versions and update the CHANGELOG.

## Comments on this Policy

If you have suggestions on how this process could be improved, please submit a pull request or open an issue to discuss.
