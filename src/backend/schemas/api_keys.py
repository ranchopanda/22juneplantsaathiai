from pydantic import BaseModel
from typing import List, Optional

class APIKeyCreateRequest(BaseModel):
    company_name: str
    permissions: Optional[List[str]] = []
    expires_at: Optional[str] = None  # ISO date string

class APIKeyRevokeRequest(BaseModel):
    id: str

class APIKeyResponse(BaseModel):
    id: str
    company_name: str
    created_at: str
    revoked: bool
    revoked_at: Optional[str]
    last_used_at: Optional[str]
    permissions: List[str]
    daily_usage: dict
    quota_per_day: int
    expires_at: Optional[str] = None  # ISO date string
    api_key: Optional[str] = None  # Only present on creation
    api_key_raw: Optional[str] = None # For frontend testing convenience 