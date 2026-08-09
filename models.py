import uuid
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

# Helper function for string UUIDs in SQLite
def generate_uuid():
    return str(uuid.uuid4())

# Tag Association Tables
note_tags = db.Table('note_tags',
    db.Column('note_id', db.String(36), db.ForeignKey('notes.id', ondelete='CASCADE'), primary_key=True),
    db.Column('tag_id', db.String(36), db.ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)

file_tags = db.Table('file_tags',
    db.Column('file_id', db.String(36), db.ForeignKey('files.id', ondelete='CASCADE'), primary_key=True),
    db.Column('tag_id', db.String(36), db.ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)

task_tags = db.Table('task_tags',
    db.Column('task_id', db.String(36), db.ForeignKey('tasks.id', ondelete='CASCADE'), primary_key=True),
    db.Column('tag_id', db.String(36), db.ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)

bookmark_tags = db.Table('bookmark_tags',
    db.Column('bookmark_id', db.String(36), db.ForeignKey('bookmarks.id', ondelete='CASCADE'), primary_key=True),
    db.Column('tag_id', db.String(36), db.ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)

project_tags = db.Table('project_tags',
    db.Column('project_id', db.String(36), db.ForeignKey('projects.id', ondelete='CASCADE'), primary_key=True),
    db.Column('tag_id', db.String(36), db.ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)


class User(UserMixin, db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    avatar_url = db.Column(db.String(500), nullable=True)
    major_study = db.Column(db.String(100), nullable=True, default='Computer Science')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Folder(db.Model):
    __tablename__ = 'folders'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = db.Column(db.String(36), db.ForeignKey('folders.id', ondelete='CASCADE'), nullable=True)
    name = db.Column(db.String(255), nullable=False)
    color = db.Column(db.String(50), default='#8B5CF6')
    is_starred = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class File(db.Model):
    __tablename__ = 'files'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    folder_id = db.Column(db.String(36), db.ForeignKey('folders.id', ondelete='SET NULL'), nullable=True)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.BigInteger, nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    file_extension = db.Column(db.String(20), nullable=False)
    is_starred = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Note(db.Model):
    __tablename__ = 'notes'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    folder_id = db.Column(db.String(36), db.ForeignKey('folders.id', ondelete='SET NULL'), nullable=True)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False, default='')
    is_pinned = db.Column(db.Boolean, default=False)
    is_starred = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Tag(db.Model):
    __tablename__ = 'tags'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(20), default='#06B6D4')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Task(db.Model):
    __tablename__ = 'tasks'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    priority = db.Column(db.String(20), default='medium')  # urgent, high, medium, low
    status = db.Column(db.String(20), default='todo')      # todo, in_progress, done
    due_date = db.Column(db.String(50), nullable=True)
    category = db.Column(db.String(50), default='General')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    subtasks = db.relationship('Subtask', backref='task', cascade='all, delete-orphan', lazy=True)


class Subtask(db.Model):
    __tablename__ = 'subtasks'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    task_id = db.Column(db.String(36), db.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    is_completed = db.Column(db.Boolean, default=False)


class CalendarEvent(db.Model):
    __tablename__ = 'calendar_events'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    event_type = db.Column(db.String(50), default='event')  # exam, deadline, meeting, class, personal
    start_time = db.Column(db.String(50), nullable=False)
    end_time = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(20), default='#6366F1')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class TimetableEntry(db.Model):
    __tablename__ = 'timetable_entries'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    subject = db.Column(db.String(150), nullable=False)
    instructor = db.Column(db.String(100), nullable=True)
    room = db.Column(db.String(50), nullable=True)
    day_of_week = db.Column(db.String(20), nullable=False)  # Monday, Tuesday, etc.
    start_time = db.Column(db.String(20), nullable=False)
    end_time = db.Column(db.String(20), nullable=False)
    color = db.Column(db.String(20), default='#8B5CF6')


class Bookmark(db.Model):
    __tablename__ = 'bookmarks'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    url = db.Column(db.String(1000), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), default='General')
    is_starred = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Project(db.Model):
    __tablename__ = 'projects'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='in_progress')  # planning, in_progress, completed, paused
    start_date = db.Column(db.String(50), nullable=True)
    deadline = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    milestones = db.relationship('Milestone', backref='project', cascade='all, delete-orphan', lazy=True)


class Milestone(db.Model):
    __tablename__ = 'milestones'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    due_date = db.Column(db.String(50), nullable=True)
    is_completed = db.Column(db.Boolean, default=False)


class Reminder(db.Model):
    __tablename__ = 'reminders'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    remind_at = db.Column(db.String(50), nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    recurrence = db.Column(db.String(50), default='none')


class PinnedItem(db.Model):
    __tablename__ = 'pinned_items'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    item_type = db.Column(db.String(50), nullable=False)  # note, file, task, project, bookmark
    item_id = db.Column(db.String(36), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
