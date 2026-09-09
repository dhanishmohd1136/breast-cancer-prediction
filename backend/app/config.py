from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_PATH = (BASE_DIR/"models"/"breast_cancer_model.pkl")

APP_NAME  = "Brest Cancer Prediction API"
APP_VERSION = "1.0.0"