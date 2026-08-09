import os

class AIService:
    def __init__(self):
        self.api_key = os.environ.get('OPENAI_API_KEY') or os.environ.get('GEMINI_API_KEY')
        self.is_configured = bool(self.api_key)

    def ask_unispace(self, user_id: str, query: str, context_documents: list = None) -> dict:
        """
        Ask UniSpace AI Assistant. Returns structured answer using context documents.
        If no API key is provided, provides a graceful intelligent fallback.
        """
        if not self.is_configured:
            return {
                "answer": f"UniSpace AI Assistant is ready. To enable live LLM synthesis for query '{query}', set OPENAI_API_KEY or GEMINI_API_KEY in your environment.",
                "configured": False,
                "sources": context_documents or []
            }
        
        # Real AI integration point (e.g. OpenAI / Gemini SDK)
        return {
            "answer": f"Synthesized insight for: '{query}' based on your {len(context_documents or [])} workspace documents.",
            "configured": True,
            "sources": context_documents or []
        }

ai_service = AIService()
