
import os
os.environ["ULTRALYTICS_CONFIG_DIR"] = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".ultralytics")

from ultralytics import YOLO

print("Loading model from ../model/best.pt")
model = YOLO("../model/best.pt")
print("Model loaded!")
print("Model task:", model.task)
print("Model names:", model.names)
