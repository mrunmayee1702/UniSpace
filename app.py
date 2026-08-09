import os
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_file
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from config import Config
from models import (
    db, User, Folder, File, Note, Tag, Task, Subtask, CalendarEvent, TimetableEntry,
    Bookmark, Project, Milestone, Reminder, ActivityLog, PinnedItem
)
from services.storage_service import storage_service
from services.ai_service import ai_service
from services.graph_service import graph_service
from services.vector_service import vector_service

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(user_id)

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response


def log_activity(user_id, action_type, description, item_type, item_id=None):
    try:
        log = ActivityLog(user_id=user_id, action_type=action_type, description=description, item_type=item_type, item_id=item_id)
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        print("Activity log error:", e)


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
    log_activity(user.id, "created", "Initialized demo workspace profile", "workspace")


@app.route('/')
def index():
    if not current_user.is_authenticated:
        return redirect(url_for('login'))
    return render_template('index.html', initial_view='dashboard')

@app.route('/settings')
@login_required
def settings_route():
    return render_template('index.html', initial_view='settings')

@app.route('/drive')
@login_required
def drive_route():
    return render_template('index.html', initial_view='drive')

@app.route('/notes')
@login_required
def notes_route():
    return render_template('index.html', initial_view='notes')

@app.route('/tasks')
@login_required
def tasks_route():
    return render_template('index.html', initial_view='tasks')

@app.route('/calendar')
@login_required
def calendar_route():
    return render_template('index.html', initial_view='calendar')

@app.route('/timetable')
@login_required
def timetable_route():
    return render_template('index.html', initial_view='timetable')

@app.route('/bookmarks')
@login_required
def bookmarks_route():
    return render_template('index.html', initial_view='bookmarks')

@app.route('/projects')
@login_required
def projects_route():
    return render_template('index.html', initial_view='projects')

@app.route('/reminders')
@login_required
def reminders_route():
    return render_template('index.html', initial_view='reminders')

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
            log_activity(user.id, "authenticated", f"User logged in: {user.email}", "auth")
            return redirect(url_for('index'))
        else:
            flash('Invalid email or password.')
            
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        full_name = request.form.get('full_name', '').strip()
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
        log_activity(user.id, "registered", f"Created new account: {user.email}", "auth")
        return redirect(url_for('index'))

    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    log_activity(current_user.id, "authenticated", f"User logged out", "auth")
    logout_user()
    return redirect(url_for('login'))


# USER PROFILE & SETTINGS API (Functional Control Center)
@app.route('/api/v1/user/settings')
@login_required
def get_user_settings():
    total_bytes = db.session.query(db.func.sum(File.file_size)).filter(File.user_id == current_user.id).scalar() or 0
    file_count = File.query.filter_by(user_id=current_user.id).count()
    note_count = Note.query.filter_by(user_id=current_user.id).count()
    task_count = Task.query.filter_by(user_id=current_user.id).count()
    project_count = Project.query.filter_by(user_id=current_user.id).count()

    return jsonify({
        "profile": {
            "email": current_user.email,
            "full_name": current_user.full_name,
            "major_study": current_user.major_study or 'Computer Science'
        },
        "appearance": {
            "theme_preference": current_user.theme_preference or 'cyber-dark'
        },
        "notifications": {
            "reminder_notifs": current_user.reminder_notifs,
            "task_notifs": current_user.task_notifs,
            "event_notifs": current_user.event_notifs
        },
        "workspace": {
            "total_bytes": total_bytes,
            "total_mb": round(total_bytes / (1024 * 1024), 2),
            "file_count": file_count,
            "note_count": note_count,
            "task_count": task_count,
            "project_count": project_count
        }
    })

@app.route('/api/v1/user/profile', methods=['PUT'])
@login_required
def update_profile():
    data = request.json or {}
    if 'full_name' in data: current_user.full_name = data['full_name'].strip()
    if 'major_study' in data: current_user.major_study = data['major_study'].strip()
    db.session.commit()
    log_activity(current_user.id, "updated", "Updated profile settings", "user")
    return jsonify({"success": True})

@app.route('/api/v1/user/password', methods=['PUT'])
@login_required
def update_password():
    data = request.json or {}
    old_pw = data.get('old_password')
    new_pw = data.get('new_password')
    confirm_pw = data.get('confirm_password')

    if not old_pw or not new_pw or not confirm_pw:
        return jsonify({"error": "All password fields are required."}), 400
    if new_pw != confirm_pw:
        return jsonify({"error": "New password and confirmation do not match."}), 400
    if not current_user.check_password(old_pw):
        return jsonify({"error": "Incorrect current password."}), 401
    
    current_user.set_password(new_pw)
    db.session.commit()
    log_activity(current_user.id, "updated", "Changed account password", "user")
    return jsonify({"success": True})

@app.route('/api/v1/user/appearance', methods=['PUT'])
@login_required
def update_appearance():
    data = request.json or {}
    if 'theme_preference' in data:
        current_user.theme_preference = data['theme_preference']
        db.session.commit()
    return jsonify({"success": True})

@app.route('/api/v1/user/notifications', methods=['PUT'])
@login_required
def update_notifications():
    data = request.json or {}
    if 'reminder_notifs' in data: current_user.reminder_notifs = bool(data['reminder_notifs'])
    if 'task_notifs' in data: current_user.task_notifs = bool(data['task_notifs'])
    if 'event_notifs' in data: current_user.event_notifs = bool(data['event_notifs'])
    db.session.commit()
    log_activity(current_user.id, "updated", "Updated notification preferences", "user")
    return jsonify({"success": True})

@app.route('/api/v1/user/export')
@login_required
def export_user_data():
    notes = Note.query.filter_by(user_id=current_user.id).all()
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    files = File.query.filter_by(user_id=current_user.id).all()
    projects = Project.query.filter_by(user_id=current_user.id).all()
    bookmarks = Bookmark.query.filter_by(user_id=current_user.id).all()
    timetable = TimetableEntry.query.filter_by(user_id=current_user.id).all()

    export_data = {
        "user": {"email": current_user.email, "full_name": current_user.full_name},
        "notes": [{"title": n.title, "content": n.content} for n in notes],
        "tasks": [{"title": t.title, "status": t.status, "priority": t.priority} for t in tasks],
        "files": [{"file_name": f.file_name, "file_size": f.file_size} for f in files],
        "projects": [{"name": p.name, "description": p.description} for p in projects],
        "bookmarks": [{"title": b.title, "url": b.url} for b in bookmarks],
        "timetable": [{"subject": t.subject, "day": t.day_of_week, "time": t.start_time} for t in timetable]
    }
    return jsonify(export_data)

@app.route('/api/v1/user/clear-data', methods=['POST'])
@login_required
def clear_workspace_data():
    # Remove files from disk
    user_files = File.query.filter_by(user_id=current_user.id).all()
    for f in user_files:
        if os.path.exists(f.file_path):
            try: os.remove(f.file_path)
            except Exception: pass

    File.query.filter_by(user_id=current_user.id).delete()
    Note.query.filter_by(user_id=current_user.id).delete()
    Task.query.filter_by(user_id=current_user.id).delete()
    Project.query.filter_by(user_id=current_user.id).delete()
    Bookmark.query.filter_by(user_id=current_user.id).delete()
    CalendarEvent.query.filter_by(user_id=current_user.id).delete()
    TimetableEntry.query.filter_by(user_id=current_user.id).delete()
    Reminder.query.filter_by(user_id=current_user.id).delete()
    Folder.query.filter_by(user_id=current_user.id).delete()
    
    db.session.commit()
    log_activity(current_user.id, "cleared", "Cleared all workspace data", "workspace")
    return jsonify({"success": True})

@app.route('/api/v1/user/account', methods=['DELETE'])
@login_required
def delete_account():
    # Delete files from disk
    user_files = File.query.filter_by(user_id=current_user.id).all()
    for f in user_files:
        if os.path.exists(f.file_path):
            try: os.remove(f.file_path)
            except Exception: pass

    user = User.query.get(current_user.id)
    logout_user()
    db.session.delete(user)
    db.session.commit()
    return jsonify({"success": True})


# NOTES API
@app.route('/api/v1/notes', methods=['GET', 'POST'])
@login_required
def handle_notes():
    if request.method == 'POST':
        data = request.json or {}
        note = Note(
            user_id=current_user.id,
            folder_id=data.get('folder_id'),
            project_id=data.get('project_id'),
            title=data.get('title', 'Untitled Note'),
            content=data.get('content', ''),
            is_starred=data.get('is_starred', False),
            is_pinned=data.get('is_pinned', False)
        )
        db.session.add(note)
        db.session.commit()
        log_activity(current_user.id, "created", f"Created note '{note.title}'", "note", note.id)
        return jsonify({"id": note.id, "title": note.title}), 201
    
    notes = Note.query.filter_by(user_id=current_user.id).order_by(Note.is_pinned.desc(), Note.updated_at.desc()).all()
    return jsonify([{
        "id": n.id, "title": n.title, "content": n.content,
        "is_starred": n.is_starred, "is_pinned": n.is_pinned,
        "folder_id": n.folder_id, "project_id": n.project_id,
        "updated_at": n.updated_at.isoformat() if n.updated_at else ''
    } for n in notes])

@app.route('/api/v1/notes/<note_id>', methods=['PUT', 'DELETE'])
@login_required
def single_note(note_id):
    note = Note.query.filter_by(id=note_id, user_id=current_user.id).first_or_404()
    if request.method == 'DELETE':
        db.session.delete(note)
        db.session.commit()
        log_activity(current_user.id, "deleted", f"Deleted note '{note.title}'", "note", note_id)
        return jsonify({"success": True}), 200
    
    data = request.json or {}
    if 'title' in data: note.title = data['title']
    if 'content' in data: note.content = data['content']
    if 'is_starred' in data: note.is_starred = data['is_starred']
    if 'is_pinned' in data: note.is_pinned = data['is_pinned']
    if 'project_id' in data: note.project_id = data['project_id']
    db.session.commit()
    log_activity(current_user.id, "updated", f"Updated note '{note.title}'", "note", note.id)
    return jsonify({"success": True})


# FOLDERS API (Nested Hierarchy Support)
@app.route('/api/v1/folders', methods=['GET', 'POST'])
@login_required
def handle_folders():
    if request.method == 'POST':
        data = request.json or {}
        parent_id = data.get('parent_id')
        if parent_id in ['', 'null', 'undefined']: parent_id = None
        folder = Folder(user_id=current_user.id, parent_id=parent_id, name=data.get('name'), color=data.get('color', '#00F5A0'))
        db.session.add(folder)
        db.session.commit()
        log_activity(current_user.id, "created", f"Created folder '{folder.name}'", "folder", folder.id)
        return jsonify({"id": folder.id, "name": folder.name, "parent_id": folder.parent_id}), 201

    parent_id = request.args.get('parent_id')
    if parent_id == 'root' or parent_id == '':
        folders = Folder.query.filter(Folder.user_id == current_user.id, Folder.parent_id == None).all()
    elif parent_id:
        folders = Folder.query.filter_by(user_id=current_user.id, parent_id=parent_id).all()
    else:
        folders = Folder.query.filter_by(user_id=current_user.id).all()

    return jsonify([{"id": f.id, "name": f.name, "color": f.color, "parent_id": f.parent_id} for f in folders])

@app.route('/api/v1/folders/<folder_id>', methods=['PUT', 'DELETE'])
@login_required
def single_folder(folder_id):
    folder = Folder.query.filter_by(id=folder_id, user_id=current_user.id).first_or_404()
    if request.method == 'DELETE':
        # Safely detach subfiles & subfolders to root directory
        File.query.filter_by(folder_id=folder.id, user_id=current_user.id).update({"folder_id": None})
        Folder.query.filter_by(parent_id=folder.id, user_id=current_user.id).update({"parent_id": None})
        db.session.delete(folder)
        db.session.commit()
        log_activity(current_user.id, "deleted", f"Deleted folder '{folder.name}'", "folder", folder_id)
        return jsonify({"success": True}), 200
    
    data = request.json or {}
    if 'name' in data: folder.name = data['name']
    if 'parent_id' in data: folder.parent_id = data['parent_id']
    db.session.commit()
    log_activity(current_user.id, "updated", f"Renamed folder '{folder.name}'", "folder", folder.id)
    return jsonify({"success": True})


# FILES API (Upload, Preview, Download, Move, Sort, Search)
@app.route('/api/v1/files', methods=['GET', 'POST'])
@login_required
def handle_files():
    if request.method == 'POST':
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        file = request.files['file']
        folder_id = request.form.get('folder_id')
        project_id = request.form.get('project_id')
        if folder_id in ['', 'null', 'undefined']: folder_id = None
        if project_id in ['', 'null', 'undefined']: project_id = None

        dest_path, filename, size, ext = storage_service.save_file(file)
        db_file = File(user_id=current_user.id, folder_id=folder_id, project_id=project_id, file_name=filename, file_path=dest_path, file_size=size, mime_type=file.content_type or 'application/octet-stream', file_extension=ext)
        db.session.add(db_file)
        db.session.commit()
        log_activity(current_user.id, "uploaded", f"Uploaded file '{filename}'", "file", db_file.id)
        return jsonify({"id": db_file.id, "file_name": db_file.file_name, "folder_id": db_file.folder_id}), 201

    query = File.query.filter_by(user_id=current_user.id)
    folder_id = request.args.get('folder_id')
    sort_by = request.args.get('sort_by', 'date')
    search_q = request.args.get('search', '').strip()

    if folder_id == 'root':
        query = query.filter(File.folder_id == None)
    elif folder_id:
        query = query.filter(File.folder_id == folder_id)

    if search_q:
        query = query.filter(File.file_name.ilike(f"%{search_q}%"))

    if sort_by == 'name':
        query = query.order_by(File.file_name.asc())
    elif sort_by == 'size':
        query = query.order_by(File.file_size.desc())
    elif sort_by == 'type':
        query = query.order_by(File.file_extension.asc())
    else:
        query = query.order_by(File.created_at.desc())

    files = query.all()
    return jsonify([{"id": f.id, "file_name": f.file_name, "file_size": f.file_size, "file_extension": f.file_extension, "mime_type": f.mime_type, "folder_id": f.folder_id, "project_id": f.project_id, "is_starred": f.is_starred} for f in files])

@app.route('/api/v1/files/<file_id>', methods=['PUT', 'DELETE'])
@login_required
def single_file(file_id):
    file_obj = File.query.filter_by(id=file_id, user_id=current_user.id).first_or_404()
    if request.method == 'DELETE':
        if os.path.exists(file_obj.file_path):
            os.remove(file_obj.file_path)
        db.session.delete(file_obj)
        db.session.commit()
        log_activity(current_user.id, "deleted", f"Deleted file '{file_obj.file_name}'", "file", file_id)
        return jsonify({"success": True}), 200

    data = request.json or {}
    if 'file_name' in data:
        new_name = data['file_name'].strip()
        ext_suffix = f".{file_obj.file_extension}"
        if not new_name.lower().endswith(ext_suffix.lower()):
            new_name = f"{new_name}{ext_suffix}"
        file_obj.file_name = new_name
    
    if 'folder_id' in data:
        target_folder = data['folder_id']
        if target_folder in ['', 'null', 'undefined']: target_folder = None
        file_obj.folder_id = target_folder

    if 'is_starred' in data:
        file_obj.is_starred = data['is_starred']

    db.session.commit()
    log_activity(current_user.id, "updated", f"Updated file '{file_obj.file_name}'", "file", file_obj.id)
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


# TASKS & SUBTASKS API
@app.route('/api/v1/tasks', methods=['GET', 'POST'])
@login_required
def handle_tasks():
    if request.method == 'POST':
        data = request.json or {}
        task = Task(
            user_id=current_user.id,
            project_id=data.get('project_id'),
            title=data.get('title'),
            description=data.get('description'),
            priority=data.get('priority', 'medium'),
            status=data.get('status', 'todo'),
            due_date=data.get('due_date'),
            category=data.get('category', 'General')
        )
        db.session.add(task)
        db.session.commit()
        log_activity(current_user.id, "created", f"Created task '{task.title}'", "task", task.id)
        return jsonify({"id": task.id, "title": task.title}), 201

    tasks = Task.query.filter_by(user_id=current_user.id).order_by(Task.created_at.desc()).all()
    return jsonify([{
        "id": t.id, "title": t.title, "description": t.description,
        "priority": t.priority, "status": t.status, "progress": t.progress,
        "due_date": t.due_date, "category": t.category, "project_id": t.project_id,
        "subtasks": [{"id": s.id, "title": s.title, "is_completed": s.is_completed} for s in t.subtasks]
    } for t in tasks])

@app.route('/api/v1/tasks/<task_id>', methods=['PUT', 'DELETE'])
@login_required
def single_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
    if request.method == 'DELETE':
        db.session.delete(task)
        db.session.commit()
        log_activity(current_user.id, "deleted", f"Deleted task '{task.title}'", "task", task_id)
        return jsonify({"success": True}), 200
    
    data = request.json or {}
    if 'title' in data: task.title = data['title']
    if 'description' in data: task.description = data['description']
    if 'priority' in data: task.priority = data['priority']
    if 'status' in data: task.status = data['status']
    if 'progress' in data: task.progress = data['progress']
    if 'due_date' in data: task.due_date = data['due_date']
    if 'project_id' in data: task.project_id = data['project_id']
    db.session.commit()
    log_activity(current_user.id, "updated", f"Updated task '{task.title}' status to {task.status}", "task", task.id)
    return jsonify({"success": True})

@app.route('/api/v1/tasks/<task_id>/subtasks', methods=['POST'])
@login_required
def add_subtask(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
    data = request.json or {}
    subtask = Subtask(task_id=task.id, title=data.get('title'))
    db.session.add(subtask)
    db.session.commit()
    return jsonify({"id": subtask.id, "title": subtask.title}), 201

@app.route('/api/v1/subtasks/<subtask_id>', methods=['PUT', 'DELETE'])
@login_required
def single_subtask(subtask_id):
    subtask = Subtask.query.get_or_404(subtask_id)
    if request.method == 'DELETE':
        db.session.delete(subtask)
        db.session.commit()
        return jsonify({"success": True})
    
    data = request.json or {}
    if 'is_completed' in data: subtask.is_completed = data['is_completed']
    db.session.commit()
    return jsonify({"success": True})


# TIMETABLE API
@app.route('/api/v1/timetable', methods=['GET', 'POST'])
@login_required
def handle_timetable():
    if request.method == 'POST':
        data = request.json or {}
        entry = TimetableEntry(
            user_id=current_user.id,
            subject=data.get('subject'),
            day_of_week=data.get('day_of_week'),
            start_time=data.get('start_time'),
            end_time=data.get('end_time'),
            room=data.get('room'),
            instructor=data.get('instructor'),
            color=data.get('color', '#00F5A0')
        )
        db.session.add(entry)
        db.session.commit()
        log_activity(current_user.id, "created", f"Scheduled lecture '{entry.subject}'", "timetable", entry.id)
        return jsonify({"id": entry.id, "subject": entry.subject}), 201

    timetable = TimetableEntry.query.filter_by(user_id=current_user.id).all()
    return jsonify([{"id": t.id, "subject": t.subject, "day_of_week": t.day_of_week, "start_time": t.start_time, "end_time": t.end_time, "room": t.room, "instructor": t.instructor, "color": t.color} for t in timetable])

@app.route('/api/v1/timetable/<entry_id>', methods=['DELETE'])
@login_required
def single_timetable(entry_id):
    entry = TimetableEntry.query.filter_by(id=entry_id, user_id=current_user.id).first_or_404()
    db.session.delete(entry)
    db.session.commit()
    log_activity(current_user.id, "deleted", f"Removed lecture '{entry.subject}'", "timetable", entry_id)
    return jsonify({"success": True})


# PROJECTS API
@app.route('/api/v1/projects', methods=['GET', 'POST'])
@login_required
def handle_projects():
    if request.method == 'POST':
        data = request.json or {}
        project = Project(
            user_id=current_user.id,
            name=data.get('name'),
            description=data.get('description'),
            status=data.get('status', 'in_progress'),
            priority=data.get('priority', 'medium'),
            start_date=data.get('start_date'),
            deadline=data.get('deadline'),
            progress=data.get('progress', 0)
        )
        db.session.add(project)
        db.session.commit()
        log_activity(current_user.id, "created", f"Launched project '{project.name}'", "project", project.id)
        return jsonify({"id": project.id, "name": project.name}), 201

    projects = Project.query.filter_by(user_id=current_user.id).order_by(Project.created_at.desc()).all()
    return jsonify([{
        "id": p.id, "name": p.name, "description": p.description,
        "status": p.status, "priority": p.priority, "deadline": p.deadline,
        "progress": p.progress, "task_count": len(p.tasks)
    } for p in projects])

@app.route('/api/v1/projects/<project_id>/details')
@login_required
def project_details(project_id):
    project = Project.query.filter_by(id=project_id, user_id=current_user.id).first_or_404()
    tasks = Task.query.filter_by(project_id=project.id, user_id=current_user.id).all()
    notes = Note.query.filter_by(project_id=project.id, user_id=current_user.id).all()
    files = File.query.filter_by(project_id=project.id, user_id=current_user.id).all()
    bookmarks = Bookmark.query.filter_by(project_id=project.id, user_id=current_user.id).all()

    return jsonify({
        "project": {"id": project.id, "name": project.name, "description": project.description, "status": project.status, "deadline": project.deadline, "progress": project.progress},
        "tasks": [{"id": t.id, "title": t.title, "status": t.status, "priority": t.priority} for t in tasks],
        "notes": [{"id": n.id, "title": n.title} for n in notes],
        "files": [{"id": f.id, "file_name": f.file_name, "file_extension": f.file_extension} for f in files],
        "bookmarks": [{"id": b.id, "title": b.title, "url": b.url} for b in bookmarks]
    })

@app.route('/api/v1/projects/<project_id>', methods=['PUT', 'DELETE'])
@login_required
def single_project(project_id):
    project = Project.query.filter_by(id=project_id, user_id=current_user.id).first_or_404()
    if request.method == 'DELETE':
        db.session.delete(project)
        db.session.commit()
        log_activity(current_user.id, "deleted", f"Deleted project '{project.name}'", "project", project_id)
        return jsonify({"success": True}), 200

    data = request.json or {}
    if 'name' in data: project.name = data['name']
    if 'description' in data: project.description = data['description']
    if 'status' in data: project.status = data['status']
    if 'progress' in data: project.progress = data['progress']
    if 'deadline' in data: project.deadline = data['deadline']
    db.session.commit()
    log_activity(current_user.id, "updated", f"Updated project '{project.name}'", "project", project.id)
    return jsonify({"success": True})


# BOOKMARKS API
@app.route('/api/v1/bookmarks', methods=['GET', 'POST'])
@login_required
def handle_bookmarks():
    if request.method == 'POST':
        data = request.json or {}
        b = Bookmark(
            user_id=current_user.id,
            project_id=data.get('project_id'),
            title=data.get('title'),
            url=data.get('url'),
            description=data.get('description'),
            category=data.get('category', 'General')
        )
        db.session.add(b)
        db.session.commit()
        log_activity(current_user.id, "created", f"Saved bookmark '{b.title}'", "bookmark", b.id)
        return jsonify({"id": b.id, "title": b.title}), 201

    bookmarks = Bookmark.query.filter_by(user_id=current_user.id).all()
    return jsonify([{"id": b.id, "title": b.title, "url": b.url, "category": b.category, "project_id": b.project_id} for b in bookmarks])

@app.route('/api/v1/bookmarks/<bookmark_id>', methods=['DELETE'])
@login_required
def single_bookmark(bookmark_id):
    bm = Bookmark.query.filter_by(id=bookmark_id, user_id=current_user.id).first_or_404()
    db.session.delete(bm)
    db.session.commit()
    log_activity(current_user.id, "deleted", f"Deleted bookmark '{bm.title}'", "bookmark", bookmark_id)
    return jsonify({"success": True})


# CALENDAR EVENTS API
@app.route('/api/v1/calendar', methods=['GET', 'POST'])
@login_required
def handle_calendar():
    if request.method == 'POST':
        data = request.json or {}
        event = CalendarEvent(
            user_id=current_user.id,
            project_id=data.get('project_id'),
            task_id=data.get('task_id'),
            title=data.get('title'),
            description=data.get('description'),
            event_type=data.get('event_type', 'event'),
            start_time=data.get('start_time'),
            end_time=data.get('end_time'),
            location=data.get('location'),
            color=data.get('color', '#00D2FF')
        )
        db.session.add(event)
        db.session.commit()
        log_activity(current_user.id, "created", f"Created event '{event.title}'", "event", event.id)
        return jsonify({"id": event.id, "title": event.title}), 201

    events = CalendarEvent.query.filter_by(user_id=current_user.id).all()
    return jsonify([{"id": e.id, "title": e.title, "start_time": e.start_time, "end_time": e.end_time, "location": e.location, "color": e.color, "event_type": e.event_type} for e in events])

@app.route('/api/v1/calendar/<event_id>', methods=['DELETE'])
@login_required
def single_calendar_event(event_id):
    ev = CalendarEvent.query.filter_by(id=event_id, user_id=current_user.id).first_or_404()
    db.session.delete(ev)
    db.session.commit()
    log_activity(current_user.id, "deleted", f"Removed event '{ev.title}'", "event", event_id)
    return jsonify({"success": True})


# REMINDERS API
@app.route('/api/v1/reminders', methods=['GET', 'POST'])
@login_required
def handle_reminders():
    if request.method == 'POST':
        data = request.json or {}
        rem = Reminder(
            user_id=current_user.id,
            title=data.get('title'),
            description=data.get('description'),
            remind_at=data.get('remind_at'),
            priority=data.get('priority', 'medium')
        )
        db.session.add(rem)
        db.session.commit()
        log_activity(current_user.id, "created", f"Created reminder '{rem.title}'", "reminder", rem.id)
        return jsonify({"id": rem.id, "title": rem.title}), 201

    reminders = Reminder.query.filter_by(user_id=current_user.id).order_by(Reminder.created_at.desc()).all()
    return jsonify([{"id": r.id, "title": r.title, "remind_at": r.remind_at, "is_completed": r.is_completed, "priority": r.priority} for r in reminders])

@app.route('/api/v1/reminders/<reminder_id>', methods=['PUT', 'DELETE'])
@login_required
def single_reminder(reminder_id):
    rem = Reminder.query.filter_by(id=reminder_id, user_id=current_user.id).first_or_404()
    if request.method == 'DELETE':
        db.session.delete(rem)
        db.session.commit()
        log_activity(current_user.id, "deleted", f"Deleted reminder '{rem.title}'", "reminder", reminder_id)
        return jsonify({"success": True}), 200

    data = request.json or {}
    if 'is_completed' in data: rem.is_completed = data['is_completed']
    db.session.commit()
    return jsonify({"success": True})


# ACTIVITY LOGS STREAM API
@app.route('/api/v1/activity')
@login_required
def handle_activity():
    logs = ActivityLog.query.filter_by(user_id=current_user.id).order_by(ActivityLog.created_at.desc()).limit(15).all()
    return jsonify([{"id": l.id, "action_type": l.action_type, "description": l.description, "item_type": l.item_type, "created_at": l.created_at.strftime("%b %d, %H:%M")} for l in logs])


# GLOBAL SEARCH API across ALL 8 MODULES
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
    bookmarks = Bookmark.query.filter(Bookmark.user_id == current_user.id, Bookmark.title.ilike(query_str)).limit(5).all()
    events = CalendarEvent.query.filter(CalendarEvent.user_id == current_user.id, CalendarEvent.title.ilike(query_str)).limit(5).all()
    timetable = TimetableEntry.query.filter(TimetableEntry.user_id == current_user.id, TimetableEntry.subject.ilike(query_str)).limit(5).all()
    reminders = Reminder.query.filter(Reminder.user_id == current_user.id, Reminder.title.ilike(query_str)).limit(5).all()

    return jsonify({
        "results": {
            "notes": [{"id": n.id, "title": n.title} for n in notes],
            "tasks": [{"id": t.id, "title": t.title} for t in tasks],
            "files": [{"id": f.id, "title": f.file_name} for f in files],
            "projects": [{"id": p.id, "title": p.name} for p in projects],
            "bookmarks": [{"id": b.id, "title": b.title} for b in bookmarks],
            "events": [{"id": e.id, "title": e.title} for e in events],
            "timetable": [{"id": t.id, "title": t.subject} for t in timetable],
            "reminders": [{"id": r.id, "title": r.title} for r in reminders]
        }
    })


# KNOWLEDGE GRAPH & AI PREPARATION ENDPOINTS
@app.route('/api/v1/graph')
@login_required
def handle_graph():
    notes = Note.query.filter_by(user_id=current_user.id).all()
    files = File.query.filter_by(user_id=current_user.id).all()
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    projects = Project.query.filter_by(user_id=current_user.id).all()
    bookmarks = Bookmark.query.filter_by(user_id=current_user.id).all()
    graph_data = graph_service.build_user_graph(current_user.id, notes, files, tasks, projects, bookmarks)
    return jsonify(graph_data)

@app.route('/api/v1/ai/ask', methods=['POST'])
@login_required
def handle_ai_ask():
    data = request.json or {}
    query = data.get('query', '')
    notes = Note.query.filter_by(user_id=current_user.id).all()
    context_docs = [{"title": n.title, "content": n.content} for n in notes]
    res = ai_service.ask_unispace(current_user.id, query, context_docs)
    return jsonify(res)


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
