from pydantic import BaseModel
from typing import List, Optional

class APIKeyCreateRequest(BaseModel):
    company_name: str
    permissions: Optional[List[str]] = []

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
    api_key: str = None  # Only present on creation 