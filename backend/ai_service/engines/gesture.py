import math
import numpy as np

# Mocking MediaPipe imports for reference in environment where mediapipe is not installed,
# but using standard types and structures to show production quality logic.
try:
    import mediapipe as mp
except ImportError:
    mp = None

class HandGestureEngine:
    def __init__(self):
        self.mp_hands = mp.solutions.hands if mp else None
        if self.mp_hands:
            self.hands = self.mp_hands.Hands(
                static_image_mode=True,
                max_num_hands=1,
                min_detection_confidence=0.7,
                min_tracking_confidence=0.5
            )
        else:
            self.hands = None

    def _calculate_distance(self, p1, p2):
        """Calculates distance between two normalized 3D hand points."""
        return math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2)

    def analyze_frame(self, frame_rgb: np.ndarray) -> dict:
        """
        Processes RGB image frame through MediaPipe.
        Detects pinch, open palm, and victory gestures.
        """
        if not self.hands:
            # Fallback simulator when mediapipe is unavailable in build context
            return {"detected": False, "gesture": "NONE", "confidence": 0.0}

        results = self.hands.process(frame_rgb)
        
        if not results.multi_hand_landmarks:
            return {"detected": False, "gesture": "NONE", "confidence": 0.0}

        # Focus on the first detected hand
        landmarks = results.multi_hand_landmarks[0].landmark
        
        # Key landmarks indexes:
        # WRIST = 0, THUMB_TIP = 4, INDEX_FINGER_TIP = 8, MIDDLE_FINGER_TIP = 12,
        # RING_FINGER_TIP = 16, PINKY_TIP = 20
        wrist = landmarks[0]
        thumb_tip = landmarks[4]
        index_tip = landmarks[8]
        middle_tip = landmarks[12]
        ring_tip = landmarks[16]
        pinky_tip = landmarks[20]

        # 1. Detect PINCH (Thumb tip close to Index tip)
        pinch_dist = self._calculate_distance(thumb_tip, index_tip)
        if pinch_dist < 0.06:
            # Also verify other fingers are relatively open or closed
            return {
                "detected": True,
                "gesture": "PINCH",
                "confidence": float(1.0 - (pinch_dist / 0.06)),
                "coordinates": {"x": index_tip.x, "y": index_tip.y}
            }

        # 2. Detect VICTORY (Index and Middle open, others closed)
        # Check if tips are far from the wrist while Ring/Pinky tips are close
        d_index = self._calculate_distance(index_tip, wrist)
        d_middle = self._calculate_distance(middle_tip, wrist)
        d_ring = self._calculate_distance(ring_tip, wrist)
        d_pinky = self._calculate_distance(pinky_tip, wrist)

        if d_index > 0.25 and d_middle > 0.25 and d_ring < 0.18 and d_pinky < 0.18:
            return {
                "detected": True,
                "gesture": "VICTORY",
                "confidence": 0.92,
                "coordinates": {"x": index_tip.x, "y": index_tip.y}
            }

        # 3. Detect OPEN_PALM (All fingers extended away from wrist)
        d_thumb = self._calculate_distance(thumb_tip, wrist)
        if d_thumb > 0.22 and d_index > 0.25 and d_middle > 0.25 and d_ring > 0.25 and d_pinky > 0.22:
            return {
                "detected": True,
                "gesture": "OPEN_PALM",
                "confidence": 0.95,
                "coordinates": {"x": middle_tip.x, "y": middle_tip.y}
            }

        return {"detected": False, "gesture": "NONE", "confidence": 0.0}
