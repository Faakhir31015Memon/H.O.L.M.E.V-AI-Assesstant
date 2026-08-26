import os
import cv2
import numpy as np

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
except ImportError:
    torch = None
    nn = None
    F = None

# Custom PyTorch Model representation for HUD Emotion classification
class EmotionCNN(nn.Module) if nn else object:
    def __init__(self):
        super().__init__()
        if not nn:
            return
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(64 * 12 * 12, 128)
        self.fc2 = nn.Linear(128, 4) # 4 classes: Happy, Neutral, Focused, Angry

    def forward(self, x):
        if not nn:
            return x
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = x.view(-1, 64 * 12 * 12)
        x = F.relu(self.fc1(x))
        x = self.fc2(x)
        return x


class FaceEmotionEngine:
    def __init__(self):
        # Load OpenCV face detector
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        
        # Load PyTorch model if PyTorch is available
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu') if torch else None
        self.emotion_model = None
        
        if torch:
            self.emotion_model = EmotionCNN().to(self.device)
            self.emotion_model.eval() # Set to evaluation mode

        self.emotion_labels = ['Happy', 'Neutral', 'Focused', 'Angry']

    def analyze_frame(self, frame_bgr: np.ndarray) -> dict:
        """
        Detects faces in BGR image, predicts bounding boxes,
        extracts emotion classifications, and generates identity embeddings.
        """
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)

        if len(faces) == 0:
            return {"detected": False, "faces": []}

        face_list = []
        for (x, y, w, h) in faces:
            # Extract face region of interest (ROI)
            roi_gray = gray[y:y+h, x:x+w]
            roi_resized = cv2.resize(roi_gray, (48, 48))
            
            # Predict emotions
            emotions = self._predict_emotion(roi_resized)
            
            # Generate face recognition embedding (128-dimensional mock representation)
            face_embedding = self._generate_face_embedding(roi_resized)

            face_list.append({
                "boundingBox": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)},
                "emotions": emotions,
                "embedding": face_embedding.tolist() if isinstance(face_embedding, np.ndarray) else face_embedding,
            })

        return {
            "detected": True,
            "faces": face_list
        }

    def _predict_emotion(self, face_gray_48x48: np.ndarray) -> dict:
        """Runs PyTorch CNN to get emotion probabilities."""
        if not self.emotion_model or not torch:
            # Fallback mock probability generator
            probs = np.array([0.15, 0.65, 0.15, 0.05]) # Default Neutral heavy
            return {self.emotion_labels[i]: float(probs[i]) for i in range(4)}

        # Format input for PyTorch tensor (1, 1, 48, 48)
        img_tensor = torch.from_numpy(face_gray_48x48).float().unsqueeze(0).unsqueeze(0).to(self.device)
        img_tensor /= 255.0

        with torch.no_grad():
            outputs = self.emotion_model(img_tensor)
            probabilities = F.softmax(outputs, dim=1).cpu().numpy()[0]

        return {self.emotion_labels[i]: float(probabilities[i]) for i in range(4)}

    def _generate_face_embedding(self, face_gray_48x48: np.ndarray) -> np.ndarray:
        """Generates face identity recognition vectors."""
        # Simple simulated projection (PCA/ResNet style) to 128 dimension vector
        flat = face_gray_48x48.flatten() / 255.0
        # Seed generator with face metrics to maintain identity consistency in mock
        np.random.seed(int(flat.sum() * 100) % 65535)
        mock_embedding = np.random.randn(128)
        # Normalize vector
        mock_embedding /= np.linalg.norm(mock_embedding)
        return mock_embedding
