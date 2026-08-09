import os
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_file
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from config import Config
from models import (
    db, User, Folder, File, Note, Tag, Task, Subtask, CalendarEvent, TimetableEntry,
    Bookmark, Project, Milestone, Reminder, PinnedItem
)
from services.storage_service import storage_service

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(user_id)


# Pre-seed realistic data for demo user ONLY
def seed_demo_data(user):
    if Note.query.filter_by(user_id=user.id).first():
        return
    
    note1 = Note(user_id=user.id, title="DBMS Normalization & 3NF Rules", content="Database Normalization eliminates redundancy. 1NF: Atomic values. 2NF: No partial dependency. 3NF: No transitive dependency.", is_starred=True, is_pinned=True)
    note2 = Note(user_id=user.id, title="Neural Networks & Gradient Descent", content="Gradient descent updates weights along negative gradient of loss function: w = w - lr * grad.", is_starred=False)
    db.session.add_all([note1, note2])

    task1 = Task(user_id=user.id, title="Complete DBMS Assignment 3", priority="urgent", status="todo", due_date="Tomorrow, 11:59 PM", category="College")
    task2 = Task(user_id=user.id, title="Train ResNet Model for MediAssist", priority="high", status="in_progress", category="Project")
    task3 = Task(user_id=user.id, title="Review Linear Algebra Chapter 4", priority="medium", status="done", category="Study")
    db.session.add_all([task1, task2, task3])

    tt1 = TimetableEntry(user_id=user.id, subject="Database Management Systems", day_of_week="Monday", start_time="09:00 AM", end_time="10:30 AM", room="Hall 302", instructor="Dr. Sarah Vance")
    tt2 = TimetableEntry(user_id=user.id, subject="Machine Learning Lab", day_of_week="Monday", start_time="11:00 AM", end_time="01:00 PM", room="Lab 4B", instructor="Prof. Miller")
    tt3 = TimetableEntry(user_id=user.id, subject="Operating Systems", day_of_week="Tuesday", start_time="10:00 AM", end_time="11:30 AM", room="Hall 105", instructor="Dr. Alan Turing")
    db.session.add_all([tt1, tt2, tt3])

    p1 = Project(user_id=user.id, name="MediAssist AI", description="AI Medical Diagnosis System", status="in_progress", deadline="Sep 30, 2026")
    p2 = Project(user_id=user.id, name="Expense Tracker", description="Personal Finance App", status="planning", deadline="Oct 15, 2026")
    db.session.add_all([p1, p2])

    b1 = Bookmark(user_id=user.id, title="PostgreSQL Docs", url="https://postgresql.org/docs", category="Docs", is_starred=True)
    b2 = Bookmark(user_id=user.id, title="FastAPI Tutorial", url="https://fastapi.tiangolo.com", category="GitHub")
    db.session.add_all([b1, b2])

    r1 = Reminder(user_id=user.id, title="Submit Project Proposal", remind_at="Tomorrow at 10:00 AM")
    db.session.add(r1)

    ev1 = CalendarEvent(user_id=user.id, title="DBMS Midterm Exam", start_time="Monday 9:00 AM", end_time="Monday 11:00 AM", location="Hall 302")
    db.session.add(ev1)

    f1 = Folder(user_id=user.id, name="Lecture Slides", color="#00F5A0")
    f2 = Folder(user_id=user.id, name="Research Papers", color="#00D2FF")
    db.session.add_all([f1, f2])

    db.session.commit()


# HTML Authentication & Dashboard Routes
@app.route('/')
def index():
    if not current_user.is_authenticated:
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            login_user(user, remember=True)
            return redirect(url_for('index'))
        else:
            flash('Invalid email or password.')
            
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        email = request.form.get('email')
        full_name = request.form.get('full_name')
        major_study = request.form.get('major_study', 'Computer Science')
        password = request.form.get('password')

        if User.query.filter_by(email=email).first():
            flash('Email address already registered.')
            return redirect(url_for('register'))

        user = User(email=email, full_name=full_name, major_study=major_study)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        login_user(user)
        return redirect(url_for('index'))

    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


# REST JSON API Endpoints (Strict User Isolation & Full CRUD)

# NOTES API
@app.route('/api/v1/notes', methods=['GET', 'POST'])
@login_required
def handle_notes():
    if request.method == 'POST':
        data = request.json or {}
        note = Note(user_id=current_user.id, title=data.get('title'), content=data.get('content', ''), is_starred=data.get('is_starred', False), is_pinned=data.get('is_pinned', False))
        db.session.add(note)
        db.session.commit()
        return jsonify({"id": note.id, "title": note.title}), 201
    
    notes = Note.query.filter_by(user_id=current_user.id).order_by(Note.created_at.desc()).all()
    return jsonify([{"id": n.id, "title": n.title, "content": n.content, "is_starred": n.is_starred, "is_pinned": n.is_pinned} for n in notes])

@app.route('/api/v1/notes/<note_id>', methods=['PUT', 'DELETE'])
@login_required
def single_note(note_id):
    note = Note.query.filter_by(id=note_id, user_id=current_user.id).first_or_404()
    if request.method == 'DELETE':
        db.session.delete(note)
        db.session.commit()
        return jsonify({"success": True}), 200
    
    data = request.json or {}
    if 'title' in data: note.title = data['title']
    if 'content' in data: note.content = data['content']
    if 'is_starred' in data: note.is_starred = data['is_starred']
    if 'is_pinned' in data: note.is_pinned = data['is_pinned']
    db.session.commit()
    return jsonify({"success": True})


# FOLDERS API
@app.route('/api/v1/folders', methods=['GET', 'POST'])
@login_required
def handle_folders():
    if request.method == 'POST':
        data = request.json or {}
        folder = Folder(user_id=current_user.id, name=data.get('name'), color=data.get('color', '#00F5A0'))
        db.session.add(folder)
        db.session.commit()
        return jsonify({"id": folder.id, "name": folder.name}), 201

    folders = Folder.query.filter_by(user_id=current_user.id).all()
    return jsonify([{"id": f.id, "name": f.name, "color": f.color} for f in folders])

@app.route('/api/v1/folders/<folder_id>', methods=['PUT', 'DELETE'])
@login_required
def single_folder(folder_id):
    folder = Folder.query.filter_by(id=folder_id, user_id=current_user.id).first_or_404()
    if request.method == 'DELETE':
        # Safely detach files to root directory
        File.query.filter_by(folder_id=folder.id, user_id=current_user.id).update({"folder_id": None})
        db.session.delete(folder)
        db.session.commit()
        return jsonify({"success": True}), 200
    
    data = request.json or {}
    if 'name' in data: folder.name = data['name']
    db.session.commit()
    return jsonify({"success": True})


# FILES API (Upload, Rename, Preview, Download, Move, Delete)
@app.route('/api/v1/files', methods=['GET', 'POST'])
@login_required
def handle_files():
    if request.method == 'POST':
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        file = request.files['file']
        folder_id = request.form.get('folder_id')
        if folder_id in ['', 'null', 'undefined']: folder_id = None
        dest_path, filename, size, ext = storage_service.save_file(file)
        db_file = File(user_id=current_user.id, folder_id=folder_id, file_name=filename, file_path=dest_path, file_size=size, mime_type=file.content_type or 'application/octet-stream', file_extension=ext)
        db.session.add(db_file)
        db.session.commit()
        return jsonify({"id": db_file.id, "file_name": db_file.file_name, "folder_id": db_file.folder_id}), 201

    files = File.query.filter_by(user_id=current_user.id).order_by(File.created_at.desc()).all()
    return jsonify([{"id": f.id, "file_name": f.file_name, "file_size": f.file_size, "file_extension": f.file_extension, "mime_type": f.mime_type, "folder_id": f.folder_id} for f in files])

@app.route('/api/v1/files/<file_id>', methods=['PUT', 'DELETE'])
@login_required
def single_file(file_id):
    file_obj = File.query.filter_by(id=file_id, user_id=current_user.id).first_or_404()
    if request.method == 'DELETE':
        if os.path.exists(file_obj.file_path):
            os.remove(file_obj.file_path)
        db.session.delete(file_obj)
        db.session.commit()
        return jsonify({"success": True}), 200

    data = request.json or {}
    if 'file_name' in data:
        new_name = data['file_name'].strip()
        # Preserve original file extension if missing from new name
        ext_suffix = f".{file_obj.file_extension}"
        if not new_name.lower().endswith(ext_suffix.lower()):
            new_name = f"{new_name}{ext_suffix}"
        file_obj.file_name = new_name
    
    if 'folder_id' in data:
        target_folder = data['folder_id']
        if target_folder in ['', 'null', 'undefined']: target_folder = None
        file_obj.folder_id = target_folder

    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/v1/files/<file_id>/content')
@login_required
def file_content(file_id):
    file_obj = File.query.filter_by(id=file_id, user_id=current_user.id).first_or_404()
    return send_file(file_obj.file_path, mimetype=file_obj.mime_type, as_attachment=False)

@app.route('/api/v1/files/<file_id>/download')
@login_required
def file_download(file_id):
    file_obj = File.query.filter_by(id=file_id, user_id=current_user.id).first_or_404()
    download_name = file_obj.file_name
    ext_suffix = f".{file_obj.file_extension}"
    if not download_name.lower().endswith(ext_suffix.lower()):
        download_name = f"{download_name}{ext_suffix}"

    return send_file(
        file_obj.file_path,
        as_attachment=True,
        download_name=download_name,
        mimetype=file_obj.mime_type
    )


# TASKS API
@app.route('/api/v1/tasks', methods=['GET', 'POST'])
@login_required
def handle_tasks():
    if request.method == 'POST':
        data = request.json or {}
        task = Task(user_id=current_user.id, title=data.get('title'), priority=data.get('priority', 'medium'), status=data.get('status', 'todo'), due_date=data.get('due_date'))
        db.session.add(task)
        db.session.commit()
        return jsonify({"id": task.id, "title": task.title}), 201

    tasks = Task.query.filter_by(user_id=current_user.id).order_by(Task.created_at.desc()).all()
    return jsonify([{"id": t.id, "title": t.title, "priority": t.priority, "status": t.status, "due_date": t.due_date} for t in tasks])

@app.route('/api/v1/tasks/<task_id>', methods=['PUT', 'DELETE'])
@login_required
def single_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
    if request.method == 'DELETE':
        db.session.delete(task)
        db.session.commit()
        return jsonify({"success": True}), 200
    
    data = request.json or {}
    if 'title' in data: task.title = data['title']
    if 'priority' in data: task.priority = data['priority']
    if 'status' in data: task.status = data['status']
    if 'due_date' in data: task.due_date = data['due_date']
    db.session.commit()
    return jsonify({"success": True})


# TIMETABLE API
@app.route('/api/v1/timetable', methods=['GET', 'POST'])
@login_required
def handle_timetable():
    if request.method == 'POST':
        data = request.json or {}
        entry = TimetableEntry(user_id=current_user.id, subject=data.get('subject'), day_of_week=data.get('day_of_week'), start_time=data.get('start_time'), end_time=data.get('end_time'), room=data.get('room'), instructor=data.get('instructor'))
        db.session.add(entry)
        db.session.commit()
        return jsonify({"id": entry.id, "subject": entry.subject}), 201

    timetable = TimetableEntry.query.filter_by(user_id=current_user.id).all()
    return jsonify([{"id": t.id, "subject": t.subject, "day_of_week": t.day_of_week, "start_time": t.start_time, "end_time": t.end_time, "room": t.room, "instructor": t.instructor} for t in timetable])

@app.route('/api/v1/timetable/<entry_id>', methods=['DELETE'])
@login_required
def single_timetable(entry_id):
    entry = TimetableEntry.query.filter_by(id=entry_id, user_id=current_user.id).first_or_404()
    db.session.delete(entry)
    db.session.commit()
    return jsonify({"success": True})


# PROJECTS API
@app.route('/api/v1/projects', methods=['GET', 'POST'])
@login_required
def handle_projects():
    if request.method == 'POST':
        data = request.json or {}
        project = Project(user_id=current_user.id, name=data.get('name'), description=data.get('description'), deadline=data.get('deadline'))
        db.session.add(project)
        db.session.commit()
        return jsonify({"id": project.id, "name": project.name}), 201

    projects = Project.query.filter_by(user_id=current_user.id).all()
    return jsonify([{"id": p.id, "name": p.name, "description": p.description, "status": p.status, "deadline": p.deadline} for p in projects])

@app.route('/api/v1/projects/<project_id>', methods=['DELETE'])
@login_required
def single_project(project_id):
    project = Project.query.filter_by(id=project_id, user_id=current_user.id).first_or_404()
    db.session.delete(project)
    db.session.commit()
    return jsonify({"success": True})


# BOOKMARKS API
@app.route('/api/v1/bookmarks', methods=['GET', 'POST'])
@login_required
def handle_bookmarks():
    if request.method == 'POST':
        data = request.json or {}
        b = Bookmark(user_id=current_user.id, title=data.get('title'), url=data.get('url'), category=data.get('category', 'General'))
        db.session.add(b)
        db.session.commit()
        return jsonify({"id": b.id, "title": b.title}), 201

    bookmarks = Bookmark.query.filter_by(user_id=current_user.id).all()
    return jsonify([{"id": b.id, "title": b.title, "url": b.url, "category": b.category} for b in bookmarks])

@app.route('/api/v1/bookmarks/<bookmark_id>', methods=['DELETE'])
@login_required
def single_bookmark(bookmark_id):
    bm = Bookmark.query.filter_by(id=bookmark_id, user_id=current_user.id).first_or_404()
    db.session.delete(bm)
    db.session.commit()
    return jsonify({"success": True})


# CALENDAR EVENTS API
@app.route('/api/v1/calendar', methods=['GET', 'POST'])
@login_required
def handle_calendar():
    if request.method == 'POST':
        data = request.json or {}
        event = CalendarEvent(user_id=current_user.id, title=data.get('title'), start_time=data.get('start_time'), end_time=data.get('end_time'), location=data.get('location'))
        db.session.add(event)
        db.session.commit()
        return jsonify({"id": event.id, "title": event.title}), 201

    events = CalendarEvent.query.filter_by(user_id=current_user.id).all()
    return jsonify([{"id": e.id, "title": e.title, "start_time": e.start_time, "end_time": e.end_time, "location": e.location} for e in events])

@app.route('/api/v1/calendar/<event_id>', methods=['DELETE'])
@login_required
def single_calendar_event(event_id):
    ev = CalendarEvent.query.filter_by(id=event_id, user_id=current_user.id).first_or_404()
    db.session.delete(ev)
    db.session.commit()
    return jsonify({"success": True})


# REMINDERS API
@app.route('/api/v1/reminders', methods=['GET', 'POST'])
@login_required
def handle_reminders():
    if request.method == 'POST':
        data = request.json or {}
        rem = Reminder(user_id=current_user.id, title=data.get('title'), remind_at=data.get('remind_at'))
        db.session.add(rem)
        db.session.commit()
        return jsonify({"id": rem.id, "title": rem.title}), 201

    reminders = Reminder.query.filter_by(user_id=current_user.id).all()
    return jsonify([{"id": r.id, "title": r.title, "remind_at": r.remind_at, "is_completed": r.is_completed} for r in reminders])

@app.route('/api/v1/reminders/<reminder_id>', methods=['DELETE'])
@login_required
def single_reminder(reminder_id):
    rem = Reminder.query.filter_by(id=reminder_id, user_id=current_user.id).first_or_404()
    db.session.delete(rem)
    db.session.commit()
    return jsonify({"success": True})


# SEARCH API
@app.route('/api/v1/search')
@login_required
def handle_search():
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify({"results": {}})
    query_str = f"%{q}%"
    notes = Note.query.filter(Note.user_id == current_user.id, Note.title.ilike(query_str)).limit(5).all()
    tasks = Task.query.filter(Task.user_id == current_user.id, Task.title.ilike(query_str)).limit(5).all()
    files = File.query.filter(File.user_id == current_user.id, File.file_name.ilike(query_str)).limit(5).all()
    projects = Project.query.filter(Project.user_id == current_user.id, Project.name.ilike(query_str)).limit(5).all()
    return jsonify({
        "results": {
            "notes": [{"id": n.id, "title": n.title} for n in notes],
            "tasks": [{"id": t.id, "title": t.title} for t in tasks],
            "files": [{"id": f.id, "title": f.file_name} for f in files],
            "projects": [{"id": p.id, "title": p.name} for p in projects]
        }
    })


# Initialize DB on start
with app.app_context():
    db.create_all()
    # Create default demo user if empty
    if not User.query.filter_by(email="demo@unispace.edu").first():
        demo_user = User(email="demo@unispace.edu", full_name="Alex Rivera", major_study="Computer Science & AI")
        demo_user.set_password("unispace123")
        db.session.add(demo_user)
        db.session.commit()
        seed_demo_data(demo_user)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
