class VectorService:
    def extract_text(self, file_path: str, extension: str) -> str:
        """Extracts text content from uploaded workspace files."""
        ext = extension.lower().replace('.', '')
        if ext in ['txt', 'md', 'py', 'js', 'json', 'html', 'css', 'csv', 'log']:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read()
            except Exception:
                return ""
        return ""

    def search_semantic(self, query: str, documents: list) -> list:
        """Simple keyword matching fallback for vector similarity search."""
        query_lower = query.lower()
        results = []
        for doc in documents:
            content = doc.get('content', '') or doc.get('title', '')
            if query_lower in content.lower():
                results.append(doc)
        return results

vector_service = VectorService()
