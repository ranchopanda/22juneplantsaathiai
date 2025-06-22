from fastapi import FastAPI
from routes import api_keys

app = FastAPI()

app.include_router(api_keys.router)

# Example protected route
# from auth.api_key_middleware import verify_api_key
# @app.get("/predict")
# async def predict(request: Request, doc=Depends(verify_api_key)):
#     ... 