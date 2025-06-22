from fastapi import Request, HTTPException, Depends
from google.cloud import firestore
from ..utils.api_key_utils import hash_api_key, find_active_api_key, check_and_update_quota, log_api_usage
from datetime import datetime

db = firestore.Client()

async def verify_api_key(request: Request):
    key = request.headers.get("x-api-key")
    if not key:
        raise HTTPException(401, "Missing API Key")
    hashed = hash_api_key(key)
    doc = find_active_api_key(db, hashed)
    if not doc:
        log_api_usage(db, None, request.url.path, 403, {"reason": "invalid or revoked"})
        raise HTTPException(403, "Invalid or revoked API key")
    # Quota check and increment
    if not check_and_update_quota(db, doc):
        log_api_usage(db, doc.id, request.url.path, 429, {"reason": "quota exceeded"})
        raise HTTPException(429, "API quota exceeded for today")
    db.collection("company_api_keys").document(doc.id).update({"last_used_at": datetime.utcnow()})
    request.state.company_id = doc.to_dict()["id"]
    # Log successful usage
    log_api_usage(db, doc.id, request.url.path, 200, {})
    return doc 