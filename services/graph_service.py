class KnowledgeGraphService:
    def build_user_graph(self, user_id: str, notes: list, files: list, tasks: list, projects: list, bookmarks: list) -> dict:
        """
        Maps entity nodes and relationships (Notes -> Projects, Tasks -> Projects, Files -> Folders/Notes).
        Prepares data for future D3 / Cytoscape visual Knowledge Graph rendering.
        """
        nodes = []
        links = []

        # Add Projects
        for p in projects:
            nodes.append({"id": f"proj_{p.id}", "label": p.name, "type": "project", "color": "#7B2CBF"})

        # Add Tasks and links to Projects
        for t in tasks:
            nodes.append({"id": f"task_{t.id}", "label": t.title, "type": "task", "color": "#00F5A0"})
            if t.project_id:
                links.append({"source": f"task_{t.id}", "target": f"proj_{t.project_id}", "relation": "BELONGS_TO"})

        # Add Notes and links to Projects
        for n in notes:
            nodes.append({"id": f"note_{n.id}", "label": n.title, "type": "note", "color": "#00D2FF"})
            if getattr(n, 'project_id', None):
                links.append({"source": f"note_{n.id}", "target": f"proj_{n.project_id}", "relation": "REFERENCES"})

        # Add Files
        for f in files:
            nodes.append({"id": f"file_{f.id}", "label": f.file_name, "type": "file", "color": "#FFB703"})
            if getattr(f, 'project_id', None):
                links.append({"source": f"file_{f.id}", "target": f"proj_{f.project_id}", "relation": "ATTACHED_TO"})

        return {"nodes": nodes, "links": links}

graph_service = KnowledgeGraphService()
