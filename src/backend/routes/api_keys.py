from fastapi import APIRouter, Depends, HTTPException
from google.cloud import firestore
from ..schemas.api_keys import APIKeyCreateRequest, APIKeyRevokeRequest, APIKeyResponse
from ..utils.api_key_utils import generate_api_key, store_api_key, get_api_keys, revoke_api_key
from typing import List

router = APIRouter()
db = firestore.Client()

def admin_only():
    # Placeholder for admin authentication
    return True

@router.post("/api/admin/api-keys", response_model=APIKeyResponse)
def create_api_key(data: APIKeyCreateRequest, user=Depends(admin_only)):
    key, hashed = generate_api_key()
    doc = store_api_key(db, data.company_name, hashed, data.permissions)
    return {**doc, "api_key": key}

@router.get("/api/admin/api-keys", response_model=List[APIKeyResponse])
def list_keys(user=Depends(admin_only)):
    return get_api_keys(db)

@router.post("/api/admin/api-keys/revoke")
def revoke_key(data: APIKeyRevokeRequest, user=Depends(admin_only)):
    if not revoke_api_key(db, data.id):
        raise HTTPException(404, "API key not found")
    return {"success": True} 