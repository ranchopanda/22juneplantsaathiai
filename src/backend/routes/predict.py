from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

router = APIRouter()

@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    # TODO: Integrate real AI model here
    # For now, return a mock response
    return JSONResponse({
        "disease": "Leaf Spot",
        "confidence": 0.91,
        "severity": "High",
        "stage": "Vegetative",
        "yield_impact": "30-50%",
        "spread_risk": "High",
        "recovery": "Medium",
        "symptoms": [
            "Brown circular spots",
            "Yellowing margins"
        ],
        "action_plan": {
            "immediate": "Remove infected parts.",
            "short_term": "Apply fungicide spray every 5–7 days."
        },
        "treatments": {
            "organic": "Garlic extract spray (50ml/L)",
            "chemical": "Chlorothalonil 2g/L"
        }
    }) 