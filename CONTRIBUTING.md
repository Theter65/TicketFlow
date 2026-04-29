# Contributing to QR-TicketFlow 🎫

Thank you for considering contributing to QR-TicketFlow! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

- Check if the bug has already been reported in [Issues](https://github.com/yourusername/qr-ticketflow/issues)
- Use the bug report template when creating a new issue
- Include detailed steps to reproduce the bug
- Include screenshots if applicable
- Specify your environment (OS, Python version, browser)

### Suggesting Enhancements

- Check if the enhancement has already been suggested in [Issues](https://github.com/yourusername/qr-ticketflow/issues)
- Use the feature request template
- Describe the enhancement and why it would be useful
- Include mockups or examples if possible

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-fix-name
   ```
3. Make your changes
4. Test your changes thoroughly
5. Commit with clear, descriptive messages:
   ```bash
   git commit -m "Add: description of your changes"
   ```
6. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. Create a Pull Request against the `main` branch

### Development Setup

1. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/qr-ticketflow.git
   cd qr-ticketflow
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/macOS
   # or
   .\venv\Scripts\Activate.ps1  # Windows
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt  # If available
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. Run the development server:
   ```bash
   python app.py
   ```

### Code Style

- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small
- Write docstrings for functions and classes

### Testing

- Add tests for new features
- Ensure existing tests pass
- Test edge cases and error handling

### Documentation

- Update README.md if needed
- Document new features or API changes
- Update comments in code when making changes

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing! 🎉
