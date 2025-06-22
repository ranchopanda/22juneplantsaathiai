import secrets
import hashlib
import json
import cloudinary
import cloudinary.uploader
import cloudinary.api
from typing import List, Optional
import io
from datetime import datetime
from fastapi import HTTPException
import os

COLLECTION_NAME = "company_api_keys"
USAGE_LOGS_COLLECTION = "api_usage_logs"

DEFAULT_QUOTA_PER_DAY = 100

CLOUDINARY_API_KEYS_FILE = "api-keys.json"

def _get_cloudinary_options():
    """
    Manually parses the Cloudinary URL and returns an options dict for API calls.
    This avoids relying on global config state or specific SDK functions.
    """
    cloudinary_url = os.environ.get('CLOUDINARY_URL')
    if not cloudinary_url:
        raise ValueError("CLOUDINARY_URL environment variable not set.")
    
    # Manually parse the URL format: cloudinary://api_key:api_secret@cloud_name
    if not cloudinary_url.startswith("cloudinary://"):
        raise ValueError("Invalid CLOUDINARY_URL format. Must start with 'cloudinary://'")
    
    try:
        # Remove the 'cloudinary://' prefix
        auth_part = cloudinary_url[13:]
        # Split into credentials and cloud name
        credentials, cloud_name = auth_part.split('@')
        # Split credentials into api_key and api_secret
        api_key, api_secret = credentials.split(':')
        return {
            "cloud_name": cloud_name,
            "api_key": api_key,
            "api_secret": api_secret
        }
    except ValueError as e:
        raise ValueError(f"Invalid CLOUDINARY_URL format. Unable to parse: {str(e)}")

def generate_api_key():
    key = secrets.token_hex(24)
    hashed = hashlib.sha256(key.encode()).hexdigest()
    return key, hashed

def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()

def download_api_keys_from_cloudinary() -> List[dict]:
    try:
        options = _get_cloudinary_options()
        resource = cloudinary.api.resource(CLOUDINARY_API_KEYS_FILE, resource_type="raw", **options)
        url = resource["secure_url"]
        import requests
        resp = requests.get(url)
        if resp.status_code == 200:
            return json.loads(resp.text)
        return []
    except Exception:
        return []

def upload_api_keys_to_cloudinary(api_keys: List[dict]):
    options = _get_cloudinary_options()
    data = json.dumps(api_keys, indent=2)
    file_obj = io.BytesIO(data.encode())
    cloudinary.uploader.upload_large(
        file_obj,
        public_id=CLOUDINARY_API_KEYS_FILE,
        resource_type="raw",
        overwrite=True,
        format="json",
        **options
    )

def store_api_key(_, company_name: str, api_key_hash: str, permissions=None, quota_per_day=None):
    api_keys = download_api_keys_from_cloudinary()
    new_key = {
        "id": secrets.token_hex(8),
        "company_name": company_name,
        "api_key_hash": api_key_hash,
        "created_at": datetime.utcnow().isoformat(),
        "revoked": False,
        "revoked_at": None,
        "last_used_at": None,
        "permissions": permissions or [],
        "quota_per_day": quota_per_day or DEFAULT_QUOTA_PER_DAY,
        "daily_usage": {}
    }
    api_keys.append(new_key)
    upload_api_keys_to_cloudinary(api_keys)
    return new_key

def get_api_keys(_):
    api_keys = download_api_keys_from_cloudinary()
    for key in api_keys:
        if "quota_per_day" not in key:
            key["quota_per_day"] = DEFAULT_QUOTA_PER_DAY
        if "daily_usage" not in key:
            key["daily_usage"] = {}
        if not key.get("created_at"):
            key["created_at"] = datetime.utcnow().isoformat()
        elif not isinstance(key["created_at"], str):
            key["created_at"] = str(key["created_at"])
    return api_keys

def revoke_api_key(_, key_id: str):
    api_keys = download_api_keys_from_cloudinary()
    found = False
    for key in api_keys:
        if key["id"] == key_id:
            key["revoked"] = True
            found = True
    if found:
        upload_api_keys_to_cloudinary(api_keys)
    return found

def find_active_api_key(db, api_key_hash: str):
    docs = db.collection(COLLECTION_NAME).where("api_key_hash", "==", api_key_hash).where("revoked", "==", False).limit(1).stream()
    return next(docs, None)

def log_api_usage(db, api_key_id: str, endpoint: str, status_code: int, request_meta=None):
    log_doc = {
        "api_key_id": api_key_id,
        "timestamp": datetime.utcnow(),
        "endpoint": endpoint,
        "status_code": status_code,
        "request_meta": request_meta or {},
    }
    db.collection(USAGE_LOGS_COLLECTION).add(log_doc)

def check_and_update_quota(db, doc):
    today = date.today().isoformat()
    doc_ref = db.collection(COLLECTION_NAME).document(doc.id)
    data = doc.to_dict()
    # Reset usage if last reset is not today
    if data.get("usage_last_reset") != today:
        doc_ref.update({"usage_today": 0, "usage_last_reset": today})
        data["usage_today"] = 0
        data["usage_last_reset"] = today
    # Enforce quota
    if data.get("usage_today", 0) >= data.get("quota_per_day", DEFAULT_QUOTA_PER_DAY):
        return False
    # Increment usage
    doc_ref.update({"usage_today": firestore.Increment(1)})
    return True

def update_quota(_, key_id: str, new_quota: int):
    api_keys = download_api_keys_from_cloudinary()
    found = False
    for key in api_keys:
        if key["id"] == key_id:
            key["quota_per_day"] = new_quota
            found = True
    if found:
        upload_api_keys_to_cloudinary(api_keys)
    return found

def track_and_get_api_key(api_key: str):
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing API Key")
    
    hashed_key = hash_api_key(api_key)
    api_keys = download_api_keys_from_cloudinary()
    
    key_to_update = None
    for key in api_keys:
        if key["api_key_hash"] == hashed_key:
            if key.get("revoked"):
                raise HTTPException(status_code=403, detail="API key has been revoked")
            key_to_update = key
            break

    if not key_to_update:
        raise HTTPException(status_code=403, detail="Invalid API Key")

    today_str = datetime.utcnow().date().isoformat()
    now_iso = datetime.utcnow().isoformat()

    if "daily_usage" not in key_to_update:
        key_to_update["daily_usage"] = {}
    
    if today_str not in key_to_update["daily_usage"]:
        key_to_update["daily_usage"][today_str] = {"count": 0}
        
    key_to_update["daily_usage"][today_str]["count"] += 1
    key_to_update["daily_usage"][today_str]["last_used"] = now_iso
    key_to_update["last_used_at"] = now_iso

    upload_api_keys_to_cloudinary(api_keys)

    return key_to_update
