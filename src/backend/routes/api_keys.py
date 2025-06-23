from fastapi import APIRouter, Depends, HTTPException, Body, Request
from ..schemas.api_keys import APIKeyCreateRequest, APIKeyRevokeRequest, APIKeyResponse
from ..utils.api_key_utils import generate_api_key, store_api_key, get_api_keys, revoke_api_key, update_quota
from typing import List
import os
from dotenv import load_dotenv

router = APIRouter()
# Firestore is commented out for now
# from google.cloud import firestore
# db = firestore.Client()

def admin_only(request: Request):
    load_dotenv()
    admin_password = os.getenv("ADMIN_PASSWORD")
    auth_header = request.headers.get("Authorization", "")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    provided_password = auth_header.split("Bearer ")[1]
    if provided_password != admin_password:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    return True

@router.post("/api/admin/api-keys", response_model=APIKeyResponse)
def create_api_key(data: APIKeyCreateRequest, user=Depends(admin_only)):
    key, hashed = generate_api_key()
    # Replace with Cloudinary logic
    doc = store_api_key(None, data.company_name, hashed, data.permissions, expires_at=data.expires_at)
    return {**doc, "api_key": key, "api_key_raw": key}

@router.get("/api/admin/api-keys", response_model=List[APIKeyResponse])
def list_keys(user=Depends(admin_only)):
    # Replace with Cloudinary logic
    return get_api_keys(None)

@router.post("/api/admin/api-keys/revoke")
def revoke_key(data: APIKeyRevokeRequest, user=Depends(admin_only)):
    # Replace with Cloudinary logic
    if not revoke_api_key(None, data.id):
        raise HTTPException(404, "API key not found")
    return {"success": True}

@router.post("/api/admin/api-keys/quota")
def set_quota(data=Body(...)):
    key_id = data.get("id")
    quota = data.get("quota_per_day")
    if not key_id or quota is None:
        raise HTTPException(400, "Missing id or quota_per_day")
    if not update_quota(None, key_id, quota):
        raise HTTPException(404, "API key not found")
    return {"success": True}
