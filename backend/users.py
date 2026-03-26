import hashlib
import secrets
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from database import get_users_conn, init_users_db
from auth import get_current_user, require_admin


router = APIRouter(prefix="/users", tags=["users"])


class UserCreate(BaseModel):
    username: str
    password: str
    role: str


class UserUpdate(BaseModel):
    password: Optional[str] = None
    role: Optional[str] = None


def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return f"{salt.hex()}${digest.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, digest_hex = stored.split("$", 1)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
        return secrets.compare_digest(digest, expected)
    except Exception:
        return False


def get_user_by_username(username: str):
    init_users_db()
    with get_users_conn() as conn:
        return conn.execute(
            "SELECT * FROM users WHERE username = ?",
            (username,),
        ).fetchone()


def get_user_by_id(user_id: int):
    init_users_db()
    with get_users_conn() as conn:
        return conn.execute(
            "SELECT * FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()

def count_admins():
    init_users_db()
    with get_users_conn() as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS cnt FROM users WHERE role = 'admin'"
        ).fetchone()
    return row["cnt"] if row else 0


def create_user(username: str, password: str, role: str):
    init_users_db()
    created_at = datetime.now(timezone.utc).isoformat()
    pw_hash = _hash_password(password)
    with get_users_conn() as conn:
        conn.execute(
            "INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)",
            (username, pw_hash, role, created_at),
        )
        conn.commit()


def update_user(user_id: int, password: Optional[str], role: Optional[str]):
    init_users_db()
    with get_users_conn() as conn:
        if password:
            pw_hash = _hash_password(password)
            conn.execute(
                "UPDATE users SET password_hash = ? WHERE id = ?",
                (pw_hash, user_id),
            )
        if role:
            conn.execute(
                "UPDATE users SET role = ? WHERE id = ?",
                (role, user_id),
            )
        conn.commit()


def delete_user(user_id: int):
    init_users_db()
    with get_users_conn() as conn:
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()


@router.get("")
def list_users(_: dict = Depends(require_admin)):
    init_users_db()
    with get_users_conn() as conn:
        rows = conn.execute(
            "SELECT id, username, role, created_at FROM users ORDER BY id"
        ).fetchall()
    return {"users": [dict(r) for r in rows]}


@router.post("")
def create_user_route(payload: UserCreate, _: dict = Depends(require_admin)):
    if payload.role not in ("admin", "worker"):
        raise HTTPException(status_code=400, detail="Invalid role")
    if get_user_by_username(payload.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    create_user(payload.username, payload.password, payload.role)
    return {"ok": True}


@router.put("/{user_id}")
def update_user_route(user_id: int, payload: UserUpdate, current: dict = Depends(require_admin)):
    if payload.role and payload.role not in ("admin", "worker"):
        raise HTTPException(status_code=400, detail="Invalid role")
    target = get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.role and target["role"] == "admin" and payload.role != "admin":
        if count_admins() <= 1:
            raise HTTPException(status_code=400, detail="At least one admin required")
    update_user(user_id, payload.password, payload.role)
    return {"ok": True}


@router.delete("/{user_id}")
def delete_user_route(user_id: int, current: dict = Depends(require_admin)):
    if current["id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own user")
    target = get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target["role"] == "admin" and count_admins() <= 1:
        raise HTTPException(status_code=400, detail="At least one admin required")
    delete_user(user_id)
    return {"ok": True}


def verify_user_credentials(username: str, password: str):
    user = get_user_by_username(username)
    if not user:
        return None
    if not _verify_password(password, user["password_hash"]):
        return None
    return dict(user)
