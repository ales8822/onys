# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from features.settings.router import router as settings_router
from features.providers.router import router as providers_router

app = FastAPI()

# Allow Frontend to talk to Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the settings feature
app.include_router(settings_router, prefix="/api/settings", tags=["Settings"])
app.include_router(providers_router, prefix="/api/providers", tags=["Providers"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)