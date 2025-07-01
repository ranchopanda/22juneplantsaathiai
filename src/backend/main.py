from dotenv import load_dotenv
import os
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

print("DEBUG: ADMIN_PASSWORD =", os.environ.get("ADMIN_PASSWORD"))

import os
import time
import uuid
import secrets
import logging
import json
from datetime import datetime
from typing import List, Dict, Any, Optional, Union
from functools import lru_cache

import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status, Request, Body, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, Field
from PIL import Image
import io
import redis
import prometheus_client
from prometheus_client import Counter, Histogram, Gauge
from pythonjsonlogger import jsonlogger

# --- Logging Setup ---
class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super(CustomJsonFormatter, self).add_fields(log_record, record, message_dict)
        log_record['timestamp'] = datetime.utcnow().isoformat()
        log_record['level'] = record.levelname
        log_record['service'] = 'plantsaathi-api'

logHandler = logging.StreamHandler()
formatter = CustomJsonFormatter('%(timestamp)s %(level)s %(name)s %(message)s')
logHandler.setFormatter(formatter)

logger = logging.getLogger("plantsaathi-api")
logger.setLevel(os.getenv("LOG_LEVEL", "INFO"))
logger.addHandler(logHandler)

# --- Prometheus Metrics ---
REQUEST_COUNT = Counter(
    'http_requests_total', 
    'Total HTTP Requests', 
    ['method', 'endpoint', 'status_code']
)
REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds', 
    'HTTP Request Latency', 
    ['method', 'endpoint']
)
API_KEY_USAGE = Counter(
    'api_key_usage_total', 
    'API Key Usage', 
    ['partner_id']
)
ACTIVE_API_KEYS = Gauge(
    'active_api_keys', 
    'Number of active API keys'
)

# --- Config ---
MASTER_API_KEY = os.getenv("MASTER_API_KEY")
if not MASTER_API_KEY:
    logger.error("MASTER_API_KEY environment variable not set")
    raise ValueError("MASTER_API_KEY environment variable not set")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

# --- Redis Setup ---
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

try:
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=REDIS_DB,
        password=REDIS_PASSWORD,
        decode_responses=True
    )
    redis_client.ping()  # Test connection
    logger.info(f"Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
except Exception as e:
    if os.getenv("ENVIRONMENT") == "production":
        logger.info(f"Redis connection failed: {str(e)}. Caching will be disabled.")
    else:
        logger.warning(f"Redis connection failed: {str(e)}. Caching will be disabled.")
    redis_client = None

# --- Firestore Setup ---
db = None
if os.getenv("ENABLE_FIRESTORE", "false").lower() == "true":
    try:
        firebase_admin.initialize_app()
        db = firestore.client()
        logger.info("Connected to Firestore")
    except Exception as e:
        if os.getenv("ENVIRONMENT") == "production":
            logger.info(f"Firestore initialization failed: {str(e)}")
        else:
            logger.error(f"Firestore initialization failed: {str(e)}")
        # Do not raise here, allow the app to start without Firestore for local dev
else:
    if os.getenv("ENVIRONMENT") == "production":
        logger.info("Firestore initialization skipped. Set ENABLE_FIRESTORE=true to enable.")
    else:
        logger.warning("Firestore initialization skipped. Set ENABLE_FIRESTORE=true to enable.")

# --- App Setup ---
app = FastAPI(
    title="Plant Disease Detection API", 
    description="API for plant disease detection with API key management",
    version=os.getenv("APP_VERSION", "dev"),
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None,
)

@app.get("/version")
def get_version():
    return {"version": app.version}

# Prometheus metrics endpoint
try:
    from prometheus_fastapi_instrumentator import Instrumentator
    Instrumentator().instrument(app).expose(app)
except ImportError:
    logger.warning("prometheus_fastapi_instrumentator not installed, /metrics endpoint not available.")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Auth
bearer_scheme = HTTPBearer()

# --- Middleware ---
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    # Process the request
    try:
        response = await call_next(request)
        status_code = response.status_code
    except Exception as e:
        status_code = 500
        raise e
    finally:
        # Record request metrics
        REQUEST_COUNT.labels(
            method=request.method, 
            endpoint=request.url.path, 
            status_code=status_code
        ).inc()
        
        REQUEST_LATENCY.labels(
            method=request.method, 
            endpoint=request.url.path
        ).observe(time.time() - start_time)
        
    # Add X-RateLimit-Remaining if available in request.state
    if hasattr(request.state, "rate_limit_remaining"):
        response.headers["X-RateLimit-Remaining"] = str(request.state.rate_limit_remaining)
    return response

# --- API Key Management ---
class APIKey(BaseModel):
    id: str
    key: str
    name: str
    partner_id: str
    rate_limit_day: int
    rate_limit_hour: Optional[int] = None
    created_at: str
    is_active: bool = True

class APIKeyCreate(BaseModel):
    name: str
    partner_id: str
    rate_limit_day: int
    rate_limit_hour: Optional[int] = None
    custom_key_value: Optional[str] = None

async def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    import hashlib
    try:
        # Debug logging
        logger.info(f"[DEBUG] Bearer credentials: {credentials.credentials}")
        logger.info(f"[DEBUG] Bearer hash: {hashlib.sha256(credentials.credentials.encode()).hexdigest()}")
        # Check if this is the master key
        if credentials.credentials == MASTER_API_KEY:
            logger.info("[DEBUG] Master API key used, authentication successful.")
            return {"partner_id": "admin", "rate_limit_day": 10000}
        
        # Check cache first
        if redis_client:
            cached_key = redis_client.get(f"api_key:{credentials.credentials}")
            logger.info(f"[DEBUG] Redis cache lookup: {cached_key}")
            if cached_key:
                key_data = json.loads(cached_key)
                logger.info(f"[DEBUG] Redis cache hit, key data: {key_data}")
                return key_data
        
        # Query Firestore
        if db:
            keys_ref = db.collection('api_keys')
            query = keys_ref.where('key', '==', credentials.credentials).where('is_active', '==', True).limit(1)
            results = query.get()
            logger.info(f"[DEBUG] Firestore query results: {results}")
            for doc in results:
                key_data = doc.to_dict()
                key_data['key_id'] = doc.id
                logger.info(f"[DEBUG] Firestore key data: {key_data}")
                # Cache the result
                if redis_client:
                    redis_client.setex(
                        f"api_key:{credentials.credentials}", 
                        300,  # Cache for 5 minutes
                        json.dumps(key_data)
                    )
                return key_data
        
        logger.info("[DEBUG] API key not found, raising 401.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid API Key"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API key verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}"
        )

def verify_master_key(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if credentials.credentials != MASTER_API_KEY:
        logger.warning("Invalid master key attempt")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid Master API Key"
        )
    return True

# --- Pydantic Response Model ---
class ActionPlan(BaseModel):
    immediate: str
    short_term: str

class Treatments(BaseModel):
    organic: str
    chemical: str

class PredictResponse(BaseModel):
    disease: str
    confidence: float
    severity: str
    stage: str
    yield_impact: str
    spread_risk: str
    recovery: str
    symptoms: List[str]
    action_plan: ActionPlan
    treatments: Treatments

# --- Dynamic Rate Limiting ---
def get_rate_limit_for_key(api_key_info):
    # Apply dynamic rate limits based on the API key
    if api_key_info.get("rate_limit_day"):
        return f"{api_key_info.get('rate_limit_day')}/day"
    return "100/day"  # Default fallback

# --- Caching ---
def get_cache_key(image_bytes, partner_id):
    """Generate a cache key based on image content and partner ID"""
    import hashlib
    image_hash = hashlib.md5(image_bytes).hexdigest()
    return f"predict:{partner_id}:{image_hash}"

async def get_cached_prediction(cache_key):
    """Get cached prediction result"""
    if redis_client:
        cached = redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
    return None

async def cache_prediction(cache_key, result, ttl=3600):
    """Cache prediction result"""
    if redis_client:
        redis_client.setex(cache_key, ttl, json.dumps(result))

# --- Background Tasks ---
async def log_api_usage(partner_id, key_id, endpoint):
    """Log API usage to Firestore"""
    if not db:
        logger.warning(f"Firestore not enabled, skipping API usage logging for {partner_id}")
        return
    try:
        today = datetime.utcnow().strftime("%Y-%m-%d")
        usage_ref = db.collection('api_usage').document(f"{partner_id}_{today}")
        
        # Use transactions to safely update counters
        transaction = db.transaction()
        
        @firestore.transactional
        def update_in_transaction(transaction, ref):
            snapshot = ref.get(transaction=transaction)
            if snapshot.exists:
                # Update existing document
                current_data = snapshot.to_dict()
                total_requests = current_data.get('total_requests', 0) + 1
                endpoints = current_data.get('endpoints', {})
                endpoints[endpoint] = endpoints.get(endpoint, 0) + 1
                
                transaction.update(ref, {
                    'total_requests': total_requests,
                    'endpoints': endpoints,
                    'last_updated': datetime.utcnow().isoformat()
                })
            else:
                # Create new document
                transaction.set(ref, {
                    'partner_id': partner_id,
                    'date': today,
                    'total_requests': 1,
                    'key_id': key_id,
                    'endpoints': {endpoint: 1},
                    'created_at': datetime.utcnow().isoformat(),
                    'last_updated': datetime.utcnow().isoformat()
                })
        
        update_in_transaction(transaction, usage_ref)
        
        # Update Prometheus metrics
        API_KEY_USAGE.labels(partner_id=partner_id).inc()
        
    except Exception as e:
        logger.error(f"Error logging API usage: {str(e)}")

# --- Health Check ---
@app.get("/status")
def health_status():
    health_data = {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "version": app.version
    }
    
    # Check Redis connection
    if redis_client:
        try:
            redis_client.ping()
            health_data["redis"] = "connected"
        except:
            health_data["redis"] = "disconnected"
    else:
        health_data["redis"] = "disabled"
    
    # Check Firestore connection
    if db:
        try:
            db.collection('api_keys').limit(1).get()
            health_data["firestore"] = "connected"
        except:
            health_data["firestore"] = "disconnected"
    else:
        health_data["firestore"] = "disabled"
    
    return health_data

# --- Metrics Endpoint ---
@app.get("/metrics")
def metrics(is_authenticated: bool = Depends(verify_master_key)):
    return prometheus_client.generate_latest()

# --- Usage Stats ---
@app.get("/usage")
def get_usage(is_authenticated: bool = Depends(verify_master_key)):
    if not db:
        raise HTTPException(
            status_code=503,
            detail="Firestore is not enabled, usage statistics are unavailable."
        )
    try:
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
        # Query Firestore for usage data
        usage_ref = db.collection('api_usage')
        results = usage_ref.get()
        
        total = 0
        today_total = 0
        by_partner = {}
        by_endpoint = {}
        
        for doc in results:
            data = doc.to_dict()
            requests = data.get("total_requests", 0)
            total += requests
            
            if data.get("date") == today:
                today_total += requests
            
            partner = data.get("partner_id", "unknown")
            by_partner.setdefault(partner, 0)
            by_partner[partner] += requests
            
            # Collect endpoint stats
            endpoints = data.get("endpoints", {})
            for endpoint, count in endpoints.items():
                by_endpoint.setdefault(endpoint, 0)
                by_endpoint[endpoint] += count
        
        return {
            "total_requests": total,
            "today_requests": today_total,
            "by_partner": by_partner,
            "by_endpoint": by_endpoint
        }
    except Exception as e:
        logger.error(f"Error fetching usage stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch usage statistics"
        )

# --- API Key Management Endpoints ---
@app.post("/api-keys", response_model=APIKey)
def create_api_key(key_data: APIKeyCreate, is_authenticated: bool = Depends(verify_master_key)):
    """Create a new API key with specified rate limits"""
    if not db:
        raise HTTPException(
            status_code=503,
            detail="Firestore is not enabled, API key management is unavailable."
        )
    try:
        # Create new key document
        new_key = {
            "name": key_data.name,
            "key": key_data.custom_key_value if key_data.custom_key_value else secrets.token_urlsafe(32),
            "partner_id": key_data.partner_id,
            "rate_limit_day": key_data.rate_limit_day,
            "created_at": datetime.utcnow().isoformat(),
            "is_active": True
        }
        
        # Add optional rate limit if provided
        if key_data.rate_limit_hour is not None:
            new_key["rate_limit_hour"] = key_data.rate_limit_hour
        
        # Add to Firestore
        doc_ref = db.collection('api_keys').document()
        doc_ref.set(new_key)
        
        # Update active keys metric
        ACTIVE_API_KEYS.inc()
        
        # Return created key with ID
        result = new_key.copy()
        result["id"] = doc_ref.id
        
        logger.info(f"Created new API key for {key_data.partner_id}")
        return APIKey(**result)
    except Exception as e:
        logger.error(f"Error creating API key: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create API key: {str(e)}"
        )

@app.get("/api-keys", response_model=List[APIKey])
def list_api_keys(is_authenticated: bool = Depends(verify_master_key)):
    """List all API keys"""
    if not db:
        raise HTTPException(
            status_code=503,
            detail="Firestore is not enabled, API key management is unavailable."
        )
    try:
        keys = []
        keys_ref = db.collection('api_keys')
        results = keys_ref.get()
        
        for doc in results:
            key_data = doc.to_dict()
            key_data["id"] = doc.id
            keys.append(APIKey(**key_data))
        
        # Update active keys metric
        active_count = sum(1 for key in keys if key.is_active)
        ACTIVE_API_KEYS.set(active_count)
        
        return keys
    except Exception as e:
        logger.error(f"Error listing API keys: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list API keys: {str(e)}"
        )

@app.get("/api-keys/{key_id}", response_model=APIKey)
def get_api_key(key_id: str, is_authenticated: bool = Depends(verify_master_key)):
    """Get a specific API key by ID"""
    if not db:
        raise HTTPException(
            status_code=503,
            detail="Firestore is not enabled, API key management is unavailable."
        )
    try:
        doc_ref = db.collection('api_keys').document(key_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            logger.warning(f"API key not found: {key_id}")
            raise HTTPException(status_code=404, detail="API key not found")
        
        key_data = doc.to_dict()
        key_data["id"] = doc.id
        return APIKey(**key_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting API key: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get API key: {str(e)}"
        )

@app.patch("/api-keys/{key_id}")
def update_api_key(
    key_id: str, 
    updates: dict = Body(...),
    is_authenticated: bool = Depends(verify_master_key)
):
    """Update an API key (rate limits, active status, etc.)"""
    if not db:
        raise HTTPException(
            status_code=503,
            detail="Firestore is not enabled, API key management is unavailable."
        )
    try:
        # Get allowed fields for update
        allowed_updates = {k: v for k, v in updates.items() 
                        if k in ["name", "rate_limit_day", "rate_limit_hour", "is_active"]}
        
        if not allowed_updates:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        # Update in Firestore
        doc_ref = db.collection('api_keys').document(key_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            logger.warning(f"API key not found for update: {key_id}")
            raise HTTPException(status_code=404, detail="API key not found")
        
        # Update document
        doc_ref.update(allowed_updates)
        
        # If we're updating active status, update metrics and clear cache
        if "is_active" in allowed_updates:
            # Update active keys metric
            if allowed_updates["is_active"]:
                ACTIVE_API_KEYS.inc()
            else:
                ACTIVE_API_KEYS.dec()
            
            # Clear cache for this key
            if redis_client:
                key_data = doc.to_dict()
                redis_client.delete(f"api_key:{key_data.get('key')}")
        
        logger.info(f"Updated API key {key_id}: {allowed_updates}")
        return {"message": "API key updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating API key: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update API key: {str(e)}"
        )

@app.delete("/api-keys/{key_id}")
def delete_api_key(key_id: str, is_authenticated: bool = Depends(verify_master_key)):
    """Delete an API key"""
    if not db:
        raise HTTPException(
            status_code=503,
            detail="Firestore is not enabled, API key management is unavailable."
        )
    try:
        doc_ref = db.collection('api_keys').document(key_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            logger.warning(f"API key not found for deletion: {key_id}")
            raise HTTPException(status_code=404, detail="API key not found")
        
        # Get key data before deletion (for cache clearing)
        key_data = doc.to_dict()
        
        # Delete from Firestore
        doc_ref.delete()
        
        # Update active keys metric if the key was active
        if key_data.get("is_active", True):
            ACTIVE_API_KEYS.dec()
        
        # Clear cache for this key
        if redis_client and "key" in key_data:
            redis_client.delete(f"api_key:{key_data['key']}")
        
        logger.info(f"Deleted API key {key_id}")
        return {"message": "API key deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting API key: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete API key: {str(e)}"
        )

@app.get("/api-keys/regenerate/{key_id}", response_model=APIKey)
def regenerate_api_key(key_id: str, is_authenticated: bool = Depends(verify_master_key)):
    """Regenerate an API key value while keeping the same settings"""
    if not db:
        raise HTTPException(
            status_code=503,
            detail="Firestore is not enabled, API key management is unavailable."
        )
    try:
        doc_ref = db.collection('api_keys').document(key_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            logger.warning(f"API key not found for regeneration: {key_id}")
            raise HTTPException(status_code=404, detail="API key not found")
        
        # Get current key data
        key_data = doc.to_dict()
        old_key_value = key_data.get("key")
        
        # Generate new key value
        new_key_value = secrets.token_urlsafe(32)
        doc_ref.update({"key": new_key_value})
        
        # Clear cache for old key
        if redis_client and old_key_value:
            redis_client.delete(f"api_key:{old_key_value}")
        
        # Get updated data
        key_data["key"] = new_key_value
        key_data["id"] = key_id
        
        logger.info(f"Regenerated API key {key_id}")
        return APIKey(**key_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error regenerating API key: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to regenerate API key: {str(e)}"
        )

# --- Error Handling ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred"}
    )

# --- Startup and Shutdown Events ---
@app.on_event("startup")
async def startup_event():
    logger.info("Starting Plant Disease Detection API")
    
    # Log critical environment variables for debugging
    logger.info(f"Environment: CLOUDINARY_URL={'set' if os.getenv('CLOUDINARY_URL') else 'not set'}")
    logger.info(f"Environment: ADMIN_PASSWORD={'set' if os.getenv('ADMIN_PASSWORD') else 'not set'}")
    logger.info(f"Environment: MASTER_API_KEY={'set' if os.getenv('MASTER_API_KEY') else 'not set'}")
    
    # Check Cloudinary dependency
    try:
        import cloudinary
        logger.info("Cloudinary library imported successfully")
    except Exception as e:
        logger.error(f"Cloudinary library import failed: {str(e)}")
    
    # Initialize active keys metric
    if db:
        try:
            keys_ref = db.collection('api_keys')
            query = keys_ref.where('is_active', '==', True)
            results = query.get()
            active_count = len(list(results))
            ACTIVE_API_KEYS.set(active_count)
            logger.info(f"Found {active_count} active API keys")
        except Exception as e:
            logger.error(f"Error counting active API keys: {str(e)}")
    else:
        logger.warning("Firestore not enabled, skipping active API keys metric initialization.")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Plant Disease Detection API")
    
    # Close Redis connection if active
    if redis_client:
        redis_client.close()

# Include routers for admin routes with password protection
from fastapi import HTTPException, Depends, Header

async def verify_admin_password(authorization: str = Header(None)):
    admin_password = os.environ.get('ADMIN_PASSWORD')
    if not admin_password:
        raise HTTPException(status_code=500, detail="Admin password not configured")
    expected_token = f"Bearer {admin_password}"
    if authorization != expected_token:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    return True

from .routes import api_keys
from .routes import predict
app.include_router(api_keys.router, dependencies=[Depends(verify_admin_password)])
app.include_router(predict.router)

# Custom error handlers
@app.exception_handler(404)
async def custom_404_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"detail": "Not Found."})

@app.exception_handler(500)
async def custom_500_handler(request: Request, exc):
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error."})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
