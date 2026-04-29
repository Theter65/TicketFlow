# Changelog

All notable changes to QR-TicketFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release preparation
- Environment variable configuration support
- Enhanced documentation

## [1.0.0] - 2026-04-28

### Added
- Batch QR code generation with customizable parameters
- Admin authentication system
- QR code scanning with first-scan detection
- CSV export functionality
- Reset scan counts feature
- Delete all codes functionality
- Background image support for QR codes
- Customizable QR code colors and positioning
- Transparency support for backgrounds
- QR code rotation support
- Preview mode for generated codes
- SSL/HTTPS support
- Session-based authentication
- Responsive web interface

### Security
- Admin password protection
- Session-based access control
- Environment variable support for sensitive data

---

## Release Notes

### Version 1.0.0

This is the initial release of QR-TicketFlow. The application provides a complete solution for generating, managing, and scanning QR code tickets for events.

**Key Features:**
- Generate multiple QR codes in batch
- Customize appearance with colors, backgrounds, and positioning
- Track ticket usage with scan counting
- Export data to CSV for analysis
- Secure admin interface

**Known Limitations:**
- SQLite database (recommended to use PostgreSQL/MySQL in production)
- No user role management (single admin password)
- No rate limiting on API endpoints

**Future Plans:**
- Add user roles and permissions
- Implement rate limiting
- Add database migration support
- Create Docker deployment option
- Add comprehensive test suite
