from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from logs import log_event


router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


def get_current_user(request: Request):
    from users import get_user_by_id
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {
        "id": user["id"],
        "username": user["username"],
        "role": user["role"],
    }


def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


@router.post("/login")
def login(payload: LoginRequest, request: Request):
    from users import verify_user_credentials
    user = verify_user_credentials(payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    request.session["user_id"] = user["id"]
    request.session["role"] = user["role"]
    request.session["username"] = user["username"]
    log_event("login", user["username"], user["role"])
    return {
        "ok": True,
        "user": {"id": user["id"], "username": user["username"], "role": user["role"]},
    }


@router.post("/logout")
def logout(request: Request, user: dict = Depends(get_current_user)):
    log_event("logout", user["username"], user["role"])
    request.session.clear()
    return {"ok": True}


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return {"user": user}
