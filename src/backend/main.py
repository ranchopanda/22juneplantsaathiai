from fastapi import FastAPI
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware
from .routes import api_keys
from .routes import predict

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_keys.router)
app.include_router(predict.router)

# Example protected route
# from .auth.api_key_middleware import verify_api_key
# @app.get("/predict")
# async def predict(request: Request, doc=Depends(verify_api_key)):
#     ...
