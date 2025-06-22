import secrets
import hashlib
from google.cloud import firestore
from datetime import datetime, date

COLLECTION_NAME = "company_api_keys"
USAGE_LOGS_COLLECTION = "api_usage_logs"

DEFAULT_QUOTA_PER_DAY = 100

def generate_api_key():
    key = secrets.token_hex(24)
    hashed = hashlib.sha256(key.encode()).hexdigest()
    return key, hashed

def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()

def store_api_key(db, company_name: str, api_key_hash: str, permissions=None):
    today = date.today().isoformat()
    doc = {
        "company_name": company_name,
        "api_key_hash": api_key_hash,
        "created_at": datetime.utcnow(),
        "revoked": False,
        "revoked_at": None,
        "last_used_at": None,
        "permissions": permissions or [],
        "quota_per_day": DEFAULT_QUOTA_PER_DAY,
        "usage_today": 0,
        "usage_last_reset": today,
    }
    ref = db.collection(COLLECTION_NAME).document()
    doc["id"] = ref.id
    ref.set(doc)
    return doc

def get_api_keys(db):
    docs = db.collection(COLLECTION_NAME).stream()
    return [doc.to_dict() for doc in docs]

def revoke_api_key(db, key_id: str):
    ref = db.collection(COLLECTION_NAME).document(key_id)
    ref.update({"revoked": True, "revoked_at": datetime.utcnow()})
    return True

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