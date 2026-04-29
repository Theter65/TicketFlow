# QR-TicketFlow 🎫

A Flask-based QR code ticket management system with scanning capabilities, batch generation, and administrative controls.

## Features

- **Batch QR Code Generation**: Generate multiple QR codes at once with customizable parameters
- **Customizable Design**: Add backgrounds, adjust colors, transparency, and positioning
- **Ticket Scanning**: Track entry with first-scan detection
- **Admin Dashboard**: Protected admin area for managing codes
- **Export Data**: Export ticket data to CSV
- **Reset Capability**: Reset scan counts without deleting codes
- **HTTPS Support**: SSL/TLS encryption ready

## Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/qr-ticketflow.git
cd qr-ticketflow
```

2. Create and activate a virtual environment:
```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables (optional):
```bash
cp .env.example .env
# Edit .env with your settings
```

5. Run the application:
```bash
python app.py
```

6. Open your browser and navigate to:
   - Local: `https://localhost:5000`
   - Network: `https://your-ip:5000`

### Default Admin Password

The default admin password is `12345678`. **Change this in production!**

Set a secure password via environment variable:
```bash
export ADMIN_PASSWORD=your_secure_password
```

## Configuration

Create a `.env` file based on `.env.example`:

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Flask secret key | Change in production! |
| `ADMIN_PASSWORD` | Admin login password | `12345678` |
| `DATABASE_URL` | Database connection URL | SQLite |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `5000` |

## SSL/HTTPS Setup

For HTTPS support with custom certificates:

1. Install mkcert:
```bash
# Windows (using Chocolatey)
choco install mkcert

# macOS
brew install mkcert

# Linux
sudo apt install libnss3-tools && wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
```

2. Generate certificates:
```bash
mkcert your-ip localhost 127.0.0.1 ::1
```

3. Move certificates to `certs/` folder and update `app.py` if needed.

## Usage

### Admin Login
Navigate to `/login` and enter your admin password.

### Generate QR Codes
1. Login as admin
2. Use the web interface to configure:
   - Number of codes (batch size)
   - Prefix for codes
   - Company/Event/Address text
   - Colors and styling
   - Background image (optional)
   - QR positioning and scaling

### Scan Tickets
Send POST requests to `/scan` endpoint:
```bash
curl -X POST https://localhost:5000/scan \
  -H "Content-Type: application/json" \
  -d '{"code": "YOUR_QR_CODE_TEXT"}'
```

### Export Data
Visit `/export_csv` (admin only) to download ticket data.

## API Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/` | GET | Main page | No |
| `/login` | GET, POST | Admin login | No |
| `/logout` | GET | Admin logout | No |
| `/check-auth` | GET | Check auth level | No |
| `/generate` | GET, POST | Generate QR codes | Admin |
| `/codes` | GET | List all codes | Admin |
| `/codes/<filename>` | GET | Serve QR code image | No |
| `/scan` | POST | Scan a ticket | No |
| `/export_csv` | GET | Export to CSV | Admin |
| `/reset` | POST | Reset all scan counts | Admin |
| `/delete_all` | POST | Delete all codes | Admin |

## Project Structure

```
qr-ticketflow/
├── app.py                 # Main Flask application
├── templates/              # HTML templates
│   ├── index.html
│   └── login.html
├── static/                 # Static assets
│   ├── css/
│   ├── js/
│   └── images/
├── codes/                  # Generated QR codes (gitignored)
├── instance/               # Instance-specific data (gitignored)
├── flask_session/          # Session data (gitignored)
├── certs/                  # SSL certificates (gitignored)
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── LICENSE.txt             # MIT License
└── README.md               # This file
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.

## Acknowledgments

- Flask - Web framework
- qrcode - QR code generation
- Pillow - Image processing
- SQLAlchemy - Database ORM

## Support

If you encounter any issues or have questions, please file an issue on the GitHub issue tracker.

---

Made with ❤️ for event management
