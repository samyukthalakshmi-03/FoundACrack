
import os
os.environ["ULTRALYTICS_CONFIG_DIR"] = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".ultralytics")

from ultralytics import YOLO
from PIL import Image

# Verify model path
MODEL_PATH = "../model/best.pt"
print(f"Loading model from: {os.path.abspath(MODEL_PATH)}")

# Load model
model = YOLO(MODEL_PATH)
print("Model loaded successfully!")
print("Model task:", model.task)
print("Model names:", model.names)

# Let's create a simple test image (or use an existing one if you have it)
# For test purposes, let's just print model info
print("\nModel info:")
print(f"Model type: {type(model.model)}")
print(f"Number of classes: {len(model.names)}")

# Let's try running a dummy inference (or if you have a test image, use that)
print("\nTry running inference on a test image!")
