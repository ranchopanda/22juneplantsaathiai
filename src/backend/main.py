from fastapi import FastAPI
from dotenv import load_dotenv
import os
import cloudinary
from fastapi.middleware.cors import CORSMiddleware
from .routes import api_keys
from .routes import predict

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# --- TEMPORARY DEBUGGING ---
print("--- DEBUGGING ENV VARS ---")
print(f"CLOUDINARY_URL: {os.environ.get('CLOUDINARY_URL')}")
print("--------------------------")
# --- END DEBUGGING ---

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import HTTPException, Depends, Header
import os

async def verify_admin_password(authorization: str = Header(None)):
    admin_password = os.environ.get('ADMIN_PASSWORD')
    if not admin_password:
        raise HTTPException(status_code=500, detail="Admin password not configured")
    expected_token = f"Bearer {admin_password}"
    if authorization != expected_token:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    return True

# Use the dependency for admin routes
app.include_router(api_keys.router, dependencies=[Depends(verify_admin_password)])
app.include_router(predict.router)

# Example protected route
# from .auth.api_key_middleware import verify_api_key
# @app.get("/predict")
# async def predict(request: Request, doc=Depends(verify_api_key)):
#     ...
