from fastapi import APIRouter, UploadFile, File, Header
from fastapi.responses import JSONResponse
from ..utils.api_key_utils import track_and_get_api_key

router = APIRouter()

@router.post("/predict")
async def predict(
    file: UploadFile = File(...),
    x_api_key: str = Header(default=None),
    authorization: str = Header(default=None),
):
    # Prefer x-api-key, fallback to Bearer
    api_key = x_api_key
    if not api_key and authorization and authorization.lower().startswith("bearer "):
        api_key = authorization.split(" ", 1)[1]
    if not api_key:
        return JSONResponse(status_code=401, content={"detail": "API key missing"})

    # Validate key
    try:
        api_key_data = track_and_get_api_key(api_key)
    except Exception as e:
        return JSONResponse(status_code=403, content={"detail": str(e)})

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