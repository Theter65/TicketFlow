#!/usr/bin/env python3
"""
Quick setup script for QR-TicketFlow
"""

import os
import sys
import subprocess

def run_command(command, description):
    """Run a shell command and handle errors"""
    print(f"\n[INFO] {description}...")
    try:
        subprocess.run(command, shell=True, check=True)
        print(f"[SUCCESS] {description} completed.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Failed to {description.lower()}: {e}")
        return False

def main():
    print("=" * 60)
    print("QR-TicketFlow Setup Script")
    print("=" * 60)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("[ERROR] Python 3.8 or higher is required.")
        sys.exit(1)
    
    print(f"[INFO] Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro} detected.")
    
    # Create virtual environment
    if not os.path.exists("venv"):
        if not run_command(f"{sys.executable} -m venv venv", "Creating virtual environment"):
            sys.exit(1)
    else:
        print("[INFO] Virtual environment already exists.")
    
    # Determine activate script path
    if os.name == 'nt':
        activate = "venv\\Scripts\\activate"
        pip = "venv\\Scripts\\pip"
    else:
        activate = "source venv/bin/activate"
        pip = "venv/bin/pip"
    
    # Install dependencies
    print(f"\n[INFO] To install dependencies, run:")
    print(f"  {activate}")
    print(f"  {pip} install -r requirements.txt")
    
    # Create .env file if it doesn't exist
    if not os.path.exists(".env"):
        if os.path.exists(".env.example"):
            import shutil
            shutil.copy(".env.example", ".env")
            print("\n[SUCCESS] Created .env file from .env.example")
            print("[WARNING] Please edit .env and set your own SECRET_KEY and ADMIN_PASSWORD!")
    
    # Create necessary directories
    for directory in ["codes", "certs", "flask_session", "instance"]:
        os.makedirs(directory, exist_ok=True)
    
    print("\n" + "=" * 60)
    print("Setup completed!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Activate the virtual environment:")
    if os.name == 'nt':
        print("   .\\venv\\Scripts\\Activate.ps1")
    else:
        print("   source venv/bin/activate")
    print("2. Install dependencies:")
    print("   pip install -r requirements.txt")
    print("3. Edit .env with your settings")
    print("4. Run the application:")
    print("   python app.py")
    print("5. Open https://localhost:5000 in your browser")
    print("\n")

if __name__ == "__main__":
    main()
