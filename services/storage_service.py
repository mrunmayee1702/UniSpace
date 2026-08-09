import os
import uuid
from werkzeug.utils import secure_filename
from config import Config

class LocalDiskStorageService:
    def __init__(self, upload_dir: str = Config.UPLOAD_FOLDER):
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)

    def save_file(self, file_storage) -> tuple[str, str, int, str]:
        filename = secure_filename(file_storage.filename)
        ext = os.path.splitext(filename)[1].replace('.', '').lower()
        unique_name = f"{uuid.uuid4()}_{filename}"
        destination_path = os.path.join(self.upload_dir, unique_name)
        
        file_storage.save(destination_path)
        file_size = os.path.getsize(destination_path)
        return destination_path, filename, file_size, ext

    def delete_file(self, file_path: str) -> bool:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False

storage_service = LocalDiskStorageService()
