import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from services.wave_service import APP_TITLE
from routes.wave_routes import router as wave_router
from auth import router as auth_router
from users import router as users_router, create_user
from logs import router as logs_router
from database import init_users_db, init_logs_db, init_admin_user

app = FastAPI(title=APP_TITLE)

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv(
        "SECRET_KEY",
        "pB3kN2vQ8yX6wT1sR9mZ7uL4hC5eJ0aG8fD1kP6sN2vQ8yX6wT1sR9mZ7uL4hC5e",
    ),
    same_site="lax",
    https_only=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(wave_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(logs_router)


@app.on_event("startup")
def startup():
    init_users_db()
    init_logs_db()
    init_admin_user(create_user)
