from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.wave_service import APP_TITLE
from routes.wave_routes import router as wave_router

app = FastAPI(title=APP_TITLE)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(wave_router)
