from fastapi import APIRouter, UploadFile, File, Header, Depends
from fastapi.responses import JSONResponse
from typing import Annotated
from ..utils.api_key_utils import track_and_get_api_key

router = APIRouter()

@router.post("/predict")
async def predict(
    file: UploadFile = File(...),
    x_api_key: Annotated[str, Header()] = None,
    api_key_data: dict = Depends(track_and_get_api_key)
):
    # The 'track_and_get_api_key' dependency already handles validation and usage tracking.
    # If the code reaches here, the key is valid and usage has been recorded.
    
    # You can optionally use api_key_data if you need info about the calling company
    # print(f"Request from {api_key_data['company_name']}")

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