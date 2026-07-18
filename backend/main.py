
import os
import sqlite3
import bcrypt
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
from PIL import Image
from ultralytics import YOLO

os.environ["ULTRALYTICS_CONFIG_DIR"] = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".ultralytics")

# Initialize FastAPI app
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "foundacrack.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # Reports table
    c.execute('''
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            location TEXT,
            road_type TEXT,
            damage_types TEXT,
            confidence_scores TEXT,
            severity TEXT,
            authority TEXT,
            image_path TEXT,
            annotated_image_path TEXT,
            status TEXT DEFAULT 'Pending',
            user_id INTEGER
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# Upload and static directories
UPLOAD_DIR = "../uploads"
REPORTS_DIR = "../reports"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/reports", StaticFiles(directory=REPORTS_DIR), name="reports")

# Load YOLO model
MODEL_PATH = "../model/best.pt"
model = YOLO(MODEL_PATH)

# Severity calculation
def calculate_severity(detections):
    if not detections:
        return "None"
    max_confidence = max(d["confidence"] for d in detections)
    if max_confidence > 0.7:
        return "High"
    elif max_confidence > 0.4:
        return "Medium"
    else:
        return "Low"

# Function to get appropriate authority based on road type
def get_authority(road_type):
    authority_map = {
        "City Road": "Municipal Corporation",
        "State Highway": "Public Works Department (PWD)",
        "National Highway": "National Highways Authority (NHAI)",
        "Rural Road": "Panchayat / Rural Development Department"
    }
    return authority_map.get(road_type, "Municipal Corporation")

# Hash password
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

# Verify password
def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# Registration endpoint
@app.post("/api/register")
async def register(
    full_name: str = Form(...),
    email: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(...)
):
    # Check if passwords match
    if password != confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        # Check if username exists
        c.execute("SELECT id FROM users WHERE username = ?", (username,))
        if c.fetchone():
            raise HTTPException(status_code=400, detail="Username already exists")
        
        # Check if email exists
        c.execute("SELECT id FROM users WHERE email = ?", (email,))
        if c.fetchone():
            raise HTTPException(status_code=400, detail="Email already exists")
        
        # Hash password
        hashed_password = hash_password(password)
        
        # Insert user into DB
        c.execute('''
            INSERT INTO users (full_name, email, username, password)
            VALUES (?, ?, ?, ?)
        ''', (full_name, email, username, hashed_password))
        conn.commit()
        user_id = c.lastrowid
        
        return {
            "success": True,
            "user_id": user_id,
            "username": username,
            "full_name": full_name,
            "email": email
        }
    finally:
        conn.close()

# Login endpoint
@app.post("/api/login")
async def login(
    login: str = Form(...),  # can be username or email
    password: str = Form(...)
):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        # Find user by username or email
        c.execute("SELECT id, username, full_name, email, password FROM users WHERE username = ? OR email = ?", (login, login))
        user = c.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="User does not exist")
        
        user_id, username, full_name, email, hashed_password = user
        
        if not verify_password(password, hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect password")
        
        return {
            "success": True,
            "user_id": user_id,
            "username": username,
            "full_name": full_name,
            "email": email
        }
    finally:
        conn.close()

# Detect damage endpoint
@app.post("/api/detect")
async def detect_damage(
    file: UploadFile = File(...),
    location: str = Form(""),
    road_type: str = Form("City Road"),
    user_id: str = Form(None)  # optional for now
):
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    results = model(
        file_location,
        conf=0.15,
        iou=0.45,
        imgsz=640
    )
    
    detections = []
    annotated_path = os.path.join(UPLOAD_DIR, f"annotated_{file.filename}")
    
    for r in results:
        r.save(
            annotated_path,
            conf=True,
            line_width=2,
            font_size=12
        )
        for box in r.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            detections.append({
                "class": model.names[cls_id],
                "confidence": conf
            })
    
    severity = calculate_severity(detections)
    authority = get_authority(road_type)
    
    # Insert report into DB
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute('''
        INSERT INTO reports (location, road_type, damage_types, confidence_scores, severity, authority, image_path, annotated_image_path, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        location,
        road_type,
        ",".join([d["class"] for d in detections]) if detections else "",
        ",".join([f"{d['confidence']:.4f}" for d in detections]) if detections else "",
        severity,
        authority,
        file.filename,
        f"annotated_{file.filename}",
        int(user_id) if user_id else None
    ))
    conn.commit()
    report_id = c.lastrowid
    conn.close()
    
    return {
        "success": True,
        "report_id": report_id,
        "detections": detections,
        "severity": severity,
        "authority": authority,
        "road_type": road_type,
        "image_url": f"/uploads/{file.filename}",
        "annotated_image_url": f"/uploads/annotated_{file.filename}"
    }

# Get reports endpoint
@app.get("/api/reports")
async def get_reports(status: str = None):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    if status:
        c.execute("SELECT * FROM reports WHERE status = ? ORDER BY created_at DESC", (status,))
    else:
        c.execute("SELECT * FROM reports ORDER BY created_at DESC")
    
    reports = c.fetchall()
    conn.close()
    
    return [{
        "id": r["id"],
        "created_at": r["created_at"],
        "location": r["location"],
        "road_type": r["road_type"],
        "damage_types": r["damage_types"],
        "confidence_scores": r["confidence_scores"],
        "severity": r["severity"],
        "authority": r["authority"],
        "image_url": f"/uploads/{r['image_path']}",
        "annotated_image_url": f"/uploads/{r['annotated_image_path']}" if r['annotated_image_path'] else None,
        "status": r["status"]
    } for r in reports]

# Update report status endpoint
@app.put("/api/reports/{report_id}/status")
async def update_report_status(report_id: int, status: str = Form(...)):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute("UPDATE reports SET status = ? WHERE id = ?", (status, report_id))
    if c.rowcount == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    conn.commit()
    conn.close()
    
    return {"success": True}

# Delete report endpoint
@app.delete("/api/reports/{report_id}")
async def delete_report(report_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Find report first to get file paths
    c.execute("SELECT image_path, annotated_image_path FROM reports WHERE id = ?", (report_id,))
    report = c.fetchone()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Delete files if they exist
    try:
        if report["image_path"]:
            img_path = os.path.join(UPLOAD_DIR, report["image_path"])
            if os.path.exists(img_path):
                os.remove(img_path)
        if report["annotated_image_path"]:
            ann_path = os.path.join(UPLOAD_DIR, report["annotated_image_path"])
            if os.path.exists(ann_path):
                os.remove(ann_path)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise
    
    # Delete report from DB
    c.execute("DELETE FROM reports WHERE id = ?", (report_id,))
    conn.commit()
    conn.close()
    
    return {"success": True}


# Function to generate PDF report
def generate_pdf_report(report_id, report_data):
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Image, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet

    pdf_path = os.path.join(REPORTS_DIR, f"report_{report_id}.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title = Paragraph(f"FoundACrack - Road Damage Report ID: {report_id}", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 12))

    # Report Details Table
    data = [
        ["Field", "Value"],
        ["Timestamp", report_data['created_at']],
        ["Location", report_data['location'] if report_data['location'] else "Not provided"],
        ["Road Type", report_data['road_type']],
        ["Severity", report_data['severity']],
        ["Assigned Authority", report_data['authority']],
        ["Status", "Submitted"]
    ]
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(table)
    story.append(Spacer(1, 12))

    # Damage Types & Confidences
    if report_data['damage_types']:
        damage_types = report_data['damage_types'].split(',')
        confidences = report_data['confidence_scores'].split(',') if report_data['confidence_scores'] else []
        
        damage_data = [["Damage Type", "Confidence Score"]]
        for dt, conf in zip(damage_types, confidences):
            damage_data.append([dt.strip(), f"{float(conf)*100:.2f}%"])
        
        damage_table = Table(damage_data)
        damage_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightblue),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(Paragraph("Detected Damages:", styles['Heading2']))
        story.append(damage_table)
        story.append(Spacer(1, 12))

    # Images
    img_width = 250
    img_height = 200
    
    story.append(Paragraph("Images:", styles['Heading2']))
    story.append(Spacer(1, 12))
    
    image_data = [["Original Image", "Annotated Image"]]
    
    # Add original image
    original_img_path = os.path.join(UPLOAD_DIR, report_data['image_path'])
    if os.path.exists(original_img_path):
        original_img = Image(original_img_path, width=img_width, height=img_height, kind='proportional')
    else:
        original_img = Paragraph("Image not available", styles['BodyText'])
    
    # Add annotated image
    annotated_img_path = os.path.join(UPLOAD_DIR, report_data['annotated_image_path']) if report_data['annotated_image_path'] else None
    if annotated_img_path and os.path.exists(annotated_img_path):
        annotated_img = Image(annotated_img_path, width=img_width, height=img_height, kind='proportional')
    else:
        annotated_img = Paragraph("Image not available", styles['BodyText'])
        
    image_data.append([original_img, annotated_img])
    
    img_table = Table(image_data)
    img_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(img_table)
    
    doc.build(story)
    return pdf_path


# Generate report endpoint
@app.post("/api/reports/{report_id}/generate")
async def generate_report(report_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
    report = c.fetchone()
    
    if not report:
        conn.close()
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Convert report to dict for easier handling
    report_data = dict(report)
    
    # Generate PDF report
    pdf_path = generate_pdf_report(report_id, report_data)
    pdf_filename = os.path.basename(pdf_path)
    
    # Update report status to "Submitted"
    c.execute("UPDATE reports SET status = 'Submitted' WHERE id = ?", (report_id,))
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "message": "Report generated successfully.",
        "pdf_url": f"/reports/{pdf_filename}"
    }

# Serve frontend
@app.get("/")
async def serve_index():
    return FileResponse("../frontend/index.html")

@app.get("/{path:path}")
async def serve_static(path: str):
    file_path = os.path.join("../frontend", path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    return FileResponse("../frontend/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)