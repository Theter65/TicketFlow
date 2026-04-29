from flask import Flask, render_template, request, jsonify, send_from_directory, make_response, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
import qrcode
import os
from datetime import datetime, timezone
import csv
from io import StringIO
import shutil
import random
import string
from PIL import ImageColor
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///database.sqlite')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', os.urandom(24).hex())
app.config['SESSION_TYPE'] = 'filesystem'

from flask_session import Session
Session(app)

db = SQLAlchemy(app)

CODES_DIR = os.path.join(os.path.dirname(__file__), 'codes')
os.makedirs(CODES_DIR, exist_ok=True)

class Code(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code_text = db.Column(db.String(200), unique=True, nullable=False, index=True)
    filename = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    first_scanned_at = db.Column(db.DateTime, nullable=True)
    scan_count = db.Column(db.Integer, default=0)
    entry_number = db.Column(db.Integer, nullable=False)
    batch_size = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'code_text': self.code_text,
            'filename': self.filename,
            'created_at': self.created_at.isoformat(),
            'first_scanned_at': self.first_scanned_at.isoformat() if self.first_scanned_at else None,
            'scan_count': self.scan_count,
            'entry_number': self.entry_number,
            'batch_size': self.batch_size
        }

ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', '12345678')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        password = request.form.get('password')
        if password == ADMIN_PASSWORD:
            session['level'] = 'admin'
            return redirect(url_for('index'))
        return "Contraseña incorrecta. Intenta de nuevo.", 401
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('level', None)
    return redirect(url_for('index'))

@app.route('/check-auth', methods=['GET'])
def check_auth():
    level = session.get('level', 'none')
    return jsonify({'level': level})

@app.route('/generate', methods=['GET', 'POST'])
def generate():
    if session.get('level') != 'admin':
        return "Acceso denegado. Nivel insuficiente.", 403
    
    if request.method == 'POST':
        data = request.form
        background_file = request.files.get('background')
    else:
        data = request.args
        background_file = None
    
    try:
        n = int(data.get('n', 1))
    except ValueError:
        return jsonify({'error': 'Parámetro n inválido'}), 400
    
    prefix = data.get('prefix', 'AMIGOS')
    company = data.get('company', '').strip()
    event = data.get('event', '').strip()
    address = data.get('address', '').strip()
    text_color = data.get('text_color', 'black')
    use_background = data.get('use_background', 'false').lower() == 'true'
    solo_qr = data.get('solo_qr', 'false').lower() == 'true'
    transparency = float(data.get('transparency', 0.5))
    show_entry_number = data.get('show_entry_number', 'true').lower() == 'true'
    qr_x_pos = float(data.get('qr_x_pos', 0.5))
    qr_y_pos = float(data.get('qr_y_pos', 0.5))
    qr_scale = float(data.get('qr_scale', 0.5))
    qr_box_size = int(data.get('qr_box_size', 10))
    qr_fill_color = data.get('qr_fill_color', 'black')
    qr_back_color = data.get('qr_back_color', 'white')
    rotate_qr = int(data.get('rotate_qr', 0)) % 360
    preview_mode = data.get('preview_mode', 'false').lower() == 'true'

    created = []
    # Preload fonts once to optimize
    try:
        fonts = {
            'large': ImageFont.truetype("arialbd.ttf", 1),
            'regular': ImageFont.truetype("arial.ttf", 1),
            'address': ImageFont.truetype("arial.ttf", 1)
        }
    except:
        fonts = {'large': ImageFont.load_default(), 'regular': ImageFont.load_default(), 'address': ImageFont.load_default()}

    for i in range(n):
        random_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
        code_text = f"{prefix}-{random_code}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}-{i+1}"
        entry_number = i + 1
        filename = f"{code_text}.png"
        filepath = os.path.join(CODES_DIR, filename)

        # Create QR and capture original dimensions
        qr = qrcode.QRCode(version=1, box_size=qr_box_size, border=4)
        qr.add_data(code_text)
        qr.make(fit=True)

        # NEW: Handle back_color intelligently for transparency
        if qr_back_color == 'transparent':
            # Get fill RGB
            fill_rgb = ImageColor.getcolor(qr_fill_color, "RGB")
            # Choose temp_back by inverting fill to ensure it's different
            temp_back_rgb = (255 - fill_rgb[0], 255 - fill_rgb[1], 255 - fill_rgb[2])
            # If inversion results in same color (rare, e.g., gray), shift it
            if temp_back_rgb == fill_rgb:
                temp_back_rgb = ( (temp_back_rgb[0] + 1) % 256, (temp_back_rgb[1] + 1) % 256, (temp_back_rgb[2] + 1) % 256 )
            temp_back_color = f"#{temp_back_rgb[0]:02x}{temp_back_rgb[1]:02x}{temp_back_rgb[2]:02x}"  # Convert to hex for make_image
            qr_img = qr.make_image(fill_color=qr_fill_color, back_color=temp_back_color).convert("RGBA")
            
            # Replace temp_back pixels with transparent
            datas = qr_img.getdata()
            new_data = []
            for item in datas:
                if item[:3] == temp_back_rgb:
                    new_data.append(item[:3] + (0,))  # Set alpha=0, preserve RGB (though irrelevant for trans)
                else:
                    new_data.append(item)
            qr_img.putdata(new_data)
        else:
            qr_img = qr.make_image(fill_color=qr_fill_color, back_color=qr_back_color).convert("RGBA")

        qr_width, qr_height = qr_img.size  # Capture dimensions here, after creation but before resize

        if solo_qr:
            qr_img.save(filepath)  # CHANGED: No convert('RGB') to preserve alpha
        else:
            # Determine base size
            if use_background and background_file:
                bg_img = Image.open(background_file).convert('RGBA')
                entry_width, entry_height = bg_img.size
            else:
                entry_width = 2 * qr_width
                entry_height = 3 * qr_height
                bg_img = Image.new('RGBA', (entry_width, entry_height), (50, 50, 50, 255))  # Fondo gris oscuro para contraste con blanco

            # Apply transparency to background if custom background is used
            if use_background and background_file:
                transparency = max(0.0, min(1.0, transparency))
                base_img = Image.new('RGBA', bg_img.size, (0, 0, 0, 0))  # Fondo transparente base
                img = Image.blend(base_img, bg_img, alpha=transparency)
            else:
                img = bg_img

            # Resize and rotate QR
            new_qr_width = int(entry_width * qr_scale)
            new_qr_height = int(qr_height * (new_qr_width / qr_width))  # Use captured qr_height
            qr_img = qr_img.resize((new_qr_width, new_qr_height), Image.Resampling.LANCZOS)
            if rotate_qr:
                qr_img = qr_img.rotate(rotate_qr, expand=True)

            # Position QR
            qr_pos_x = int(qr_x_pos * (entry_width - qr_img.width))
            qr_pos_y = int(qr_y_pos * (entry_height - qr_img.height))
            qr_pos_x = max(0, min(qr_pos_x, entry_width - qr_img.width))
            qr_pos_y = max(0, min(qr_pos_y, entry_height - qr_img.height))

            # Paste QR with transparency
            if qr_img.mode == 'RGBA':
                img.paste(qr_img, (qr_pos_x, qr_pos_y), qr_img)
            else:
                img.paste(qr_img, (qr_pos_x, qr_pos_y))

            # Text rendering
            draw = ImageDraw.Draw(img)
            # Scale fonts based on QR width
            fonts['large'] = ImageFont.truetype("arialbd.ttf", int(qr_img.width * 0.3)) if 'arialbd.ttf' in fonts['large'].getname()[0] else ImageFont.load_default().font_variant(size=int(qr_img.width * 0.3))
            fonts['regular'] = ImageFont.truetype("arial.ttf", int(qr_img.width * 0.2)) if 'arial.ttf' in fonts['regular'].getname()[0] else ImageFont.load_default().font_variant(size=int(qr_img.width * 0.2))
            fonts['address'] = ImageFont.truetype("arial.ttf", int(qr_img.width * 0.1)) if 'arial.ttf' in fonts['address'].getname()[0] else ImageFont.load_default().font_variant(size=int(qr_img.width * 0.1))

            def center_text(text, font, y_pos, base_x=0):
                bbox = draw.textbbox((0, 0), text, font=font)
                text_width = bbox[2] - bbox[0]
                x_pos = base_x + ((qr_img.width - text_width) // 2)  # Center relative to QR width
                x_pos = max(0, min(x_pos, entry_width - text_width))  # Ensure within bounds
                draw.text((x_pos, y_pos), text, fill=text_color, font=font)

            if company:
                center_text(company, fonts['large'], 10, qr_pos_x)
            text_y = qr_pos_y + qr_img.height + 10
            if event:
                center_text(event, fonts['regular'], text_y, qr_pos_x)
                text_y += int(qr_img.width * 0.25)
            if show_entry_number and n > 1:
                entry_text = f"{entry_number}/{n}"
                entry_font_size = qr_img.width // 10  # x/10 scaling
                entry_font = ImageFont.truetype("arial.ttf", entry_font_size) if 'arial.ttf' in fonts['regular'].getname()[0] else ImageFont.load_default().font_variant(size=entry_font_size)
                center_text(entry_text, entry_font, text_y, qr_pos_x)
                text_y += int(qr_img.width * 0.25)
            if address:
                center_text(address, fonts['address'], text_y, qr_pos_x)

            # Save with preview option
            if preview_mode:
                img = img.resize((int(entry_width * 0.5), int(entry_height * 0.5)), Image.Resampling.LANCZOS)
            img.save(filepath)  # CHANGED: No convert('RGB') to preserve alpha

        c = Code(code_text=code_text, filename=filename, entry_number=entry_number, batch_size=n)
        db.session.add(c)
        created.append(code_text)
    
    db.session.commit()
    return jsonify({'created': created, 'count': len(created)})
    
@app.route('/codes', methods=['GET'])
def list_codes():
    if session.get('level') != 'admin':
        return "Acceso denegado. Nivel insuficiente.", 403
    codes = Code.query.all()
    return jsonify([c.to_dict() for c in codes])

@app.route('/codes/<path:filename>')
def serve_code_image(filename):
    filepath = os.path.join(CODES_DIR, filename)
    if os.path.isfile(filepath):
        response = make_response(send_from_directory(CODES_DIR, filename))
        response.headers['Cache-Control'] = 'public, max-age=86400'
        return response
    return "Archivo no encontrado", 404

@app.route('/scan', methods=['POST'])
def scan():
    data = request.get_json(force=True)
    if not data or 'code' not in data:
        return jsonify({'error': 'Falta campo code'}), 400
    code_text = data['code']
    code = Code.query.filter_by(code_text=code_text).first()
    if not code:
        return jsonify({'result': 'denegado', 'reason': 'Código no registrado', 'code_text': code_text}), 200

    if code.scan_count == 0:
        code.scan_count = 1
        code.first_scanned_at = datetime.now(timezone.utc)
        db.session.commit()
        return jsonify({'result': 'concedido', 'message': 'Permiso concedido', 'code_text': code_text, 'entry_number': code.entry_number, 'total_entries': code.batch_size}), 200
    else:
        code.scan_count += 1
        db.session.commit()
        return jsonify({'result': 'denegado', 'message': 'Permiso denegado - ya usado', 'code_text': code_text, 'entry_number': code.entry_number, 'total_entries': code.batch_size}), 200

@app.route('/export_csv', methods=['GET'])
def export_csv():
    if session.get('level') != 'admin':
        return "Acceso denegado. Nivel insuficiente.", 403
    codes = Code.query.all()
    si = StringIO()
    writer = csv.writer(si)
    writer.writerow(['id', 'code_text', 'filename', 'created_at', 'first_scanned_at', 'scan_count', 'entry_number', 'batch_size'])
    for c in codes:
        writer.writerow([c.id, c.code_text, c.filename, c.created_at.isoformat(), c.first_scanned_at.isoformat() if c.first_scanned_at else '', c.scan_count, c.entry_number, c.batch_size])
    output = si.getvalue()
    return (output, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="codes.csv"'
    })

@app.route('/reset', methods=['POST'])
def reset():
    if session.get('level') != 'admin':
        return "Acceso denegado. Nivel insuficiente.", 403
    for c in Code.query.all():
        c.scan_count = 0
        c.first_scanned_at = None
    db.session.commit()
    return jsonify({'status': 'reset done'})

@app.route('/delete_all', methods=['POST'])
def delete_all():
    if session.get('level') != 'admin':
        return "Acceso denegado. Nivel insuficiente.", 403
    db.session.query(Code).delete()
    db.session.commit()
    for filename in os.listdir(CODES_DIR):
        file_path = os.path.join(CODES_DIR, filename)
        if os.path.isfile(file_path):
            os.unlink(file_path)
    return jsonify({'status': 'all deleted'})

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'production') == 'development'
    
    cert_path = os.getenv('SSL_CERT', 'certs/cert.pem')
    key_path = os.getenv('SSL_KEY', 'certs/key.pem')
    
    ssl_context = None
    if os.path.exists(cert_path) and os.path.exists(key_path):
        ssl_context = (cert_path, key_path)
    
    app.run(host=host, port=port, debug=debug, threaded=True, ssl_context=ssl_context)