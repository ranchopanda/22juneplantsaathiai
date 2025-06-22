import secrets
import hashlib
import json
import cloudinary
import cloudinary.uploader
import cloudinary.api
from typing import List, Optional
import io
from datetime import datetime

COLLECTION_NAME = "company_api_keys"
USAGE_LOGS_COLLECTION = "api_usage_logs"

DEFAULT_QUOTA_PER_DAY = 100

CLOUDINARY_API_KEYS_FILE = "api-keys.json"

# Cloudinary config should be set via environment variables
# CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME

def generate_api_key():
    key = secrets.token_hex(24)
    hashed = hashlib.sha256(key.encode()).hexdigest()
    return key, hashed

def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()

def download_api_keys_from_cloudinary() -> List[dict]:
    try:
        resource = cloudinary.api.resource(CLOUDINARY_API_KEYS_FILE, resource_type="raw")
        url = resource["secure_url"]
        import requests
        resp = requests.get(url)
        if resp.status_code == 200:
            return json.loads(resp.text)
        return []
    except Exception:
        return []

def upload_api_keys_to_cloudinary(api_keys: List[dict]):
    data = json.dumps(api_keys, indent=2)
    file_obj = io.BytesIO(data.encode())
    cloudinary.uploader.upload_large(
        file_obj,
        public_id=CLOUDINARY_API_KEYS_FILE,
        resource_type="raw",
        overwrite=True,
        format="json"
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
        "usage_today": 0,
    }
    api_keys.append(new_key)
    upload_api_keys_to_cloudinary(api_keys)
    return new_key

def get_api_keys(_):
    api_keys = download_api_keys_from_cloudinary()
    for key in api_keys:
        if "quota_per_day" not in key:
            key["quota_per_day"] = DEFAULT_QUOTA_PER_DAY
        if "usage_today" not in key:
            key["usage_today"] = 0
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
