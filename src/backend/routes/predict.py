from fastapi import APIRouter, UploadFile, File, Request, HTTPException
from fastapi.responses import JSONResponse
from ..utils.api_key_utils import track_and_get_api_key
import logging
import cloudinary.uploader
from datetime import datetime
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Firestore logging (optional)
try:
    import firebase_admin
    from firebase_admin import firestore
    FIRESTORE_ENABLED = True
except ImportError:
    FIRESTORE_ENABLED = False

# Load environment variables
load_dotenv()

router = APIRouter()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel("gemini-2.0-flash")

def log_event_to_firestore(event: dict):
    if FIRESTORE_ENABLED and firebase_admin._apps:
        db = firestore.client()
        db.collection("prediction_events").add(event)

def parse_gemini_response(content: str):
    """
    Parses the Gemini API response to extract structured data.
    """
    try:
        # Naive parsing - assumes key-value pairs separated by newlines
        lines = content.strip().split('\n')
        data = {}
        for line in lines:
            if ':' in line:
                key, value = line.split(':', 1)
                data[key.strip()] = value.strip()

        # Fallback for simple string response
        if not data:
            return {"disease": content.strip()}

        return {
            "disease": data.get("disease", "Unknown"),
            "confidence": float(data.get("confidence", 0.0)),
            "severity": data.get("severity", "N/A"),
            "stage": data.get("stage", "N/A"),
            "yield_impact": data.get("yield_impact", "N/A"),
            "spread_risk": data.get("spread_risk", "N/A"),
            "recovery": data.get("recovery", "N/A"),
            "symptoms": [s.strip() for s in data.get("symptoms", "").split(',')],
            "action_plan": {
                "step_1": data.get("action_plan_step_1", "N/A"),
                "step_2": data.get("action_plan_step_2", "N/A"),
            },
            "treatments": {
                "organic": [t.strip() for t in data.get("organic_treatments", "").split(',')],
                "chemical": [t.strip() for t in data.get("chemical_treatments", "").split(',')]
            }
        }
    except Exception as e:
        logging.error(f"Error parsing Gemini response: {e}")
        return {"error": "Failed to parse response"}

# Gemini-powered inference
def run_model_on_image(image_bytes: bytes, image_url: str = None, api_key: str = None):
    prompt = "Detect plant disease in this image and return disease name, confidence score, and recommended actions."
    try:
        response = gemini_model.generate_content([
            prompt,
            {
                "mime_type": "image/jpeg",
                "data": image_bytes
            }
        ])
        content = response.text
        result = parse_gemini_response(content)

        # Log low-confidence or unknown predictions
        if result.get("confidence", 1.0) < 0.5 or result.get("disease") == "Unknown":
            log_event_to_firestore({
                "event": "low_confidence",
                "image_url": image_url,
                "confidence": result.get("confidence"),
                "predicted_class": result.get("disease"),
                "timestamp": datetime.utcnow().isoformat(),
                "api_key": api_key
            })
        return result
    except Exception as e:
        return {
            "disease": "Unknown",
            "confidence": 0.0,
            "error": str(e)
        }

@router.post("/predict")
async def predict_route(request: Request, file: UploadFile = File(...)):
    try:
        print("[📥] Incoming /predict request")
        print(f"[🧾] Headers: {request.headers}")
        print(f"[📎] Filename: {file.filename}")

        api_key = request.headers.get("x-api-key")
        api_key_data = track_and_get_api_key(api_key)

        # Read file bytes
        image_bytes = await file.read()

        # Upload image to Cloudinary
        upload_result = cloudinary.uploader.upload(
            image_bytes,
            resource_type="image",
            folder="plant-disease-uploads",
            public_id=None,
            overwrite=True
        )
        image_url = upload_result.get("secure_url")
        print(f"[☁️] Uploaded to Cloudinary: {image_url}")

        # Debug: Log prompt, image info, and model
        prompt = "Detect plant disease in this image and return disease name, confidence score, and recommended actions."
        print(f"[DEBUG] Prompt: {prompt}")
        print(f"[DEBUG] Image size: {len(image_bytes)} bytes, MIME: image/jpeg")
        print(f"[DEBUG] Gemini model: {gemini_model.model_name}")

        # Run Gemini model inference
        response = gemini_model.generate_content([
            prompt,
            {
                "mime_type": "image/jpeg",
                "data": image_bytes
            }
        ])
        content = response.text
        print(f"[DEBUG] Gemini raw response: {content}")
        result = parse_gemini_response(content)

        # Log low-confidence or unknown predictions
        if result.get("confidence", 1.0) < 0.5 or result.get("disease") == "Unknown":
            log_event_to_firestore({
                "event": "low_confidence",
                "image_url": image_url,
                "confidence": result.get("confidence"),
                "predicted_class": result.get("disease"),
                "timestamp": datetime.utcnow().isoformat(),
                "api_key": api_key
            })

        return {
            "prediction": result,
            "confidence": result.get("confidence"),
            "image_url": image_url,
            "filename": file.filename
        }

    except HTTPException as e:
        print(f"[❌] HTTPException: {e.status_code} - {e.detail}")
        return JSONResponse(status_code=e.status_code, content={"detail": e.detail or "Something went wrong."})

    except Exception as e:
        print(f"[💥] Unexpected Exception: {str(e)}")
        return JSONResponse(status_code=500, content={"detail": str(e) or "Internal server error"})
