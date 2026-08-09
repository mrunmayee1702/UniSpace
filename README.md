# 🌌 UniSpace — Personal Digital Workspace

> **"Your space. Your information. Your way."**  
> A futuristic, high-performance personal digital workspace built with **Python Flask** and **SQLite**, designed to consolidate your academic, personal, and project management life into one cohesive, beautifully engineered interface.

---

## ⚡ Features

### 🌐 1. Dynamic Dashboard & Command Matrix
- **Real-Time Workspace Metrics**: Dynamic stat cards counting pending tasks, active projects, weekly lectures, and drive storage usage in real-time.
- **Global Command Search (`Ctrl + K`)**: Instantly search across notes, tasks, drive files, and projects simultaneously.
- **Quick Action Launcher (`+ QUICK ADD`)**: Fast modal triggers for creating notes, uploading files, creating tasks, scheduling lectures, saving bookmarks, and launching projects.
- **Cyber-Aurora Obsidian Theme**: Deep void aesthetics (`#030508`), glassmorphism card surfaces, and subtle ambient canvas particle effects.

### 📁 2. My Drive — Personal File Workspace
- **Real Folder-Based Management**: Create, open, rename, and delete folders with breadcrumbs navigation (`My Drive > College Documents`).
- **In-App File Preview & Reader**:
  - **Images (`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.svg`)**: Full-screen dark glass image viewer.
  - **PDFs (`.pdf`)**: Embedded PDF document reader.
  - **Text & Code (`.txt`, `.py`, `.js`, `.json`, `.md`, `.html`, `.css`)**: Syntax-highlighted text reader.
  - **Office Documents (`.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`)**: Clean preview-fallback state with direct download buttons.
- **Strict Binary Preservation**: File downloads preserve original binary byte streams, MIME types, and original file extensions without conversion or re-encoding.
- **File Moving (`🚚 Move`)**: Move files seamlessly between folders or back to the root directory.

### 📝 3. Notes Workspace
- Organize lecture notes, code snippets, and research thoughts with live preview and reader side-panel.

### ✅ 4. Tasks & Kanban Matrix
- Task management with status state transitions (`TO DO` $\rightarrow$ `IN PROGRESS` $\rightarrow$ `COMPLETED`), priority tags (`URGENT`, `HIGH`, `MEDIUM`, `LOW`), and category tagging.

### 📅 5. College Timetable & Calendar
- Manage weekly class schedules, lecture times, hall numbers, instructors, and calendar exam dates.

### 🔖 6. Bookmarks & Projects
- Bookmark essential study tools, documentation links, and Github repositories. Manage multi-stage development projects with progress tracking.

---

## 🛠️ Architecture & Tech Stack

- **Backend**: Python 3 (Flask, Flask-SQLAlchemy, Flask-Login)
- **Database**: SQLite (`unispace.db`) with strict multi-tenant user data isolation (`user_id == current_user.id`)
- **Frontend**: HTML5, Vanilla CSS3 (Custom design system, glassmorphism, responsive grids), JavaScript (ES6+ async/await engine)
- **Storage**: Local disk storage (`uploads/` folder)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have Python 3.9+ installed on your system.

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/mrunmayee1702/UniSpace.git
cd UniSpace
pip install -r requirements.txt
```

### 3. Run the Application

```bash
python app.py
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 🔒 Security & Data Privacy

- Passwords are securely hashed using `Werkzeug.security` (`pbkdf2:sha256`).
- All REST API endpoints strictly enforce authenticated session checks and user ID filtering. Newly registered users start with a 100% clean, empty workspace.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
