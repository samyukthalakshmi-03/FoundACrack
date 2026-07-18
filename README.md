# Road Damage Detection System 🚧

## Overview

The Road Damage Detection System is a computer vision project developed to automatically identify different types of road damage from images. The system detects potholes, cracks, manholes, and other selected road-related objects using a YOLOv26 object detection model.

The main objective of this project is to simplify road inspection by providing a quick and efficient way to identify damaged roads and generate reports that can be reviewed by the concerned authorities.

---

## Features

- Detects road damages from uploaded images
- Identifies:
  - Potholes
  - Cracks
  - Manholes
  - Other selected road objects
- Generates a report based on the detected damages
- Automatically downloads the generated report
- Simple and user-friendly web interface

---

## Technologies Used

- Python
- OpenCV
- YOLOv26
- Roboflow
- Google Colab
- Flask
- HTML
- CSS
- JavaScript

---

## Project Workflow

1. Collected road images from different sources.
2. Organized the images into different categories.
3. Annotated the images using Roboflow.
4. Generated the dataset and exported it in YOLO format.
5. Trained the YOLOv26 model using Google Colab.
6. Integrated the trained model into a Flask web application.
7. Implemented image upload and detection.
8. Generated downloadable reports.

---

## Folder Structure

```text
Road-Damage-Detection/
│
├── dataset/
├── models/
├── static/
├── templates/
├── reports/
├── app.py
├── requirements.txt
└── README.md
```

---

## How to Run

1. Clone the repository

```bash
git clone <repository-link>
```

2. Navigate to the project folder

```bash
cd Road-Damage-Detection
```

3. Install the required packages

```bash
pip install -r requirements.txt
```

4. Run the application

```bash
python app.py
```

5. Open your browser and visit

```
http://127.0.0.1:5000
```

---

## Model Training

The model was trained using:

- Roboflow for dataset creation and annotation
- Google Colab for training
- YOLOv26 as the object detection model

---

## Future Improvements

- Real-time road damage detection using live camera feeds
- GPS-based location tracking of detected damages
- Dashboard for monitoring reported damages
- Mobile application support
- Integration with municipal maintenance systems

---

## Team

Developed as part of an internship project.

Team Members:
- Samyuktha Lakshmi
- Trisha D M

---

## Acknowledgements

- Roboflow
- Ultralytics YOLO
- Google Colab
- OpenCV
