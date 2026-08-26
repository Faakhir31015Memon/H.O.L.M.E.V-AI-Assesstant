import numpy as np

try:
    import torch
    import torch.nn as nn
except ImportError:
    torch = None
    nn = None

class VectorMemoryEngine:
    def __init__(self):
        # 768 dimensions (compatible with pgvector dimension standards)
        self.embedding_dim = 768
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu') if torch else None
        
        # Simple embedding projection matrix representation
        if torch and nn:
            # Simulated projection layer translating word tokens to vectors
            self.projection = nn.Linear(512, self.embedding_dim).to(self.device)
            self.projection.eval()
        else:
            self.projection = None

    def generate_embedding(self, text: str) -> np.ndarray:
        """
        Generates a 768-dimensional normalized text embedding vector
        suitable for pgvector database queries.
        """
        # Convert characters/words to seed
        seed_sum = sum(ord(char) * (idx + 1) for idx, char in enumerate(text))
        np.random.seed(seed_sum % 65535)

        # Simple deterministic vector generation (simulating transformer outputs)
        vector = np.random.randn(self.embedding_dim)
        
        # Add slight semantic bias to common triggers
        lower_text = text.lower()
        if "security" in lower_text or "firewall" in lower_text:
            vector[0:50] += 1.5
        elif "diagnostics" in lower_text or "system" in lower_text:
            vector[50:100] += 1.5
        elif "overkill" in lower_text or "overclock" in lower_text:
            vector[100:150] += 1.8

        # Normalize the embedding vector
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
            
        return vector

    def calculate_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculates cosine similarity metrics between two high-dimensional vectors."""
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
            
        return float(dot_product / (norm1 * norm2))
