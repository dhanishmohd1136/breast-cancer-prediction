

import joblib 
import pandas as pd

from fastapi import FastAPI

from .config import MODEL_PATH,APP_NAME,APP_VERSION

from .schema import Prediction_Request


model = joblib.load(MODEL_PATH)

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION
)

@app.get('/')
def root():
    return{"Messege":"APP_NAME","Version":APP_VERSION}

@app.post('/predict')
def predict(data:Prediction_Request):

    input_data = pd.DataFrame([{
        "Clump Thickness"             : data.clump_thickness,
        "Uniformity of Cell Size"     : data.uniformity_of_cell_size,
        "Uniformity of Cell Shape"    : data.uniformity_of_cell_shape,
        "Marginal Adhesion"           : data.marginal_adhesion,
        "Single Epithelial Cell Size" : data.single_epithelial_cell_size,
        "Bare Nuclei"                 : data.bare_nuclei,
        "Bland Chromatin"             : data.bland_chromatin,
        "Normal Nucleoli"             : data.normal_nucleoli,
        "Mitoses"                     : data.mitoses
    }])

    prediction  = model.predict(input_data)[0]
    probability = model.predict_proba(input_data)[0]

    if prediction == 0:
        label =  "Benign"
    else:
        label = "Malignant"


    return{
        "prediction":int(prediction),
        "label" : label,
        "probability":{
            "benign":round(float(probability[0]),4),
            "malignant":round(float(probability[1]),4)
        }
    }